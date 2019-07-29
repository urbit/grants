import { pick } from 'lodash';
import { store } from 'react-easy-state';
import axios, { AxiosError } from 'axios';
import {
  User,
  Proposal,
  RFP,
  RFPArgs,
  EmailExample,
  PageQuery,
  PageData,
  CommentArgs,
  RFW,
  Tag,
  TagArgs,
  HistoryEvent,
  HistoryEventArgs,
  AdminLog,
} from './types';

// API
const api = axios.create({
  baseURL: process.env.BACKEND_URL + '/api/v1',
  withCredentials: true,
});

async function login(username: string, password: string) {
  const { data } = await api.post('/admin/login', {
    username,
    password,
  });
  return data;
}

export async function refresh(password: string) {
  const { data } = await api.post('/admin/refresh', {
    password,
  });
  return data;
}

async function logout() {
  const { data } = await api.get('/admin/logout');
  return data;
}

async function checkLogin() {
  const { data } = await api.get('/admin/checklogin');
  return data;
}

export async function get2fa() {
  const { data } = await api.get('/admin/2fa');
  return data;
}

export async function get2faInit() {
  const { data } = await api.get('/admin/2fa/init');
  return data;
}

export async function post2faEnable(args: {
  backupCodes: string[];
  totpSecret: string;
  verifyCode: string;
}) {
  const { data } = await api.post('/admin/2fa/enable', args);
  return data;
}

export async function post2faVerify(args: { verifyCode: string }) {
  const { data } = await api.post('/admin/2fa/verify', args);
  return data;
}

async function fetchStats() {
  const { data } = await api.get('/admin/stats');
  return data;
}

async function fetchFinancials() {
  const { data } = await api.get('/admin/financials');
  return data;
}

async function fetchUsers(params: Partial<PageQuery>) {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

async function fetchUserDetail(id: number) {
  const { data } = await api.get(`/admin/users/${id}`);
  return data;
}

async function editUser(id: number, args: Partial<User>) {
  const { data } = await api.put(`/admin/users/${id}`, args);
  return data;
}

async function deleteUser(id: number) {
  const { data } = await api.delete('/admin/users/' + id);
  return data;
}

async function fetchProposals(params: Partial<PageQuery>) {
  const { data } = await api.get('/admin/proposals', { params });
  return data;
}

async function fetchProposalDetail(id: number) {
  const { data } = await api.get(`/admin/proposals/${id}`);
  return data;
}

async function updateProposal(p: Partial<Proposal>) {
  const { data } = await api.put('/admin/proposals/' + p.id, p);
  return data;
}

async function deleteProposal(id: number) {
  const { data } = await api.delete('/admin/proposals/' + id);
  return data;
}

async function approveProposal(id: number, isApprove: boolean, rejectReason?: string) {
  const { data } = await api.put(`/admin/proposals/${id}/approve`, {
    isApprove,
    rejectReason,
  });
  return data;
}

async function cancelProposal(id: number) {
  const { data } = await api.put(`/admin/proposals/${id}/cancel`);
  return data;
}

async function fetchComments(params: Partial<PageQuery>) {
  const { data } = await api.get('/admin/comments', { params });
  return data;
}

async function updateComment(id: number, args: Partial<CommentArgs>) {
  const { data } = await api.put(`/admin/comments/${id}`, args);
  return data;
}

async function rejectMilestone(proposalId: number, milestoneId: number, reason: string) {
  const { data } = await api.put(
    `/admin/proposals/${proposalId}/milestone/${milestoneId}/reject`,
    { reason },
  );
  return data;
}

async function acceptMilestone(proposalId: number, milestoneId: number) {
  const { data } = await api.put(
    `/admin/proposals/${proposalId}/milestone/${milestoneId}/accept`,
    {},
  );
  return data;
}

async function markMilestonePaid(proposalId: number, milestoneId: number) {
  const { data } = await api.put(
    `/admin/proposals/${proposalId}/milestone/${milestoneId}/paid`,
    {},
  );
  return data;
}

async function getEmailExample(type: string) {
  const { data } = await api.get(`/admin/email/example/${type}`);
  return data;
}

async function getRFPs() {
  const { data } = await api.get(`/admin/rfps`);
  return data;
}

async function createRFP(args: RFPArgs) {
  const { data } = await api.post('/admin/rfps', args);
  return data;
}

async function editRFP(id: number, args: RFPArgs) {
  const { data } = await api.put(`/admin/rfps/${id}`, args);
  return data;
}

async function deleteRFP(id: number) {
  await api.delete(`/admin/rfps/${id}`);
}

async function fetchRFWs(params: Partial<PageQuery>) {
  const { data } = await api.get('/admin/rfws', { params });
  return data;
}

async function fetchRFWDetail(id: number) {
  const { data } = await api.get(`/admin/rfws/${id}`);
  return data;
}

async function createRFW(args: Partial<RFW>) {
  const { data } = await api.post('/admin/rfws', args);
  return data;
}

async function editRFW(id: number, args: Partial<RFW>) {
  const { data } = await api.put(`/admin/rfws/${id}`, args);
  return data;
}

async function deleteRFW(id: number) {
  await api.delete(`/admin/rfws/${id}`);
}

async function approveRFWWorker(
  id: number,
  workerId: number,
  isAccept: boolean,
  message: string,
) {
  const { data } = await api.put(`/admin/rfws/${id}/worker/${workerId}/accept`, {
    isAccept,
    message,
  });
  return data;
}

async function acceptRFWClaim(
  id: number,
  msId: number,
  claimId: number,
  isAccept: boolean,
  message: string,
) {
  const { data } = await api.put(
    `/admin/rfws/${id}/milestone/${msId}/accept/${claimId}`,
    {
      isAccept,
      message,
    },
  );
  return data;
}

async function getTags() {
  const { data } = await api.get(`/admin/tags`);
  return data;
}

async function updateTag(tag: TagArgs) {
  const { data } = await api.put('/admin/tags', tag);
  return data;
}

async function deleteTag(id: number) {
  await api.delete(`/admin/tags/${id}`);
}

async function fetchHistory(params: Partial<PageQuery>) {
  const { data } = await api.get('/admin/history', { params });
  return data;
}

async function fetchHistoryEvent(id: number) {
  const { data } = await api.get(`/admin/history/${id}`);
  return data;
}

async function createHistoryEvent(args: HistoryEventArgs) {
  const { data } = await api.post(`/admin/history`, args);
  return data;
}

async function editHistoryEvent(id: number, args: HistoryEventArgs) {
  const { data } = await api.put(`/admin/history/${id}`, args);
  return data;
}

async function deleteHistoryEvent(id: number) {
  const { data } = await api.delete(`/admin/history/${id}`);
  return data;
}

async function fetchLogs(params: Partial<PageQuery>) {
  const { data } = await api.get('/admin/logs', { params });
  return data;
}

// STORE
const app = store({
  /*** DATA ***/

  hasCheckedLogin: false,
  isLoggedIn: false,
  is2faAuthed: false,
  loginError: '',
  generalError: [] as string[],
  statsFetched: false,
  statsFetching: false,
  stats: {
    userCount: 0,
    proposalCount: 0,
    proposalPendingCount: 0,
    proposalMilestonePayoutsCount: 0,
    rfwWorkerRequestCount: 0,
    rfwMilestoneClaimCount: 0,
  },

  financialsFetched: false,
  financialsFetching: false,
  financials: {
    grants: {
      total: '0',
      matching: '0',
      bounty: '0',
    },
    payouts: {
      total: '0',
      due: '0',
      paid: '0',
      future: '0',
    },
  },

  users: {
    page: createDefaultPageData<User>('EMAIL:DESC'),
  },
  userSaving: false,
  userSaved: false,

  userDetailFetching: false,
  userDetail: null as null | User,
  userDeleting: false,
  userDeleted: false,

  proposals: {
    page: createDefaultPageData<Proposal>('CREATED:DESC'),
  },

  proposalDetail: null as null | Proposal,
  proposalDetailFetching: false,
  proposalDetailApproving: false,
  proposalDetailMarkingMilestonePaid: false,
  proposalDetailRejectingMilestone: false,
  proposalDetailAcceptingMilestone: false,
  proposalDetailCanceling: false,
  proposalDetailUpdating: false,
  proposalDetailUpdated: false,

  comments: {
    page: createDefaultPageData<Comment>('CREATED:DESC'),
  },
  commentSaving: false,
  commentSaved: false,

  rfps: [] as RFP[],
  rfpsFetching: false,
  rfpsFetched: false,
  rfpSaving: false,
  rfpSaved: false,
  rfpDeleting: false,
  rfpDeleted: false,

  rfws: {
    page: createDefaultPageData<RFW>('CREATED:DESC'),
  },
  rfwDeleting: false,
  rfwDeleted: false,

  rfwDetail: null as null | RFW,
  rfwDetailFetching: false,
  rfwDetailBusy: false,
  rfwDetailSaved: false,

  tags: [] as Tag[],
  tagsFetching: false,
  tagsFetched: false,
  tagsUpdating: false,
  tagsUpdated: false,
  tagDeleting: false,
  tagDeleted: false,

  history: {
    page: createDefaultPageData<HistoryEvent>('DATE:DESC'),
  },
  historyEvent: null as null | HistoryEvent,
  historyEventFetching: false,
  historyEventSaving: false,
  historyEventSaved: false,
  historyEventDeleting: false,
  historyEventDeleted: false,

  logs: {
    page: createDefaultPageData<AdminLog>('DATE:DESC'),
  },

  emailExamples: {} as { [type: string]: EmailExample },

  /*** ACTIONS ***/

  removeGeneralError(i: number) {
    app.generalError.splice(i, 1);
  },

  updateProposalInStore(p: Proposal) {
    const index = app.proposals.page.items.findIndex(x => x.id === p.id);
    if (index > -1) {
      app.proposals.page.items[index] = p;
    }
    if (app.proposalDetail && app.proposalDetail.id === p.id) {
      app.proposalDetail = p;
    }
  },

  updateUserInStore(u: User) {
    const index = app.users.page.items.findIndex(x => x.id === u.id);
    if (index > -1) {
      app.users.page.items[index] = u;
    }
    if (app.userDetail && app.userDetail.id === u.id) {
      app.userDetail = {
        ...app.userDetail,
        ...u,
      };
    }
  },

  updateRFWInStore(rfw: RFW) {
    const index = app.rfws.page.items.findIndex(x => x.id === rfw.id);
    if (index > -1) {
      app.rfws.page.items[index] = rfw;
    }
    if (app.rfwDetail && app.rfwDetail.id === rfw.id) {
      app.rfwDetail = rfw;
    }
  },

  updateHistoryEventInStore(h: HistoryEvent) {
    const index = app.history.page.items.findIndex(x => x.id === h.id);
    if (index > -1) {
      app.history.page.items[index] = h;
    }
    if (app.historyEvent && app.historyEvent.id === h.id) {
      app.historyEvent = {
        ...app.historyEvent,
        ...h,
      };
    }
  },

  // Auth

  async checkLogin() {
    const res = await checkLogin();
    app.isLoggedIn = res.isLoggedIn;
    app.is2faAuthed = res.is2faAuthed;
    app.hasCheckedLogin = true;
  },

  async login(username: string, password: string) {
    try {
      const res = await login(username, password);
      app.isLoggedIn = res.isLoggedIn;
      app.is2faAuthed = res.is2faAuthed;
    } catch (e) {
      app.loginError = e.response.data.message;
    }
  },

  async logout() {
    try {
      const res = await logout();
      app.isLoggedIn = res.isLoggedIn;
      app.is2faAuthed = res.is2faAuthed;
    } catch (e) {
      app.generalError.push(e.toString());
    }
  },

  async fetchStats() {
    app.statsFetching = true;
    try {
      app.stats = await fetchStats();
      app.statsFetched = true;
    } catch (e) {
      handleApiError(e);
    }
    app.statsFetching = false;
  },

  async fetchFinancials() {
    app.financialsFetching = true;
    try {
      app.financials = await fetchFinancials();
      app.financialsFetched = true;
    } catch (e) {
      handleApiError(e);
    }
    app.financialsFetching = false;
  },

  // Users

  async fetchUsers() {
    return await pageFetch(app.users, fetchUsers);
  },

  setUserPageQuery(params: Partial<PageQuery>) {
    setPageParams(app.users, params);
  },

  resetUserPageQuery() {
    resetPageParams(app.users);
  },

  async fetchUserDetail(id: number) {
    app.userDetailFetching = true;
    try {
      app.userDetail = await fetchUserDetail(id);
    } catch (e) {
      handleApiError(e);
    }
    app.userDetailFetching = false;
  },

  async editUser(id: number, args: Partial<User>) {
    app.userSaving = true;
    app.userSaved = false;
    try {
      const user = await editUser(id, args);
      app.updateUserInStore(user);
      app.userSaved = true;
    } catch (e) {
      handleApiError(e);
    }
    app.userSaving = false;
  },

  async deleteUser(id: number) {
    app.userDeleting = false;
    app.userDeleted = false;
    try {
      await deleteUser(id);
      app.users.page.items = app.users.page.items.filter(u => u.id !== id);
      app.userDeleted = true;
      app.userDetail = null;
    } catch (e) {
      handleApiError(e);
    }
    app.userDeleting = false;
  },

  // Proposals

  async fetchProposals() {
    return await pageFetch(app.proposals, fetchProposals);
  },

  setProposalPageQuery(params: Partial<PageQuery>) {
    setPageParams(app.proposals, params);
  },

  resetProposalPageQuery() {
    resetPageParams(app.proposals);
  },

  async fetchProposalDetail(id: number) {
    app.proposalDetailFetching = true;
    try {
      app.proposalDetail = await fetchProposalDetail(id);
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailFetching = false;
  },

  async updateProposalDetail(updates: Partial<Proposal>) {
    if (!app.proposalDetail) {
      return;
    }
    app.proposalDetailUpdating = true;
    app.proposalDetailUpdated = false;
    try {
      const res = await updateProposal({
        ...updates,
        id: app.proposalDetail.id,
      });
      app.updateProposalInStore(res);
      app.proposalDetailUpdated = true;
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailUpdating = false;
  },

  async deleteProposal(id: number) {
    try {
      await deleteProposal(id);
      app.proposals.page.items = app.proposals.page.items.filter(p => p.id === id);
    } catch (e) {
      handleApiError(e);
    }
  },

  async approveProposal(isApprove: boolean, rejectReason?: string) {
    if (!app.proposalDetail) {
      const m = 'store.approveProposal(): Expected proposalDetail to be populated!';
      app.generalError.push(m);
      console.error(m);
      return;
    }
    app.proposalDetailApproving = true;
    try {
      const { id } = app.proposalDetail;
      const res = await approveProposal(id, isApprove, rejectReason);
      app.updateProposalInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailApproving = false;
  },

  async cancelProposal(id: number) {
    app.proposalDetailCanceling = true;
    try {
      const res = await cancelProposal(id);
      app.updateProposalInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailCanceling = false;
  },

  async rejectMilestone(proposalId: number, milestoneId: number, reason: string) {
    app.proposalDetailRejectingMilestone = true;
    try {
      const res = await rejectMilestone(proposalId, milestoneId, reason);
      app.updateProposalInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailRejectingMilestone = false;
  },

  async acceptMilestone(proposalId: number, milestoneId: number) {
    app.proposalDetailAcceptingMilestone = true;
    try {
      const res = await acceptMilestone(proposalId, milestoneId);
      app.updateProposalInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailAcceptingMilestone = false;
  },

  async markMilestonePaid(proposalId: number, milestoneId: number) {
    app.proposalDetailMarkingMilestonePaid = true;
    try {
      const res = await markMilestonePaid(proposalId, milestoneId);
      app.updateProposalInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.proposalDetailMarkingMilestonePaid = false;
  },

  // Comments

  async fetchComments() {
    return await pageFetch(app.comments, fetchComments);
  },

  setCommentPageParams(params: Partial<PageQuery>) {
    setPageParams(app.comments, params);
  },

  resetCommentPageParams() {
    resetPageParams(app.comments);
  },

  async updateComment(id: number, args: Partial<CommentArgs>) {
    app.commentSaving = true;
    app.commentSaved = false;
    try {
      await updateComment(id, args);
      app.commentSaved = true;
      await app.fetchComments();
    } catch (e) {
      handleApiError(e);
    }
    app.commentSaving = false;
  },

  // Email

  async getEmailExample(type: string) {
    try {
      const example = await getEmailExample(type);
      app.emailExamples = {
        ...app.emailExamples,
        [type]: example,
      };
    } catch (e) {
      handleApiError(e);
    }
  },

  // RFPs

  async fetchRFPs() {
    app.rfpsFetching = true;
    try {
      app.rfps = await getRFPs();
      app.rfpsFetched = true;
    } catch (e) {
      handleApiError(e);
    }
    app.rfpsFetching = false;
  },

  async createRFP(args: RFPArgs) {
    app.rfpSaving = true;
    try {
      const data = await createRFP(args);
      app.rfps = [data, ...app.rfps];
      app.rfpSaved = true;
    } catch (e) {
      handleApiError(e);
    }
    app.rfpSaving = false;
  },

  async editRFP(id: number, args: RFPArgs) {
    app.rfpSaving = true;
    app.rfpSaved = false;
    try {
      await editRFP(id, args);
      app.rfpSaved = true;
      await app.fetchRFPs();
    } catch (e) {
      handleApiError(e);
    }
    app.rfpSaving = false;
  },

  async deleteRFP(id: number) {
    app.rfpDeleting = true;
    app.rfpDeleted = false;
    try {
      await deleteRFP(id);
      app.rfps = app.rfps.filter(rfp => rfp.id !== id);
      app.rfpDeleted = true;
    } catch (e) {
      handleApiError(e);
    }
    app.rfpDeleting = false;
  },

  // RFWs

  async fetchRFWs() {
    return await pageFetch(app.rfws, fetchRFWs);
  },

  setRFWPageQuery(params: Partial<PageQuery>) {
    setPageParams(app.rfws, params);
  },

  resetRFWPageQuery() {
    resetPageParams(app.rfws);
  },

  async fetchRFWDetail(id: number) {
    app.rfwDetail = null; // clear every time
    app.rfwDetailFetching = true;
    try {
      app.rfwDetail = await fetchRFWDetail(id);
    } catch (e) {
      app.rfwDetail = null;
      handleApiError(e);
    }
    app.rfwDetailFetching = false;
  },

  clearRFWDetail() {
    app.rfwDetail = null;
  },

  async updateRFWDetail(id: number, updates: Partial<RFW>) {
    if (!app.rfwDetail) {
      return;
    }
    app.rfwDetailBusy = true;
    app.rfwDetailSaved = false;
    try {
      const res = await editRFW(id, {
        ...updates,
      });
      app.updateRFWInStore(res);
      app.rfwDetailSaved = true;
    } catch (e) {
      handleApiError(e);
    }
    app.rfwDetailBusy = false;
  },

  async createRFWDetail(args: Partial<RFW>) {
    app.rfwDetailBusy = true;
    try {
      const data = await createRFW(args);
      app.updateRFWInStore(data);
      app.rfwDetailSaved = true;
    } catch (e) {
      handleApiError(e);
    }
    app.rfwDetailBusy = false;
  },

  async deleteRFW(id: number) {
    app.rfwDeleting = true;
    app.rfwDeleted = false;
    try {
      await deleteRFW(id);
      app.rfws.page.items = app.rfws.page.items.filter(rfw => rfw.id !== id);
      app.rfwDeleted = true;
    } catch (e) {
      handleApiError(e);
    }
    app.rfwDeleting = false;
  },

  async approveRFWWorker(workerId: number, isApprove: boolean, message: string) {
    if (!app.rfwDetail) {
      const m = 'store.approveRFWWorker(): Expected proposalDetail to be populated!';
      app.generalError.push(m);
      console.error(m);
      return;
    }
    app.rfwDetailBusy = true;
    try {
      const { id } = app.rfwDetail;
      const res = await approveRFWWorker(id, workerId, isApprove, message);
      app.updateRFWInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.rfwDetailBusy = false;
  },

  async acceptRFWClaim(
    msId: number,
    claimId: number,
    isApprove: boolean,
    message: string,
  ) {
    if (!app.rfwDetail) {
      const m = 'store.acceptRFWClaim(): Expected proposalDetail to be populated!';
      app.generalError.push(m);
      console.error(m);
      return;
    }
    app.rfwDetailBusy = true;
    try {
      const { id } = app.rfwDetail;
      const res = await acceptRFWClaim(id, msId, claimId, isApprove, message);
      app.updateRFWInStore(res);
    } catch (e) {
      handleApiError(e);
    }
    app.rfwDetailBusy = false;
  },

  // Tags

  async getTags() {
    app.tagsFetching = true;
    try {
      app.tags = await getTags();
      app.tagsFetched = true;
    } catch (e) {
      handleApiError(e);
    }
    app.tagsFetching = false;
  },

  async updateTag(tag: TagArgs) {
    app.tagsUpdating = true;
    app.tagsUpdated = false;
    try {
      const newTag = await updateTag(tag);
      const tagInd = app.tags.findIndex(x => x.id === tag.id);
      if (tagInd > -1) {
        app.tags[tagInd] = newTag;
      } else {
        app.tags.push(newTag);
      }
      app.tagsUpdated = true;
      return newTag;
    } catch (e) {
      handleApiError(e);
    }
    app.tagsUpdating = false;
  },

  async deleteTag(id: number) {
    app.tagDeleting = true;
    app.tagDeleted = false;
    try {
      await deleteTag(id);
      app.tags = app.tags.filter(x => x.id !== id);
      if (app.rfwDetail) {
        app.rfwDetail.tags = app.rfwDetail.tags.filter(x => x.id !== id);
      }
      app.tagDeleted = true;
    } catch (e) {
      handleApiError(e);
    }
    app.tagDeleting = false;
  },

  // History Events

  async fetchHistory() {
    return await pageFetch(app.history, fetchHistory);
  },

  setHistoryPageQuery(params: Partial<PageQuery>) {
    setPageParams(app.history, params);
  },

  resetHistoryPageQuery() {
    resetPageParams(app.history);
  },

  async fetchHistoryEvent(id: number) {
    app.historyEventFetching = true;
    try {
      app.historyEvent = await fetchHistoryEvent(id);
    } catch (e) {
      handleApiError(e);
    }
    app.historyEventFetching = false;
  },

  async createHistoryEvent(args: HistoryEventArgs) {
    app.historyEventSaving = true;
    app.historyEventSaved = false;
    try {
      await createHistoryEvent(args);
      app.historyEventSaved = true;
    } catch (e) {
      handleApiError(e);
    }
    app.historyEventSaving = false;
  },

  async editHistoryEvent(id: number, args: HistoryEventArgs) {
    app.historyEventSaving = true;
    app.historyEventSaved = false;
    try {
      const historyEvent = await editHistoryEvent(id, args);
      app.updateHistoryEventInStore(historyEvent);
      app.historyEventSaved = true;
    } catch (e) {
      handleApiError(e);
    }
    app.historyEventSaving = false;
  },

  async deleteHistoryEvent(id: number) {
    app.historyEventDeleting = false;
    app.historyEventDeleted = false;
    try {
      await deleteHistoryEvent(id);
      app.history.page.items = app.history.page.items.filter(h => h.id !== id);
      app.historyEventDeleted = true;
      app.historyEvent = null;
    } catch (e) {
      handleApiError(e);
    }
    app.historyEventDeleting = false;
  },
  
  // Admin Logs

  async fetchLogs() {
    return await pageFetch(app.logs, fetchLogs);
  },

  setLogsQuery(params: Partial<PageQuery>) {
    setPageParams(app.logs, params);
  },

  resetLogsQuery() {
    resetPageParams(app.logs);
  },
});

// Utils
export function handleApiError(e: AxiosError) {
  if (e.response && e.response.data!.message) {
    app.generalError.push(e.response!.data.message);
  } else if (e.response && e.response.data!.data!) {
    app.generalError.push(e.response!.data.data);
  } else {
    app.generalError.push(e.toString());
  }
}

function createDefaultPageData<T>(sort: string): PageData<T> {
  return {
    sort,
    page: 1,
    search: '',
    filters: [] as string[],
    pageSize: 0,
    total: 0,
    items: [] as T[],
    fetching: false,
    fetched: false,
  };
}

type FNFetchPage = (params: PageQuery) => Promise<any>;
interface PageParent<T> {
  page: PageData<T>;
}

async function pageFetch<T>(ref: PageParent<T>, fetch: FNFetchPage) {
  ref.page.fetching = true;
  try {
    const params = getPageParams(ref.page);
    const newPage = await fetch(params);
    ref.page = {
      ...ref.page,
      ...newPage,
      fetched: true,
    };
  } catch (e) {
    handleApiError(e);
  }
  ref.page.fetching = false;
}

function getPageParams<T>(page: PageData<T>) {
  return pick(page, ['page', 'search', 'filters', 'sort']) as PageQuery;
}

function setPageParams<T>(ref: PageParent<T>, query: Partial<PageQuery>) {
  // sometimes we need to reset page to 1
  if (query.filters || query.search) {
    query.page = 1;
  }
  ref.page = {
    ...ref.page,
    ...query,
  };
}

function resetPageParams<T>(ref: PageParent<T>) {
  ref.page.page = 1;
  ref.page.search = '';
  ref.page.sort = 'CREATED:DESC';
  ref.page.filters = [];
}

// Attach to window for inspection
(window as any).appStore = app;

// check login status periodically
app.checkLogin();
window.setInterval(app.checkLogin, 10000);

export type TApp = typeof app;
export default app;
