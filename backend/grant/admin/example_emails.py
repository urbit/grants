# Fake objects must be classes. Should stub out model properties.
class FakeUser(object):
    id = 123
    email_address = 'example@example.com'
    display_name = 'Example User'
    title = 'Email Example Dude'


class FakeMilestone(object):
    id = 123
    index = 0
    title = 'Example Milestone'


class FakeProposal(object):
    id = 123
    title = 'Example proposal'
    brief = 'This is an example proposal'
    content = 'Example example example example'
    target = "100"
    current_milestone = FakeMilestone()


class FakeUpdate(object):
    id = 123
    title = 'Example update'
    content = 'Example example example example\n\nExample example example example'
    proposal_id = 123


class FakeRFW(object):
    id = 123
    title = 'Example RFW'


class FakeRFWMilestone(object):
    id = 345
    title = 'Example RFW Milestone'


user = FakeUser()
proposal = FakeProposal()
milestone = FakeMilestone()
update = FakeUpdate()
rfw = FakeRFW()
rfw_ms = FakeRFWMilestone()

example_email_args = {
    'signup': {
        'display_name': user.display_name,
        'confirm_url': 'http://someconfirmurl.com',
    },
    'team_invite': {
        'inviter': user,
        'proposal': proposal,
        'invite_url': 'http://someinviteurl.com',
    },
    'recover': {
        'recover_url': 'http://somerecoveryurl.com',
    },
    'change_email': {
        'display_name': user.display_name,
        'confirm_url': 'http://someconfirmurl.com',
    },
    'change_email_old': {
        'display_name': user.display_name,
        'contact_url': 'http://somecontacturl.com',
    },
    'change_password': {
        'display_name': user.display_name,
        'recover_url': 'http://somerecoverurl.com',
        'contact_url': 'http://somecontacturl.com',
    },
    'proposal_approved': {
        'proposal': proposal,
        'proposal_url': 'http://someproposal.com',
        'admin_note': 'This proposal was the hottest stuff our team has seen yet. We look forward to throwing the fat stacks at you.',
    },
    'proposal_rejected': {
        'proposal': proposal,
        'proposal_url': 'http://someproposal.com',
        'admin_note': 'We think that you’ve asked for too much money for the project you’ve proposed, and for such an inexperienced team. Feel free to change your target amount, or elaborate on why you need so much money, and try applying again.',
    },
    'proposal_comment': {
        'author': user,
        'proposal': proposal,
        'comment_url': 'http://somecomment.com',
        'author_url': 'http://someuser.com',
    },
    'proposal_canceled': {
        'proposal': proposal,
        'support_url': 'http://linktosupport.com',
    },
    'comment_reply': {
        'author': user,
        'proposal': proposal,
        'comment_url': 'http://somecomment.com',
        'author_url': 'http://someuser.com',
    },
    'milestone_request': {
        'proposal': proposal,
        'proposal_milestones_url': 'http://example.com/proposals/999-my-proposal?tab=milestones',
    },
    'milestone_reject': {
        'proposal': proposal,
        'admin_note': 'We noticed that the tests were failing for the features outlined in this milestone. Please address these issues.',
        'proposal_milestones_url': 'http://example.com/proposals/999-my-proposal?tab=milestones',
    },
    'milestone_accept': {
        'proposal': proposal,
        'amount': '33',
        'proposal_milestones_url': 'http://example.com/proposals/999-my-proposal?tab=milestones',
    },
    'milestone_paid': {
        'proposal': proposal,
        'milestone': milestone,
        'amount': '33',
        'proposal_milestones_url': 'http://example.com/proposals/999-my-proposal?tab=milestones',
    },
    'admin_approval': {
        'proposal': proposal,
        'proposal_url': 'https://admin.example.com/proposals/999',
    },
    'admin_payout': {
        'proposal': proposal,
        'proposal_url': 'https://admin.example.com/proposals/999',
    },


    'admin_worker_request': {
        'rfw': rfw,
        'rfw_url': 'https://admin.example.com/rfw/999',
    },
    'admin_work_milestone_claim': {
        'rfw': rfw,
        'milestone': rfw_ms,
        'rfw_url': 'https://admin.example.com/rfw/999',
    },

    'followed_proposal_milestone': {
        'proposal': proposal,
        'milestone': milestone,
        'proposal_url': 'http://someproposal.com',
    },
    'followed_proposal_update': {
        'proposal': proposal,
        'proposal_url': 'http://someproposal.com',
    },

    'worker_approved': {
        'rfw': rfw,
        'message': 'Worker approved message.',
        'rfw_url': 'https://example.com/rfw/999',
    },
    'worker_rejected': {
        'rfw': rfw,
        'message': 'Worker reviewed message.',
        'rfw_url': 'https://example.com/rfw/999',
    },
    'work_milestone_accepted': {
        'rfw': rfw,
        'milestone': rfw_ms,
        'message': 'Milestone accepted message.',
        'rfw_url': 'https://example.com/rfw/999',
    },
    'work_milestone_rejected': {
        'rfw': rfw,
        'milestone': rfw_ms,
        'message': 'Milestone reviewed message.',
        'rfw_url': 'https://example.com/rfw/999',
    },
}
