export type InboxSource = "gmail" | "demo" | null;

export const INBOX_MEM_CACHE: {
  emails: any[] | null;
  selectedEmailId: string | null;
  source: InboxSource;
  gmailConnected: boolean;
  scanResult: any | null;
} = {
  emails: null,
  selectedEmailId: null,
  source: null,
  gmailConnected: false,
  scanResult: null,
};

export function clearInboxMemoryCache() {
  INBOX_MEM_CACHE.emails = null;
  INBOX_MEM_CACHE.selectedEmailId = null;
  INBOX_MEM_CACHE.source = null;
  INBOX_MEM_CACHE.gmailConnected = false;
  INBOX_MEM_CACHE.scanResult = null;
}