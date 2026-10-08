import { useSyncExternalStore } from 'react';

// Bearer token pasted by the user on the sign-in screen. Kept in sessionStorage so a
// page reload doesn't sign the user out, but closing the tab does. Replaced by the
// OIDC (PKCE) login later; callers only use getAccessToken/setToken/clearToken.
const KEY = 'chatai.token';
const listeners = new Set<() => void>();

let token: string | null = read();

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function write(value: string | null) {
  token = value;
  try {
    if (value) sessionStorage.setItem(KEY, value);
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable: token lives in memory only
  }
  listeners.forEach((l) => l());
}

export const setToken = (value: string) => write(value);
export const clearToken = () => write(null);

export function getAccessToken(): string {
  if (!token) throw new Error('Not signed in');
  return token;
}

export function useToken(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => token,
  );
}
