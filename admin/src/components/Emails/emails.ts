interface Email {
  id: string;
  title: string;
  description: string;
}

export default [
  {
    id: 'signup',
    title: 'Signup',
    description:
      'Sent when the user first signs up, with instructions to confirm their email',
  },
  {
    id: 'recover',
    title: 'Password recovery',
    description: 'For recovering a user’s forgotten password',
  },
  {
    id: 'change_email',
    title: 'Change email confirmation',
    description: 'Sent when the user has changed their email, to confirm their new one',
  },
  {
    id: 'change_email_old',
    title: 'Change email notification (Old email)',
    description: 'Sent when the user has changed their email, in case of compromise',
  },
  {
    id: 'change_password',
    title: 'Change password confirmation',
    description: 'Sent when the user has changed their password, in case of compromise',
  },
  {
    id: 'team_invite',
    title: 'Proposal team invite',
    description: 'Sent when a proposal creator sends an invite to a user',
  },
  {
    id: 'proposal_approved',
    title: 'Proposal approved',
    description: 'Sent when an admin approves your submitted proposal',
  },
  {
    id: 'proposal_rejected',
    title: 'Proposal rejected',
    description: 'Sent when an admin rejects your submitted proposal',
  },
  {
    id: 'proposal_comment',
    title: 'Proposal comment',
    description:
      'Sent if someone makes a top-level comment on your proposal. Replies don’t send an email.',
  },
  {
    id: 'proposal_canceled',
    title: 'Proposal canceled',
    description:
      'Sent to the proposal team when an admin cancels the proposal after funding',
  },
  {
    id: 'comment_reply',
    title: 'Comment reply',
    description: 'Sent if someone makes a direct reply to your comment',
  },
  {
    id: 'milestone_request',
    title: 'Milestone request',
    description: 'Sent if team member has made a milestone payout request',
  },
  {
    id: 'milestone_accept',
    title: 'Milestone accept',
    description: 'Sent to proposal team when admin approves milestone payout',
  },
  {
    id: 'milestone_reject',
    title: 'Milestone reject',
    description: 'Sent to proposal team when admin rejects milestone payout',
  },
  {
    id: 'milestone_paid',
    title: 'Milestone paid',
    description: 'Sent when milestone is paid',
  },
  {
    id: 'admin_approval',
    title: 'Admin Approval',
    description: 'Sent when proposal is ready for review',
  },
  {
    id: 'admin_payout',
    title: 'Admin Payout',
    description: 'Sent when milestone payout has been approved',
  },
  {
    id: 'admin_worker_request',
    title: 'Admin Worker Request',
    description: 'Sent when a user sends a request to become a worker on a RFW',
  },
  {
    id: 'admin_work_milestone_claim',
    title: 'Admin Work Milestone Claim',
    description: 'Sent when a worker claims milestone work',
  },
  {
    id: 'followed_proposal_milestone',
    title: 'Followed Proposal Milestone',
    description:
      'Sent to followers of a proposal when one of its milestones has been approved',
  },
  {
    id: 'followed_proposal_update',
    title: 'Followed Proposal Update',
    description: 'Sent to followers of a proposal when it has a new update',
  },
  {
    id: 'worker_approved',
    title: 'Worker Approved',
    description: "Sent to a user when they've been approved to work on a request",
  },
  {
    id: 'worker_rejected',
    title: 'Worker Reviewed/Rejected',
    description: 'Sent to a user when their work request has been reviewed/rejected',
  },
  {
    id: 'work_milestone_accepted',
    title: 'Work Milestone Claim Accepted',
    description: 'Sent to a worker when their milestone claim has been accepted',
  },
  {
    id: 'work_milestone_rejected',
    title: 'Work Milestone Claim Reviewed/Rejected',
    description: 'Sent to a worker when their milestone claim has been reviewed/rejected',
  },
] as Email[];
