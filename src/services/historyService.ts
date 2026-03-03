import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

export type HistoryItem = {
  id: string;
  source: string;
  sender?: string;
  subject?: string;
  risk_score: number;
  obf_tokens: string[];
  created_at?: Timestamp | Date | any;
};

const collectionRef = collection(db, "analysis_history");

export async function saveHistory(data: {
  source: string;
  sender?: string;
  subject?: string;
  risk_score: number;
  obf_tokens: string[];
}) {
  await addDoc(collectionRef, {
    ...data,
    created_at: new Date(), // simple timestamp (ok for now)
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  const q = query(collectionRef, orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const raw = d.data() as Omit<HistoryItem, "id">;
    return {
      id: d.id,
      source: raw.source,
      sender: raw.sender,
      subject: raw.subject,
      risk_score: raw.risk_score ?? 0,
      obf_tokens: raw.obf_tokens ?? [],
      created_at: raw.created_at,
    };
  });
}

export async function deleteHistory(id: string) {
  await deleteDoc(doc(db, "analysis_history", id));
}