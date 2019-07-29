import { PROPOSAL_CATEGORY } from 'types';

interface EnumUI {
  label: string;
  color: string;
}

export const CATEGORY_UI: { [key in PROPOSAL_CATEGORY]: EnumUI } = {
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
    color: '',
  },
  APP_DEV_AZIMUTH: {
    label: 'App dev: Azimuth',
    color: '',
  },
  APP_DEV_OTHER: {
    label: 'App dev: Other',
    color: '',
  },
  COMMUNITY: {
    label: 'Community',
    color: '#2aa779',
  },
  DOCUMENTATION: {
    label: 'Documentation',
    color: '#b0c7ff',
  },
  SECURITY: {
    label: 'Security',
    color: '',
  },
  DESIGN: {
    label: 'Design',
    color: '',
  },
};
