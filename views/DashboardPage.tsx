"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Banner } from "../components/Banner";
import { TrashIcon } from "../components/TrashIcon";
import {
  IconBookHelp,
  IconCalendarClock,
  IconCheck,
  IconEye,
  IconPencil,
  IconPlus,
  IconPresentation,
  IconQuiz,
  IconSeal,
  IconTrophy,
} from "../components/icons";
import { getDashboardSummary, getMateriaCounts, type DashboardSummary, type MateriaResourceCounts } from "../services/dashboardApi";
import { BarChart, type SeriesPoint } from "../components/dashboard/DashboardCharts";
import { useMaterias } from "../hooks/useMaterias";
import { listAllPresentations } from "../services/api";
import { usePrimaryCardForeground } from "../hooks/usePrimaryCardForeground";
import { DECK_TYPE_LABELS, type UnirDeckType } from "../types/unir";

/** Icono por tipo de clase para la lista de "Actividad reciente" — puramente decorativo, mismo
 * set de iconos ya usado en el resto de la app (sin inventar uno nuevo por tipo). */
const DECK_TYPE_ICONS: Record<UnirDeckType, ComponentType<SVGProps<SVGSVGElement>>> = {
  "primera-clase": IconSeal,
  normal: IconCalendarClock,
  repaso: IconBookHelp,
  actividad: IconQuiz,
  solucion: IconCheck,
};

/**
 * Dashboard modular sobre una retícula de 12 columnas. TODO lo que muestra sale de datos reales
 * del sistema (materias, presentaciones con su fecha y tipo, bancos de preguntas) — no hay
 * porcentajes de tendencia inventados ni métricas de relleno.
 *
 * Limitación honesta: el modelo de datos no guarda "clases planificadas" por materia, así que el
 * progreso se expresa como número de clases generadas y no como porcentaje. Inventar un
 * denominador daría un avance falso.
 */
interface PresentationRow {
  id: string;
  deckType: string;
  title: string;
  createdAt: string;
}

export function DashboardPage({
  onView,
  onEdit,
  onCreateMateria,
}: {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  /** Navega a "Asignaturas" — usado por el botón del estado vacío de la tarjeta de asignaturas. */
  onCreateMateria: () => void;
}) {
  const materias = useMaterias();
  const [presentations, setPresentations] = useState<PresentationRow[] | null>(null);
  const [presentationsError, setPresentationsError] = useState(false);
  const [query, setQuery] = useState("");
  /** Métricas y gráfica vienen SIEMPRE del backend (ver services/dashboardApi.ts): tras crear,
   * editar o eliminar se vuelven a pedir, en vez de restar localmente. */
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    /** `null` mientras el backend responde: el diálogo ya está abierto pero aún no puede confirmarse. */
    counts: MateriaResourceCounts | null;
    countsError?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshSummary = useCallback(() => {
    getDashboardSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  /** Pide al backend los conteos REALES antes de confirmar, para que el diálogo diga exactamente
   * qué se va a perder en vez de estimarlo desde la copia local. */
  async function openDeleteDialog(id: string, name: string) {
    setDeleteError(null);
    // El diálogo se abre de inmediato (el clic debe tener respuesta visible al instante) y los
    // conteos llegan después; hasta entonces no se puede confirmar, para que nadie elimine sin
    // haber visto qué se pierde.
    setDeleteTarget({ id, name, counts: null });
    try {
      const { counts } = await getMateriaCounts(id);
      setDeleteTarget((prev) => (prev && prev.id === id ? { ...prev, counts } : prev));
    } catch {
      setDeleteTarget((prev) =>
        prev && prev.id === id ? { ...prev, countsError: "No se pudieron consultar los recursos de la asignatura." } : prev
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting || deleteTarget.counts === null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await materias.removeMateria(deleteTarget.id);
      setDeleteTarget(null);
      // Se vuelve a consultar TODO al backend. Restar localmente dejaría tarjetas y gráfica
      // desincronizadas si el borrado en cascada afectó más de lo previsto.
      refreshSummary();
      const rows = await listAllPresentations().catch(() => null);
      if (rows) setPresentations(rows as PresentationRow[]);
    } catch (err) {
      // Si falla, la materia y sus métricas se quedan EXACTAMENTE como estaban.
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar la asignatura.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    listAllPresentations()
      .then((rows) => setPresentations(rows as PresentationRow[]))
      .catch(() => setPresentationsError(true));
  }, []);

  const totalMaterias = summary?.totals.subjects ?? null;
  const totalBanks = summary?.totals.questionBanks ?? null;
  /**
   * Se cuenta sobre la MISMA lista que alimenta la gráfica y el anillo. Sumar
   * `materia.presentationCount` daba un número distinto (32 frente a 54) porque deja fuera las
   * presentaciones antiguas que no quedaron asociadas a ninguna materia: dos cifras del mismo
   * concepto en la misma pantalla. El histórico sigue mostrando el conteo por materia, que ahí
   * sí es lo correcto.
   */
  const totalPresentations = summary?.totals.generatedClasses ?? null;

  /** Clases generadas por materia — una barra por materia activa, contadas por id de clase en el
   * backend (una clase con presentación, banco y saludo cuenta UNA vez). Las materias sin clases
   * aparecen con 0 en vez de desaparecer. */
  const classesBySubject: SeriesPoint[] = useMemo(
    () => (summary?.classesBySubject ?? []).map((s) => ({ label: s.subjectName, value: s.generatedClasses })),
    [summary]
  );

  /** Materia con más clases generadas, tomada del mismo agregado del backend que la gráfica —
   * no se recalcula sobre la lista local de presentaciones para que no diverja del total. */
  const topSubject = useMemo(() => {
    const rows = summary?.classesBySubject ?? [];
    if (rows.length === 0) return null;
    return rows.reduce((best, r) => (r.generatedClasses > best.generatedClasses ? r : best));
  }, [summary]);

  const recent = useMemo(() => {
    if (!presentations) return [];
    return [...presentations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [presentations]);

  const historial = useMemo(() => {
    const sorted = [...materias.materias].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((m) => m.name.toLowerCase().includes(q)) : sorted;
  }, [materias.materias, query]);

  const loadingCharts = presentations === null && !presentationsError;

  return (
    <div className="app-shell-wide dashboard-page">
      <header className="app-header">
        <h1>Dashboard clases</h1>
        <p>Resumen de tu producción académica: asignaturas, clases generadas y bancos de preguntas.</p>
      </header>

      {materias.error && (
        <Banner type="error" title="Ocurrió un error" onDismiss={() => materias.setError(null)}>
          {materias.error}
        </Banner>
      )}

      <div className="dashboard-grid">
        {/* --- Métricas (máximo cuatro, todas con dato real) --- */}
        <MetricCard
          label="Asignaturas activas"
          value={totalMaterias}
          loading={summary === null}
          primary
          icon={IconPresentation}
          actionLabel="Crear asignatura"
          onAction={onCreateMateria}
        />
        <MetricCard
          label="Clases generadas"
          value={totalPresentations}
          loading={summary === null}
          icon={IconCalendarClock}
        />
        <MetricCard label="Bancos de preguntas" value={totalBanks} loading={summary === null} icon={IconQuiz} />
        <MetricCard
          label="Asignatura con más clases"
          value={topSubject ? topSubject.generatedClasses : null}
          hint={topSubject?.subjectName}
          loading={summary === null}
          icon={IconTrophy}
        />

        {/* --- Única gráfica del Dashboard: clases generadas por materia.
             No hay gráficas de modalidad, tendencia ni porcentajes: el requisito es que las
             gráficas se concentren exclusivamente en las clases generadas por materia. --- */}
        <section className="panel dash-span-12" aria-labelledby="dash-activity">
          <h2 id="dash-activity">Clases generadas por asignatura</h2>
          <p className="field-hint">Una barra por asignatura activa. Una clase cuenta una sola vez.</p>
          {summary === null ? (
            <div className="skeleton-block" aria-hidden />
          ) : classesBySubject.length === 0 ? (
            <p className="field-hint">Todavía no hay asignaturas. Crea una para ver esta gráfica.</p>
          ) : (
            <BarChart data={classesBySubject} ariaLabel="Clases generadas por asignatura" />
          )}
        </section>

        {/* --- Histórico de materias (8 columnas) --- */}
        <section className="panel dash-span-8" aria-labelledby="dash-hist">
          <h2 id="dash-hist">Histórico de asignaturas</h2>
          {materias.materias.length > 4 && (
            <div className="field-group" style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="dash-search">Buscar asignatura</label>
              <input
                id="dash-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre de la asignatura"
              />
            </div>
          )}

          {materias.materias.length === 0 ? (
            <p className="field-hint">
              Todavía no has creado ninguna asignatura. Ve a &ldquo;Asignaturas&rdquo; para crear la primera.
            </p>
          ) : historial.length === 0 ? (
            <p className="field-hint">Ninguna asignatura coincide con «{query}».</p>
          ) : (
            <ul className="materia-rows" aria-label="Asignaturas creadas">
              {historial.map((m) => (
                <li key={m.id} className="materia-row">
                  <div className="materia-row-main">
                    <strong>{m.name}</strong>
                    <span className="field-hint">
                      {m.presentationCount} clase(s) · {m.minicasoBankCount} banco(s) de preguntas
                    </span>
                  </div>
                  <span className="field-hint materia-row-date">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                  <div className="materia-row-actions">
                    <button
                      type="button"
                      className="btn btn-text materia-action"
                      aria-label={`Visualizar la asignatura ${m.name}`}
                      title="Visualizar"
                      onClick={() => onView(m.id)}
                      disabled={deleting}
                    >
                      <IconEye aria-hidden />
                      <span className="materia-action-text">Visualizar</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-text materia-action"
                      aria-label={`Editar la asignatura ${m.name}`}
                      title="Editar"
                      onClick={() => onEdit(m.id)}
                      disabled={deleting}
                    >
                      <IconPencil aria-hidden />
                      <span className="materia-action-text">Editar</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-text materia-action materia-action-danger"
                      aria-label={`Eliminar la asignatura ${m.name}`}
                      title="Eliminar"
                      onClick={() => void openDeleteDialog(m.id, m.name)}
                      disabled={deleting}
                    >
                      <TrashIcon />
                      <span className="materia-action-text">Eliminar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Actividad reciente (4 columnas) --- */}
        <section className="panel dash-span-4" aria-labelledby="dash-recent">
          <h2 id="dash-recent">Actividad reciente</h2>
          {presentationsError ? (
            <p className="field-hint">No se pudo cargar la actividad reciente.</p>
          ) : loadingCharts ? (
            <div className="skeleton-block" aria-hidden />
          ) : recent.length === 0 ? (
            <p className="field-hint">Todavía no hay clases generadas.</p>
          ) : (
            <ul className="activity-list activity-list--modern">
              {recent.map((p) => {
                const Icon = DECK_TYPE_ICONS[p.deckType as UnirDeckType] ?? IconPresentation;
                return (
                  <li key={p.id}>
                    <span className="activity-icon">
                      <Icon aria-hidden />
                    </span>
                    <span className="activity-body">
                      <span className="activity-title">{p.title}</span>
                      <span className="field-hint">
                        {DECK_TYPE_LABELS[p.deckType as keyof typeof DECK_TYPE_LABELS] ?? p.deckType} ·{" "}
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {deleteTarget && (
        <div className="modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}>
          <div className="modal-panel" role="alertdialog" aria-modal="true" aria-labelledby="del-heading">
            <h2 id="del-heading">¿Eliminar «{deleteTarget.name}»?</h2>
            <p>Se eliminarán también todos sus recursos:</p>
            {deleteTarget.counts ? (
              <ul className="data-summary">
                <li><span className="label">Clases</span><span>{deleteTarget.counts.classes}</span></li>
                <li><span className="label">Presentaciones</span><span>{deleteTarget.counts.presentations}</span></li>
                <li><span className="label">Bancos de preguntas</span><span>{deleteTarget.counts.questionBanks}</span></li>
                <li><span className="label">Preguntas</span><span>{deleteTarget.counts.questions}</span></li>
              </ul>
            ) : deleteTarget.countsError ? (
              <Banner type="error" title="No se puede confirmar">
                {deleteTarget.countsError} Sin ese dato no se muestra qué se perdería, así que la
                eliminación queda bloqueada. Cierra el diálogo y vuelve a intentarlo.
              </Banner>
            ) : (
              <p className="field-hint" role="status">Consultando los recursos de la asignatura…</p>
            )}
            <Banner type="warning">
              La asignatura dejará de aparecer en el Dashboard, en el histórico y en la gráfica. Los saludos de
              foro que se derivaban de sus clases tampoco podrán generarse. Esta acción no se puede deshacer.
            </Banner>
            {deleteError && (
              <Banner type="error" title="No se pudo eliminar">
                {deleteError} La asignatura y sus recursos siguen intactos.
              </Banner>
            )}
            <div className="actions-row">
              <div />
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  <span className="btn-label" data-label="Cancelar">Cancelar</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deleting || deleteTarget.counts === null}
                  data-loading={deleting || undefined}
                >
                  <span className="btn-label" data-label="Eliminar asignatura">Eliminar asignatura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  loading,
  primary,
  icon: Icon,
  actionLabel,
  onAction,
}: {
  label: string;
  value: number | null;
  hint?: string;
  loading?: boolean;
  /** Tarjeta destacada: usa el color principal de la paleta activa, con el texto de mayor
   * contraste calculado sobre ese fondo real (ver hooks/usePrimaryCardForeground.ts). */
  primary?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Acción rápida en la esquina (solo la tarjeta de asignaturas la usa). */
  actionLabel?: string;
  onAction?: () => void;
}) {
  const foreground = usePrimaryCardForeground(primary);
  const canCreate = Boolean(primary && onAction);

  return (
    <article
      className={primary ? "panel metric-card dash-span-3 dashboard-primary-card" : "panel metric-card dash-span-3"}
      style={primary && foreground ? { color: foreground } : undefined}
    >
      {/* Insignia "+" flotante: solo la tarjeta de asignaturas la lleva, como acceso directo
       * para crear una sin salir del Dashboard — no reemplaza el icono principal de la tarjeta. */}
      {canCreate && (
        <button
          type="button"
          className="metric-card-quick-add"
          onClick={onAction}
          aria-label={actionLabel ?? "Crear asignatura"}
          title={actionLabel ?? "Crear asignatura"}
        >
          <IconPlus aria-hidden />
        </button>
      )}
      <span className="metric-card-icon" aria-hidden>
        <Icon />
      </span>
      <div className="metric-card-body">
        <span className="metric-label">{label}</span>
        {/* Nunca un cero falso: se muestra un guion mientras carga y cuando no hay dato del que
         * hablar (p. ej. "asignatura con más clases" sin ninguna asignatura creada). */}
        <span className="metric-value">{loading || value === null ? "—" : value}</span>
        {hint && <span className="field-hint">{hint}</span>}
      </div>
    </article>
  );
}
