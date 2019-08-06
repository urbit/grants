from flask import Blueprint, g
from sqlalchemy import or_
from grant.extensions import db
from grant.utils import pagination
from grant.rfw import models as rfw_models
from grant.tag import models as tag_models
from grant.parser import body, query, paginated_fields
from grant.utils.enums import RFWStatus
from grant.utils.auth import requires_email_verified_auth
from grant.utils.misc import make_admin_url
from grant.email.send import send_admin_email
from marshmallow import fields
from webargs import validate
from grant.utils.exceptions import ValidationException


RFW = rfw_models.RFW
rfw_schemas = rfw_models.rfw_schemas


blueprint = Blueprint("rfw", __name__, url_prefix="/api/v1/bounties")


def rfw_exists_check(id):
    rfw = RFW.query.get(id)
    if not rfw:
        raise ValidationException("No RFW matching id")
    if rfw.status in [RFWStatus.DRAFT]:
        raise ValidationException("RFW is not viewable")
    return rfw


@blueprint.route("/", methods=["GET"])
@query(paginated_fields)
def get_rfws(**kwargs):
    query = RFW.query.filter(RFW.status != RFWStatus.DRAFT)
    page = pagination.rfw(
        schema=rfw_schemas.list,
        query=query,
        **kwargs,
    )
    return page


@blueprint.route("/<id>", methods=["GET"])
def get_rfw(id):
    rfw = rfw_exists_check(id)
    return rfw_schemas.single.dump(rfw)


@blueprint.route("/<id>/worker/request", methods=["POST"])
@requires_email_verified_auth
@body({
    "statusMessage": fields.Str(required=True, validate=validate.Length(max=1000)),
})
def post_rfw_worker_request(id, **kwargs):
    rfw = rfw_exists_check(id)
    rfw.create_worker_by_user_id_and_request(id=g.current_user.id, **kwargs)
    db.session.commit()
    # notify admin
    send_admin_email('admin_worker_request', {
        'rfw': rfw,
        'rfw_url': make_admin_url(f'/bounties/{rfw.id}'),
    })
    return rfw_schemas.single.dump(rfw)


@blueprint.route("/<id>/milestone/<ms_id>/worker/<worker_id>", methods=["POST"])
@requires_email_verified_auth
@body({
    "message": fields.Str(required=True, validate=validate.Length(max=1000)),
    "url": fields.Str(required=False, validate=validate.Length(max=1000))
})
def post_rfw_milestone_worker_claim(id, ms_id, worker_id, message, url):
    rfw = rfw_exists_check(id)
    rfw.request_milestone_claim(worker_id, ms_id, message, url)
    db.session.commit()
    # notify admin
    send_admin_email('admin_work_milestone_claim', {
        'rfw': rfw,
        'milestone': rfw.get_milestone_by_id(ms_id),
        'rfw_url': make_admin_url(f'/bounties/{rfw.id}'),
    })
    return rfw_schemas.single.dump(rfw)


@blueprint.route("/tags", methods=["GET"])
def get_rfw_tags():
    tags = tag_models.Tag.query.all()
    return tag_models.tag_schemas.list.dump(tags)
