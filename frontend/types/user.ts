import { SocialMedia } from './social';
import { EmailSubscriptions } from './email';

export interface User {
  id: number;
  emailAddress?: string;
  emailVerified?: boolean;
  displayName: string;
  title: string;
  displayTitle: string;
  socialMedias: SocialMedia[];
  avatar: { imageUrl: string } | null;
  isAdmin?: boolean;
  azimuth: { point: string } | null;
}

export interface UserSettings {
  emailSubscriptions: EmailSubscriptions;
}
