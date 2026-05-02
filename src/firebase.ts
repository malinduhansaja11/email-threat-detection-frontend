import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDAngb-ej6-4x1xwQm8Bb1AqsjxPmwj4f4",
  authDomain: "email-threat-detection-85358.firebaseapp.com",
  projectId: "email-threat-detection-85358",
  storageBucket: "email-threat-detection-85358.firebasestorage.app",
  messagingSenderId: "568345918952",
  appId: "1:568345918952:web:2a90147a76c97b3aacf85d",
  measurementId: "G-HWS32VKKBW",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);