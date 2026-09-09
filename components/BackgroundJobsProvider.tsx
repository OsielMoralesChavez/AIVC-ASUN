"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getJob } from "../services/api";
import type { AppSection } from "./Sidebar";

/**
 * Seguimiento de las generaciones que siguen corriendo mientras el usuario navega por el resto de
 * la aplicación.
 *
 * El trabajo en sí YA ocurría en segundo plano: `lib/jobs/jobRunner.ts` lanza la tarea como una
 * promesa desacoplada en el servidor y espeja su estado en SQLite, así que salir de la pantalla
 * nunca canceló nada. Lo que se perdía era la VISIBILIDAD: el sondeo vivía dentro del asistente,
 * y al desmontarse ese componente el docente se quedaba sin saber si su curso seguía generándose,
 * si había terminado o si había fallado — el único camino seguro era quedarse mirando la pantalla.
 *
 * Este proveedor sube ese sondeo al nivel de la aplicación y lo persiste en `localStorage`, para
 * que sobreviva también a una recarga completa de la página.
 */

export interface TrackedJob {
  jobId: string;
  /** Texto que ve el docente: "Curso completo — Finanzas", "Clase de repaso"… */
  label: string;
  /** A dónde volver cuando pulse "Ir". */
  section: AppSection;
  status: "queued" | "extracting" | "analyzing" | "generating" | "done" | "error";
  progress: number;
  message: string;
  error?: string;
  startedAt: number;
}

interface BackgroundJobsValue {
  jobs: TrackedJob[];
  activeCount: number;
  /** Registra un job para seguirlo aunque el asistente se desmonte. Idempotente por `jobId`. */
  track: (job: { jobId: string; label: string; section: AppSection }) => void;
  /** Quita un job terminado de la lista (no cancela nada: ya terminó). */
  dismiss: (jobId: string) => void;
  dismissFinished: () => void;
}

const BackgroundJobsContext = createContext<BackgroundJobsValue | null>(null);

const STORAGE_KEY = "unir.backgroundJobs";
const POLL_MS = 1500;
/** Un job terminado se conserva un rato para que el docente vea el resultado al volver, pero no
 * para siempre: pasado este tiempo desaparece solo en vez de acumularse. */
const KEEP_FINISHED_MS = 10 * 60 * 1000;

function isFinished(job: TrackedJob): boolean {
  return job.status === "done" || job.status === "error";
}

function readStored(): TrackedJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackedJob[];
    if (!Array.isArray(parsed)) return [];
    // Se descartan los terminados hace rato: al recargar interesa lo que sigue vivo.
    return parsed.filter((j) => !isFinished(j) || Date.now() - j.startedAt < KEEP_FINISHED_MS);
  } catch {
    return [];
  }
}

export function BackgroundJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  /** El sondeo lee de aquí y no del estado, para no reiniciar el intervalo en cada actualización
   * de progreso (que ocurre varias veces por segundo durante un curso completo). */
  const jobsRef = useRef<TrackedJob[]>([]);

  // La lectura de localStorage se hace tras montar, no en el useState inicial: el servidor no
  // tiene localStorage y el HTML renderizado en servidor debe coincidir con el primer render.
  useEffect(() => {
    const stored = readStored();
    if (stored.length > 0) {
      jobsRef.current = stored;
      setJobs(stored);
    }
  }, []);

  const commit = useCallback((next: TrackedJob[]) => {
    jobsRef.current = next;
    setJobs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Modo privado o almacenamiento lleno: el seguimiento sigue funcionando en memoria, solo
      // no sobrevivirá a una recarga. No es motivo para romper la generación.
    }
  }, []);

  const track = useCallback(
    ({ jobId, label, section }: { jobId: string; label: string; section: AppSection }) => {
      if (jobsRef.current.some((j) => j.jobId === jobId)) return;
      commit([
        ...jobsRef.current,
        { jobId, label, section, status: "queued", progress: 0, message: "En cola.", startedAt: Date.now() },
      ]);
    },
    [commit]
  );

  const dismiss = useCallback(
    (jobId: string) => commit(jobsRef.current.filter((j) => j.jobId !== jobId)),
    [commit]
  );

  const dismissFinished = useCallback(
    () => commit(jobsRef.current.filter((j) => !isFinished(j))),
    [commit]
  );

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const pending = jobsRef.current.filter((j) => !isFinished(j));
      if (pending.length === 0) return;

      const updates = await Promise.all(
        pending.map(async (job) => {
          try {
            const fresh = await getJob(job.jobId);
            return { jobId: job.jobId, fresh };
          } catch {
            // Un fallo de red puntual no marca el job como fallido: se reintenta en el siguiente
            // ciclo. El servidor sigue trabajando aunque esta consulta no llegara.
            return null;
          }
        })
      );
      if (cancelled) return;

      const byId = new Map(updates.filter(Boolean).map((u) => [u!.jobId, u!.fresh]));
      if (byId.size === 0) return;

      commit(
        jobsRef.current.map((job) => {
          const fresh = byId.get(job.jobId);
          if (!fresh) return job;
          return {
            ...job,
            status: fresh.status as TrackedJob["status"],
            progress: fresh.progress,
            message: fresh.message,
            error: fresh.error,
          };
        })
      );
    };

    const id = window.setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [commit]);

  const value = useMemo<BackgroundJobsValue>(
    () => ({
      jobs,
      activeCount: jobs.filter((j) => !isFinished(j)).length,
      track,
      dismiss,
      dismissFinished,
    }),
    [jobs, track, dismiss, dismissFinished]
  );

  return <BackgroundJobsContext.Provider value={value}>{children}</BackgroundJobsContext.Provider>;
}

/**
 * Devuelve `null` fuera del proveedor a propósito: los asistentes se renderizan también en
 * pruebas y pantallas sueltas, y ahí registrar el seguimiento global es opcional, no un error.
 */
export function useBackgroundJobs(): BackgroundJobsValue | null {
  return useContext(BackgroundJobsContext);
}
