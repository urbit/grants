import axios from './axios';
import {
  Proposal,
  ProposalDraft,
  ProposalPage,
  User,
  Update,
  TeamInvite,
  TeamInviteWithProposal,
  SOCIAL_SERVICE,
  EmailSubscriptions,
  RFP,
  ProposalPageParams,
  PageParams,
  UserSettings,
  ServerPage,
  HistoryEvent,
  RFWPage,
  RFWPageParams,
  RFW,
  Tag,
} from 'types';
import {
  formatUserForPost,
  formatProposalFromGet,
  formatUserFromGet,
  formatRFPFromGet,
  formatProposalPageParamsForGet,
  formatProposalPageFromGet,
  formatRFWPageFromGet,
  formatRFWPageParamsForGet,
  formatRFWFromGet,
} from 'utils/api';
import { EIP712Data } from 'utils/web3';

export function getProposals(page?: ProposalPageParams): Promise<{ data: ProposalPage }> {
  let serverParams;
  if (page) {
    serverParams = formatProposalPageParamsForGet(page);
  }
  return axios.get('/api/v1/proposals/', { params: serverParams || {} }).then(res => {
    res.data = formatProposalPageFromGet(res.data);
    return res;
  });
}

export function getProposal(proposalId: number | string): Promise<{ data: Proposal }> {
  return axios.get(`/api/v1/proposals/${proposalId}`).then(res => {
    res.data = formatProposalFromGet(res.data);
    return res;
  });
}

export function followProposal(proposalId: number, isFollow: boolean) {
  return axios.put(`/api/v1/proposals/${proposalId}/follow`, { isFollow });
}

export function getProposalComments(proposalId: number | string, params: PageParams) {
  return axios.get(`/api/v1/proposals/${proposalId}/comments`, { params });
}

export function reportProposalComment(proposalId: number, commentId: number) {
  return axios.put(`/api/v1/proposals/${proposalId}/comments/${commentId}/report`);
}

export function getProposalUpdates(proposalId: number | string) {
  return axios.get(`/api/v1/proposals/${proposalId}/updates`);
}

export function postProposal(payload: ProposalDraft) {
  return axios.post(`/api/v1/proposals/`, {
    ...payload,
    // Team has a different shape for POST
    team: payload.team.map(formatUserForPost),
  });
}

export function getUser(address: string): Promise<{ data: User }> {
  return axios
    .get(`/api/v1/users/${address}`, {
      params: {
        withProposals: true,
        withComments: true,
        withFunded: true,
        withPending: true,
        withWork: true,
      },
    })
    .then(res => {
      res.data = formatUserFromGet(res.data);
      return res;
    });
}

export function createUser(user: {
  email: string;
  password: string;
  name: string;
  title: string;
}): Promise<{ data: User }> {
  const payload = {
    emailAddress: user.email,
    password: user.password,
    displayName: user.name,
    title: user.title,
  };
  return axios.post('/api/v1/users', payload);
}

export function authUser(payload: {
  email: string;
  password: string;
}): Promise<{ data: User }> {
  return axios.post('/api/v1/users/auth', payload);
}

export function logoutUser() {
  return axios.post('/api/v1/users/logout');
}

export function checkUserAuth(): Promise<{ data: User }> {
  return axios.get(`/api/v1/users/me`);
}

export function updateUserPassword(
  currentPassword: string,
  password: string,
): Promise<any> {
  return axios.put(`/api/v1/users/me/password`, { currentPassword, password });
}

export function updateUserEmail(email: string, password: string): Promise<any> {
  return axios.put('/api/v1/users/me/email', { email, password });
}

export function updateUser(user: User): Promise<{ data: User }> {
  return axios.put(`/api/v1/users/${user.id}`, formatUserForPost(user));
}

export function getUserSettings(
  userId: string | number,
): Promise<{ data: UserSettings }> {
  return axios.get(`/api/v1/users/${userId}/settings`);
}

interface SettingsArgs {
  emailSubscriptions?: EmailSubscriptions;
}
export function updateUserSettings(
  userId: string | number,
  args?: SettingsArgs,
): Promise<{ data: UserSettings }> {
  return axios.put(`/api/v1/users/${userId}/settings`, args);
}

export function requestUserRecoveryEmail(email: string): Promise<any> {
  return axios.post(`/api/v1/users/recover`, { email });
}

export function resetPassword(code: string, password: string): Promise<any> {
  return axios.post(`/api/v1/users/recover/${code}`, { password });
}

export function verifyEmail(code: string): Promise<any> {
  return axios.post(`/api/v1/email/${code}/verify`);
}

export function unsubscribeEmail(code: string): Promise<any> {
  return axios.post(`/api/v1/email/${code}/unsubscribe`);
}

export function getSocialAuthUrl(service: SOCIAL_SERVICE): Promise<any> {
  return axios.get(`/api/v1/users/social/${service}/authurl`);
}

export function verifySocial(service: SOCIAL_SERVICE, code: string): Promise<any> {
  return axios.post(`/api/v1/users/social/${service}/verify`, { code });
}

export function postProposalUpdate(
  proposalId: number,
  title: string,
  content: string,
): Promise<{ data: Update }> {
  return axios.post(`/api/v1/proposals/${proposalId}/updates`, {
    title,
    content,
  });
}

export function getProposalDrafts(): Promise<{ data: ProposalDraft[] }> {
  return axios.get('/api/v1/proposals/drafts');
}

export function postProposalDraft(rfpId?: number): Promise<{ data: ProposalDraft }> {
  return axios.post('/api/v1/proposals/drafts', { rfpId });
}

export function deleteProposalDraft(proposalId: number): Promise<any> {
  return axios.delete(`/api/v1/proposals/${proposalId}`);
}

export function putProposal(proposal: ProposalDraft): Promise<{ data: ProposalDraft }> {
  // Exclude some keys
  const { id, stage, dateCreated, team, ...rest } = proposal;
  return axios.put(`/api/v1/proposals/${id}`, rest);
}

export async function putProposalSubmitForApproval(
  proposal: ProposalDraft,
): Promise<{ data: Proposal }> {
  return axios.put(`/api/v1/proposals/${proposal.id}/submit_for_approval`).then(res => {
    res.data = formatProposalFromGet(res.data);
    return res;
  });
}

export async function putProposalPublish(
  proposalId: number,
): Promise<{ data: Proposal }> {
  return axios.put(`/api/v1/proposals/${proposalId}/publish`).then(res => {
    res.data = formatProposalFromGet(res.data);
    return res;
  });
}

export async function deleteProposalRFPLink(proposalId: number): Promise<any> {
  return axios.delete(`/api/v1/proposals/${proposalId}/rfp`);
}

export async function requestProposalPayout(
  proposalId: number,
  milestoneId: number,
): Promise<{ data: Proposal }> {
  return axios
    .put(`/api/v1/proposals/${proposalId}/milestone/${milestoneId}/request`)
    .then(res => {
      res.data = formatProposalFromGet(res.data);
      return res;
    });
}
export async function acceptProposalPayout(
  proposalId: number,
  milestoneId: number,
): Promise<{ data: Proposal }> {
  return axios
    .put(`/api/v1/proposals/${proposalId}/milestone/${milestoneId}/accept`)
    .then(res => {
      res.data = formatProposalFromGet(res.data);
      return res;
    });
}
export async function rejectProposalPayout(
  proposalId: number,
  milestoneId: number,
  reason: string,
): Promise<{ data: Proposal }> {
  return axios
    .put(`/api/v1/proposals/${proposalId}/milestone/${milestoneId}/reject`, { reason })
    .then(res => {
      res.data = formatProposalFromGet(res.data);
      return res;
    });
}

export function postProposalInvite(
  proposalId: number,
  address: string,
): Promise<{ data: TeamInvite }> {
  return axios.post(`/api/v1/proposals/${proposalId}/invite`, { address });
}

export function deleteProposalInvite(
  proposalId: number,
  inviteIdOrAddress: number | string,
): Promise<{ data: TeamInvite }> {
  return axios.delete(`/api/v1/proposals/${proposalId}/invite/${inviteIdOrAddress}`);
}

export function fetchUserInvites(
  id: string | number,
): Promise<{ data: TeamInviteWithProposal[] }> {
  return axios.get(`/api/v1/users/${id}/invites`);
}

export function putInviteResponse(
  id: string | number,
  inviteid: string | number,
  response: boolean,
): Promise<{ data: void }> {
  return axios.put(`/api/v1/users/${id}/invites/${inviteid}/respond`, {
    response,
  });
}

export function postProposalComment(payload: {
  proposalId: number;
  parentCommentId?: number;
  comment: string;
}): Promise<{ data: any }> {
  const { proposalId, ...args } = payload;
  return axios.post(`/api/v1/proposals/${proposalId}/comments`, args);
}

export function getRFPs(): Promise<{ data: RFP[] }> {
  return axios.get('/api/v1/rfps/').then(res => {
    res.data = res.data.map(formatRFPFromGet);
    return res;
  });
}

export function getRFP(rfpId: number | string): Promise<{ data: RFP }> {
  return axios.get(`/api/v1/rfps/${rfpId}`).then(res => {
    res.data = formatRFPFromGet(res.data);
    return res;
  });
}

export function getHistory(
  params: PageParams,
): Promise<{ data: ServerPage<HistoryEvent> }> {
  return axios.get(`/api/v1/history`, { params });
}

export function resendEmailVerification(): Promise<{ data: void }> {
  return axios.put(`/api/v1/users/me/resend-verification`);
}

export function setUserAzimuth(
  sigData: EIP712Data,
  signature: string,
): Promise<{ data: User }> {
  const data = JSON.stringify(sigData);
  return axios.put(`/api/v1/users/me/azimuth`, { data, signature }).then(res => {
    res.data = formatUserFromGet(res.data);
    return res;
  });
}

export function getRFWs(page?: RFWPageParams): Promise<{ data: RFWPage }> {
  let serverParams;
  if (page) {
    serverParams = formatRFWPageParamsForGet(page);
  }
  return axios.get('/api/v1/rfws/', { params: serverParams || {} }).then(res => {
    res.data = formatRFWPageFromGet(res.data);
    return res;
  });
}

export function getRFW(id: number | string): Promise<{ data: RFW }> {
  return axios.get(`/api/v1/rfws/${id}`).then(res => {
    res.data = formatRFWFromGet(res.data);
    return res;
  });
}

export function rfwWorkerRequest(payload: {
  rfwId: number;
  statusMessage: string;
}): Promise<{ data: any }> {
  const { rfwId, ...args } = payload;
  return axios.post(`/api/v1/rfws/${rfwId}/worker/request`, args);
}

export function rfwMilestoneClaim(payload: {
  rfwId: number;
  msId: number;
  workerId: number;
  message: string;
  url: string;
}): Promise<{ data: any }> {
  const { rfwId, msId, workerId, ...args } = payload;
  return axios.post(`/api/v1/rfws/${rfwId}/milestone/${msId}/worker/${workerId}`, args);
}

export function getRFWTags(): Promise<{ data: Tag[] }> {
  return axios.get(`/api/v1/rfws/tags`);
}

