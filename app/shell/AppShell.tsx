"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BackgroundJobsProvider } from "../../components/BackgroundJobsProvider";
import { Sidebar, type AppSection } from "../../components/Sidebar";
import { Topbar } from "../../components/Topbar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useTheme } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { CalificadorPage } from "../../views/CalificadorPage";
import { CatadorClasesPage } from "../../views/CatadorClasesPage";
import { CursosActualizacionPage } from "../../views/CursosActualizacionPage";
import { CursoSelloPage } from "../../views/CursoSelloPage";
import { DashboardPage } from "../../views/DashboardPage";
import { IncidenciasPage } from "../../views/IncidenciasPage";
import { MateriasPage } from "../../views/MateriasPage";
import { TrainingPage } from "../../views/TrainingPage";
import { ConfiguracionPage } from "../../views/ConfiguracionPage";
import { InvestigacionAsistidaPage } from "../../views/InvestigacionAsistidaPage";
import { MateriaDetailPage } from "../../views/MateriaDetailPage";
import { MateriaEditPage } from "../../views/MateriaEditPage";
import { ManualPage } from "../../views/ManualPage";

/** Debe coincidir con el breakpoint del drawer en app/globals.css. */
const MOBILE_QUERY = "(max-width: 768px)";

export function AppShell() {
  const [section, setSection] = useState<AppSection>("dashboard");
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const appearance = useTheme();
  const { user, setUser } = useCurrentUser();
  /** En móvil el sidebar es un drawer superpuesto; en escritorio se contrae. El mismo botón del
   * topbar hace lo que corresponde según el ancho, en vez de tener dos disparadores distintos. */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  /** Materia abierta desde el Dashboard, en modo lectura o edición. Navegación SPA: el sidebar y
   * el topbar conservan su estado. */
  const [materiaView, setMateriaView] = useState<{ id: string; mode: "view" | "edit" } | null>(null);
  /** Cambia al guardar/eliminar para que el Dashboard vuelva a pedir sus métricas al backend. */
  const [dashboardVersion, setDashboardVersion] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Al pasar a escritorio, un drawer que quedara abierto dejaría el scroll de fondo bloqueado.
  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  const toggleNav = useCallback(() => {
    if (isMobile) {
      setMobileNavOpen((prev) => !prev);
      return;
    }
    toggleCollapsed();
  }, [isMobile, toggleCollapsed]);

  /** Identidad estable: el efecto del drawer (foco atrapado, Escape, bloqueo de scroll) la lleva
   * en sus dependencias — si cambiara en cada render, el efecto se reiniciaría continuamente y
   * el foco no volvería nunca al botón que lo abrió. */
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  // Una sola vez por sesión: aplica el modo/paleta guardados en la cuenta en cuanto se conocen,
  // sin sobrescribir después si el usuario los cambia localmente en lo que resta de la visita.
  const syncedRef = useRef(false);
  useEffect(() => {
    if (user && !syncedRef.current) {
      syncedRef.current = true;
      appearance.setThemeMode(user.themeMode);
      appearance.setPalette(user.colorPalette);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    // El proveedor envuelve TODO el shell: sigue el progreso de las generaciones aunque el
    // asistente que las lanzó ya no esté montado, que es lo que permite navegar mientras corren.
    <BackgroundJobsProvider>
    <div className="app-layout">
      <Sidebar
        active={section}
        onSelect={(next) => {
          setMateriaView(null);
          setSection(next);
        }}
        collapsed={collapsed}
        mobileOpen={mobileNavOpen}
        onCloseMobile={closeMobileNav}
      />
      <div className="app-content">
        <Topbar
          collapsed={collapsed}
          navExpanded={isMobile ? mobileNavOpen : !collapsed}
          navIsDrawer={isMobile}
          onToggleSidebar={toggleNav}
          theme={appearance.theme}
          onToggleTheme={appearance.toggleTheme}
          themeMode={appearance.themeMode}
          onThemeModeChange={appearance.setThemeMode}
          palette={appearance.palette}
          onPaletteChange={appearance.setPalette}
          user={user}
          onUserChange={setUser}
          onOpenSettings={() => setSection("configuracion")}
          onOpenResearch={() => setSection("investigacion")}
          onOpenManual={() => {
            setMateriaView(null);
            setSection("manual");
          }}
          onOpenSection={(next) => {
            setMateriaView(null);
            setSection(next);
          }}
        />
        <main className="app-main">
          {section === "dashboard" && !materiaView && (
            <DashboardPage
              key={dashboardVersion}
              onView={(id) => setMateriaView({ id, mode: "view" })}
              onEdit={(id) => setMateriaView({ id, mode: "edit" })}
              onCreateMateria={() => setSection("materias")}
            />
          )}
          {section === "dashboard" && materiaView?.mode === "view" && (
            <MateriaDetailPage
              materiaId={materiaView.id}
              onBack={() => setMateriaView(null)}
              onEdit={(id) => setMateriaView({ id, mode: "edit" })}
            />
          )}
          {section === "dashboard" && materiaView?.mode === "edit" && (
            <MateriaEditPage
              materiaId={materiaView.id}
              onBack={() => setMateriaView(null)}
              onSaved={() => setDashboardVersion((v) => v + 1)}
              onOpenMaterias={() => {
                setMateriaView(null);
                setSection("materias");
              }}
            />
          )}
          {section === "entrenamiento" && <TrainingPage />}
          {section === "materias" && <MateriasPage />}
          {section === "curso-sello" && <CursoSelloPage />}
          {section === "catador-clases" && <CatadorClasesPage />}
          {section === "cursos-actualizacion" && <CursosActualizacionPage />}
          {section === "calificador" && (
            <CalificadorPage
              onOpenSettings={() => setSection("configuracion")}
              onOpenTraining={() => setSection("entrenamiento")}
            />
          )}
          {section === "incidencias" && <IncidenciasPage />}
          {section === "configuracion" && <ConfiguracionPage />}
          {section === "investigacion" && (
            <InvestigacionAsistidaPage onOpenSettings={() => setSection("configuracion")} />
          )}
          {section === "manual" && (
            <ManualPage
              onOpenSection={(next) => {
                setMateriaView(null);
                setSection(next);
              }}
            />
          )}
        </main>
      </div>
    </div>
    </BackgroundJobsProvider>
  );
}
