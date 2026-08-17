export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  gender?: string;
  major: string;
  university: string;
  bio: string;
  interests: string[];
  /** e.g. Carpool, Study groups — community connection intents */
  openTo?: string[];
  photoURL: string;
  photos: string[];
  gallery: string[];
  email: string;
  blockedUsers: string[];
  /** @deprecated dating-era field; ignored in UI */
  genderPreference?: string;
  createdAt: any;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: any;
}

export interface Message {
  id?: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: any;
  seenBy: string[];
}

export interface Like {
  id?: string;
  fromUserId: string;
  toUserId: string;
  createdAt: any;
}

export interface Activity {
  id?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  type: string;
  title: string;
  description: string;
  location?: string;
  campusSpotId?: string;
  when?: any;
  spots?: number;
  participantIds: string[];
  createdAt: any;
  likedBy?: string[];
  updatedAt?: any;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: any;
}

export interface VolunteerJob {
  id?: string;
  seedId?: string;
  title: string;
  description: string;
  category: string;
  campusSpotId?: string | null;
  location?: string | null;
  when?: any;
  whenLabel?: string | null;
  hours: number;
  spots: number;
  requirements?: string;
  skills: string[];
  commitment: "one-time" | "ongoing" | string;
  organizerId: string;
  organizerName: string;
  organizerPhoto?: string | null;
  participantIds: string[];
  status: "active" | "closed" | string;
  createdAt: any;
}

export type VolunteerAppStatus =
  | "applied"
  | "reviewing"
  | "hired"
  | "waitlisted"
  | "declined"
  | "withdrawn";

export interface VolunteerApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhoto?: string | null;
  phone: string;
  major: string;
  year: string;
  availability: string;
  why: string;
  experience: string;
  resumeURL?: string | null;
  resumeName?: string | null;
  roleNotes?: string;
  status: VolunteerAppStatus;
  adminNotes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface VolunteerHourLog {
  id: string;
  jobId: string;
  jobTitle: string;
  userId: string;
  userName: string;
  date: string;
  hours: number;
  comment: string;
  createdAt: any;
  updatedAt: any;
}

export interface InboxItem {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  fromUserId?: string;
  fromName?: string;
  read: boolean;
  createdAt: any;
}
