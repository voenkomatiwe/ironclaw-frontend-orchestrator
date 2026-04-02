export const POLYMARKET_AUTH_TOKEN_KEY = "polymarket-copy-bot:token";

export function getAuthToken(): string | null {
  return localStorage.getItem(POLYMARKET_AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(POLYMARKET_AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(POLYMARKET_AUTH_TOKEN_KEY);
}

function redirectToAddonAuth(): void {
  const path = window.location.pathname;
  const idx = path.indexOf("/start/");
  if (idx !== -1) {
    window.location.href = `${path.slice(0, idx)}/start/auth`;
    return;
  }
  window.location.href = "/auth";
}

export { redirectToAddonAuth };
