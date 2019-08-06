from grant.utils.ma_fields import UnixDate
from grant.utils.enums import Category
from grant.utils.misc import dt_to_unix, gen_random_id, get
from grant.utils.enums import RFWStatus, RFWWorkerStatus, RFWMilestoneClaimStage
from grant.tag.models import TagAssociation, TagSchema, Tag
from datetime import datetime
from decimal import Decimal
from grant.extensions import ma, db
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import validates
from grant.utils.auth import get_authed_user


class RFWException(Exception):
    pass


# # # # # # # # # # # # # # # # # # # # # # # # # # # #
#   RFWMilestoneClaim (RFWWorker <-> RFWMilestone)
# # # # # # # # # # # # # # # # # # # # # # # # # # # #
class RFWMilestoneClaim(db.Model):
    __tablename__ = 'rfw_milestone_claim'

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime)

    stage = db.Column(db.String(255), nullable=False)
    stage_message = db.Column(db.String, nullable=False)
    stage_change_date = db.Column(db.DateTime, nullable=False)
    stage_url = db.Column(db.String, nullable=False)

    worker_id = db.Column(db.Integer(), db.ForeignKey('rfw_worker.id'))
    milestone_id = db.Column(db.Integer(), db.ForeignKey('rfw_milestone.id'))
    worker = db.relationship(
        "RFWWorker",
        back_populates="claims"
    )
    milestone = db.relationship(
        "RFWMilestone",
        back_populates="claims"
    )

    @validates('stage')
    def validate_status(self, key, field):
        if not RFWMilestoneClaimStage.includes(field):
            raise RFWException(f'RFWMilestoneClaim stage must be in the RFWMilestoneClaimStageEnum, was [{field}]')
        return field

    def __init__(self, **kwargs):
        super().__init__(
            id=gen_random_id(RFWMilestoneClaim),
            date_created=datetime.now(),
            stage=RFWMilestoneClaimStage.REQUESTED,
            stage_message=kwargs.pop('stage_message', ''),
            stage_change_date=datetime.now(),
            stage_url=kwargs.pop('stage_url', ''),
            **kwargs
        )

    def set_requested(self, message='', url=''):
        if self.stage in [RFWMilestoneClaimStage.ACCEPTED, RFWMilestoneClaimStage.REQUESTED]:
            raise RFWException(f'Cannot request claim id {self.id} with status {self.stage}')

        self.stage = RFWMilestoneClaimStage.REQUESTED
        self.stage_message = message
        self.stage_change_date = datetime.now()
        self.stage_url = url
        db.session.flush()

    def set_accepted(self, message=''):
        if self.stage in [RFWMilestoneClaimStage.ACCEPTED, RFWMilestoneClaimStage.REJECTED]:
            raise RFWException(f'Cannot accept claim id {self.id} with status {self.stage}')

        self.stage = RFWMilestoneClaimStage.ACCEPTED
        self.stage_message = message
        self.stage_change_date = datetime.now()
        db.session.flush()

    def set_rejected(self, message: str):
        if self.stage in [RFWMilestoneClaimStage.ACCEPTED, RFWMilestoneClaimStage.REJECTED]:
            raise RFWException(f'Cannot reject claim id {self.id} with status {self.stage}')

        self.stage = RFWMilestoneClaimStage.REJECTED
        self.stage_message = message
        self.stage_change_date = datetime.now()
        self.stage_url = ''
        db.session.flush()


class RFWMilestoneClaimSchema(ma.Schema):
    class Meta:
        additional = ("id", "stage", "stage_message", "stage_url")
    date_created = UnixDate(attribute='date_created')
    stage_change_date = UnixDate(attribute='stage_change_date')
    worker = ma.Nested("RFWWorkerSchema", exclude=['claims', 'rfw'])
    milestone = ma.Nested("RFWMilestoneSchema", exclude=['claims', 'rfw'])


# # # # # # # # # # # # # # # # # # # # # # # #
#   RFWMilestone
# # # # # # # # # # # # # # # # # # # # # # # #
class RFWMilestone(db.Model):
    __tablename__ = 'rfw_milestone'

    id = db.Column(db.Integer(), primary_key=True)
    index = db.Column(db.Integer(), nullable=False)
    date_created = db.Column(db.DateTime)

    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    effort_from = db.Column(db.BigInteger, nullable=False)
    effort_to = db.Column(db.BigInteger, nullable=False)
    bounty = db.Column(db.BigInteger, nullable=False)

    rfw_id = db.Column(db.Integer(), db.ForeignKey('rfw.id'), nullable=False)
    rfw = db.relationship('RFW', back_populates='milestones')
    claims = db.relationship("RFWMilestoneClaim", cascade="all,delete")

    @hybrid_property
    def authed_claim(self):
        authed = get_authed_user()
        if not authed:
            return None
        for c in self.claims:
            if c.worker.user_id == authed.id:
                return c
        return None

    @hybrid_property
    def is_authed_active(self):
        aw = self.rfw.authed_worker
        if aw and aw.status == RFWWorkerStatus.ACCEPTED:
            accepted = [c.milestone_id for c in aw.claims if c.stage == RFWMilestoneClaimStage.ACCEPTED]
            for ms in self.rfw.milestones:
                if ms.id not in accepted:  # active ms for athed user
                    if ms.id == self.id:
                        return True
                    else:
                        return False
        return False

    def __init__(self, bounty=0, **kwargs):
        if 'index' not in kwargs:
            raise RFWException('Must set index on RFWMilestone')
        super().__init__(
            id=gen_random_id(RFWMilestone),
            date_created=datetime.now(),
            bounty=bounty,
            title=kwargs.pop('title', ''),
            content=kwargs.pop('content', ''),
            effort_from=kwargs.pop('effort_from', 0),
            effort_to=kwargs.pop('effort_to', 0),
            **kwargs
        )

    def update(self, **kwargs):
        if kwargs.pop('id', None):
            raise RFWException('Cannot update RFWMilestone IDs once created')
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.flush()

    def get_claim_by_id(self, id):
        claim = get(self.claims, 'id', int(id))
        if claim is None:
            raise RFWException(f'Could not find RFWMilestone.claims[{id}]')
        return claim


class RFWMilestoneSchema(ma.Schema):
    class Meta:
        additional = (
            "id",
            "index",
            "title",
            "content",
            "effort_from",
            "effort_to",
            "bounty",
            "is_authed_active"
        )
    date_created = UnixDate(attribute='date_created')
    rfw = ma.Nested("RFWSchema")
    claims = ma.Nested("RFWMilestoneClaimSchema", many=True, exclude=['milestone'])
    authed_claim = ma.Nested("RFWMilestoneClaimSchema", exclude=['milestone'])


# # # # # # # # # # # # # # # # # # # # # # # #
#   RFWWorker
# # # # # # # # # # # # # # # # # # # # # # # #
class RFWWorker(db.Model):
    __tablename__ = 'rfw_worker'

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime)

    status = db.Column(db.String(255), nullable=False)
    status_message = db.Column(db.String, nullable=False)
    status_change_date = db.Column(db.DateTime, nullable=True)

    # relations
    rfw_id = db.Column(db.Integer(), db.ForeignKey('rfw.id'))
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    rfw = db.relationship('RFW', back_populates='workers')
    user = db.relationship('User', back_populates='rfws')
    claims = db.relationship("RFWMilestoneClaim")

    @staticmethod
    def get_work(user_id, is_self=False):
        if is_self:
            work = RFWWorker.query.filter_by(user_id=user_id) \
                .order_by(RFWWorker.status_change_date.desc()) \
                .all()
            work_dump = RFWWorkerSchema(many=True).dump(work)
        else:
            work = RFWWorker.query.filter_by(user_id=user_id, status=RFWWorkerStatus.ACCEPTED) \
                .order_by(RFWWorker.status_change_date.desc()) \
                .all()
            work_dump = RFWWorkerSchema(many=True, exclude=['status_message']).dump(work)
            for w in work_dump:
                w['claims'] = [c for c in w['claims'] if c['stage'] == RFWMilestoneClaimStage.ACCEPTED]
        return work_dump

    @hybrid_property
    def is_self(self):
        authed = get_authed_user()
        if authed:
            return authed.id == self.user.id
        return False

    @validates('status')
    def validate_status(self, key, field):
        if not RFWWorkerStatus.includes(field):
            raise RFWException(f'RFWWorker status must be in the RFWWorkerStatusEnum, was [{field}]')
        return field

    def __init__(self, **kwargs):
        super().__init__(
            id=gen_random_id(RFWWorker),
            date_created=datetime.now(),
            status=RFWWorkerStatus.REQUESTED,
            status_message=kwargs.pop('status_message', ''),
            **kwargs
        )

    def set_requested(self, message=''):
        if self.status == RFWWorkerStatus.ACCEPTED:
            raise RFWException(f'Cannot request worker when already accepted, worker id {worker.id}')
        if self.status == RFWWorkerStatus.REJECTED:
            pass
        self.status = RFWWorkerStatus.REQUESTED
        self.status_message = message
        self.status_change_date = datetime.now()
        db.session.flush()

    def set_accepted(self, message=''):
        self.status = RFWWorkerStatus.ACCEPTED
        self.status_message = message
        self.status_change_date = datetime.now()
        db.session.flush()

    def set_rejected(self, message: str):
        self.status = RFWWorkerStatus.REJECTED
        self.status_message = message
        self.status_change_date = datetime.now()
        db.session.flush()


class RFWWorkerSchema(ma.Schema):
    class Meta:
        additional = ("id", "status", "status_message", "is_self")
    date_created = UnixDate(attribute='date_created')
    status_change_date = UnixDate(attribute='status_change_date')
    rfw = ma.Nested("RFWSchema", exclude=['workers', 'milestones'])
    user = ma.Nested("UserSchema")  # , exclude=['rfws'])
    claims = ma.Nested("RFWMilestoneClaimSchema", many=True, exclude=['worker'])


# # # # # # # # # # # # # # # # # # # # # # # #
#   RFW (Request For Work)
# # # # # # # # # # # # # # # # # # # # # # # #
class RFW(db.Model):
    __tablename__ = "rfw"

    id = db.Column(db.Integer(), primary_key=True)
    date_created = db.Column(db.DateTime)

    title = db.Column(db.String(255), nullable=False)
    brief = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(255), nullable=False)
    status_change_date = db.Column(db.DateTime, nullable=True)
    category = db.Column(db.String(255), nullable=False)

    # Relationships
    workers = db.relationship(
        'RFWWorker',
        back_populates='rfw',
        cascade="all,delete"
    )
    milestones = db.relationship(
        'RFWMilestone',
        back_populates='rfw',
        order_by="RFWMilestone.index",
        cascade="all,delete,delete-orphan"
    )
    tags = db.relationship(
        'Tag',
        secondary='tag_association',
        back_populates="rfws"
    )

    @hybrid_property
    def effort_from(self):
        return sum([ms.effort_from for ms in self.milestones])

    @hybrid_property
    def effort_to(self):
        return sum([ms.effort_to for ms in self.milestones])

    @hybrid_property
    def bounty(self):
        return sum([ms.bounty for ms in self.milestones])

    @hybrid_property
    def authed_worker(self):
        authed = get_authed_user()
        if not authed:
            return None
        return get(self.workers, 'user_id', authed.id, None)

    @validates('status')
    def validate_status(self, key, field):
        if not RFWStatus.includes(field):
            raise RFWException(f'RFW status must be in the RFWStatusEnum, was [{field}]')
        return field

    @validates('category')
    def validate_category(self, key, field):
        if not Category.includes(field):
            raise RFWException(f'RFW category must be in the CategoryEnum, was [{field}]')
        return field

    def create(**kwargs):
        milestones = kwargs.pop('milestones', [{'index': 0}])
        tags = kwargs.pop('tags', [])
        rfw = RFW(
            id=gen_random_id(RFW),
            date_created=datetime.now(),
            title=kwargs.pop('title', ''),
            brief=kwargs.pop('brief', ''),
            content=kwargs.pop('content', ''),
            status=kwargs.pop('status', RFWStatus.DRAFT),
            category=kwargs.pop('category', Category.COMMUNITY),
            **kwargs
        )
        db.session.add(rfw)
        db.session.flush()
        # milestones
        for ms in milestones:
            ms.pop('is_new', None)
            rfw.create_milestone(**ms)
        # tags
        for tag_id in tags:
            rfw.add_tag_by_id(tag_id)
        db.session.flush()
        return rfw

    def check_live(self):
        if self.status != RFWStatus.LIVE:
            raise RFWException(f'RFW must be {RFWStatus.LIVE}, was {self.status}')

    def delete(self):
        db.session.delete(self)
        db.session.flush()

    def update(self, milestones=[], delete_milestones=[], tags=[], **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        # ms sync
        for ms in milestones:
            if ms.pop('is_new', False):
                self.create_milestone(**ms)
            elif 'id' in ms:
                self.update_milestone_by_id(**ms)
        for ms_id in delete_milestones:
            self.delete_milestone_by_id(ms_id)
        self.check_milestone_integrity()
        # tags sync
        cur_tags = [x.id for x in self.tags]
        to_rem_tags = set(cur_tags) - set(tags)
        for tag_id in to_rem_tags:
            self.remove_tag_by_id(tag_id)
        for tag_id in tags:
            self.add_tag_by_id(tag_id)
        db.session.flush()

    def check_milestone_integrity(self):
        milestones = sorted(self.milestones, key=lambda x: x.index)
        for ind, ms in enumerate(milestones):
            if ind != ms.index:
                raise RFWException(
                    f'RFW has bad milestone index for id {ms.id}. Got {ms.index}, expected {ind}')

    def get_milestone_by_id(self, id):
        ms = get(self.milestones, 'id', int(id))
        if ms is None:
            raise RFWException(f'Could not find RFWMilestone with id {id}')
        return ms

    def update_milestone_by_id(self, id, **kwargs):
        ms = self.get_milestone_by_id(id)
        ms.update(**kwargs)
        db.session.flush()
        return ms

    def delete_milestone_by_id(self, id):
        ms = self.get_milestone_by_id(id)
        self.milestones.remove(ms)  # delete-orphan, so ms is deleted as well
        db.session.flush()
        # re-order indexes
        milestones = sorted(self.milestones, key=lambda x: x.index)
        for ind, ms in enumerate(milestones):
            ms.index = ind
        db.session.flush()

    def create_milestone(self, **kwargs):
        self.milestones.append(RFWMilestone(**kwargs))
        db.session.flush()

    def create_next_milestone(self, **kwargs):
        next_index = max([x.index for x in self.milestones]) + 1
        next_milestone = RFWMilestone(index=next_index, **kwargs)
        self.milestones.append(next_milestone)
        db.session.flush()
        return next_milestone

    def create_worker_by_user_id_and_request(self, id, status_message):
        self.check_live()
        from grant.user.models import User
        user = User.query.get(int(id))
        if not user:
            raise RFWException(f'Could not create a worker for RFW because user {id} not found')
        worker = get(self.workers, 'user_id', user.id)
        if not worker:
            worker = RFWWorker(user_id=user.id, rfw_id=self.id)
            self.workers.append(worker)
        worker.set_requested(message=status_message)
        db.session.flush()
        return worker

    def get_worker_by_id(self, id: int):
        worker = get(self.workers, 'id', int(id))
        if not worker:
            raise RFWException(f'Could not find worker with id {id} for RFW with id {self.id}')
        return worker

    def accept_worker_by_id(self, id, message=''):
        worker = self.get_worker_by_id(id)
        worker.set_accepted(message)
        return worker

    def reject_worker_by_id(self, id, message=''):
        worker = self.get_worker_by_id(id)
        worker.set_rejected(message)
        return worker

    def get_existing_claim(self, worker_id, ms_id):
        worker = self.get_worker_by_id(worker_id)
        self.get_milestone_by_id(ms_id)  # throws if non-child/non-existing milestone
        existing_claim = next((x for x in worker.claims if x.milestone_id == ms_id), None)
        return existing_claim

    def request_milestone_claim(self, worker_id, ms_id, msg, url):
        self.check_live()
        worker_id = int(worker_id)
        ms_id = int(ms_id)
        claim = self.get_existing_claim(worker_id, ms_id)
        ms = self.get_milestone_by_id(ms_id)
        if not claim:
            worker = self.get_worker_by_id(worker_id)
            # init with message and url
            claim = RFWMilestoneClaim(stage_message=msg, stage_url=url)
            ms.claims.append(claim)
            worker.claims.append(claim)
            db.session.flush()
        else:
            claim.set_requested(msg, url)
        return claim

    def accept_milestone_claim(self, ms_id, claim_id, msg):
        ms = self.get_milestone_by_id(int(ms_id))
        claim = ms.get_claim_by_id(int(claim_id))
        claim.set_accepted(msg)

    def reject_milestone_claim(self, ms_id, claim_id, msg):
        ms = self.get_milestone_by_id(int(ms_id))
        claim = ms.get_claim_by_id(int(claim_id))
        claim.set_rejected(msg)

    def add_tag_by_id(self, id):
        tag = Tag.query.get(int(id))
        if tag:
            self.add_tag(tag)

    def add_tag(self, tag: Tag):
        self.tags.append(tag)
        db.session.flush()

    def remove_tag_by_id(self, id):
        tag = Tag.query.get(int(id))
        if tag:
            self.tags.remove(tag)
        db.session.flush()

    def set_status(self, status: RFWStatus):
        self.status = status
        self.status_change_date = datetime.now()
        db.session.flush()

    def publish(self):
        self.set_status(RFWStatus.LIVE)

    def close(self):
        self.set_status(RFWStatus.CLOSED)


class RFWSchema(ma.Schema):
    class Meta:
        additional = (
            "id",
            "title",
            "brief",
            "content",
            "status",
            "category",
            "bounty",  # derived from ms
            "effort_from",  # derived from ms
            "effort_to",  # derived from ms
        )
    date_created = UnixDate(attribute='date_created')
    status_change_date = UnixDate(attribute='status_change_date')
    workers = ma.Nested("RFWWorkerSchema", many=True, exclude=['rfw'])
    authed_worker = ma.Nested("RFWWorkerSchema", exclude=['rfw'])
    milestones = ma.Nested("RFWMilestoneSchema", many=True, exclude=['rfw'])
    tags = ma.Nested("TagSchema", many=True)


class RFWSchemas:
    list = RFWSchema(many=True)
    admin_list = RFWSchema(many=True)
    single = RFWSchema()
    single_admin = RFWSchema()


rfw_schemas = RFWSchemas()
