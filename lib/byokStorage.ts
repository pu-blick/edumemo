const STORAGE_KEY = 'edumemo_user_gemini_key';

export function getUserApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY) || null;
}

export function setUserApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function removeUserApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
