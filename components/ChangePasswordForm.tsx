"use client";

import { useMemo, useState } from "react";
import { IconEye, IconEyeOff, IconCheck } from "./icons";
import { UnirLogo } from "./UnirLogo";
import { changePassword } from "../services/authApi";
import { ApiError } from "../services/httpClient";

interface Requirement {
  label: string;
  test: (value: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "Mínimo 10 caracteres", test: (v) => v.length >= 10 },
  { label: "Al menos una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Al menos una minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Al menos un número", test: (v) => /[0-9]/.test(v) },
  { label: "Al menos un carácter especial", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const failedRequirements = REQUIREMENTS.filter((r) => !r.test(newPassword));
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = failedRequirements.length === 0 && matches && !busy;

  const mismatchHint = useMemo(() => {
    if (confirmPassword.length === 0) return null;
    return matches ? null : "Las contraseñas no coinciden.";
  }, [confirmPassword, matches]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await changePassword(newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => {
        window.location.assign("/");
      }, 900);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo-row">
          <UnirLogo variant="on-dark" />
        </div>
        <h1 className="auth-title">{forced ? "Actualiza tu contraseña" : "Cambiar contraseña"}</h1>
        <p className="auth-subtitle">
          {forced
            ? "Por seguridad, la contraseña temporal solo funciona en tu primer acceso. Crea una nueva antes de continuar."
            : "Elige una nueva contraseña para tu cuenta."}
        </p>

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="banner banner-info" role="status">
            Contraseña actualizada. Entrando…
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="new-password">Nueva contraseña</label>
            <div className="password-field">
              <input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={busy || success}
                required
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPasswords((v) => !v)}
                aria-label={showPasswords ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                aria-pressed={showPasswords}
                tabIndex={-1}
              >
                {showPasswords ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            <ul className="password-requirements">
              {REQUIREMENTS.map((req) => {
                const met = req.test(newPassword);
                return (
                  <li key={req.label} data-met={met}>
                    <IconCheck aria-hidden />
                    {req.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="field-group">
            <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
            <input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={mismatchHint ? "true" : undefined}
              aria-describedby={mismatchHint ? "confirm-password-error" : undefined}
              disabled={busy || success}
              required
            />
            {mismatchHint && (
              <span id="confirm-password-error" className="field-error">
                {mismatchHint}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={!canSubmit || success}
            data-loading={busy || undefined}
          >
            <span className="btn-label" data-label="Guardar contraseña y continuar">
              Guardar contraseña y continuar
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
