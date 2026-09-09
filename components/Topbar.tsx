"use client";

import { useEffect, useRef, useState } from "react";
import type { Theme } from "../hooks/useTheme";
import { logout as logoutRequest, type PublicUser, type ThemeMode, type ColorPalette } from "../services/authApi";
import {
  IconBookHelp,
  IconChevronDown,
  IconIdCard,
  IconLock,
  IconLogout,
  IconMenu,
  IconMoon,
  IconPalette,
  IconSettings,
  IconSparkleSearch,
  IconSun,
  IconTrophy,
  IconUser,
} from "./icons";
import { ProfilePersonalizationModal } from "./ProfilePersonalizationModal";
import { BackgroundJobsIndicator } from "./BackgroundJobsIndicator";
import type { AppSection } from "./Sidebar";

interface TopbarProps {
  collapsed: boolean;
  /** Estado real de la navegación: drawer abierto en móvil, sidebar expandido en escritorio. */
  navExpanded: boolean;
  /** `true` cuando el sidebar se comporta como drawer (móvil) — cambia la etiqueta del botón. */
  navIsDrawer: boolean;
  onToggleSidebar: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  palette: ColorPalette;
  onPaletteChange: (palette: ColorPalette) => void;
  user: PublicUser | null;
  onUserChange: (user: PublicUser) => void;
  /** Abre la página global de Configuración. Antes esta entrada abría un modal con solo los
   * campos de IA; ahora lleva a la página única que reúne todos los ajustes. */
  onOpenSettings: () => void;
  /** Abre la sección Investigación asistida por IA. */
  onOpenResearch: () => void;
  /** Abre el Manual de usuario. */
  onOpenManual: () => void;
  /** Navega a una sección cualquiera — lo usa el indicador de generaciones en segundo plano
   * para volver a la pantalla que lanzó el trabajo. */
  onOpenSection: (section: AppSection) => void;
}

/** "Investigación asistida por IA" y "Manual de usuario" salieron de aquí: ya son secciones
 * funcionales con su propio botón activo (ver más abajo), no herramientas futuras. */
const UPCOMING_TOOLS = [{ id: "gamificacion", label: "Gamificación", icon: IconTrophy }] as const;

function UpcomingToolButton({ label, Icon }: { label: string; Icon: (typeof UPCOMING_TOOLS)[number]["icon"] }) {
  const [hint, setHint] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        className="btn btn-text topbar-upcoming-btn topbar-tool-swap"
        onFocus={() => setHint(true)}
        onBlur={() => setHint(false)}
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
        onClick={() => setHint((v) => !v)}
        aria-describedby={`upcoming-${label}`}
      >
        <span className="topbar-tool-stack">
          <span className="topbar-tool-text">{label}</span>
          <span className="topbar-tool-icon" aria-hidden>
            <Icon aria-hidden />
          </span>
        </span>
      </button>
      {hint && (
        <span
          id={`upcoming-${label}`}
          role="tooltip"
          className="field-hint"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "0.3rem",
            background: "var(--color-surface)",
            boxShadow: "var(--neu-2)",
            borderRadius: "var(--radius-sm)",
            padding: "0.4rem 0.6rem",
            whiteSpace: "nowrap",
            zIndex: 50,
          }}
        >
          Esta herramienta estará disponible próximamente.
        </span>
      )}
    </div>
  );
}

export function Topbar({
  collapsed,
  navExpanded,
  navIsDrawer,
  onToggleSidebar,
  theme,
  onToggleTheme,
  themeMode,
  onThemeModeChange,
  palette,
  onPaletteChange,
  user,
  onUserChange,
  onOpenSettings,
  onOpenResearch,
  onOpenManual,
  onOpenSection,
}: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Recarga completa (no el router de cliente): cierre de sesión y cambio de contraseña son
  // transiciones de contexto de seguridad — deben limpiar por completo el árbol de componentes
  // en memoria y forzar que `app/(app)/layout.tsx` reevalúe la sesión desde cero en el servidor,
  // no solo re-pintar. También evita depender de que exista un `<AppRouter>` montado alrededor
  // de Topbar (útil para las pruebas existentes que renderizan Topbar de forma aislada).
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutRequest();
    } finally {
      window.location.assign("/login");
    }
  }

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : null;

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn icon-btn-menu"
          data-collapsed={collapsed}
          onClick={onToggleSidebar}
          aria-controls="sidebar-nav-wrap"
          aria-expanded={navExpanded}
          aria-label={
            navIsDrawer
              ? navExpanded
                ? "Cerrar menú de navegación"
                : "Abrir menú de navegación"
              : navExpanded
                ? "Colapsar barra lateral"
                : "Expandir barra lateral"
          }
        >
          <IconMenu />
        </button>
      </div>

      <nav className="topbar-center" aria-label="Herramientas futuras">
        {/* Una sola superficie elevada para las tres herramientas, con UNA insignia general al
            final — repetir "Próximamente" tres veces era ruido, y tres elevaciones sueltas
            competían con la cápsula de cuenta y el botón de menú. */}
        <div className="topbar-tools">
          {/* Herramientas ACTIVAS: navegan a su sección. Llevan `topbar-tool-active` para que se
              lean como los controles reales que son — la que aún no existe queda un escalón por
              debajo, en gris apagado, en vez de competir de tú a tú con ellas. */}
          <button type="button" className="btn btn-text topbar-upcoming-btn topbar-tool-active" onClick={onOpenResearch}>
            <IconSparkleSearch aria-hidden />
            <span className="btn-label" data-label="Investigación asistida por IA">
              Investigación asistida por IA
            </span>
          </button>
          <button type="button" className="btn btn-text topbar-upcoming-btn topbar-tool-active" onClick={onOpenManual}>
            <IconBookHelp aria-hidden />
            <span className="btn-label" data-label="Manual de usuario">
              Manual de usuario
            </span>
          </button>
          <span className="topbar-tools-divider" aria-hidden />
          {UPCOMING_TOOLS.map((tool) => (
            <UpcomingToolButton key={tool.id} label={tool.label} Icon={tool.icon} />
          ))}
          <span className="badge badge-warn topbar-tools-badge">Próximamente</span>
        </div>
      </nav>

      <div className="topbar-right">
        {/* Solo aparece cuando hay una generación viva o recién terminada. */}
        <BackgroundJobsIndicator onOpenSection={onOpenSection} />

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-pressed={theme === "dark"}
        >
          <span className="icon-btn-icon" key={theme}>
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </span>
        </button>

        {/* Separador tenue: el conmutador de tema es una preferencia de la app y la cápsula de
            cuenta es la identidad de quien la usa — dos cosas distintas pegadas se leían como un
            mismo grupo de controles. */}
        <span className="topbar-right-divider" aria-hidden />

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-menu-trigger"
            ref={triggerRef}
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-controls="user-menu-dropdown"
          >
            <span className="user-avatar">
              {user?.avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarDataUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : initials ? (
                <span aria-hidden style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                  {initials}
                </span>
              ) : (
                <IconUser />
              )}
            </span>
            <span className="user-menu-identity">
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user?.displayName ?? "Cuenta"}</span>
              {user?.email && <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{user.email}</span>}
            </span>
            <IconChevronDown />
          </button>

          {userMenuOpen && (
            <div id="user-menu-dropdown" className="dropdown-menu" role="menu" aria-label="Menú de usuario">
              {/* Duplicado a propósito de .topbar-center: en pantallas angostas esa franja se
                  oculta (ver media query en globals.css) y esta es la única vía que queda para
                  llegar a las herramientas "próximamente" — nunca deben quedar sin acceso. */}
              <div className="topbar-center-mobile-only" style={{ display: "none" }}>
                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenResearch();
                  }}
                >
                  <IconSparkleSearch />
                  Investigación asistida por IA
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenManual();
                  }}
                >
                  <IconBookHelp />
                  Manual de usuario
                </button>
                {UPCOMING_TOOLS.map((tool) => (
                  <span key={tool.id} className="dropdown-item" role="menuitem" aria-disabled="true" style={{ cursor: "default" }}>
                    <tool.icon />
                    {tool.label}
                    <span className="badge badge-warn" style={{ marginLeft: "auto" }}>
                      Próximamente
                    </span>
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  setPersonalizeOpen(true);
                }}
              >
                <IconIdCard />
                Mi perfil
              </button>
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  setPersonalizeOpen(true);
                }}
              >
                <IconPalette />
                Personalizar perfil
              </button>
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  window.location.assign("/cambiar-password");
                }}
              >
                <IconLock />
                Cambiar contraseña
              </button>
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenSettings();
                }}
              >
                <IconSettings />
                Configuración
              </button>
              <button type="button" className="dropdown-item" role="menuitem" disabled={loggingOut} onClick={handleLogout}>
                <IconLogout />
                {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
            </div>
          )}
        </div>
      </div>

      {personalizeOpen && user && (
        <ProfilePersonalizationModal
          user={user}
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          palette={palette}
          onPaletteChange={onPaletteChange}
          onClose={() => setPersonalizeOpen(false)}
          onSaved={onUserChange}
        />
      )}
    </header>
  );
}
