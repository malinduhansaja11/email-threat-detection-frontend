
import type { EmailItem } from "../types/email";

const API_BASE = "http://localhost:8000";

export async function getEmails(): Promise<EmailItem[]> {
  const res = await fetch(`${API_BASE}/emails`);
  if (!res.ok) throw new Error("Failed to fetch demo emails");
  return res.json();
}

export async function seedEmails(): Promise<{ status: string; count: number }> {
  const res = await fetch(`${API_BASE}/emails/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed emails");
  return res.json();
}

export async function getGmailEmails(): Promise<{ connected: boolean; emails: EmailItem[] }> {
  const res = await fetch(`${API_BASE}/emails/gmail`);
  if (!res.ok) throw new Error("Failed to fetch Gmail emails");
  return res.json();
}



