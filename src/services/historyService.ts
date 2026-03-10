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
  type: "obfuscation" | "header" | "time" | "phishingLinks";
  source: string;
  sender?: string;
  subject?: string;

  // obfuscation
  risk_score?: number;
  obf_tokens?: string[];

  // header
  spf?: string;
  dkim?: string;
  dmarc?: string;
  sender_domain?: string;
  header_count?: number;

  // time
  email_date?: string;
  body_preview?: string;

  // url
  url_count?: number;
  url_verdict?: string;

  created_at?: Timestamp | Date | any;
};

const collectionRef = collection(db, "analysis_history");

export async function saveHistory(data: Omit<HistoryItem, "id" | "created_at">) {
  await addDoc(collectionRef, {
    ...data,
    created_at: new Date(),
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  const q = query(collectionRef, orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const raw = d.data() as Omit<HistoryItem, "id">;
    return {
      id: d.id,
      type: raw.type,
      source: raw.source,
      sender: raw.sender,
      subject: raw.subject,
      risk_score: raw.risk_score,
      obf_tokens: raw.obf_tokens ?? [],
      spf: raw.spf,
      dkim: raw.dkim,
      dmarc: raw.dmarc,
      sender_domain: raw.sender_domain,
      header_count: raw.header_count,
      email_date: raw.email_date,
      body_preview: raw.body_preview,
      url_count: raw.url_count,
      url_verdict: raw.url_verdict,
      created_at: raw.created_at,
    };
  });
}

export async function deleteHistory(id: string) {
  await deleteDoc(doc(db, "analysis_history", id));
}