from .subscription_settings import EmailSubscription, is_subscribed
from sendgrid.helpers.mail import Email, Mail, Content
from python_http_client import HTTPError
from grant.utils.misc import make_url
from sentry_sdk import capture_exception
from grant.settings import SENDGRID_API_KEY, SENDGRID_DEFAULT_FROM, SENDGRID_DEFAULT_FROMNAME, UI
from grant.settings import SENDGRID_API_KEY, SENDGRID_DEFAULT_FROM, UI, E2E_TESTING
import sendgrid
from threading import Thread
from flask import render_template, Markup, current_app, g


default_template_args = {
    'home_url': make_url('/'),
    'account_url': make_url('/profile'),
    'email_settings_url': make_url('/profile/settings?tab=emails'),
    'unsubscribe_url': make_url('/profile/settings?tab=emails'),
}


def signup_info(email_args):
    return {
        'subject': 'Confirm your email on {}'.format(UI['NAME']),
        'title': 'Welcome to {}!'.format(UI['NAME']),
        'preview': 'Welcome to {}, we just need to confirm your email address.'.format(UI['NAME']),
    }


def team_invite_info(email_args):
    return {
        'subject': '{} has invited you to a project'.format(email_args['inviter'].display_name),
        'title': 'You’ve been invited!',
        'preview': 'You’ve been invited to the "{}" project team'.format(email_args['proposal'].title)
    }


def recover_info(email_args):
    return {
        'subject': 'Recover your account',
        'title': 'Recover your account',
        'preview': 'Use the link to recover your account.'
    }


def change_email_info(email_args):
    return {
        'subject': 'Confirm your new email',
        'title': 'Confirm your email',
        'preview': 'Click the link inside to confirm your new email'
    }


def change_email_old_info(email_args):
    return {
        'subject': 'Your email has been changed',
        'title': 'Email changed',
        'preview': 'Your email address has been updated on {}'.format(UI['NAME']),
    }


def change_password_info(email_args):
    return {
        'subject': 'Your password has been changed',
        'title': 'Password changed',
        'preview': 'This is just a confirmation of your recent password change'
    }


def proposal_approved(email_args):
    return {
        'subject': 'Your proposal has been approved!',
        'title': 'Your proposal has been approved',
        'preview': 'Start raising funds for {} now'.format(email_args['proposal'].title),
        'subscription': EmailSubscription.MY_PROPOSAL_APPROVAL
    }


def proposal_rejected(email_args):
    return {
        'subject': 'Your proposal has been rejected',
        'title': 'Your proposal has been rejected',
        'preview': '{} has been rejected'.format(email_args['proposal'].title),
        'subscription': EmailSubscription.MY_PROPOSAL_APPROVAL
    }


def proposal_comment(email_args):
    return {
        'subject': 'New comment from {}'.format(email_args['author'].display_name),
        'title': 'You got a comment',
        'preview': '{} has added a comment to your proposal {}'.format(
            email_args['author'].display_name,
            email_args['proposal'].title,
        ),
        'subscription': EmailSubscription.MY_PROPOSAL_COMMENT,
    }


def proposal_canceled(email_args):
    return {
        'subject': 'Your proposal has been canceled',
        'title': 'Proposal canceled',
        'preview': 'Your proposal entitled {} has been canceled, and your contributors will be refunded'.format(
            email_args['proposal'].title,
        ),
    }


def comment_reply(email_args):
    return {
        'subject': 'New reply from {}'.format(email_args['author'].display_name),
        'title': 'You got a reply',
        'preview': '{} has replied to a comment you posted'.format(email_args['author'].display_name),
        'subscription': EmailSubscription.MY_COMMENT_REPLY,
    }


def milestone_request(email_args):
    p = email_args['proposal']
    ms = p.current_milestone
    return {
        'subject': f'Payout request for {p.title} - {ms.title} has been made',
        'title': f'Milestone payout requested',
        'preview': f'A payout request for milestone {ms.title} has been made.',
        'subscription': EmailSubscription.ADMIN_APPROVAL,
    }


def milestone_reject(email_args):
    p = email_args['proposal']
    ms = p.current_milestone
    return {
        'subject': f'Payout rejected for {p.title} - {ms.title}',
        'title': f'Milestone payout rejected',
        'preview': f'The payout for milestone {ms.title} has been rejected.',
        'subscription': EmailSubscription.MY_PROPOSAL_APPROVAL,
    }


def milestone_accept(email_args):
    p = email_args['proposal']
    a = email_args['amount']
    ms = p.current_milestone
    return {
        'subject': f'Payout approved for {p.title} - {ms.title}!',
        'title': f'Milestone payout approved',
        'preview': f'The payout of {a} STARS for milestone {ms.title} has been approved.',
        'subscription': EmailSubscription.MY_PROPOSAL_APPROVAL,
    }


def milestone_paid(email_args):
    p = email_args['proposal']
    a = email_args['amount']
    ms = email_args['milestone']
    return {
        'subject': f'{p.title} - {ms.title} has been paid!',
        'title': f'Milestone paid',
        'preview': f'The milestone {ms.title} payout of {a} STARS has been paid!',
        'subscription': EmailSubscription.MY_PROPOSAL_APPROVAL,
    }


def admin_approval(email_args):
    return {
        'subject': f'Review needed for {email_args["proposal"].title}',
        'title': f'Proposal Review',
        'preview': f'{email_args["proposal"].title} needs review, as an admin you can help.',
        'subscription': EmailSubscription.ADMIN_APPROVAL,
    }


def admin_payout(email_args):
    return {
        'subject': f'Payout requested for {email_args["proposal"].title}',
        'title': f'Milestone Payout Requested',
        'preview': f'{email_args["proposal"].title} has requested a payout, as an admin you can help.',
        'subscription': EmailSubscription.ADMIN_PAYOUT,
    }


def admin_worker_request(email_args):
    return {
        'subject': f'Worker request for {email_args["rfw"].title}',
        'title': f'Worker Request',
        'preview': f'Someone wants to work on {email_args["rfw"].title}, as an admin you can help.',
        'subscription': EmailSubscription.ADMIN_WORK_REVIEW,
    }


def admin_work_milestone_claim(email_args):
    w = email_args['rfw']
    return {
        'subject': f'Milestone work claim on {w.title}',
        'title': f'Milestone Review Requested',
        'preview': f'A milestone work claim has been made for {w.title}, as an admin you can help.',
        'subscription': EmailSubscription.ADMIN_WORK_MILESTONE_REVIEW,
    }


def followed_proposal_milestone(email_args):
    p = email_args['proposal']
    ms = email_args['milestone']
    return {
        'subject': f'Milestone accepted for {p.title}',
        'title': f'Milestone Accepted',
        'preview': f'Followed proposal {p.title} has passed a milestone',
        'subscription': EmailSubscription.FOLLOWED_PROPOSAL,
    }


def followed_proposal_update(email_args):
    p = email_args['proposal']
    return {
        'subject': f'Proposal update for {p.title}',
        'title': f'Proposal Update',
        'preview': f'Followed proposal {p.title} has an update',
        'subscription': EmailSubscription.FOLLOWED_PROPOSAL,
    }


def worker_approved(email_args):
    w = email_args['rfw']
    return {
        'subject': f"You've been approved to work on {w.title}",
        'title': f'Worker Approved',
        'preview': f"Your request to work on {w.title} has been accepted",
        'subscription': EmailSubscription.WORK_REVIEW,
    }


def worker_rejected(email_args):
    w = email_args['rfw']
    return {
        'subject': f"Work request for {w.title}",
        'title': f'Worker Review',
        'preview': f"Your request to work on {w.title} has been reviewed",
        'subscription': EmailSubscription.WORK_REVIEW,
    }


def work_milestone_accepted(email_args):
    w = email_args['rfw']
    ms = email_args['milestone']
    return {
        'subject': f"Your work claim was accepted!",
        'title': f'Milestone Claim Accepted',
        'preview': f"Your claim of work on {w.title} - {ms.title} was accepted",
        'subscription': EmailSubscription.WORK_REVIEW,
    }


def work_milestone_rejected(email_args):
    w = email_args['rfw']
    ms = email_args['milestone']
    return {
        'subject': f"Work claim reviewed for {w.title}",
        'title': f'Milestone Claim Reviewed',
        'preview': f"Your claim of work on {w.title} - {ms.title} was reviewed",
        'subscription': EmailSubscription.WORK_REVIEW,
    }


get_info_lookup = {
    'signup': signup_info,
    'team_invite': team_invite_info,
    'recover': recover_info,
    'change_email': change_email_info,
    'change_email_old': change_email_old_info,
    'change_password': change_password_info,
    'proposal_approved': proposal_approved,
    'proposal_rejected': proposal_rejected,
    'proposal_comment': proposal_comment,
    'proposal_canceled': proposal_canceled,
    'comment_reply': comment_reply,
    'milestone_request': milestone_request,
    'milestone_reject': milestone_reject,
    'milestone_accept': milestone_accept,
    'milestone_paid': milestone_paid,
    'admin_approval': admin_approval,
    'admin_payout': admin_payout,

    'admin_worker_request': admin_worker_request,
    'admin_work_milestone_claim': admin_work_milestone_claim,
    'followed_proposal_milestone': followed_proposal_milestone,
    'followed_proposal_update': followed_proposal_update,
    'worker_approved': worker_approved,
    'worker_rejected': worker_rejected,
    'work_milestone_accepted': work_milestone_accepted,
    'work_milestone_rejected': work_milestone_rejected,
}


def generate_email(type, email_args, user=None):
    info = get_info_lookup[type](email_args)
    body_text = render_template(
        'emails/%s.txt' % (type),
        args=email_args,
        UI=UI,
    )
    body_html = render_template(
        'emails/%s.html' % (type),
        args=email_args,
        UI=UI,
    )

    template_args = {**default_template_args}
    if user:
        template_args['unsubscribe_url'] = make_url('/email/unsubscribe?code={}'.format(user.email_verification.code))

    html = render_template(
        'emails/template.html',
        args={
            **template_args,
            **info,
            'body': Markup(body_html),
        },
        UI=UI,
    )
    text = render_template(
        'emails/template.txt',
        args={
            **template_args,
            **info,
            'body': body_text,
        },
        UI=UI,
    )

    return {
        'info': info,
        'html': html,
        'text': text
    }


def send_email(to, type, email_args):
    if 'email_sender' not in g:
        g.email_sender = EmailSender(current_app._get_current_object())
    g.email_sender.add(to, type, email_args)


def make_envelope(to, type, email_args):
    if current_app and current_app.config.get("TESTING"):
        return None

    from grant.user.models import User
    user = User.get_by_email(to)
    info = get_info_lookup[type](email_args)

    if user and 'subscription' in info:
        sub = info['subscription']
        if user and not is_subscribed(user.settings.email_subscriptions, sub):
            current_app.logger.debug(f'Ignoring send_email to {to} of type {type} because user is unsubscribed.')
            return None

    email = generate_email(type, email_args, user)
    mail = Mail(
        from_email=Email(SENDGRID_DEFAULT_FROM, SENDGRID_DEFAULT_FROMNAME),
        to_email=Email(to),
        subject=email['info']['subject'],
    )
    mail.add_content(Content('text/plain', email['text']))
    mail.add_content(Content('text/html', email['html']))

    mail.___type = type
    mail.___to = to

    return mail


def sendgrid_send(mail, app=current_app):
    to = mail.___to
    type = mail.___type
    try:
        sg = sendgrid.SendGridAPIClient(apikey=SENDGRID_API_KEY)
        if E2E_TESTING:
            from grant.e2e import views
            views.last_email = mail.get()
            app.logger.info(f'Just set last_email for e2e to pickup, to: {to}, type: {type}')
        else:
            res = sg.client.mail.send.post(request_body=mail.get())
            app.logger.info('Just sent an email to %s of type %s, response code: %s' %
                            (to, type, res.status_code))
    except HTTPError as e:
        app.logger.info('An HTTP error occured while sending an email to %s - %s: %s' %
                        (to, e.__class__.__name__, e))
        app.logger.debug(e.body)
        capture_exception(e)
    except Exception as e:
        app.logger.info('An unknown error occured while sending an email to %s - %s: %s' %
                        (to, e.__class__.__name__, e))
        app.logger.debug(e)
        capture_exception(e)


class EmailSender(Thread):
    def __init__(self, app):
        Thread.__init__(self)
        self.envelopes = []
        self.app = app

    def add(self, to, type, email_args):
        env = make_envelope(to, type, email_args)
        if env:
            self.envelopes.append(env)

    def run(self):
        for envelope in self.envelopes:
            sendgrid_send(envelope, self.app)


def send_admin_email(type: str, email_args: dict):
    from grant.user.models import User
    admins = User.get_admins()
    for a in admins:
        send_email(a.email_address, type, {
            'user': a,
            **email_args
        })
