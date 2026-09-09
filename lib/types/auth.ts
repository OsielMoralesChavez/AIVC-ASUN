export type ThemeMode = "light" | "dark" | "system";
export type ColorPalette = "default" | "corporate" | "red" | "burgundy";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarDataUrl: string | null;
  mustChangePassword: boolean;
  themeMode: ThemeMode;
  colorPalette: ColorPalette;
  createdAt: string;
  updatedAt: string;
}

/** Vista pública del usuario — nunca incluye `passwordHash`. Es lo único que sale de la API. */
export type PublicUser = Omit<AuthUser, "passwordHash">;

export function toPublicUser(user: AuthUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
