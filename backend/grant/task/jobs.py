from datetime import datetime, timedelta

from grant.extensions import db
from grant.email.send import send_email
from grant.utils.misc import make_url
from flask import current_app


class ProposalReminder:
    JOB_TYPE = 1

    def __init__(self, proposal_id):
        self.proposal_id = proposal_id

    def blobify(self):
        return {"proposal_id": self.proposal_id}

    def make_task(self):
        from .models import Task
        task = Task(
            job_type=self.JOB_TYPE,
            blob=self.blobify(),
            execute_after=datetime.now()
        )
        db.session.add(task)
        db.session.commit()

    @staticmethod
    def process_task(task):
        assert task.job_type == 1, "Job type: {} is incorrect for ProposalReminder".format(task.job_type)
        from grant.proposal.models import Proposal
        proposal = Proposal.query.filter_by(id=task.blob["proposal_id"]).first()
        print(proposal)
        task.completed = True
        db.session.add(task)
        db.session.commit()


JOBS = {
    1: ProposalReminder.process_task,
}
