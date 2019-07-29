from decimal import Decimal

from flask import Blueprint, g, request, current_app
from marshmallow import fields, validate
from sqlalchemy import or_
from sentry_sdk import capture_message
from webargs import validate

from grant.extensions import limiter
from grant.comment.models import Comment, comment_schema, comments_schema
from grant.email.send import send_email
from grant.milestone.models import Milestone
from grant.parser import body, query, paginated_fields
from grant.rfp.models import RFP
from grant.user.models import User
from grant.utils import pagination
from grant.utils.auth import (
    requires_auth,
    requires_team_member_auth,
    requires_email_verified_auth,
    get_authed_user,
)
from grant.utils.enums import Category
from grant.utils.enums import ProposalStatus, ProposalStage
from grant.utils.exceptions import ValidationException
from grant.utils.misc import is_email, make_url, from_zat
from .models import (
    Proposal,
    proposals_schema,
    proposal_schema,
    ProposalUpdate,
    proposal_update_schema,
    proposal_team,
    ProposalTeamInvite,
    proposal_team_invite_schema,
    db,
)

blueprint = Blueprint("proposal", __name__, url_prefix="/api/v1/proposals")


@blueprint.route("/<proposal_id>", methods=["GET"])
def get_proposal(proposal_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        authed_user = get_authed_user()
        team_ids = list(x.id for x in proposal.team)
        authed_in_team = authed_user and authed_user.id in team_ids
        if proposal.status != ProposalStatus.LIVE:
            if proposal.status == ProposalStatus.DELETED:
                return {"message": "Proposal was deleted"}, 404
            if not authed_in_team:
                return {"message": "User cannot view this proposal"}, 404
        if proposal.private:
            if not authed_in_team:
                return {"message": "Proposal is private"}, 404
        return proposal_schema.dump(proposal)
    else:
        return {"message": "No proposal matching id"}, 404


@blueprint.route("/<proposal_id>/comments", methods=["GET"])
@query(paginated_fields)
def get_proposal_comments(proposal_id, page, filters, search, sort):
    # only using page, currently
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.comment(
        schema=comments_schema,
        query=Comment.query.filter_by(proposal_id=proposal_id, parent_comment_id=None, hidden=False),
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page


@blueprint.route("/<proposal_id>/comments/<comment_id>/report", methods=["PUT"])
@requires_email_verified_auth
def report_proposal_comment(proposal_id, comment_id):
    # Make sure proposal exists
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    comment = Comment.query.filter_by(id=comment_id).first()
    if not comment:
        return {"message": "Comment doesn’t exist"}, 404

    comment.report(True)
    db.session.commit()
    return {"message": "ok"}, 200


@blueprint.route("/<proposal_id>/follow", methods=["PUT"])
@requires_auth
@body({
    "isFollow": fields.Bool(required=True)
})
def follow_proposal(proposal_id, is_follow):
    user = g.current_user
    # Make sure proposal exists
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    proposal.follow(user, is_follow)
    db.session.commit()
    return {"message": "ok"}, 200


@blueprint.route("/<proposal_id>/comments", methods=["POST"])
@limiter.limit("30/hour;2/minute")
@requires_email_verified_auth
@body({
    "comment": fields.Str(required=True, validate=validate.Length(max=1000)),
    "parentCommentId": fields.Int(required=False, missing=None),
})
def post_proposal_comments(proposal_id, comment, parent_comment_id):
    # Make sure proposal exists
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404

    # Make sure the parent comment exists
    parent = None
    if parent_comment_id:
        parent = Comment.query.filter_by(id=parent_comment_id).first()
        if not parent:
            return {"message": "Parent comment doesn’t exist"}, 400

    # Make sure user has verified their email
    if not g.current_user.email_verification.has_verified:
        return {"message": "Please confirm your email before commenting"}, 401

    # Make sure user is not silenced
    if g.current_user.silenced:
        return {"message": "Your account has been silenced, commenting is disabled."}, 403

    # Make the comment
    comment = Comment(
        proposal_id=proposal_id,
        user_id=g.current_user.id,
        parent_comment_id=parent_comment_id,
        content=comment
    )
    db.session.add(comment)
    db.session.commit()
    dumped_comment = comment_schema.dump(comment)

    # Email proposal team if top-level comment
    if not parent:
        for member in proposal.team:
            send_email(member.email_address, 'proposal_comment', {
                'author': g.current_user,
                'proposal': proposal,
                'comment_url': make_url(f'/proposals/{proposal.id}?tab=discussions&comment={comment.id}'),
                'author_url': make_url(f'/profile/{comment.author.id}'),
            })
    # Email parent comment creator, if it's not themselves
    if parent and parent.author.id != comment.author.id:
        send_email(parent.author.email_address, 'comment_reply', {
            'author': g.current_user,
            'proposal': proposal,
            'comment_url': make_url(f'/proposals/{proposal.id}?tab=discussions&comment={comment.id}'),
            'author_url': make_url(f'/profile/{comment.author.id}'),
        })

    return dumped_comment, 201


@blueprint.route("/", methods=["GET"])
@query(paginated_fields)
def get_proposals(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    query = Proposal.query.filter_by(status=ProposalStatus.LIVE) \
        .filter(Proposal.stage != ProposalStage.CANCELED) \
        .filter(Proposal.stage != ProposalStage.FAILED) \
        .filter(Proposal.private != True)
    page = pagination.proposal(
        schema=proposals_schema,
        query=query,
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page


@blueprint.route("/drafts", methods=["POST"])
@limiter.limit("10/hour;3/minute")
@requires_email_verified_auth
@body({
    "rfpId": fields.Int(required=False, missing=None)
})
def make_proposal_draft(rfp_id):
    proposal = Proposal.create(status=ProposalStatus.DRAFT)
    proposal.team.append(g.current_user)

    if rfp_id:
        rfp = RFP.query.filter_by(id=rfp_id).first()
        if not rfp:
            return {"message": "The request this proposal was made for doesn’t exist"}, 400
        proposal.category = rfp.category
        rfp.proposals.append(proposal)
        db.session.add(rfp)

    db.session.add(proposal)
    db.session.commit()
    return proposal_schema.dump(proposal), 201


@blueprint.route("/drafts", methods=["GET"])
@requires_auth
def get_proposal_drafts():
    proposals = (
        Proposal.query
        .filter(or_(
                Proposal.status == ProposalStatus.DRAFT,
                Proposal.status == ProposalStatus.REJECTED,
                ))
        .join(proposal_team)
        .filter(proposal_team.c.user_id == g.current_user.id)
        .order_by(Proposal.date_created.desc())
        .all()
    )
    return proposals_schema.dump(proposals), 200


@blueprint.route("/<proposal_id>", methods=["PUT"])
@requires_team_member_auth
@body({
    # Length checks are to prevent database errors, not actual user limits imposed
    "title": fields.Str(required=True),
    "brief": fields.Str(required=True),
    "category": fields.Str(required=True, validate=validate.OneOf(choices=Category.list() + [''])),
    "content": fields.Str(required=True),
    "target": fields.Str(required=True),
    "milestones": fields.List(fields.Dict(), required=True),
})
def update_proposal(milestones, proposal_id, **kwargs):
    # Update the base proposal fields
    try:
        if g.current_proposal.status not in [ProposalStatus.DRAFT,
                                             ProposalStatus.REJECTED]:
            raise ValidationException(
                f"Proposal with status: {g.current_proposal.status} are not authorized for updates"
            )
        g.current_proposal.update(**kwargs)
    except ValidationException as e:
        return {"message": "{}".format(str(e))}, 400
    db.session.add(g.current_proposal)

    Milestone.make(milestones, g.current_proposal)

    # Commit
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>/rfp", methods=["DELETE"])
@requires_team_member_auth
def unlink_proposal_from_rfp(proposal_id):
    g.current_proposal.rfp_id = None
    db.session.add(g.current_proposal)
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>", methods=["DELETE"])
@requires_team_member_auth
def delete_proposal(proposal_id):
    deleteable_statuses = [
        ProposalStatus.DRAFT,
        ProposalStatus.PENDING,
        ProposalStatus.APPROVED,
        ProposalStatus.REJECTED,
    ]
    status = g.current_proposal.status
    if status not in deleteable_statuses:
        return {"message": "Cannot delete proposals with %s status" % status}, 400
    db.session.delete(g.current_proposal)
    db.session.commit()
    return {"message": "ok"}, 202


@blueprint.route("/<proposal_id>/submit_for_approval", methods=["PUT"])
@requires_team_member_auth
def submit_for_approval_proposal(proposal_id):
    try:
        g.current_proposal.submit_for_approval()
    except ValidationException as e:
        return {"message": "{}".format(str(e))}, 400
    db.session.add(g.current_proposal)
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>/publish", methods=["PUT"])
@requires_team_member_auth
def publish_proposal(proposal_id):
    try:
        g.current_proposal.publish()
    except ValidationException as e:
        return {"message": "{}".format(str(e))}, 400
    db.session.add(g.current_proposal)
    db.session.commit()
    return proposal_schema.dump(g.current_proposal), 200


@blueprint.route("/<proposal_id>/updates", methods=["GET"])
def get_proposal_updates(proposal_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        dumped_proposal = proposal_schema.dump(proposal)
        return dumped_proposal["updates"]
    else:
        return {"message": "No proposal matching id"}, 404


@blueprint.route("/<proposal_id>/updates/<update_id>", methods=["GET"])
def get_proposal_update(proposal_id, update_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if proposal:
        update = ProposalUpdate.query.filter_by(proposal_id=proposal.id, id=update_id).first()
        if update:
            return proposal_update_schema.dump(update)
        else:
            return {"message": "No update matching id"}
    else:
        return {"message": "No proposal matching id"}, 404


@blueprint.route("/<proposal_id>/updates", methods=["POST"])
@limiter.limit("5/day;1/minute")
@requires_team_member_auth
@body({
    "title": fields.Str(required=True, validate=validate.Length(min=3, max=60)),
    "content": fields.Str(required=True, validate=validate.Length(min=5, max=10000)),
})
def post_proposal_update(proposal_id, title, content):
    update = ProposalUpdate(
        proposal_id=g.current_proposal.id,
        title=title,
        content=content
    )
    db.session.add(update)
    db.session.commit()

    # notify followers
    g.current_proposal.send_follower_email('followed_proposal_update', url_suffix='?tab=updates')

    dumped_update = proposal_update_schema.dump(update)
    return dumped_update, 201


@blueprint.route("/<proposal_id>/invite", methods=["POST"])
@limiter.limit("30/day;10/minute")
@requires_team_member_auth
@body({
    "address": fields.Str(required=True, validate=validate.Length(max=255)),
})
def post_proposal_team_invite(proposal_id, address):
    for u in g.current_proposal.team:
        if address == u.email_address:
            return {"message": f"Cannot invite members already on the team"}, 400

    existing_invite = ProposalTeamInvite.query.filter_by(
        proposal_id=proposal_id,
        address=address
    ).first()
    if existing_invite:
        return {"message": f"You've already invited {address}"}, 400

    invite = ProposalTeamInvite(
        proposal_id=proposal_id,
        address=address
    )
    db.session.add(invite)
    db.session.commit()

    # Send email
    email = address
    user = User.get_by_email(email_address=address)
    if user:
        email = user.email_address
    if is_email(email):
        send_email(email, 'team_invite', {
            'user': user,
            'inviter': g.current_user,
            'proposal': g.current_proposal,
            'invite_url': make_url(
                f'/profile/{user.id}?tab=invites' if user else '/auth')
        })

    return proposal_team_invite_schema.dump(invite), 201


@blueprint.route("/<proposal_id>/invite/<id_or_address>", methods=["DELETE"])
@requires_team_member_auth
def delete_proposal_team_invite(proposal_id, id_or_address):
    invite = ProposalTeamInvite.query.filter(
        (ProposalTeamInvite.id == id_or_address) |
        (ProposalTeamInvite.address == id_or_address)
    ).first()
    if not invite:
        return {"message": "No invite found given {}".format(id_or_address)}, 404
    if invite.accepted:
        return {"message": "Cannot delete an invite that has been accepted"}, 403

    db.session.delete(invite)
    db.session.commit()
    return {"message": "ok"}, 202


# request MS payout
@blueprint.route("/<proposal_id>/milestone/<milestone_id>/request", methods=["PUT"])
@requires_team_member_auth
def request_milestone_payout(proposal_id, milestone_id):
    for ms in g.current_proposal.milestones:
        if ms.id == int(milestone_id):
            ms.request_payout(g.current_user.id)
            db.session.add(ms)
            db.session.commit()
            return proposal_schema.dump(g.current_proposal), 200

    return {"message": "No milestone matching id"}, 404
