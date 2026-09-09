"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Liquid } from "liquid-gooey";
import {
  IconAlertTriangle,
  IconCalendarClock,
  IconChevronDown,
  IconDashboard,
  IconMenu,
  IconPresentation,
  IconQuiz,
  IconSeal,
  IconTraining,
  IconVideoBook,
} from "./icons";
import { UnirLogo } from "./UnirLogo";
import type { ComponentType, SVGProps } from "react";

/** `configuracion`, `investigacion` y `manual` no están en el sidebar: se abren desde el topbar
 * o el menú de cuenta, pero son secciones de pleno derecho del contenido principal. */
export type AppSection =
  | "dashboard"
  | "entrenamiento"
  | "materias"
  | "curso-sello"
  | "catador-clases"
  | "cursos-actualizacion"
  | "calificador"
  | "incidencias"
  | "configuracion"
  | "investigacion"
  | "manual";

interface SidebarItem {
  id: AppSection;
  label: string;
  /** Una línea corta, nunca una frase: el subtítulo orienta, no explica. Lo largo iba a tres
   * líneas y hacía que ocho entradas se leyeran como un muro de texto. */
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface SidebarGroup {
  id: string;
  title: string;
  items: SidebarItem[];
}

/**
 * Las secciones se agrupan por lo que el docente viene a HACER, no por cuándo se construyeron:
 * preparar clase, evaluar, formarse, y el cajón de sistema. Cada grupo se pliega para que quien
 * solo usa una parte de la app no cargue con las otras tres en pantalla.
 */
const GROUPS: SidebarGroup[] = [
  {
    id: "docencia",
    title: "Docencia",
    items: [
      { id: "dashboard", label: "Dashboard clases", description: "Resumen y histórico", icon: IconDashboard },
      // El entrenamiento de voz vivía en "Formación", junto a los cursos de actualización, pero no
      // es formación del docente: es lo que define el tono con el que se generan SUS clases, así
      // que pertenece al mismo grupo donde se preparan.
      { id: "entrenamiento", label: "Entrenamiento", description: "Tono de voz y datos", icon: IconTraining },
      { id: "materias", label: "Asignaturas", description: "Clases y banco de preguntas", icon: IconPresentation },
      { id: "curso-sello", label: "Curso sello", description: "Asignaturas A, B y C", icon: IconSeal },
    ],
  },
  {
    id: "evaluacion",
    title: "Evaluación",
    items: [
      { id: "calificador", label: "Calificador", description: "Trabajos contra rúbrica", icon: IconQuiz },
      { id: "catador-clases", label: "Catador de clases", description: "Videos contra rúbrica", icon: IconCalendarClock },
    ],
  },
  {
    id: "formacion",
    title: "Formación",
    items: [
      { id: "cursos-actualizacion", label: "Cursos de actualización", description: "Herramientas de IA", icon: IconVideoBook },
    ],
  },
  {
    id: "sistema",
    title: "Sistema",
    items: [{ id: "incidencias", label: "Incidencias", description: "Reporte y seguimiento", icon: IconAlertTriangle }],
  },
];

/** Grupo al que pertenece cada sección, para poder desplegarlo cuando se navega a ella. */
const GROUP_OF = new Map<AppSection, string>(
  GROUPS.flatMap((group) => group.items.map((item) => [item.id, group.id] as const))
);

interface SidebarProps {
  active: AppSection;
  onSelect: (section: AppSection) => void;
  collapsed: boolean;
  /** Solo aplica por debajo del breakpoint móvil: el sidebar se comporta como drawer. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface IndicatorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Sidebar({ active, onSelect, collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Partial<Record<AppSection, HTMLLIElement | null>>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
  const drawerRef = useRef<HTMLElement>(null);
  /** Todos abiertos de inicio: plegar es una decisión del usuario, no un estado que la app le
   * imponga escondiéndole la mitad del menú en el primer arranque. */
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  // Navegar a una sección desde fuera del sidebar (p. ej. el botón del Dashboard que lleva a
  // Asignaturas) despliega su grupo: si no, el indicador marcaría una entrada invisible.
  useEffect(() => {
    const group = GROUP_OF.get(active);
    if (!group) return;
    setClosedGroups((prev) => {
      if (!prev.has(group)) return prev;
      const next = new Set(prev);
      next.delete(group);
      return next;
    });
  }, [active]);

  /**
   * Mientras el drawer está abierto: se cierra con Escape, el foco queda atrapado dentro (Tab y
   * Shift+Tab hacen ciclo) y el contenido de fondo no se desplaza. Al cerrarse, el foco vuelve
   * al elemento que lo abrió — el botón de menú del topbar.
   */
  useEffect(() => {
    if (!mobileOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? []
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseMobile();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [mobileOpen, onCloseMobile]);

  useLayoutEffect(() => {
    const measure = () => {
      const container = navRef.current;
      const item = itemRefs.current[active];
      // Secciones que no viven en el sidebar (Configuración, Investigación, Manual): el
      // indicador se retira en vez de quedarse marcando la última entrada visitada, que
      // afirmaría que estás en una sección en la que ya no estás.
      if (!container || !item) {
        setIndicator(null);
        return;
      }
      const containerBox = container.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();
      setIndicator({
        x: itemBox.left - containerBox.left,
        y: itemBox.top - containerBox.top,
        width: itemBox.width,
        height: itemBox.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (navRef.current) observer.observe(navRef.current);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
    // mobileOpen entra en las dependencias porque abrir/cerrar el menú en móvil cambia el
    // layout (el panel de navegación aparece/desaparece) y el indicador debe remedirse.
    // closedGroups también: plegar un grupo desplaza verticalmente todo lo que hay debajo.
  }, [active, collapsed, mobileOpen, closedGroups]);

  const handleSelect = (id: AppSection) => {
    onSelect(id);
    onCloseMobile();
  };

  const toggleGroup = (id: string) => {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {/* Capa superpuesta: cierra el drawer al tocar fuera. Solo visible en móvil (CSS). */}
      <div
        className="sidebar-overlay"
        data-open={mobileOpen}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <nav
        ref={drawerRef}
        className="sidebar"
        data-collapsed={collapsed}
        data-mobile-open={mobileOpen}
        aria-label="Secciones de la aplicación"
      >
      <div className="sidebar-brand-block">
        <UnirLogo variant="on-dark" className="sidebar-logo" />
        <div className="sidebar-brand">Asistente de gestión académica</div>
        <div className="sidebar-brand-divider" aria-hidden="true" />
      </div>
      <div className="sidebar-nav-wrap" id="sidebar-nav-wrap">
        <Liquid className="sidebar-liquid-group" fill="var(--color-secondary)" blur={5} contrast={22} aria-hidden="true">
          {indicator && (
            <Liquid.Item effect="move" move={{ springiness: 0.55, trail: 0.5 }}>
              <div
                className="sidebar-indicator"
                style={{
                  transform: `translate(${indicator.x}px, ${indicator.y}px)`,
                  width: indicator.width,
                  height: indicator.height,
                }}
              />
            </Liquid.Item>
          )}
        </Liquid>
        <div className="sidebar-nav" ref={navRef}>
          {GROUPS.map((group) => {
            // Con el sidebar contraído solo se ven iconos: no hay dónde poner el título ni cómo
            // saber qué grupo está plegado, así que ahí se muestran siempre todas las entradas.
            const open = collapsed || !closedGroups.has(group.id);
            return (
              <section className="sidebar-group" key={group.id}>
                <h2 className="sidebar-group-heading">
                  <button
                    type="button"
                    className="sidebar-group-toggle"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={open}
                    aria-controls={`sidebar-group-${group.id}`}
                  >
                    <span className="sidebar-group-title">{group.title}</span>
                    <span className="sidebar-group-caret" data-open={open} aria-hidden>
                      <IconChevronDown />
                    </span>
                  </button>
                </h2>
                <ul className="sidebar-group-items" id={`sidebar-group-${group.id}`} hidden={!open}>
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[item.id] = el;
                      }}
                    >
                      <button
                        type="button"
                        className="sidebar-link"
                        data-active={active === item.id}
                        aria-current={active === item.id ? "page" : undefined}
                        onClick={() => handleSelect(item.id)}
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                      >
                        <span className="sidebar-link-icon">
                          <item.icon />
                        </span>
                        <span className="sidebar-link-text">
                          <span className="sidebar-link-label">{item.label}</span>
                          <span className="sidebar-link-desc">{item.description}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
        {/* Cierre explícito del drawer (además de Escape y de tocar fuera). Solo en móvil. */}
        <button type="button" className="sidebar-mobile-close" onClick={onCloseMobile}>
          <IconMenu aria-hidden />
          <span>Cerrar menú</span>
        </button>
      </nav>
    </>
  );
}
