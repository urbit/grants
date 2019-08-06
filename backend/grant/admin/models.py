from datetime import datetime
from grant.extensions import ma, db
from grant.utils.ma_fields import UnixDate
from grant.utils.misc import gen_random_id

class AdminLog(db.Model):
    __tablename__ = "admin_log"

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime, nullable=False)
    event = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    ip = db.Column(db.String(255), nullable=False)

    user = db.relationship("User")

    def __init__(self, **kwargs):
        super().__init__(
            id=gen_random_id(AdminLog),
            date_created=datetime.now(),
            **kwargs
        )


class AdminLogSchema(ma.Schema):
    class Meta:
        model = AdminLog
        # Fields to expose
        fields = (
            "id",
            "date_created",
            "event",
            "message",
            "user",
            "ip",
        )

    date_created = UnixDate(attribute="date_created")
    user = ma.Nested("UserSchema")

admin_log_schema = AdminLogSchema()
admin_logs_schema = AdminLogSchema(many=True)
