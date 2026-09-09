"use client";

import { useState } from "react";
import { useSettings } from "@/components/calificador-orig/SettingsProvider";
import type { Subject } from "@/lib/calificador/types";

const SEVERITY_LABELS = [
  "Muy flexible",
  "Flexible",
  "Balanceado",
  "Estricto",
  "Muy estricto",
];

/**
 * Paso 1 del wizard de creación de sesión (datos generales).
 * Al crear, redirige a la página de la sesión, donde continúan los
 * pasos 2 (documentos) y 3 (lógica de calificación).
 */
export function NewSessionWizard({
  subjects,
  preselectedSubjectId,
  onCreated,
  onCancel,
}: {
  subjects: Subject[];
  preselectedSubjectId: string | null;
  onCreated: (sessionId: string) => void;
  onCancel: () => void;
}) {
  const [subjectId, setSubjectId] = useState(
    preselectedSubjectId ?? (subjects[0]?.id || "__nueva__")
  );
  const [newSubjectName, setNewSubjectName] = useState("");
  const [name, setName] = useState("");
  // Los valores iniciales salen de los defaults que el usuario configuró en
  // el asistente inicial, para que no tenga que repetirlos en cada sesión.
  const {
    academicLevels,
    defaultLevelId,
    defaultSeverity,
    defaultWorkType,
    defaultFilesPerSubmission,
  } = useSettings();
  const [level, setLevel] = useState(
    academicLevels.some((option) => option.id === defaultLevelId)
      ? defaultLevelId
      : academicLevels[0].id
  );
  const [workType, setWorkType] = useState<"individual" | "grupal">(defaultWorkType);
  const [severity, setSeverity] = useState(defaultSeverity);
  const [filesPerSubmission, setFilesPerSubmission] = useState(
    defaultFilesPerSubmission
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (subjectId === "__nueva__" && !newSubjectName.trim()) {
      setError("Escribe el nombre de la nueva materia.");
      return;
    }
    if (!name.trim()) {
      setError("Escribe el nombre de la sesión (ej. “Entrega 1”).");
      return;
    }
    setSaving(true);
    try {
      let finalSubjectId = subjectId;
      if (subjectId === "__nueva__") {
        const res = await fetch("/api/calificador/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newSubjectName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al crear la materia");
        finalSubjectId = data.subject.id;
      }
      const res = await fetch("/api/calificador/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: finalSubjectId,
          name,
          level,
          severity,
          work_type: workType,
          files_per_submission: filesPerSubmission,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear la sesión");
      onCreated(data.session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Nueva sesión</h1>
      <p className="mb-6 text-sm text-slate-500">
        Paso 1 de 3 — Datos generales. Después subirás los documentos y
        aprobarás la lógica de calificación.
      </p>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Materia
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="__nueva__">➕ Crear materia nueva…</option>
          </select>
          {subjectId === "__nueva__" && (
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Nombre de la nueva materia"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nombre de la sesión
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Entrega 2 — Ensayo final"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nivel
            </label>
            <div className="flex flex-wrap gap-2">
              {academicLevels.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setLevel(option.id)}
                  title={option.rigor}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    level === option.id
                      ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tipo de trabajo
            </label>
            <div className="flex gap-2">
              {(["individual", "grupal"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setWorkType(option)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition ${
                    workType === option
                      ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Archivos por entrega
          </label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilesPerSubmission(option)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  filesPerSubmission === option
                    ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {option === 1 ? "1 archivo" : `Hasta ${option} archivos`}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {filesPerSubmission === 1
              ? "Cada archivo subido es una entrega independiente."
              : "Los archivos se agruparán por los nombres detectados en la portada y la IA los calificará juntos como un solo trabajo."}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Severidad de calificación:{" "}
            <span className="font-semibold text-indigo-700">
              {severity} — {SEVERITY_LABELS[severity - 1]}
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            {SEVERITY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Creando…" : "Continuar → Documentos"}
          </button>
        </div>
      </div>
    </div>
  );
}
