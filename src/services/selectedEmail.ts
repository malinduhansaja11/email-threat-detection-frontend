export type SelectedEmail = {
  id?: string;
  sender?: string;
  subject?: string;
  body?: string;
  date?: string;
  received_at?: string;
  sender_domain?: string;
  headers?: Record<string, string>;
  spf?: string;
  dkim?: string;
  dmarc?: string;
  attachments?: {
    filename: string;
    mimeType?: string;
    attachment_id?: string;
  }[];
};

const KEY = "selected_email";

export function saveSelectedEmail(email: SelectedEmail) {
  localStorage.setItem(KEY, JSON.stringify(email));
}

export function loadSelectedEmail(): SelectedEmail | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSelectedEmail() {
  localStorage.removeItem(KEY);
}