import type { EmailItem } from "../types/email";
import { apiJson } from "./apiClient";

export async function getEmails(): Promise<EmailItem[]> {
  return apiJson<EmailItem[]>("/emails");
}

export async function seedEmails(): Promise<{ status: string; count: number }> {
  return apiJson<{ status: string; count: number }>("/emails/seed", {
    method: "POST",
  });
}

export async function getGmailEmails(): Promise<{
  connected: boolean;
  emails: EmailItem[];
}> {
  return apiJson<{
    connected: boolean;
    emails: EmailItem[];
  }>("/emails/gmail");
}