"use client";

import { useState } from "react";
import type { Session } from "@/lib/calificador/types";

const OPTIONS = [1, 2, 3] as const;

/**
 * Ajusta cuántos archivos componen UNA entrega en esta sesión (1-3).
 * Con más de uno, al subir en masa los archivos se agrupan por los nombres
 * detectados en la portada y la IA los califica juntos como un solo trabajo.
 */
export function FilesPerSubmissionEditor({
  session,
  disabled,
  onChange,
}: {
  session: Session;
  disabled: boolean;
  onChange: (session: Session) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(session.files_per_submission);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files_per_submission: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      onChange(data.session);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setValue(session.files_per_submission);
          setOpen(true);
        }}
        disabled={disabled}
        title={
          disabled
            ? "La sesión está archivada"
            : "Haz clic para ajustar cuántos archivos componen una entrega"
        }
        className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700 transition enabled:hover:bg-slate-300 disabled:cursor-not-allowed"
      >
        {session.files_per_submission === 1
          ? "1 archivo por entrega"
          : `Hasta ${session.files_per_submission} archivos por entrega`}
        {!disabled && <span className="ml-1 opacity-60">✏️</span>}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">
        ¿De cuántos archivos consta una entrega?
      </p>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setValue(option)}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              value === option
                ? "border-indigo-500 bg-indigo-600 font-medium text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {option === 1 ? "1 archivo" : `Hasta ${option} archivos`}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {value === 1
          ? "Cada archivo que subas es una entrega independiente."
          : `Al subir en masa, los archivos se agruparán por los nombres detectados en la portada y podrás corregir la agrupación a mano. La IA leerá los ${value} archivos juntos y dará una sola calificación por entrega.`}
      </p>
      <p className="mt-2 text-xs text-amber-700">
        Aplica a las entregas que subas de aquí en adelante; las que ya están
        en la cola no cambian.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || value === session.files_per_submission}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
