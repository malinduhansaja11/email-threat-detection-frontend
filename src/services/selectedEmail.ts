const KEY = "selected_email_body";

export function saveSelectedEmailBody(body: string) {
  localStorage.setItem(KEY, body);
}

export function loadSelectedEmailBody(): string {
  return localStorage.getItem(KEY) || "";
}

export function clearSelectedEmailBody() {
  localStorage.removeItem(KEY);
}
