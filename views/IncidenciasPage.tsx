"use client";
import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Banner } from "../components/Banner";
import { IconAlertTriangle, IconCheck, IconDashboard, IconLockOpen } from "../components/icons";
import { BarChart, DonutChart, type SeriesPoint } from "../components/dashboard/DashboardCharts";
import { useIncidents } from "../hooks/useIncidents";
import { usePrimaryCardForeground } from "../hooks/usePrimaryCardForeground";
import {
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  type IncidentCategory,
  type IncidentSeverity,
  type IncidentStatus,
} from "../types/incidents";

/**
 * Dashboard de incidencias: mismo lenguaje visual que el Dashboard de clases (retícula de 12
 * columnas, `panel`, tarjetas de métrica, BarChart/DonutChart con los tokens de color del tema
 * activo) aplicado al dominio de incidencias, en vez de reproducir el estilo neón de una
 * referencia externa. Todo lo que se muestra sale de la tabla `incidents` real — sin datos de
 * relleno: una categoría o estado sin ninguna incidencia aparece con 0, nunca desaparece.
 */
function statusBadgeClass(status: IncidentStatus): string {
  if (status === "abierta") return "badge badge-error";
  if (status === "en_progreso") return "badge badge-warn";
  return "badge badge-ok";
}

function severityBadgeClass(severity: IncidentSeverity): string {
  if (severity === "critica" || severity === "alta") return "badge badge-error";
  if (severity === "media") return "badge badge-warn";
  return "badge badge-ok";
}

export function IncidenciasPage() {
  const { incidents, summary, error, setError, loading, report, setStatus, remove } = useIncidents();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("bug");
  const [severity, setSeverity] = useState<IncidentSeverity>("media");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || submitting) return;
    setSubmitting(true);
    const ok = await report({ title: title.trim(), description: description.trim(), category, severity });
    setSubmitting(false);
    if (ok) {
      setTitle("");
      setDescription("");
      setCategory("bug");
      setSeverity("media");
      setFormOpen(false);
    }
  }

  const byCategory: SeriesPoint[] =
    summary?.byCategory.map((c) => ({ label: INCIDENT_CATEGORY_LABELS[c.category], value: c.count })) ?? [];
  const byStatus: SeriesPoint[] =
    summary?.byStatus.map((s) => ({ label: INCIDENT_STATUS_LABELS[s.status], value: s.count })) ?? [];

  return (
    <div className="app-shell-wide">
      <header className="app-header">
        <h1>Incidencias</h1>
        <p>Sistema de incidencias: reporta un problema y da seguimiento a su estado hasta que se resuelva.</p>
      </header>

      {error && (
        <Banner type="error" title="Ocurrió un error" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      <div className="actions-row" style={{ marginBottom: "1rem" }}>
        <div />
        <button type="button" className="btn btn-primary" onClick={() => setFormOpen((v) => !v)}>
          <span className="btn-label" data-label={formOpen ? "Cancelar" : "Reportar incidencia"}>
            {formOpen ? "Cancelar" : "Reportar incidencia"}
          </span>
        </button>
      </div>

      {formOpen && (
        <section className="panel" aria-labelledby="incident-form-h" style={{ marginBottom: "1rem" }}>
          <h2 id="incident-form-h">Reportar una incidencia</h2>
          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="incident-title">Título</label>
              <input
                id="incident-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Describe el problema en una línea"
                required
                disabled={submitting}
              />
            </div>
            <div className="field-group">
              <label htmlFor="incident-description">Descripción</label>
              <textarea
                id="incident-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qué esperabas que pasara, qué pasó realmente, y cómo reproducirlo"
                rows={4}
                required
                disabled={submitting}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="field-group">
                <label htmlFor="incident-category">Categoría</label>
                <select
                  id="incident-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  disabled={submitting}
                >
                  {Object.entries(INCIDENT_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="incident-severity">Severidad</label>
                <select
                  id="incident-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  disabled={submitting}
                >
                  {Object.entries(INCIDENT_SEVERITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="actions-row">
              <div />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !title.trim() || !description.trim()}
                data-loading={submitting || undefined}
              >
                <span className="btn-label" data-label="Enviar reporte">
                  Enviar reporte
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="dashboard-grid">
        <MetricCard
          label="Total de incidencias"
          value={summary?.totals.total ?? null}
          loading={loading}
          primary
          icon={IconDashboard}
        />
        <MetricCard label="Abiertas" value={summary?.totals.open ?? null} loading={loading} icon={IconLockOpen} />
        <MetricCard label="Resueltas" value={summary?.totals.resolved ?? null} loading={loading} icon={IconCheck} />
        <MetricCard
          label="Críticas sin resolver"
          value={summary?.totals.criticalOpen ?? null}
          loading={loading}
          icon={IconAlertTriangle}
        />

        <section className="panel dash-span-8" aria-labelledby="incidents-by-category">
          <h2 id="incidents-by-category">Incidencias por categoría</h2>
          <p className="field-hint">Una barra por categoría, incluidas las que todavía no tienen ningún reporte.</p>
          {loading ? (
            <div className="skeleton-block" aria-hidden />
          ) : (
            <BarChart data={byCategory} ariaLabel="Incidencias por categoría" />
          )}
        </section>

        <section className="panel dash-span-4" aria-labelledby="incidents-by-status">
          <h2 id="incidents-by-status">Distribución por estado</h2>
          {loading ? <div className="skeleton-block" aria-hidden /> : <DonutChart data={byStatus} ariaLabel="Incidencias por estado" />}
        </section>

        <section className="panel dash-span-12" aria-labelledby="incidents-recent">
          <h2 id="incidents-recent">Incidencias recientes</h2>
          {loading ? (
            <div className="skeleton-block" aria-hidden />
          ) : incidents.length === 0 ? (
            <p className="field-hint">Todavía no se ha reportado ninguna incidencia.</p>
          ) : (
            <ul className="materia-rows" aria-label="Incidencias reportadas">
              {incidents.map((incident) => (
                <li key={incident.id} className="materia-row">
                  <div className="materia-row-main">
                    <strong>{incident.title}</strong>
                    <span className="field-hint">{incident.description}</span>
                    <span style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                      <span className="badge badge-warn">{INCIDENT_CATEGORY_LABELS[incident.category]}</span>
                      <span className={severityBadgeClass(incident.severity)}>{INCIDENT_SEVERITY_LABELS[incident.severity]}</span>
                      <span className={statusBadgeClass(incident.status)}>{INCIDENT_STATUS_LABELS[incident.status]}</span>
                    </span>
                  </div>
                  <span className="field-hint materia-row-date">
                    {new Date(incident.createdAt).toLocaleDateString()}
                    {incident.reportedByName ? ` · ${incident.reportedByName}` : ""}
                  </span>
                  <div className="materia-row-actions">
                    <select
                      aria-label={`Cambiar estado de «${incident.title}»`}
                      value={incident.status}
                      onChange={(e) => setStatus(incident.id, e.target.value as IncidentStatus)}
                    >
                      {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-text materia-action materia-action-danger"
                      aria-label={`Eliminar la incidencia ${incident.title}`}
                      title="Eliminar"
                      onClick={() => remove(incident.id)}
                    >
                      <span className="materia-action-text">Eliminar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  loading,
  primary,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  loading?: boolean;
  primary?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  const foreground = usePrimaryCardForeground(primary);
  return (
    <article
      className={primary ? "panel metric-card dash-span-3 dashboard-primary-card" : "panel metric-card dash-span-3"}
      style={primary && foreground ? { color: foreground } : undefined}
    >
      <span className="metric-card-icon" aria-hidden>
        <Icon />
      </span>
      <div className="metric-card-body">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{loading || value === null ? "—" : value}</span>
      </div>
    </article>
  );
}
