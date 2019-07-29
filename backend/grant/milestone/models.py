import datetime

from grant.extensions import ma, db
from grant.utils.enums import MilestoneStage
from grant.utils.exceptions import ValidationException
from grant.utils.ma_fields import UnixDate
from grant.utils.misc import gen_random_id, clean_decimal


class MilestoneException(Exception):
    pass


class Milestone(db.Model):
    __tablename__ = "milestone"

    id = db.Column(db.Integer(), primary_key=True)
    index = db.Column(db.Integer(), nullable=False)
    date_created = db.Column(db.DateTime, nullable=False)

    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    payout_amount = db.Column(db.String(255), nullable=False)
    immediate_payout = db.Column(db.Boolean)
    date_estimated = db.Column(db.DateTime, nullable=False)

    stage = db.Column(db.String(255), nullable=False)

    date_requested = db.Column(db.DateTime, nullable=True)
    requested_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    date_rejected = db.Column(db.DateTime, nullable=True)
    reject_reason = db.Column(db.String(255))

    date_accepted = db.Column(db.DateTime, nullable=True)

    date_paid = db.Column(db.DateTime, nullable=True)
    paid_tx_id = db.Column(db.String(255))

    proposal_id = db.Column(db.Integer, db.ForeignKey("proposal.id"), nullable=False)

    def __init__(
            self,
            index: int,
            title: str,
            content: str,
            date_estimated: datetime,
            payout_amount: str,
            immediate_payout: bool,
            stage: str = MilestoneStage.IDLE,
            proposal_id=int,
    ):
        self.id = gen_random_id(Milestone)
        self.title = title[:255]
        self.content = content[:255]
        self.stage = stage
        self.date_estimated = date_estimated
        self.payout_amount = payout_amount[:255]
        self.immediate_payout = immediate_payout
        self.proposal_id = proposal_id
        self.date_created = datetime.datetime.now()
        self.index = index

    @staticmethod
    def make(milestones_data, proposal):
        if milestones_data:
            # Delete & re-add milestones
            [db.session.delete(x) for x in proposal.milestones]
            for i, milestone_data in enumerate(milestones_data):
                m = Milestone(
                    title=milestone_data["title"][:255],
                    content=milestone_data["content"][:255],
                    date_estimated=datetime.datetime.fromtimestamp(milestone_data["date_estimated"]),
                    payout_amount=str(milestone_data["payout_amount"])[:255],
                    immediate_payout=milestone_data["immediate_payout"],
                    proposal_id=proposal.id,
                    index=i
                )
                db.session.add(m)

    def request_payout(self, user_id: int):
        if self.stage not in [MilestoneStage.IDLE, MilestoneStage.REJECTED]:
            raise MilestoneException(f'Cannot request payout for milestone at {self.stage} stage')
        self.proposal.send_admin_email('admin_payout')
        self.stage = MilestoneStage.REQUESTED
        self.date_requested = datetime.datetime.now()
        self.requested_user_id = user_id

    def reject_request(self, reason: str):
        if self.stage != MilestoneStage.REQUESTED:
            raise MilestoneException(f'Cannot reject payout request for milestone at {self.stage} stage')
        self.stage = MilestoneStage.REJECTED
        self.date_rejected = datetime.datetime.now()
        self.reject_reason = reason

    def accept_immediate(self):
        if self.immediate_payout and self.index == 0:
            self.date_requested = datetime.datetime.now()
            self.stage = MilestoneStage.ACCEPTED
            self.date_accepted = datetime.datetime.now()
            db.session.add(self)
            db.session.flush()
            self.make_history_event()

    def accept_request(self):
        if self.stage != MilestoneStage.REQUESTED:
            raise MilestoneException(f'Cannot accept payout request for milestone at {self.stage} stage')
        self.stage = MilestoneStage.ACCEPTED
        self.date_accepted = datetime.datetime.now()
        db.session.add(self)
        db.session.flush()
        self.make_history_event()

    def mark_paid(self):
        if self.stage != MilestoneStage.ACCEPTED and self.stage != MilestoneStage.REQUESTED:
            raise MilestoneException(f'Cannot pay a milestone at {self.stage} stage')
        self.stage = MilestoneStage.PAID
        self.date_paid = datetime.datetime.now()

    def make_history_event(self):
        from grant.history.models import HistoryEvent
        amount = float(self.payout_amount)
        clean_amount = clean_decimal(amount)

        # Early exit if this milestone has no payout associated with it
        if amount <= 0:
            return

        # Different text based on type / position of milestone
        title = f"$user received {clean_amount} STARS for completing a milestone"
        content = f"$user has received a payout of {clean_amount} STARS for completing a milestone for $proposal"
        if self.immediate_payout and self.index == 0:
            title = f"$user received {clean_amount} STARS to start working on their proposal"
            content = f"$user has received an initial payout of {clean_amount} STARS for $proposal"
        if self.index == len(self.proposal.milestones):
            title = f"$user received {clean_amount} STARS for completing their proposal"
            content = f"$user has completed their work on $proposal and received their final payout of {clean_amount} STARS"

        event = HistoryEvent(
            title=title,
            content=content,
            user_id=self.proposal.team[0].id,
            proposal_id=self.proposal.id,
        )
        db.session.add(event)
        db.session.flush()


class MilestoneSchema(ma.Schema):
    class Meta:
        model = Milestone
        # Fields to expose
        fields = (
            "title",
            "index",
            "id",
            "content",
            "stage",
            "payout_amount",
            "immediate_payout",
            "reject_reason",
            "paid_tx_id",
            "date_created",
            "date_estimated",
            "date_requested",
            "date_rejected",
            "date_accepted",
            "date_paid",
        )

    date_created = UnixDate(attribute='date_created')
    date_estimated = UnixDate(attribute='date_estimated')
    date_requested = UnixDate(attribute='date_requested')
    date_rejected = UnixDate(attribute='date_rejected')
    date_accepted = UnixDate(attribute='date_accepted')
    date_paid = UnixDate(attribute='date_paid')


milestone_schema = MilestoneSchema()
milestones_schema = MilestoneSchema(many=True)
