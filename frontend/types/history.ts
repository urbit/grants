import { User } from './user';
import { Proposal } from './proposal';

export interface HistoryEvent {
  id: number;
  title: string;
  content: string;
  date: number;
  user?: User;
  proposal?: Proposal;
}
