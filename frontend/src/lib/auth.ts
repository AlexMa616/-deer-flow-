const TOKEN_KEY = "deer-flow-token";
const USER_KEY = "deer-flow-user";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === "admin";
}

const API_BASE = "/api/auth";

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `请求失败 (${res.status})`);
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const data = await authFetch(`${API_BASE}/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAuth(data.access_token, data.user);
  return data;
}

export async function register(username: string, email: string, password: string) {
  const data = await authFetch(`${API_BASE}/register`, {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  setAuth(data.access_token, data.user);
  return data;
}

export async function fetchMe() {
  return authFetch(`${API_BASE}/me`);
}

export async function fetchAllUsers() {
  return authFetch(`${API_BASE}/admin/users`);
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  return authFetch(`${API_BASE}/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function updateUserRole(userId: number, role: string) {
  return authFetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export async function deleteUserById(userId: number) {
  return authFetch(`${API_BASE}/admin/users/${userId}`, { method: "DELETE" });
}

export function logout() {
  clearAuth();
  window.location.href = "/login";
}
