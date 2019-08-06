import random

# Our own Enum class with custom functionality, not Python's
class CustomEnum():
    # Adds an .includes function that tests if a value is in enum
    def includes(self, enum: str):
        return hasattr(self, enum)

    # provide a list of enum values (strs)
    def list(self):
        return [attr for attr in dir(self)
                if not callable(getattr(self, attr)) and
                not attr.startswith('__')]

    # Grab a random enum
    def random(self):
        return random.choice(self.list())


class ProposalStatusEnum(CustomEnum):
    DRAFT = 'DRAFT'
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    LIVE = 'LIVE'
    DELETED = 'DELETED'


ProposalStatus = ProposalStatusEnum()


class ProposalSortEnum(CustomEnum):
    NEWEST = 'NEWEST'
    OLDEST = 'OLDEST'


ProposalSort = ProposalSortEnum()


class ProposalStageEnum(CustomEnum):
    PREVIEW = 'PREVIEW'
    FUNDING_REQUIRED = 'FUNDING_REQUIRED'
    WIP = 'WIP'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'
    CANCELED = 'CANCELED'


ProposalStage = ProposalStageEnum()


class CategoryEnum(CustomEnum):
    DEV_TOOL = 'DEV_TOOL'
    CORE_DEV = 'CORE_DEV'
    APP_DEV_ARVO = 'APP_DEV_ARVO'
    APP_DEV_AZIMUTH = 'APP_DEV_AZIMUTH'
    APP_DEV_OTHER = 'APP_DEV_OTHER'
    COMMUNITY = 'COMMUNITY'
    DOCUMENTATION = 'DOCUMENTATION'
    SECURITY = 'SECURITY'
    DESIGN = 'DESIGN'


Category = CategoryEnum()


class MilestoneStageEnum(CustomEnum):
    IDLE = 'IDLE'
    REQUESTED = 'REQUESTED'
    REJECTED = 'REJECTED'
    ACCEPTED = 'ACCEPTED'
    PAID = 'PAID'


MilestoneStage = MilestoneStageEnum()


class RFPStatusEnum(CustomEnum):
    DRAFT = 'DRAFT'
    LIVE = 'LIVE'
    CLOSED = 'CLOSED'


RFPStatus = RFPStatusEnum()


class RFWStatusEnum(CustomEnum):
    DRAFT = 'DRAFT'
    LIVE = 'LIVE'
    CLOSED = 'CLOSED'


RFWStatus = RFWStatusEnum()


class RFWWorkerStatusEnum(CustomEnum):
    REQUESTED = 'REQUESTED'
    ACCEPTED = 'ACCEPTED'
    REJECTED = 'REJECTED'


RFWWorkerStatus = RFWWorkerStatusEnum()


class RFWMilestoneClaimStageEnum(CustomEnum):
    REQUESTED = 'REQUESTED'
    REJECTED = 'REJECTED'
    ACCEPTED = 'ACCEPTED'


RFWMilestoneClaimStage = RFWMilestoneClaimStageEnum()
