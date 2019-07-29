from datetime import datetime
from decimal import Decimal, ROUND_HALF_DOWN
from functools import reduce

from flask import Blueprint, request
from marshmallow import fields, validate
from sqlalchemy import func, or_, text

import grant.utils.admin as admin
import grant.utils.auth as auth
from grant.comment.models import Comment, user_comments_schema, admin_comments_schema, admin_comment_schema
from grant.email.send import generate_email, send_email
from grant.extensions import db
from grant.milestone.models import Milestone
from grant.parser import body, query, paginated_fields
from grant.proposal.models import (
    Proposal,
    proposals_schema,
    proposal_schema,
)
from grant.rfp.models import RFP, admin_rfp_schema, admin_rfps_schema
from grant.rfw import models as rfw_models
from grant.tag import models as tag_models
from grant.user.models import User, UserSettings, admin_users_schema, admin_user_schema
from grant.history.models import HistoryEvent, history_event_schema
from grant.utils import pagination
from grant.utils.enums import Category
from grant.utils.enums import (
    ProposalStatus,
    ProposalStage,
    MilestoneStage,
    RFPStatus,
    RFWStatus,
    RFWWorkerStatus,
    RFWMilestoneClaimStage
)
from grant.utils.misc import make_url
from .example_emails import example_email_args

blueprint = Blueprint('admin', __name__, url_prefix='/api/v1/admin')


def make_2fa_state():
    return {
        "isLoginFresh": admin.is_auth_fresh(),
        "has2fa": admin.has_2fa_setup(),
        "is2faAuthed": admin.admin_is_2fa_authed(),
        "backupCodeCount": admin.backup_code_count(),
        "isEmailVerified": auth.is_email_verified(),
    }


def make_login_state():
    return {
        "isLoggedIn": admin.admin_is_authed(),
        "is2faAuthed": admin.admin_is_2fa_authed()
    }


@blueprint.route("/checklogin", methods=["GET"])
def loggedin():
    return make_login_state()


@blueprint.route("/login", methods=["POST"])
@body({
    "username": fields.Str(required=False, missing=None),
    "password": fields.Str(required=False, missing=None)
})
def login(username, password):
    if auth.auth_user(username, password):
        if admin.admin_is_authed():
            return make_login_state()
    return {"message": "Username or password incorrect."}, 401


@blueprint.route("/refresh", methods=["POST"])
@body({
    "password": fields.Str(required=True)
})
def refresh(password):
    if auth.refresh_auth(password):
        return make_login_state()
    else:
        return {"message": "Username or password incorrect."}, 401


@blueprint.route("/2fa", methods=["GET"])
def get_2fa():
    if not admin.admin_is_authed():
        return {"message": "Must be authenticated"}, 403
    return make_2fa_state()


@blueprint.route("/2fa/init", methods=["GET"])
def get_2fa_init():
    admin.throw_on_2fa_not_allowed()
    return admin.make_2fa_setup()


@blueprint.route("/2fa/enable", methods=["POST"])
@body({
    "backupCodes": fields.List(fields.Str(), required=True),
    "totpSecret": fields.Str(required=True),
    "verifyCode": fields.Str(required=True)
})
def post_2fa_enable(backup_codes, totp_secret, verify_code):
    admin.throw_on_2fa_not_allowed()
    admin.check_and_set_2fa_setup(backup_codes, totp_secret, verify_code)
    admin.admin_log("2FA_ENABLE", f"Enabled two factor authentication")
    db.session.commit()
    return make_2fa_state()


@blueprint.route("/2fa/verify", methods=["POST"])
@body({
    "verifyCode": fields.Str(required=True)
})
def post_2fa_verify(verify_code):
    admin.throw_on_2fa_not_allowed(allow_stale=True)
    admin.admin_auth_2fa(verify_code)
    db.session.commit()
    return make_2fa_state()


@blueprint.route("/logout", methods=["GET"])
def logout():
    admin.logout()
    return {
        "isLoggedIn": False,
        "is2faAuthed": False
    }


@blueprint.route("/stats", methods=["GET"])
@admin.admin_auth_required
def stats():
    user_count = db.session.query(func.count(User.id)).scalar()
    proposal_count = db.session.query(func.count(Proposal.id)).scalar()
    proposal_pending_count = db.session.query(func.count(Proposal.id)) \
        .filter(Proposal.status == ProposalStatus.PENDING) \
        .scalar()
    proposal_milestone_payouts_count = db.session.query(func.count(Proposal.id)) \
        .join(Proposal.milestones) \
        .filter(Proposal.status == ProposalStatus.LIVE) \
        .filter(Milestone.stage == MilestoneStage.REQUESTED) \
        .scalar()
    rfw_worker_requests_count = db.session.query(func.count(rfw_models.RFW.id)) \
        .join(rfw_models.RFWWorker) \
        .filter(rfw_models.RFWWorker.status == RFWWorkerStatus.REQUESTED) \
        .scalar()
    rfw_milestone_claim_count = db.session.query(func.count(rfw_models.RFW.id)) \
        .join(rfw_models.RFWMilestone) \
        .join(rfw_models.RFWMilestoneClaim) \
        .filter(rfw_models.RFWMilestoneClaim.stage == RFWMilestoneClaimStage.REQUESTED) \
        .scalar()

    return {
        "userCount": user_count,
        "proposalCount": proposal_count,
        "proposalPendingCount": proposal_pending_count,
        "proposalMilestonePayoutsCount": proposal_milestone_payouts_count,
        "rfwWorkerRequestCount": rfw_worker_requests_count,
        "rfwMilestoneClaimCount": rfw_milestone_claim_count,
    }


# USERS


@blueprint.route('/users/<user_id>', methods=['DELETE'])
@admin.admin_auth_required
def delete_user(user_id):
    user = User.query.filter(User.id == user_id).first()
    if not user:
        return {"message": "No user matching that id"}, 404

    db.session.delete(user)
    admin.admin_log("USER_DELETE", f"Deleted user {user.id} ({user.display_name})")
    db.session.commit()
    return {"message": "ok"}, 200


@blueprint.route("/users", methods=["GET"])
@query(paginated_fields)
@admin.admin_auth_required
def get_users(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.user(
        schema=admin_users_schema,
        query=User.query,
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page


@blueprint.route('/users/<id>', methods=['GET'])
@admin.admin_auth_required
def get_user(id):
    user_db = User.query.filter(User.id == id).first()
    if user_db:
        user = admin_user_schema.dump(user_db)
        user_proposals = Proposal.query.filter(Proposal.team.any(id=user['id'])).all()
        user['proposals'] = proposals_schema.dump(user_proposals)
        user_comments = Comment.get_by_user(user_db)
        user['comments'] = user_comments_schema.dump(user_comments)
        return user
    return {"message": f"Could not find user with id {id}"}, 404


@blueprint.route('/users/<user_id>', methods=['PUT'])
@body({
    "silenced": fields.Bool(required=False, missing=None),
    "banned": fields.Bool(required=False, missing=None),
    "bannedReason": fields.Str(required=False, missing=None),
    "isAdmin": fields.Bool(required=False, missing=None),
})
@admin.admin_auth_required
def edit_user(user_id, silenced, banned, banned_reason, is_admin):
    user = User.query.filter(User.id == user_id).first()
    if not user:
        return {"message": f"Could not find user with id {id}"}, 404

    if silenced is not None:
        user.set_silenced(silenced)
        if silenced:
            admin.admin_log("USER_SILENCE", f"Silenced user {user.id} ({user.display_name})")
        else:
            admin.admin_log("USER_UNSILENCE", f"Unsilenced user {user.id} ({user.display_name})")

    if banned is not None:
        if banned and not banned_reason:  # if banned true, provide reason
            return {"message": "Please include reason for banning"}, 417
        user.set_banned(banned, banned_reason)
        if banned:
            admin.admin_log("USER_BAN", f"Banned user {user.id} ({user.display_name}) for reason '{banned_reason}'")
        else:
            admin.admin_log("USER_UNBAN", f"Unbanned user {user.id} ({user.display_name})")

    if is_admin is not None:
        user.set_admin(is_admin)
        if is_admin:
            admin.admin_log("USER_ADMIN", f"Made user {user.id} ({user.display_name}) an admin")
        else:
            admin.admin_log("USER_ADMIN", f"Removed admin from user {user.id} ({user.display_name})")

    db.session.commit()
    return admin_user_schema.dump(user)


# PROPOSALS


@blueprint.route("/proposals", methods=["GET"])
@query(paginated_fields)
@admin.admin_auth_required
def get_proposals(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.proposal(
        schema=proposals_schema,
        query=Proposal.query,
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page


@blueprint.route('/proposals/<id>', methods=['GET'])
@admin.admin_auth_required
def get_proposal(id):
    proposal = Proposal.query.filter(Proposal.id == id).first()
    if proposal:
        return proposal_schema.dump(proposal)
    return {"message": f"Could not find proposal with id {id}"}, 404


@blueprint.route('/proposals/<id>', methods=['DELETE'])
@admin.admin_auth_required
def delete_proposal(id):
    return {"message": "Not implemented."}, 400


@blueprint.route('/proposals/<id>', methods=['PUT'])
@body({
    "private": fields.Bool(required=False, missing=None)
})
@admin.admin_auth_required
def update_proposal(id, private):
    proposal = Proposal.query.filter(Proposal.id == id).first()
    if not proposal:
        return {"message": f"Could not find proposal with id {id}"}, 404

    if private != None:
        proposal.private = private

    db.session.add(proposal)
    db.session.commit()

    return proposal_schema.dump(proposal)


@blueprint.route('/proposals/<id>/approve', methods=['PUT'])
@body({
    "isApprove": fields.Bool(required=True),
    "rejectReason": fields.Str(required=False, missing=None)
})
@admin.admin_auth_required
def approve_proposal(id, is_approve, reject_reason=None):
    proposal = Proposal.query.filter_by(id=id).first()
    if proposal:
        proposal.approve_pending(is_approve, reject_reason)
        if is_approve:
            admin.admin_log("PROPOSAL_APPROVE", f"Approved proposal {proposal.id} ({proposal.title})")
        else:
            admin.admin_log("PROPOSAL_REJECT", f"Rejected proposal {proposal.id} ({proposal.title}) for reason '{reject_reason}'")
        db.session.commit()
        return proposal_schema.dump(proposal)

    return {"message": "No proposal found."}, 404


@blueprint.route('/proposals/<id>/cancel', methods=['PUT'])
@admin.admin_auth_required
def cancel_proposal(id):
    proposal = Proposal.query.filter_by(id=id).first()
    if not proposal:
        return {"message": "No proposal found."}, 404

    proposal.cancel()
    admin.admin_log("PROPOSAL_CANCEL", f"Canceled proposal {proposal.id} ({proposal.title})")
    db.session.add(proposal)
    db.session.commit()
    return proposal_schema.dump(proposal)


# accept MS payout
@blueprint.route("/proposals/<proposal_id>/milestone/<milestone_id>/accept", methods=["PUT"])
@admin.admin_auth_required
def accept_milestone_payout_request(proposal_id, milestone_id):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404
    for ms in proposal.milestones:
        if ms.id == int(milestone_id):
            ms.accept_request()
            admin.admin_log("MILESTONE_APPROVE", f"Approved milestone #{ms.index + 1} ({ms.title}) for proposal {proposal.id} ({proposal.title})")
            db.session.commit()
            # NOTE - no notification here, do it on PAID
            return proposal_schema.dump(proposal), 200

    return {"message": "No milestone matching id"}, 404


# reject MS payout (reason)
@blueprint.route("/proposals/<proposal_id>/milestone/<milestone_id>/reject", methods=["PUT"])
@body({
    "reason": fields.Str(required=True, validate=validate.Length(min=2, max=200)),
})
@admin.admin_auth_required
def reject_milestone_payout_request(proposal_id, milestone_id, reason):
    proposal = Proposal.query.filter_by(id=proposal_id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404
    for ms in proposal.milestones:
        if ms.id == int(milestone_id):
            ms.reject_request(reason)
            admin.admin_log("MILESTONE_REJECT", f"Rejected milestone #{ms.index + 1} ({ms.title}) for proposal {proposal.id} ({proposal.title}) with reason '{reason}'")
            db.session.add(ms)
            db.session.commit()
            # email TEAM that payout request was rejected
            for member in proposal.team:
                send_email(member.email_address, 'milestone_reject', {
                    'proposal': proposal,
                    'admin_note': reason,
                    'proposal_milestones_url': make_url(f'/proposals/{proposal.id}?tab=milestones'),
                })
            return proposal_schema.dump(proposal), 200

    return {"message": "No milestone matching id"}, 404


@blueprint.route("/proposals/<id>/milestone/<mid>/paid", methods=["PUT"])
@body({})
@admin.admin_auth_required
def paid_milestone_payout_request(id, mid):
    proposal = Proposal.query.filter_by(id=id).first()
    if not proposal:
        return {"message": "No proposal matching id"}, 404
    if not proposal.status == ProposalStatus.LIVE:
        return {"message": "Proposal is not live"}, 400
    for ms in proposal.milestones:
        if ms.id == int(mid):
            ms.mark_paid()
            admin.admin_log("MILESTONE_PAID", f"Paid milestone #{ms.index + 1} ({ms.title}) for proposal {proposal.id} ({proposal.title})")
            db.session.add(ms)
            db.session.flush()
            # check if this is the final ms, and update proposal.stage
            num_paid = reduce(lambda a, x: a + (1 if x.stage == MilestoneStage.PAID else 0), proposal.milestones, 0)
            if num_paid == len(proposal.milestones):
                proposal.stage = ProposalStage.COMPLETED  # WIP -> COMPLETED
                db.session.add(proposal)
                db.session.flush()
            db.session.commit()
            # email TEAM that payout request was PAID
            for member in proposal.team:
                send_email(member.email_address, 'milestone_paid', {
                    'proposal': proposal,
                    'milestone': ms,
                    'amount': ms.payout_amount,
                    'proposal_milestones_url': make_url(f'/proposals/{proposal.id}?tab=milestones'),
                })
            # email FOLLOWERS that milestone was accepted
            proposal.send_follower_email('followed_proposal_milestone', email_args={'milestone':ms}, url_suffix='?tab=milestones')
            return proposal_schema.dump(proposal), 200

    return {"message": "No milestone matching id"}, 404


# EMAIL


@blueprint.route('/email/example/<type>', methods=['GET'])
@admin.admin_auth_required
def get_email_example(type):
    email = generate_email(type, example_email_args.get(type))
    if email['info'].get('subscription'):
        # Unserializable, so remove
        email['info'].pop('subscription', None)
    return email


# Requests for Proposal


@blueprint.route('/rfps', methods=['GET'])
@admin.admin_auth_required
def get_rfps():
    rfps = RFP.query.all()
    return admin_rfps_schema.dump(rfps)


@blueprint.route('/rfps', methods=['POST'])
@body({
    "title": fields.Str(required=True),
    "brief": fields.Str(required=True),
    "content": fields.Str(required=True),
    "category": fields.Str(required=True, validate=validate.OneOf(choices=Category.list())),
    "bounty": fields.Str(required=False, missing=0),
    "matching": fields.Bool(required=False, missing=False),
    "dateCloses": fields.Int(required=False, missing=None)
})
@admin.admin_auth_required
def create_rfp(date_closes, **kwargs):
    rfp = RFP(
        **kwargs,
        date_closes=datetime.fromtimestamp(date_closes) if date_closes else None,
    )
    admin.admin_log("RFP_CREATE", f"Created RFP {rfp.id} ({rfp.title})")
    db.session.add(rfp)
    db.session.commit()
    return admin_rfp_schema.dump(rfp), 200


@blueprint.route('/rfps/<rfp_id>', methods=['GET'])
@admin.admin_auth_required
def get_rfp(rfp_id):
    rfp = RFP.query.filter(RFP.id == rfp_id).first()
    if not rfp:
        return {"message": "No RFP matching that id"}, 404

    return admin_rfp_schema.dump(rfp)


@blueprint.route('/rfps/<rfp_id>', methods=['PUT'])
@body({
    "title": fields.Str(required=True),
    "brief": fields.Str(required=True),
    "status": fields.Str(required=True, validate=validate.OneOf(choices=RFPStatus.list())),
    "content": fields.Str(required=True),
    "category": fields.Str(required=True, validate=validate.OneOf(choices=Category.list())),
    "bounty": fields.Str(required=False, allow_none=True, missing=None),
    "matching": fields.Bool(required=False, default=False, missing=False),
    "dateCloses": fields.Int(required=False, missing=None),
})
@admin.admin_auth_required
def update_rfp(rfp_id, title, brief, content, category, bounty, matching, date_closes, status):
    rfp = RFP.query.filter(RFP.id == rfp_id).first()
    if not rfp:
        return {"message": "No RFP matching that id"}, 404

    # Update fields
    rfp.title = title
    rfp.brief = brief
    rfp.content = content
    rfp.category = category
    rfp.matching = matching
    rfp.bounty = bounty
    rfp.date_closes = datetime.fromtimestamp(date_closes) if date_closes else None

    # Update timestamps if status changed
    if rfp.status != status:
        if status == RFPStatus.LIVE and not rfp.date_opened:
            rfp.date_opened = datetime.now()
        if status == RFPStatus.CLOSED:
            rfp.date_closed = datetime.now()
        rfp.status = status

    admin.admin_log("RFP_UPDATE", f"Updated RFP {rfp.id} ({rfp.title})")
    db.session.add(rfp)
    db.session.commit()
    return admin_rfp_schema.dump(rfp)


@blueprint.route('/rfps/<rfp_id>', methods=['DELETE'])
@admin.admin_auth_required
def delete_rfp(rfp_id):
    rfp = RFP.query.filter(RFP.id == rfp_id).first()
    if not rfp:
        return {"message": "No RFP matching that id"}, 404

    admin.admin_log("RFP_DELETE", f"Deleted RFP {rfp.id} ({rfp.title})")
    db.session.delete(rfp)
    db.session.commit()
    return {"message": "ok"}, 200


# Comments


@blueprint.route('/comments', methods=['GET'])
@query(paginated_fields)
@admin.admin_auth_required
def get_comments(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.comment(
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
        schema=admin_comments_schema
    )
    return page


@blueprint.route('/comments/<comment_id>', methods=['PUT'])
@body({
    "hidden": fields.Bool(required=False, missing=None),
    "reported": fields.Bool(required=False, missing=None),
})
@admin.admin_auth_required
def edit_comment(comment_id, hidden, reported):
    comment = Comment.query.filter(Comment.id == comment_id).first()
    if not comment:
        return {"message": "No comment matching that id"}, 404

    if hidden is not None:
        comment.hide(hidden)
        if hidden:
            admin.admin_log("COMMENT_HIDE", f"Hid comment {comment.id} from {comment.author.id} ({comment.author.display_name})")
        else:
            admin.admin_log("COMMENT_UNHIDE", f"Unhid comment {comment.id} from {comment.author.id} ({comment.author.display_name})")

    if reported is not None:
        comment.report(reported)

    db.session.commit()
    return admin_comment_schema.dump(comment)


# RFWs (Requests for Work)


@blueprint.route('/rfws', methods=['GET'])
@query(paginated_fields)
@admin.admin_auth_required
def get_rfws(**kwargs):
    result = pagination.rfw(
        schema=rfw_models.rfw_schemas.admin_list,
        query=rfw_models.RFW.query,
        **kwargs
    )
    return result


@blueprint.route('/rfws', methods=['POST'])
@body({
    "title": fields.Str(required=True),
    "brief": fields.Str(required=True),
    "content": fields.Str(required=True),
    "status": fields.Str(required=False, validate=validate.OneOf(choices=RFPStatus.list())),
    "category": fields.Str(required=True, validate=validate.OneOf(choices=Category.list())),
    "milestones": fields.List(fields.Dict(), required=False),
    "tags": fields.List(fields.Int(), required=False)
})
@admin.admin_auth_required
def create_rfw(**kwargs):
    rfw = rfw_models.RFW.create(**kwargs)
    admin.admin_log("RFW_CREATE", f"Created RFW {rfw.id} ({rfw.title})")
    db.session.commit()
    return rfw_models.rfw_schemas.single_admin.dump(rfw), 200


@blueprint.route('/rfws/<rfw_id>', methods=['GET'])
@admin.admin_auth_required
def get_rfw(rfw_id):
    rfw = rfw_models.RFW.query.get(rfw_id)
    if not rfw:
        return {"message": "No RFW matching that id"}, 404
    return rfw_models.rfw_schemas.single_admin.dump(rfw)


@blueprint.route('/rfws/<rfw_id>', methods=['PUT'])
@body({
    "title": fields.Str(required=False),
    "brief": fields.Str(required=False),
    "content": fields.Str(required=False),
    "status": fields.Str(required=False, validate=validate.OneOf(choices=RFPStatus.list())),
    "category": fields.Str(required=False, validate=validate.OneOf(choices=Category.list())),
    "milestones": fields.List(fields.Dict(), required=False),
    "deleteMilestones": fields.List(fields.Int(), required=False),
    "tags": fields.List(fields.Int(), required=False)
})
@admin.admin_auth_required
def update_rfw(rfw_id, **kwargs):
    rfw = rfw_models.RFW.query.get(rfw_id)
    if not rfw:
        return {"message": "No RFW matching that id"}, 404
    rfw.update(**kwargs)
    admin.admin_log("RFW_UPDATE", f"Updated RFW {rfw.id} ({rfw.title})")
    db.session.commit()
    return rfw_models.rfw_schemas.single_admin.dump(rfw)


@blueprint.route('/rfws/<rfw_id>', methods=['DELETE'])
@admin.admin_auth_required
def delete_rfw(rfw_id):
    rfw = rfw_models.RFW.query.get(rfw_id)
    if not rfw:
        return {"message": "No RFW matching that id"}, 404
    rfw.delete()
    admin.admin_log("RFW_DELETE", f"Deleted RFW {rfw.id} ({rfw.title})")
    db.session.commit()
    return {"message": "ok"}, 200


@blueprint.route('/rfws/<rfw_id>/worker/<worker_id>/accept', methods=['PUT'])
@body({
    "isAccept": fields.Bool(required=True),
    "message": fields.Str(required=False),
})
@admin.admin_auth_required
def update_rfw_worker_accept(rfw_id, worker_id, is_accept, message=''):
    rfw = rfw_models.RFW.query.get(rfw_id)
    if not rfw:
        return {"message": "No RFW matching that id"}, 404
    w = rfw_models.RFWWorker.query.get(worker_id)
    if not w:
        return {"message": "No worker matching that id"}, 404
    if is_accept:
        rfw.accept_worker_by_id(worker_id, message)
        admin.admin_log("WORKER_ACCEPT", f"Accepted worker {worker_id} for RFW {rfw.id} with message '{message}'")
    else:
        rfw.reject_worker_by_id(worker_id, message)
        admin.admin_log("WORKER_REJECT", f"Rejected worker {worker_id} for RFW {rfw.id} with message '{message}'")
    # notify worker
    send_email(w.user.email_address, 'worker_approved' if is_accept else 'worker_rejected', {
        'rfw': rfw,
        'message': message,
        'rfw_url': make_url(f'/rfws/{rfw.id}'),
    })
    db.session.commit()
    return rfw_models.rfw_schemas.single_admin.dump(rfw)


@blueprint.route('/rfws/<rfw_id>/milestone/<ms_id>/accept/<claim_id>', methods=['PUT'])
@body({
    "isAccept": fields.Bool(required=True),
    "message": fields.Str(required=False),
})
@admin.admin_auth_required
def update_rfw_milestone_claim_accept(rfw_id, ms_id, claim_id, is_accept, message=''):
    rfw = rfw_models.RFW.query.get(rfw_id)
    if not rfw:
        return {"message": "No RFW matching that id"}, 404
    if is_accept:
        rfw.accept_milestone_claim(ms_id, claim_id, message)
        admin.admin_log("CLAIM_ACCEPT", f"Accepted claim {claim_id} for RFW {rfw_id} with message '{message}'")
    else:
        rfw.reject_milestone_claim(ms_id, claim_id, message)
        admin.admin_log("CLAIM_REJECT", f"Rejected claim {claim_id} for RFW {rfw_id} with message '{message}'")
    # notify worker
    ms = rfw.get_milestone_by_id(ms_id)
    w = ms.get_claim_by_id(claim_id).worker
    send_email(w.user.email_address, 'work_milestone_accepted' if is_accept else 'work_milestone_rejected', {
        'rfw': rfw,
        'milestone': ms,
        'message': message,
        'rfw_url': make_url(f'/rfws/{rfw.id}'),
    })
    db.session.commit()
    return rfw_models.rfw_schemas.single_admin.dump(rfw)


# Tags

@blueprint.route('/tags', methods=['GET'])
@admin.admin_auth_required
def get_tags():
    tags = tag_models.Tag.query.all()
    return tag_models.tag_schemas.list_admin.dump(tags)


@blueprint.route('/tags', methods=['PUT'])
@body({
    "id": fields.Int(required=False),
    "text": fields.Str(required=True),
    "description": fields.Str(required=True),
    "color": fields.Str(required=True),
})
@admin.admin_auth_required
def upsert_tags(**kwargs):
    tag = tag_models.Tag.upsert(**kwargs)
    admin.admin_log("TAG_ADD", f"Added tag '{tag.text}'")
    db.session.commit()
    return tag_models.tag_schemas.single_admin.dump(tag)


@blueprint.route('/tags/<tag_id>', methods=['DELETE'])
@admin.admin_auth_required
def delete_tag(tag_id):
    tag = tag_models.Tag.query.get(tag_id)
    if not tag:
        return {"message": "No Tag matching that id"}, 404
    tag.delete()
    admin.admin_log("TAG_DELETE", f"Deleted tag '{tag.text}'")
    db.session.commit()
    return {"message": "ok"}, 200


# History

@blueprint.route('/history', methods=['GET'])
@query(paginated_fields)
@admin.admin_auth_required
def get_history(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.history(
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page


@blueprint.route('/history/<history_event_id>', methods=['GET'])
@admin.admin_auth_required
def get_history_event(history_event_id):
    history_event = HistoryEvent.query.get(history_event_id)
    if not history_event:
        return {"message": "No history event matching that id"}, 404
    return history_event_schema.dump(history_event)


@blueprint.route('/history', methods=['POST'])
@body({
    "title": fields.Str(required=True),
    "content": fields.Str(required=True),
    "date": fields.Int(required=False, missing=None),
    "userId": fields.Int(required=False, missing=None),
    "proposalId": fields.Int(required=False, missing=None),
})
@admin.admin_auth_required
def create_history(date, user_id, proposal_id, **kwargs):
    if user_id and not User.query.get(user_id):
        return {"message": "Invalid user ID"}, 400

    if proposal_id and not Proposal.query.get(proposal_id):
        return {"message": "Invalid proposal ID"}, 400

    history_event = HistoryEvent(
        **kwargs,
        user_id=user_id,
        proposal_id=proposal_id,
        date=datetime.fromtimestamp(date) if date else None,
    )
    db.session.add(history_event)
    admin.admin_log("HISTORY_CREATE", f"Created history event {history_event.id} ({history_event.title})")
    db.session.commit()
    return history_event_schema.dump(history_event), 200


@blueprint.route('/history/<history_event_id>', methods=['PUT'])
@body({
    "title": fields.Str(required=True),
    "content": fields.Str(required=True),
    "date": fields.Int(required=False, missing=None),
    "userId": fields.Int(required=False, missing=None),
    "proposalId": fields.Int(required=False, missing=None),
})
@admin.admin_auth_required
def update_history(history_event_id, title, content, date, user_id, proposal_id):
    history_event = HistoryEvent.query.get(history_event_id)
    if not history_event:
        return {"message": "No history event matching that id"}, 404

    if user_id and not User.query.get(user_id):
        return {"message": "Invalid user ID"}, 400

    if proposal_id and not Proposal.query.get(proposal_id):
        return {"message": "Invalid proposal ID"}, 400

    # Update fields
    history_event.title = title
    history_event.content = content
    history_event.user_id = user_id
    history_event.proposal_id = proposal_id
    if date:
        history_event.date = datetime.fromtimestamp(date)

    db.session.add(history_event)
    admin.admin_log("HISTORY_EDIT", f"Edited history event {history_event.id} ({history_event.title})")
    db.session.commit()
    return history_event_schema.dump(history_event), 200


@blueprint.route('/history/<history_event_id>', methods=['DELETE'])
@admin.admin_auth_required
def delete_history(history_event_id):
    history_event = HistoryEvent.query.get(history_event_id)
    if not history_event:
        return {"message": "No history event matching that id"}, 404

    db.session.delete(history_event)
    admin.admin_log("HISTORY_DELETE", f"Deleted history event {history_event.id} ({history_event.title})")
    db.session.commit()
    return {"message": "ok"}, 200


@blueprint.route("/logs", methods=["GET"])
@query(paginated_fields)
@admin.admin_auth_required
def get_admin_logs(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.admin_log(
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page
