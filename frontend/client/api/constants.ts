export enum PROPOSAL_SORT {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
}

export const SORT_LABELS: { [key in PROPOSAL_SORT]: string } = {
  NEWEST: 'Newest',
  OLDEST: 'Oldest',
};

export enum PROPOSAL_CATEGORY {
  DEV_TOOL = 'DEV_TOOL',
  CORE_DEV = 'CORE_DEV',
  APP_DEV_ARVO = 'APP_DEV_ARVO',
  APP_DEV_AZIMUTH = 'APP_DEV_AZIMUTH',
  APP_DEV_OTHER = 'APP_DEV_OTHER',
  COMMUNITY = 'COMMUNITY',
  DOCUMENTATION = 'DOCUMENTATION',
  SECURITY = 'SECURITY',
  DESIGN = 'DESIGN',
}

interface CategoryUI {
  label: string;
  color: string;
}

export const CATEGORY_UI: { [key in PROPOSAL_CATEGORY]: CategoryUI } = {
  DEV_TOOL: {
    label: 'Developer tool',
    color: '#2c3e50',
  },
  CORE_DEV: {
    label: 'Core dev',
    color: '#ee5432',
  },
  APP_DEV_ARVO: {
    label: 'App dev: Arvo',
    color: '#8e44ad',
  },
  APP_DEV_AZIMUTH: {
    label: 'App dev: Azimuth',
    color: '#8e44ad',
  },
  APP_DEV_OTHER: {
    label: 'App dev: Other',
    color: '#8e44ad',
  },
  COMMUNITY: {
    label: 'Community',
    color: '#2aa779',
  },
  DOCUMENTATION: {
    label: 'Documentation',
    color: '#190d7b',
  },
  SECURITY: {
    label: 'Security',
    color: '#ee5432',
  },
  DESIGN: {
    label: 'Design',
    color: '#ee892b',
  },
};

export enum PROPOSAL_STAGE {
  PREVIEW = 'PREVIEW',
  FUNDING_REQUIRED = 'FUNDING_REQUIRED',
  WIP = 'WIP',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

interface StageUI {
  label: string;
  color: string;
}

export const STAGE_UI: { [key in PROPOSAL_STAGE]: StageUI } = {
  PREVIEW: {
    label: 'Preview',
    color: '#8e44ad',
  },
  FUNDING_REQUIRED: {
    label: 'Funding required',
    color: '#8e44ad',
  },
  WIP: {
    label: 'In progress',
    color: '#2980b9',
  },
  COMPLETED: {
    label: 'Completed',
    color: '#27ae60',
  },
  // Never used
  FAILED: {
    label: 'Failed',
    color: '#000',
  },
  CANCELED: {
    label: 'Canceled',
    color: '#000',
  },
};

export enum RFP_STATUS {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}

export enum RFW_STATUS {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}

export enum RFW_SORT {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
}

export const RFW_SORT_LABELS: { [key in RFW_SORT]: string } = {
  NEWEST: 'Newest',
  OLDEST: 'Oldest',
};

interface RFWStatusUI {
  label: string;
  color: string;
}

export const RFW_STATUS_UI: { [key in RFW_STATUS]: RFWStatusUI } = {
  DRAFT: {
    label: 'Draft',
    color: '#8e44ad',
  },
  LIVE: {
    label: 'Open',
    color: '#2980b9',
  },
  CLOSED: {
    label: 'Closed',
    color: '#27ae60',
  },
};
