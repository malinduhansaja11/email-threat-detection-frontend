import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import type { AppUserProfile } from "../types/user";

export async function registerUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  const uid = credential.user.uid;

  const profile: Omit<AppUserProfile, "createdAt"> = {
    uid,
    email: normalizedEmail,
    role: "user",
    status: "pending",
    gmailConnected: false,
  };

  await setDoc(doc(db, "users", uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUserProfile(
  uid?: string
): Promise<AppUserProfile | null> {
  const userId = uid || auth.currentUser?.uid;

  if (!userId) return null;

  const snap = await getDoc(doc(db, "users", userId));

  if (!snap.exists()) return null;

  return snap.data() as AppUserProfile;
}

export async function getFirebaseToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in");
  }

  return user.getIdToken();
}