import type { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "admin";
export type UserStatus = "pending" | "approved" | "rejected";

export type AppUserProfile = {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  gmailConnected?: boolean;
  createdAt?: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
};