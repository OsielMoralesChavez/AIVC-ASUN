"use client";

import { useEffect, useRef, useState } from "react";
import { useBackgroundJobs } from "./BackgroundJobsProvider";
import { IconCheck, IconAlertTriangle } from "./icons";
import type { AppSection } from "./Sidebar";

/**
 * Pastilla del topbar con las generaciones en curso. Solo aparece cuando hay algo que informar:
 * un indicador permanente vacío sería ruido en todas las demás pantallas.
 */
export function BackgroundJobsIndicator({ onOpenSection }: { onOpenSection: (section: AppSection) => void }) {
  const tracker = useBackgroundJobs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!tracker || tracker.jobs.length === 0) return null;

  const { jobs, activeCount, dismiss, dismissFinished } = tracker;
  const failed = jobs.filter((j) => j.status === "error").length;
  const activo = jobs.find((j) => j.status !== "done" && j.status !== "error");

  return (
    <div className="jobs-indicator" ref={ref}>
      <button
        type="button"
        className="jobs-indicator-trigger"
        data-busy={activeCount > 0}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          activeCount > 0
            ? `${activeCount} generación(es) en segundo plano, ${activo?.progress ?? 0}%`
            : "Generaciones terminadas"
        }
      >
        {activeCount > 0 ? (
          <>
            <span className="jobs-indicator-spinner" aria-hidden />
            <span className="jobs-indicator-text">
              {activeCount > 1 ? `${activeCount} generando` : "Generando"} · {activo?.progress ?? 0}%
            </span>
          </>
        ) : (
          <>
            <span className="jobs-indicator-icon" data-error={failed > 0} aria-hidden>
              {failed > 0 ? <IconAlertTriangle /> : <IconCheck />}
            </span>
            <span className="jobs-indicator-text">{failed > 0 ? "Con errores" : "Listo"}</span>
          </>
        )}
      </button>

      {open && (
        <div className="dropdown-menu jobs-indicator-menu" role="menu" aria-label="Generaciones en segundo plano">
          <p className="field-hint jobs-indicator-hint">
            Las generaciones siguen en el servidor aunque cambies de sección o cierres esta pantalla.
          </p>
          <ul className="jobs-indicator-list">
            {jobs.map((job) => {
              const terminado = job.status === "done" || job.status === "error";
              return (
                <li key={job.jobId} className="jobs-indicator-item" data-status={job.status}>
                  <div className="jobs-indicator-item-head">
                    <strong>{job.label}</strong>
                    <span className="field-hint">{terminado ? "" : `${job.progress}%`}</span>
                  </div>
                  {!terminado && (
                    <div className="progress-bar" aria-hidden>
                      <div style={{ width: `${Math.max(job.progress, 2)}%` }} />
                    </div>
                  )}
                  <p className="field-hint jobs-indicator-message">{job.error ?? job.message}</p>
                  <div className="jobs-indicator-actions">
                    <button
                      type="button"
                      className="btn btn-text"
                      onClick={() => {
                        setOpen(false);
                        onOpenSection(job.section);
                      }}
                    >
                      <span className="btn-label" data-label="Ir a la sección">
                        Ir a la sección
                      </span>
                    </button>
                    {terminado && (
                      <button type="button" className="btn btn-text" onClick={() => dismiss(job.jobId)}>
                        <span className="btn-label" data-label="Quitar">
                          Quitar
                        </span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {jobs.some((j) => j.status === "done" || j.status === "error") && (
            <button type="button" className="dropdown-item" onClick={dismissFinished}>
              Limpiar terminadas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
