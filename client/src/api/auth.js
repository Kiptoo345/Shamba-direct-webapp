// Lightweight session helper. Stores the logged-in user's public profile
// (as returned by POST /api/auth/login) in localStorage so the Dashboard
// can tell who is signed in across page refreshes.

const STORAGE_KEY = 'shambaDirectUser';

export function saveSession(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
