from flask import Blueprint, request

from grant.parser import body, query, paginated_fields
from grant.utils import pagination

blueprint = Blueprint('history', __name__, url_prefix='/api/v1/history')

@blueprint.route("/", methods=["GET"])
@query(paginated_fields)
def get_history(page, filters, search, sort):
    filters_workaround = request.args.getlist('filters[]')
    page = pagination.history(
        page=page,
        filters=filters_workaround,
        search=search,
        sort=sort,
    )
    return page
