import {
  User,
  Proposal,
  ProposalPageParams,
  PageParams,
  RFP,
  ProposalPage,
  RFWPageParams,
  RFW,
  RFWPage,
} from 'types';
import { AppState } from 'store/reducers';

export function formatUserForPost(user: User) {
  return {
    ...user,
    avatar: user.avatar ? user.avatar.imageUrl : null,
    azimuth: user.azimuth ? user.azimuth.point : null,
  };
}

export function formatUserFromGet(user: User): User {
  return {
    ...user,
    displayTitle: user.azimuth
      ? user.azimuth.point
      : (user.title || ''),
  };
}
// NOTE: sync with pagination.py ProposalPagination.SORT_MAP
const proposalsSortMap = {
  NEWEST: 'PUBLISHED:DESC',
  OLDEST: 'PUBLISHED:ASC',
};

export function formatProposalPageParamsForGet(params: ProposalPageParams): PageParams {
  return {
    ...params,
    sort: proposalsSortMap[params.sort],
    filters: [
      ...params.filters.category.map(c => 'CAT_' + c),
      ...params.filters.stage.map(s => 'STAGE_' + s),
    ],
  } as PageParams;
}

export function formatProposalPageFromGet(page: any): ProposalPage {
  page.items = page.items.map(formatProposalFromGet);
  const swf = (sw: string, a: string[]) =>
    a.filter(x => x.startsWith(sw)).map(x => x.replace(sw, ''));
  page.filters = {
    category: swf('CAT_', page.filters),
    stage: swf('STAGE_', page.filters),
  };
  // reverse map
  const serverSortToClient = Object.entries(proposalsSortMap).find(
    ([_, v]) => v === page.sort,
  );
  if (!serverSortToClient) {
    throw Error(
      `formatProposalFromGet Unable to find mapping from server proposal sort: ${
        page.sort
      }`,
    );
  }
  page.sort = serverSortToClient[0];
  return page as ProposalPage;
}

export function formatProposalFromGet(p: any): Proposal {
  const proposal = { ...p } as Proposal;
  proposal.urlId = generateSlugUrl(proposal.id, proposal.title);
  if (proposal.milestones) {
    const msToFe = (m: any) => ({
      ...m,
      amount: parseFloat(m.payoutAmount),
    });
    proposal.milestones = proposal.milestones.map(msToFe);
    proposal.currentMilestone = msToFe(proposal.currentMilestone);
  }
  if (proposal.rfp) {
    proposal.rfp = formatRFPFromGet(proposal.rfp);
  }
  proposal.team = proposal.team.map(formatUserFromGet);
  return proposal;
}

export function formatRFPFromGet(rfp: RFP): RFP {
  rfp.urlId = generateSlugUrl(rfp.id, rfp.title);
  if (rfp.acceptedProposals) {
    rfp.acceptedProposals = rfp.acceptedProposals.map(formatProposalFromGet);
  }
  return rfp;
}

// NOTE: i18n on case-by-case basis
export function generateSlugUrl(id: number, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[’'"]+/g, '')
    .replace(/[^\w\-]+/g, '-')
    .replace(/\-{2,}/g, '-')
    .replace(/^\-*|\-*$/g, '');
  return `${id}-${slug}`;
}

export function extractIdFromSlug(slug: string) {
  const id = parseInt(slug, 10);
  if (isNaN(id)) {
    console.error('extractIdFromSlug could not find id in : ' + slug);
  }
  return id;
}

// pre-hydration massage (manual deserialization)
export function massageSerializedState(state: AppState) {
  // convert any BNs etc here as necessary
  return state;
}

export function formatRFWPageParamsForGet(params: RFWPageParams): PageParams {
  return {
    ...params,
    filters: [
      ...params.filters.category.map(c => `CAT_${c}`),
      ...params.filters.status.map(s => `STATUS_${s}`),
      ...params.filters.tags.map(t => `TAG_${t}`),
    ],
  } as PageParams;
}

export function formatRFWPageFromGet(page: any): RFWPage {
  const swf = (sw: string, a: string[]) =>
    a.filter(x => x.startsWith(sw)).map(x => x.replace(sw, ''));
  const fePage = {
    ...page,
    items: page.items.map(formatRFWFromGet),
    filters: {
      category: swf('CAT_', page.filters),
      status: swf('STATUS_', page.filters),
      tags: swf('TAG_', page.filters).map(t => parseInt(t, 10)),
    },
  };
  return fePage as RFWPage;
}

export function formatRFWFromGet(p: any): RFW {
  const rfw = { ...p } as RFW;
  rfw.urlId = generateSlugUrl(rfw.id, rfw.title);
  rfw.workers = rfw.workers.map(w => {
    w.user = w.user ? formatUserFromGet(w.user) : undefined;
    return w;
  });
  return rfw;
}
