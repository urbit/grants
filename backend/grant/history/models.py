import datetime

from grant.extensions import ma, db
from grant.utils.ma_fields import UnixDate
from grant.utils.misc import gen_random_id, make_url

class HistoryEvent(db.Model):
    __tablename__ = "history_event"

    id = db.Column(db.Integer(), primary_key=True)

    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey("proposal.id"), nullable=True)

    user = db.relationship("User", lazy=True)
    proposal = db.relationship("Proposal", lazy=True)

    def __init__(
            self,
            title: str,
            content: str,
            date: datetime = None,
            user_id: int = None,
            proposal_id: int = None,
    ):
        self.id = gen_random_id(HistoryEvent)
        self.title = title[:120]
        self.content = content[:1000]
        self.user_id = user_id
        self.proposal_id = proposal_id
        self.date = date or datetime.datetime.now()


class HistoryEventSchema(ma.Schema):
    class Meta:
        model = HistoryEvent
        # Fields to expose
        fields = (
            "id",
            "title",
            "title_raw",
            "content",
            "content_raw",
            "date",
            "user",
            "proposal"
        )

    date = UnixDate(attribute="date")
    user = ma.Nested("UserSchema")
    proposal = ma.Nested("ProposalSchema")
    title = ma.Method("text_title")
    title_raw = ma.Method("raw_title")
    content = ma.Method("markdown_content")
    content_raw = ma.Method("raw_content")

    def text_title(self, obj):
        return make_text(obj, "title")

    def raw_title(self, obj):
        return obj.title

    def raw_content(self, obj):
        return obj.content

    def markdown_content(self, obj):
        return make_markdown(obj, "content")

history_event_schema = HistoryEventSchema()
history_events_schema = HistoryEventSchema(many=True)

def make_text(event, field):
    text = getattr(event, field)
    if event.user != None:
        text = text.replace("$user", event.user.display_name)
    if event.proposal != None:
        text = text.replace("$proposal", event.proposal.title)
    return text

def make_markdown(event, field):
    text = getattr(event, field)
    if event.user != None:
        text = text.replace(
            "$user",
            "[{}]({})".format(
                event.user.display_name,
                make_url("/profile/{}".format(event.user.id))
            )
        )
    if event.proposal != None:
        text = text.replace(
            "$proposal",
            "[{}]({})".format(
                event.proposal.title,
                make_url("/proposal/{}".format(event.proposal.id))
            )
        )
    return text
