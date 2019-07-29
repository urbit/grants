import abc
from sqlalchemy import or_, and_

from grant.comment.models import Comment, comments_schema
from grant.proposal.models import db, ma, Proposal
from grant.user.models import User, UserSettings, users_schema, AzimuthPoint
from grant.milestone.models import Milestone
from grant.rfw.models import RFW, RFWWorker, RFWMilestone, RFWMilestoneClaim, rfw_schemas
from grant.history.models import HistoryEvent, history_events_schema
from grant.admin.models import AdminLog, admin_logs_schema
from grant.tag.models import Tag, TagAssociation
from .enums import (
    ProposalStatus,
    ProposalStage,
    Category,
    MilestoneStage,
    RFWStatus,
    RFWWorkerStatus,
    RFWMilestoneClaimStage
)


def extract_filters(sw, strings):
    return [f[len(sw):] for f in strings if f.startswith(sw)]


class PaginationException(Exception):
    pass


class Pagination(abc.ABC):
    def validate_filters(self, filters: list):
        if self.FILTERS:
            for f in filters:
                if 'TAG_' in f:
                    continue
                if f not in self.FILTERS:
                    self._raise(f'unsupported filter: {f}')

    def validate_sort(self, sort: str):
        if self.SORT_MAP:
            if sort not in self.SORT_MAP:
                self._raise(f'unsupported sort: {sort}')

    def _raise(self, desc: str):
        name = self.__class__.__name__
        raise PaginationException(f'{name} {desc}')

    # if we ever want to do more interacting from outside
    # consider moving these args into __init__ and attaching to self
    @abc.abstractmethod
    def paginate(
        self,
        schema: ma.Schema,
        query: db.Query,
        page: int,
        filters: list,
        search: str,
        sort: str,
    ):
        pass


class ProposalPagination(Pagination):
    def __init__(self):
        self.FILTERS = [f'STATUS_{s}' for s in ProposalStatus.list()]
        self.FILTERS.extend([f'STAGE_{s}' for s in ProposalStage.list()])
        self.FILTERS.extend([f'CAT_{c}' for c in Category.list()])
        self.FILTERS.extend([f'MILESTONE_{c}' for c in MilestoneStage.list()])
        self.PAGE_SIZE = 9
        self.SORT_MAP = {
            'CREATED:DESC': Proposal.date_created.desc(),
            'CREATED:ASC': Proposal.date_created,
            'PUBLISHED:DESC': Proposal.date_published.desc(),  # NEWEST
            'PUBLISHED:ASC': Proposal.date_published,  # OLDEST
        }

    def paginate(
        self,
        schema: ma.Schema,
        query: db.Query=None,
        page: int=1,
        filters: list=None,
        search: str=None,
        sort: str='PUBLISHED:DESC',
    ):
        query = query or Proposal.query
        sort = sort or 'PUBLISHED:DESC'

        # FILTER
        if filters:
            self.validate_filters(filters)
            status_filters = extract_filters('STATUS_', filters)
            stage_filters = extract_filters('STAGE_', filters)
            cat_filters = extract_filters('CAT_', filters)
            milestone_filters = extract_filters('MILESTONE_', filters)

            if status_filters:
                query = query.filter(Proposal.status.in_(status_filters))
            if stage_filters:
                query = query.filter(Proposal.stage.in_(stage_filters))
            if cat_filters:
                query = query.filter(Proposal.category.in_(cat_filters))
            if milestone_filters:
                query = query.join(Proposal.milestones) \
                    .filter(Milestone.stage.in_(milestone_filters))

        # SORT (see self.SORT_MAP)
        if sort:
            self.validate_sort(sort)
            query = query.order_by(self.SORT_MAP[sort])

        # SEARCH
        if search:
            query = query.filter(Proposal.title.ilike(f'%{search}%'))

        res = query.paginate(page, self.PAGE_SIZE, False)
        return {
            'page': res.page,
            'total': res.total,
            'page_size': self.PAGE_SIZE,
            'items': schema.dump(res.items),
            'filters': filters,
            'search': search,
            'sort': sort
        }


class UserPagination(Pagination):
    def __init__(self):
        self.FILTERS = ['BANNED', 'SILENCED']
        self.PAGE_SIZE = 9
        self.SORT_MAP = {
            'EMAIL:DESC': User.email_address.desc(),
            'EMAIL:ASC': User.email_address,
            'NAME:DESC': User.display_name.desc(),
            'NAME:ASC': User.display_name,
        }

    def paginate(
        self,
        schema: ma.Schema=users_schema,
        query: db.Query=None,
        page: int=1,
        filters: list=None,
        search: str=None,
        sort: str='EMAIL:DESC',
    ):
        query = query or Proposal.query
        sort = sort or 'EMAIL:DESC'

        # FILTER
        if filters:
            self.validate_filters(filters)
            if 'BANNED' in filters:
                query = query.filter(User.banned == True)
            if 'SILENCED' in filters:
                query = query.filter(User.silenced == True)

        # SORT (see self.SORT_MAP)
        if sort:
            self.validate_sort(sort)
            query = query.order_by(self.SORT_MAP[sort])

        # SEARCH
        if search:
            query = query.join(AzimuthPoint) \
                .filter(
                    User.email_address.ilike(f'%{search}%') |
                    User.display_name.ilike(f'%{search}%') |
                    AzimuthPoint.point.ilike(f'%{search}%')
                )

        res = query.paginate(page, self.PAGE_SIZE, False)
        return {
            'page': res.page,
            'total': res.total,
            'page_size': self.PAGE_SIZE,
            'items': schema.dump(res.items),
            'filters': filters,
            'search': search,
            'sort': sort
        }


class CommentPagination(Pagination):
    def __init__(self):
        self.FILTERS = ['REPORTED', 'HIDDEN']
        self.PAGE_SIZE = 10
        self.SORT_MAP = {
            'CREATED:DESC': Comment.date_created.desc(),
            'CREATED:ASC': Comment.date_created,
        }

    def paginate(
        self,
        schema: ma.Schema=comments_schema,
        query: db.Query=None,
        page: int=1,
        filters: list=None,
        search: str=None,
        sort: str='CREATED:DESC',
    ):
        query = query or Comment.query
        sort = sort or 'CREATED:DESC'

        # FILTER
        if filters:
            self.validate_filters(filters)
            if 'REPORTED' in filters:
                query = query.filter(Comment.reported == True)
            if 'HIDDEN' in filters:
                query = query.filter(Comment.hidden == True)

        # SORT (see self.SORT_MAP)
        if sort:
            self.validate_sort(sort)
            query = query.order_by(self.SORT_MAP[sort])

        # SEARCH
        if search:
            query = query.filter(
                Comment.content.ilike(f'%{search}%')
            )

        res = query.paginate(page, self.PAGE_SIZE, False)
        return {
            'page': res.page,
            'total': res.total,
            'page_size': self.PAGE_SIZE,
            'items': schema.dump(res.items),
            'filters': filters,
            'search': search,
            'sort': sort
        }


class RFWPagination(Pagination):
    def __init__(self):
        self.FILTERS = ['WORKERS', 'CLAIMS']
        self.FILTERS.extend([f'STATUS_{s}' for s in RFWStatus.list()])
        self.FILTERS.extend([f'CAT_{c}' for c in Category.list()])
        self.PAGE_SIZE = 10
        self.SORT_MAP = {
            'CREATED:DESC': RFW.date_created.desc(),
            'CREATED:ASC': RFW.date_created,
            'NEWEST': RFW.date_created.desc(),
            'OLDEST': RFW.date_created,
        }

    def paginate(
        self,
        schema: ma.Schema=rfw_schemas.list,
        query: db.Query=None,
        page: int=1,
        filters: list=None,
        search: str=None,
        sort: str='CREATED:DESC',
    ):
        query = query or RFW.query
        sort = sort or 'CREATED:DESC'

        # FILTER
        if filters:
            self.validate_filters(filters)
            status_filters = extract_filters('STATUS_', filters)
            cat_filters = extract_filters('CAT_', filters)
            tag_filters = extract_filters('TAG_', filters)
            if status_filters:
                query = query.filter(RFW.status.in_(status_filters))
            if cat_filters:
                query = query.filter(RFW.category.in_(cat_filters))
            if tag_filters:
                query = query.join(TagAssociation) \
                    .join(Tag) \
                    .filter(Tag.id.in_(tag_filters))
            if 'WORKERS' in filters:
                query = query.join(RFWWorker) \
                    .filter(RFWWorker.status == RFWWorkerStatus.REQUESTED)
            if 'CLAIMS' in filters:
                query = query.join(RFWMilestone) \
                    .join(RFWMilestoneClaim) \
                    .filter(RFWMilestoneClaim.stage == RFWMilestoneClaimStage.REQUESTED)

        # SORT (see self.SORT_MAP)
        if sort:
            self.validate_sort(sort)
            query = query.order_by(self.SORT_MAP[sort])

        # SEARCH
        if search:
            query = query.filter(
                RFW.title.ilike(f'%{search}%')
            )

        res = query.paginate(page, self.PAGE_SIZE, False)
        return {
            'page': res.page,
            'total': res.total,
            'page_size': self.PAGE_SIZE,
            'items': schema.dump(res.items),
            'filters': filters,
            'search': search,
            'sort': sort
        }


class HistoryPagination(Pagination):
    def __init__(self):
        self.PAGE_SIZE = 10
        self.SORT_MAP = {
            'DATE:DESC': HistoryEvent.date.desc(),
            'DATE:ASC': HistoryEvent.date,
        }

    def paginate(
        self,
        schema: ma.Schema=history_events_schema,
        query: db.Query=None,
        page: int=1,
        filters: list=None,
        search: str=None,
        sort: str='DATE:DESC',
    ):
        query = query or HistoryEvent.query
        sort = sort or 'DATE:DESC'

        # SORT (see self.SORT_MAP)
        if sort:
            self.validate_sort(sort)
            query = query.order_by(self.SORT_MAP[sort])

        # SEARCH
        if search:
            query = query.filter(
                HistoryEvent.title.ilike(f'%{search}%') |
                HistoryEvent.content.ilike(f'%{search}%')
            )

        res = query.paginate(page, self.PAGE_SIZE, False)
        return {
            'page': res.page,
            'total': res.total,
            'page_size': self.PAGE_SIZE,
            'items': schema.dump(res.items),
            'filters': filters,
            'search': search,
            'sort': sort
        }


class AdminLogPagination(Pagination):
    def __init__(self):
        self.PAGE_SIZE = 30
        self.SORT_MAP = {
            'DATE:DESC': AdminLog.date_created.desc(),
            'DATE:ASC': AdminLog.date_created,
        }

    def paginate(
        self,
        schema: ma.Schema=admin_logs_schema,
        query: db.Query=None,
        page: int=1,
        filters: list=None,
        search: str=None,
        sort: str='DATE:DESC',
    ):
        query = query or AdminLog.query
        sort = sort or 'DATE:DESC'

        # SORT (see self.SORT_MAP)
        if sort:
            self.validate_sort(sort)
            query = query.order_by(self.SORT_MAP[sort])

        # SEARCH
        if search:
            query = query.join(AdminLog.user) \
                .filter(or_(
                    AdminLog.event == search,
                    AdminLog.ip.ilike(f'%{search}%'),
                    AdminLog.message.ilike(f'%{search}%'),
                    User.display_name.ilike(f'%{search}%'),
                    User.email_address.ilike(f'%{search}%'),
                ))
            

        res = query.paginate(page, self.PAGE_SIZE, False)
        return {
            'page': res.page,
            'total': res.total,
            'page_size': self.PAGE_SIZE,
            'items': schema.dump(res.items),
            'filters': filters,
            'search': search,
            'sort': sort
        }


# expose pagination methods here
proposal = ProposalPagination().paginate
comment = CommentPagination().paginate
user = UserPagination().paginate
rfw = RFWPagination().paginate
history = HistoryPagination().paginate
admin_log = AdminLogPagination().paginate
