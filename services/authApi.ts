import { handleJsonResponse, apiFetch } from "./httpClient";
import type { PublicUser, ThemeMode, ColorPalette } from "../lib/types/auth";

export type { PublicUser, ThemeMode, ColorPalette };

export async function login(email: string, password: string, remember: boolean): Promise<{ user: PublicUser }> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, remember }),
  });
  return handleJsonResponse(res);
}

export async function logout(): Promise<void> {
  const res = await apiFetch("/api/auth/logout", { method: "POST" });
  await handleJsonResponse(res);
}

export async function fetchCurrentUser(): Promise<{ user: PublicUser | null }> {
  const res = await apiFetch("/api/auth/me");
  return handleJsonResponse(res);
}

export async function changePassword(newPassword: string, confirmPassword: string): Promise<void> {
  const res = await apiFetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword, confirmPassword }),
  });
  await handleJsonResponse(res);
}

export async function updateProfile(fields: {
  displayName?: string;
  avatarDataUrl?: string | null;
  themeMode?: ThemeMode;
  colorPalette?: ColorPalette;
}): Promise<{ user: PublicUser }> {
  const res = await apiFetch("/api/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleJsonResponse(res);
}
