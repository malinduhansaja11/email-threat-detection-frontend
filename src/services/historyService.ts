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
  type: "obfuscation" | "header" | "time" | "phishingLinks" | "fullScan";
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

  // new generic fields
  final_verdict?: string;
  final_risk_score?: number;
  final_is_threat?: boolean;
  final_reasons?: string[];
  failed_modules?: string[];
  risk_level?: string;
  confidence?: number;
  is_threat?: boolean;
  threat_type?: string;
  model_used?: string;
  details?: string[];
  scores?: Record<string, any>;
  temporal_flags?: string[];
  temporal_features?: Record<string, any>;
  urls?: string[];
  blocked_urls?: number;
  quarantine_urls?: number;
  warned_urls?: number;
  allowed_urls?: number;
  max_score?: number;
  module_summary?: Record<string, any>;
  obfuscation_result?: any;
  temporal_result?: any;
  header_result?: any;
  url_result?: any;
  raw_result?: any;

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
      ...raw,
      id: d.id,
      obf_tokens: raw.obf_tokens ?? [],
    };
  });
}

export async function deleteHistory(id: string) {
  await deleteDoc(doc(db, "analysis_history", id));
}