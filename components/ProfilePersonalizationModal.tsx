"use client";

import { useRef, useState } from "react";
import { IconUser } from "./icons";
import { updateProfile, type PublicUser, type ThemeMode, type ColorPalette } from "../services/authApi";
import { ApiError } from "../services/httpClient";

interface Props {
  user: PublicUser;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  palette: ColorPalette;
  onPaletteChange: (palette: ColorPalette) => void;
  onClose: () => void;
  onSaved: (user: PublicUser) => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: "light", label: "Claro", hint: "Fondos claros, siempre." },
  { value: "dark", label: "Oscuro", hint: "Fondos oscuros, siempre." },
  { value: "system", label: "Del sistema", hint: "Sigue la preferencia de tu equipo." },
];

const PALETTE_OPTIONS: { value: ColorPalette; label: string; hint: string; swatch: string }[] = [
  { value: "default", label: "Paleta original", hint: "Azul institucional de la app.", swatch: "#2e75b6" },
  { value: "corporate", label: "Paleta corporativa", hint: "Negro/dorado, tono UNIR.", swatch: "#b8863a" },
  { value: "red", label: "Paleta roja", hint: "Negro/rojo, alto contraste.", swatch: "#c2123f" },
  { value: "burgundy", label: "Paleta vino", hint: "Negro/borgoña, elegante.", swatch: "#7a0620" },
];

const MAX_AVATAR_BYTES = 600_000;

export function ProfilePersonalizationModal({
  user,
  themeMode,
  onThemeModeChange,
  palette,
  onPaletteChange,
  onClose,
  onSaved,
}: Props) {
  const initialThemeMode = useRef(themeMode).current;
  const initialPalette = useRef(palette).current;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(user.avatarDataUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("La imagen es muy grande. Usa una de menos de 600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleCancel() {
    onThemeModeChange(initialThemeMode);
    onPaletteChange(initialPalette);
    onClose();
  }

  function handleReset() {
    setDisplayName(user.displayName);
    setAvatarDataUrl(user.avatarDataUrl);
    setAvatarError(null);
    onThemeModeChange(user.themeMode);
    onPaletteChange(user.colorPalette);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const { user: updated } = await updateProfile({
        displayName: displayName.trim() || user.displayName,
        avatarDataUrl,
        themeMode,
        colorPalette: palette,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="personalize-heading">
        <h2 id="personalize-heading">Personalizar perfil</h2>

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        <div className="field-group">
          <span className="field-legend">Información personal</span>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
            <span className="user-avatar" style={{ width: "3rem", height: "3rem" }}>
              {avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarDataUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <IconUser />
              )}
            </span>
            <div>
              <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                <span className="btn-label" data-label="Cambiar imagen">
                  Cambiar imagen
                </span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
              {avatarError && <span className="field-error">{avatarError}</span>}
            </div>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="display-name">Nombre para mostrar</label>
          <input id="display-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120} />
        </div>

        <div className="field-group">
          <label>Correo institucional</label>
          <input type="email" value={user.email} disabled readOnly />
        </div>

        <div className="field-group">
          <span className="field-legend">Modo visual</span>
          <div className="option-grid">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="option-card"
                data-selected={themeMode === opt.value}
                onClick={() => onThemeModeChange(opt.value)}
                aria-pressed={themeMode === opt.value}
              >
                <h3>{opt.label}</h3>
                <p>{opt.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-legend">Paleta de colores</span>
          <div className="option-grid">
            {PALETTE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="option-card"
                data-selected={palette === opt.value}
                onClick={() => onPaletteChange(opt.value)}
                aria-pressed={palette === opt.value}
              >
                <span
                  aria-hidden
                  style={{ display: "inline-block", width: "1.4rem", height: "1.4rem", borderRadius: "50%", background: opt.swatch, marginBottom: "0.4rem" }}
                />
                <h3>{opt.label}</h3>
                <p>{opt.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="actions-row">
          <button type="button" className="btn btn-text" onClick={handleReset} disabled={busy}>
            <span className="btn-label" data-label="Restablecer valores">
              Restablecer valores
            </span>
          </button>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={busy}>
              <span className="btn-label" data-label="Cancelar">
                Cancelar
              </span>
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy} data-loading={busy || undefined}>
              <span className="btn-label" data-label="Guardar cambios">
                Guardar cambios
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
