from flask import Blueprint

from .models import EmailVerification, db

blueprint = Blueprint("email", __name__, url_prefix="/api/v1/email")


@blueprint.route("/<code>/verify", methods=["POST"])
def verify_email(code):
    ev = EmailVerification.query.filter_by(code=code).first()
    if ev:
        ev.has_verified = True
        db.session.commit()
        return {"message": "Email verified"}, 200

    return {"message": "Invalid email code"}, 400


@blueprint.route("/<code>/unsubscribe", methods=["POST"])
def unsubscribe_email(code):
    ev = EmailVerification.query.filter_by(code=code).first()
    if ev:
        ev.user.settings.unsubscribe_emails()
        db.session.commit()
        return {"message": "Unsubscribed from all emails"}, 200

    return {"message": "Invalid email code"}, 400
