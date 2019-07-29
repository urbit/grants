import moment from 'moment';

const DATE_TIME_FMT_STRING = 'MM/DD/YYYY h:mm a';
const DATE_DAY_FMT_STRING = 'MM/DD/YYYY';
const MONTH_DATE_FMT_STRING = 'MMMM YYYY';

export const HOUR = 1000 * 60 * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const MONTH = WEEK * 4;
export const YEAR = MONTH * 12;

export const formatDateSeconds = (s: number) => {
  return moment(s * 1000).format(DATE_TIME_FMT_STRING);
};

export const formatDateDay = (s: number) => {
  return moment(s * 1000).format(DATE_DAY_FMT_STRING);
};

export const formatMonthDateSeconds = (s: number) => {
  return moment(s * 1000).format(MONTH_DATE_FMT_STRING);
};

export const formatDateSecondsFromNow = (s: number) => {
  return moment(s * 1000).fromNow();
};

export const formatDateMs = (s: number) => {
  return moment(s).format(DATE_TIME_FMT_STRING);
};

export const formatDurationSeconds = (s: number) => {
  return moment.duration(s, 'seconds').humanize();
};

export const formatDurationMs = (s: number) => {
  return moment.duration(s).humanize();
};
