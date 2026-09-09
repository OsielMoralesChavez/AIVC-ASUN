"use client";

import { useState } from "react";
import type { Session } from "@/lib/calificador/types";

const SEVERITY_LABELS = [
  "Muy flexible",
  "Flexible",
  "Balanceado",
  "Estricto",
  "Muy estricto",
];

const SEVERITY_HELP = [
  "Reconoce el esfuerzo; solo penaliza carencias claras.",
  "Valora el cumplimiento general; penaliza con moderación.",
  "Aplica la rúbrica de forma literal y objetiva.",
  "Exige cumplimiento cabal; penaliza omisiones con firmeza.",
  "El puntaje alto exige excelencia demostrada, no solo cumplimiento.",
];

/**
 * Permite ajustar la severidad de una sesión ya creada. El cambio aplica
 * a los trabajos que se califiquen a partir de ese momento; los ya
 * calificados conservan su evaluación (pueden recalificarse con ↻).
 */
export function SeverityEditor({
  session,
  disabled,
  onChange,
}: {
  session: Session;
  disabled: boolean;
  onChange: (session: Session) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(session.severity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar la severidad");
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
          setValue(session.severity);
          setOpen(true);
        }}
        disabled={disabled}
        title={
          disabled
            ? "La sesión está archivada"
            : "Haz clic para ajustar la severidad"
        }
        className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700 transition enabled:hover:bg-slate-300 disabled:cursor-not-allowed"
      >
        Severidad {session.severity}/5 — {SEVERITY_LABELS[session.severity - 1]}
        {!disabled && <span className="ml-1 opacity-60">✏️</span>}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Severidad de calificación:{" "}
        <span className="font-semibold text-indigo-700">
          {value} — {SEVERITY_LABELS[value - 1]}
        </span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-[11px] text-slate-500">
        {SEVERITY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-600">{SEVERITY_HELP[value - 1]}</p>
      <p className="mt-2 text-xs text-amber-700">
        Aplica a los trabajos que califiques de aquí en adelante. Los ya
        calificados conservan su evaluación; para recalificarlos con la nueva
        severidad, usa ↻ Reintentar en cada uno.
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
          disabled={saving || value === session.severity}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar severidad"}
        </button>
      </div>
    </div>
  );
}
