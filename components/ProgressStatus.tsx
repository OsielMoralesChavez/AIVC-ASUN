"use client";

import type { JobStatus } from "../types/presentation";

export interface ProgressState {
  status: JobStatus | "uploading" | "idle";
  progress: number;
  message: string;
  busy: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  idle: "Listo",
  uploading: "Cargando",
  queued: "En cola",
  extracting: "Extrayendo",
  analyzing: "Analizando",
  generating: "Generando",
  downloading: "Descargando",
  done: "Terminado",
  error: "Error",
};

export function ProgressStatus({ state }: { state: ProgressState }) {
  return (
    <div className="field-group" role="status" aria-live="polite">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
        <span>{STAGE_LABELS[state.status] ?? state.status}</span>
        <span>{state.progress}%</span>
      </div>
      <div className="progress-bar">
        <div style={{ width: `${state.progress}%` }} data-busy={state.busy} />
      </div>
      <p className="field-hint">{state.message}</p>
    </div>
  );
}
