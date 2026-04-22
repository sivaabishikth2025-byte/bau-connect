export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  gender: string;
  major: string;
  university: string;
  bio: string;
  interests: string[];
  photoURL: string;
  photos: string[];           // multiple photos
  gallery: string[];          // personal gallery (up to 15)
  email: string;
  blockedUsers: string[];
  genderPreference: string;   // "Man" | "Woman" | "Everyone"
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
  seenBy: string[];           // read receipts
}

export interface Like {
  id?: string;
  fromUserId: string;
  toUserId: string;
  createdAt: any;
}
