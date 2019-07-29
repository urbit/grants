import datetime
from decimal import Decimal, ROUND_DOWN
from functools import reduce

from flask import current_app
from marshmallow import post_dump
from sqlalchemy import func, or_, select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import column_property

from flask import current_app
from grant.comment.models import Comment
from grant.email.send import send_email, send_admin_email
from grant.extensions import ma, db
from grant.utils.enums import (
    ProposalStatus,
    ProposalStage,
    Category,
    MilestoneStage
)
from grant.utils.exceptions import ValidationException
from grant.utils.misc import dt_to_unix, make_url, make_admin_url, gen_random_id
from grant.utils.stubs import anonymous_user

proposal_team = db.Table(
    'proposal_team', db.Model.metadata,
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('proposal_id', db.Integer, db.ForeignKey('proposal.id'))
)

proposal_follower = db.Table(
    'proposal_follower', db.Model.metadata,
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('proposal_id', db.Integer, db.ForeignKey('proposal.id'))
)


class ProposalTeamInvite(db.Model):
    __tablename__ = "proposal_team_invite"

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime)

    proposal_id = db.Column(db.Integer, db.ForeignKey("proposal.id"), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    accepted = db.Column(db.Boolean)

    def __init__(self, proposal_id: int, address: str, accepted: bool = None):
        self.proposal_id = proposal_id
        self.address = address[:255]
        self.accepted = accepted
        self.date_created = datetime.datetime.now()

    @staticmethod
    def get_pending_for_user(user):
        return ProposalTeamInvite.query.filter(
            ProposalTeamInvite.accepted == None,
            (func.lower(user.email_address) == func.lower(ProposalTeamInvite.address))
        ).all()


class ProposalUpdate(db.Model):
    __tablename__ = "proposal_update"

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime)

    proposal_id = db.Column(db.Integer, db.ForeignKey("proposal.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)

    def __init__(self, proposal_id: int, title: str, content: str):
        self.id = gen_random_id(ProposalUpdate)
        self.proposal_id = proposal_id
        self.title = title[:255]
        self.content = content
        self.date_created = datetime.datetime.now()


class Proposal(db.Model):
    __tablename__ = "proposal"

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime)
    rfp_id = db.Column(db.Integer(), db.ForeignKey('rfp.id'), nullable=True)

    # Content info
    status = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    brief = db.Column(db.String(255), nullable=False)
    stage = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(255), nullable=False)
    date_approved = db.Column(db.DateTime)
    date_published = db.Column(db.DateTime)
    reject_reason = db.Column(db.String())
    private = db.Column(db.Boolean, default=False, nullable=False)

    # Payment info
    target = db.Column(db.String(255), nullable=False)

    # Relations
    team = db.relationship(
        "User",
        secondary=proposal_team
    )
    comments = db.relationship(
        Comment,
        backref="proposal",
        lazy=True,
        cascade="all, delete-orphan"
    )
    updates = db.relationship(
        ProposalUpdate,
        backref="proposal",
        lazy=True,
        cascade="all, delete-orphan"
    )
    milestones = db.relationship(
        "Milestone",
        backref="proposal",
        order_by="asc(Milestone.index)",
        lazy=True,
        cascade="all, delete-orphan"
    )
    invites = db.relationship(
        ProposalTeamInvite,
        backref="proposal",
        lazy=True,
        cascade="all, delete-orphan"
    )
    followers = db.relationship(
        "User",
        secondary=proposal_follower,
        back_populates="followed_proposals"
    )
    followers_count = column_property(
        select([func.count(proposal_follower.c.proposal_id)])
        .where(proposal_follower.c.proposal_id == id)
        .correlate_except(proposal_follower)
    )
    comments_count = column_property(
        select([func.count(Comment.proposal_id)])
        .where(Comment.proposal_id == id)
        .where(Comment.hidden != True)
        .correlate_except(Comment)
    )

    def __init__(
            self,
            status: str = ProposalStatus.DRAFT,
            title: str = '',
            brief: str = '',
            content: str = '',
            stage: str = ProposalStage.PREVIEW,
            target: str = '0',
            category: str = ''
    ):
        self.id = gen_random_id(Proposal)
        self.date_created = datetime.datetime.now()
        self.status = status
        self.title = title
        self.brief = brief
        self.content = content
        self.category = category
        self.target = target
        self.stage = stage

    @staticmethod
    def simple_validate(proposal):
        # Validate fields to be database save-able.
        # Stricter validation is done in validate_publishable.
        stage = proposal.get('stage')
        category = proposal.get('category')

        if stage and not ProposalStage.includes(stage):
            raise ValidationException("Proposal stage {} is not a valid stage".format(stage))
        if category and not Category.includes(category):
            raise ValidationException("Category {} not a valid category".format(category))

    def validate_publishable_milestones(self):
        payout_total = 0.0
        for i, milestone in enumerate(self.milestones):

            if milestone.immediate_payout and i != 0:
                raise ValidationException("Only the first milestone can have an immediate payout")

            if len(milestone.title) > 60:
                raise ValidationException("Milestone title cannot be longer than 60 chars")

            if len(milestone.content) > 200:
                raise ValidationException("Milestone content cannot be longer than 200 chars")

            try:
                p = float(milestone.payout_amount)
                if not p.is_integer():
                    raise ValidationException("Milestone payout must be whole numbers, no decimals")
                if p <= 0:
                    raise ValidationException("Milestone payout must be greater than zero")
            except ValueError:
                raise ValidationException("Milestone payout percent must be a number")

            payout_total += p

        if payout_total != float(self.target):
            raise ValidationException("Payout of milestones must add up to proposal target")

    def validate_publishable(self):
        self.validate_publishable_milestones()

        # Require certain fields
        required_fields = ['title', 'content', 'brief', 'category', 'target']
        for field in required_fields:
            if not hasattr(self, field):
                raise ValidationException("Proposal must have a {}".format(field))

        # Stricter limits on certain fields
        if len(self.title) > 60:
            raise ValidationException("Proposal title cannot be longer than 60 characters")
        if len(self.brief) > 140:
            raise ValidationException("Brief cannot be longer than 140 characters")
        if len(self.content) > 250000:
            raise ValidationException("Content cannot be longer than 250,000 characters")

        # Then run through regular validation
        Proposal.simple_validate(vars(self))

    # only do this when user submits for approval, there is a chance the dates will
    # be passed by the time admin approval / user publishing occurs
    def validate_milestone_dates(self):
        present = datetime.datetime.today().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        for milestone in self.milestones:
            if present > milestone.date_estimated:
                raise ValidationException("Milestone date estimate must be in the future ")

    @staticmethod
    def create(**kwargs):
        Proposal.simple_validate(kwargs)
        proposal = Proposal(
            **kwargs
        )
        db.session.add(proposal)
        db.session.flush()
        return proposal

    @staticmethod
    def get_by_user(user, statuses=[ProposalStatus.LIVE]):
        from grant.utils.auth import get_authed_user
        authed = get_authed_user()
        status_filter = or_(Proposal.status == v for v in statuses)
        res = Proposal.query \
            .join(proposal_team) \
            .filter(proposal_team.c.user_id == user.id) \
            .filter(status_filter) \
            .all()
        # only team members get to see private proposals
        without_priv = []
        for p in res:
            if p.private:
                if authed and authed.id in [t.id for t in p.team]:
                    without_priv.append(p)
            else:
                without_priv.append(p)
        return without_priv

    def update(
            self,
            title: str = '',
            brief: str = '',
            category: str = '',
            content: str = '',
            target: str = '0',
    ):
        self.title = title[:255]
        self.brief = brief[:255]
        self.category = category
        self.content = content[:300000]
        self.target = target[:255] if target != '' else '0'
        Proposal.simple_validate(vars(self))

    def send_admin_email(self, type: str):
        send_admin_email(type, {
            'proposal': self,
            'proposal_url': make_admin_url(f'/proposals/{self.id}'),
        })

    def send_follower_email(self, type: str, email_args={}, url_suffix=''):
        for u in self.followers:
            send_email(u.email_address, type, {
                'user': u,
                'proposal': self,
                'proposal_url': make_url(f'/proposals/{self.id}{url_suffix}'),
                **email_args
            })

    # state: status (DRAFT || REJECTED) -> PENDING
    def submit_for_approval(self):
        self.validate_publishable()
        self.validate_milestone_dates()
        allowed_statuses = [ProposalStatus.DRAFT, ProposalStatus.REJECTED]
        # specific validation
        if self.status not in allowed_statuses:
            raise ValidationException(f"Proposal status must be draft or rejected to submit for approval")
        self.send_admin_email('admin_approval')
        self.status = ProposalStatus.PENDING
        db.session.add(self)
        db.session.flush()

    # state: status PENDING -> (APPROVED || REJECTED)
    def approve_pending(self, is_approve, reject_reason=None):
        self.validate_publishable()
        # specific validation
        if not self.status == ProposalStatus.PENDING:
            raise ValidationException(f"Proposal must be pending to approve or reject")

        if is_approve:
            self.status = ProposalStatus.APPROVED
            self.date_approved = datetime.datetime.now()
            for t in self.team:
                send_email(t.email_address, 'proposal_approved', {
                    'user': t,
                    'proposal': self,
                    'proposal_url': make_url(f'/proposals/{self.id}'),
                    'admin_note': 'Congratulations! Your proposal has been approved.'
                })
        else:
            if not reject_reason:
                raise ValidationException("Please provide a reason for rejecting the proposal")
            self.status = ProposalStatus.REJECTED
            self.reject_reason = reject_reason
            for t in self.team:
                send_email(t.email_address, 'proposal_rejected', {
                    'user': t,
                    'proposal': self,
                    'proposal_url': make_url(f'/proposals/{self.id}'),
                    'admin_note': reject_reason
                })

    # state: status APPROVE -> LIVE, stage PREVIEW -> WIP
    def publish(self):
        self.validate_publishable()
        # specific validation
        if not self.status == ProposalStatus.APPROVED:
            raise ValidationException(f"Proposal status must be approved")
        self.date_published = datetime.datetime.now()
        self.status = ProposalStatus.LIVE
        self.stage = ProposalStage.WIP

    def cancel(self):
        if self.status != ProposalStatus.LIVE:
            raise ValidationException("Cannot cancel a proposal until it's live")

        self.stage = ProposalStage.CANCELED
        db.session.add(self)
        db.session.flush()

        # Send emails to team & contributors
        for u in self.team:
            send_email(u.email_address, 'proposal_canceled', {
                'proposal': self,
                'support_url': make_url('/contact'),
            })

    def follow(self, user, is_follow):
        if is_follow:
            self.followers.append(user)
        else:
            self.followers.remove(user)
        db.session.flush()

    @hybrid_property
    def is_failed(self):
        if not self.status == ProposalStatus.LIVE or not self.date_published:
            return False
        if self.stage == ProposalStage.FAILED or self.stage == ProposalStage.CANCELED:
            return True
        return False

    @hybrid_property
    def current_milestone(self):
        if self.milestones:
            for ms in self.milestones:
                if ms.stage != MilestoneStage.PAID:
                    return ms
            return self.milestones[-1]  # return last one if all PAID
        return None

    @hybrid_property
    def authed_follows(self):
        from grant.utils.auth import get_authed_user
        authed = get_authed_user()
        if not authed:
            return False
        res = db.session.query(proposal_follower) \
            .filter_by(user_id=authed.id, proposal_id=self.id) \
            .count()
        if res:
            return True
        return False


class ProposalSchema(ma.Schema):
    class Meta:
        model = Proposal
        # Fields to expose
        fields = (
            "id",
            "stage",
            "status",
            "date_created",
            "date_approved",
            "date_published",
            "reject_reason",
            "title",
            "brief",
            "target",
            "is_failed",
            "content",
            "updates",
            "milestones",
            "current_milestone",
            "category",
            "team",
            "invites",
            "rfp",
            "private",
            "authed_follows",
            "followers_count",
            "comments_count"
        )

    date_created = ma.Method("get_date_created")
    date_approved = ma.Method("get_date_approved")
    date_published = ma.Method("get_date_published")

    updates = ma.Nested("ProposalUpdateSchema", many=True)
    team = ma.Nested("UserSchema", many=True)
    milestones = ma.Nested("MilestoneSchema", many=True)
    current_milestone = ma.Nested("MilestoneSchema")
    invites = ma.Nested("ProposalTeamInviteSchema", many=True)
    rfp = ma.Nested("RFPSchema", exclude=["accepted_proposals"])

    def get_date_created(self, obj):
        return dt_to_unix(obj.date_created)

    def get_date_approved(self, obj):
        return dt_to_unix(obj.date_approved) if obj.date_approved else None

    def get_date_published(self, obj):
        return dt_to_unix(obj.date_published) if obj.date_published else None


proposal_schema = ProposalSchema()
proposals_schema = ProposalSchema(many=True)
user_fields = [
    "id",
    "status",
    "title",
    "brief",
    "target",
    "date_created",
    "date_approved",
    "date_published",
    "reject_reason",
    "team",
    "authed_follows"
]
user_proposal_schema = ProposalSchema(only=user_fields)
user_proposals_schema = ProposalSchema(many=True, only=user_fields)


class ProposalUpdateSchema(ma.Schema):
    class Meta:
        model = ProposalUpdate
        # Fields to expose
        fields = (
            "update_id",
            "date_created",
            "proposal_id",
            "title",
            "content"
        )

    date_created = ma.Method("get_date_created")
    proposal_id = ma.Method("get_proposal_id")
    update_id = ma.Method("get_update_id")

    def get_update_id(self, obj):
        return obj.id

    def get_proposal_id(self, obj):
        return obj.proposal_id

    def get_date_created(self, obj):
        return dt_to_unix(obj.date_created)


proposal_update_schema = ProposalUpdateSchema()
proposals_update_schema = ProposalUpdateSchema(many=True)


class ProposalTeamInviteSchema(ma.Schema):
    class Meta:
        model = ProposalTeamInvite
        fields = (
            "id",
            "date_created",
            "address",
            "accepted"
        )

    date_created = ma.Method("get_date_created")

    def get_date_created(self, obj):
        return dt_to_unix(obj.date_created)


proposal_team_invite_schema = ProposalTeamInviteSchema()
proposal_team_invites_schema = ProposalTeamInviteSchema(many=True)


class InviteWithProposalSchema(ma.Schema):
    class Meta:
        model = ProposalTeamInvite
        fields = (
            "id",
            "date_created",
            "address",
            "accepted",
            "proposal"
        )

    date_created = ma.Method("get_date_created")
    proposal = ma.Nested("ProposalSchema")

    def get_date_created(self, obj):
        return dt_to_unix(obj.date_created)


invite_with_proposal_schema = InviteWithProposalSchema()
invites_with_proposal_schema = InviteWithProposalSchema(many=True)
