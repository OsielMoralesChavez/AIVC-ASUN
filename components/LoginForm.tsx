"use client";

import { useMemo, useState } from "react";
import { IconEye, IconEyeOff } from "./icons";
import { UnirLogo } from "./UnirLogo";
import { login } from "../services/authApi";
import { ApiError } from "../services/httpClient";
import { withBasePath } from "../utils/basePath";

const EMAIL_RE = /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@unir\.net$/i;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const emailError = touched && email.trim().length > 0 && !EMAIL_RE.test(email.trim()) ? "Usa tu correo institucional @unir.net." : null;
  const canSubmit = useMemo(() => EMAIL_RE.test(email.trim()) && password.length > 0 && !busy, [email, password, busy]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setBusy(true);
    setGeneralError(null);
    try {
      await login(email.trim(), password, remember);
      // Versión de escaparate: la marca de sesión vive en el navegador (no hay servidor que ponga
      // una cookie) y el destino lleva el prefijo del repositorio, porque en GitHub Pages el sitio
      // no cuelga de la raíz del dominio.
      window.sessionStorage.setItem("demo.sesion", "1");
      window.location.assign(withBasePath("/"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setGeneralError(err.message);
      } else if (err instanceof ApiError && err.status === 422) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Correo o contraseña incorrectos.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <h2 className="auth-hero-title">Asistente de gestión académica</h2>
        <p className="auth-hero-subtitle">Planea clases, genera material y da seguimiento a tus asignaturas desde un solo lugar.</p>
      </div>
      <div className="auth-card">
        <div className="auth-logo-row">
          <UnirLogo variant="on-dark" />
        </div>
        <h1 className="auth-title">Bienvenido de nuevo</h1>
        <p className="auth-subtitle">Inicia sesión con tu correo institucional para continuar.</p>

        {generalError && (
          <div className="banner banner-error" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="login-email">Correo institucional</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="nombre.apellido@unir.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={emailError ? "true" : undefined}
              aria-describedby={emailError ? "login-email-error" : undefined}
              disabled={busy}
              required
            />
            {emailError && (
              <span id="login-email-error" className="field-error">
                {emailError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="login-password">Contraseña</label>
            <div className="password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <div className="remember-row">
            <label htmlFor="login-remember">
              <input
                id="login-remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={busy}
              />
              Recordarme
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={!canSubmit} data-loading={busy || undefined}>
            <span className="btn-label" data-label="Iniciar sesión">
              Iniciar sesión
            </span>
          </button>
        </form>

        <p className="auth-footer">Acceso exclusivo para personal con correo @unir.net.</p>
      </div>
    </div>
  );
}
