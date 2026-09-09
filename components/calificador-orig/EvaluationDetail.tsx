"use client";

import { useMemo, useState } from "react";
import { useSettings } from "@/components/calificador-orig/SettingsProvider";
import {
  evaluationTotalPoints,
  formatGrade,
  formatGradeWithScale,
  isPassing,
  pointsToGrade,
} from "@/lib/calificador/grading/logic";
import type {
  Evaluation,
  EvaluationCriterion,
  Session,
  Submission,
} from "@/lib/calificador/types";

interface CriterionEdit {
  id: string;
  awarded_points: number;
  feedback: string;
}

export function EvaluationDetail({
  submission,
  evaluation: initialEvaluation,
  criteria: initialCriteria,
  session,
  subjectName,
  onBack,
  onRegraded,
}: {
  submission: Submission;
  evaluation: Evaluation;
  criteria: EvaluationCriterion[];
  session: Session;
  subjectName: string;
  onBack: () => void;
  /** Se llama tras enviar el trabajo de vuelta a la cola con "Recalificar con IA". */
  onRegraded: () => void;
}) {
  const [evaluation, setEvaluation] = useState(initialEvaluation);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<CriterionEdit[]>([]);
  const [generalFeedback, setGeneralFeedback] = useState(
    initialEvaluation.general_feedback
  );
  const [showOriginal, setShowOriginal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regrading, setRegrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = session.status === "archivada";
  const { gradeScale: scale } = useSettings();

  // El total sale de los criterios de esta evaluación y no de la lógica de la
  // sesión: al reemplazar la rúbrica, `session.grading_logic` se pone en null
  // y las evaluaciones anteriores seguirían necesitando su propio total.
  const totalPoints = evaluationTotalPoints(criteria);

  function startEditing() {
    setEdits(
      criteria.map((c) => ({
        id: c.id,
        awarded_points: c.awarded_points,
        feedback: c.feedback,
      }))
    );
    setGeneralFeedback(evaluation.general_feedback);
    setEditing(true);
    setError(null);
  }

  /** Calificación recalculada en vivo durante la edición, en la escala vigente. */
  const liveGrade = useMemo(() => {
    if (!editing) return evaluation.final_grade;
    const awarded = edits.reduce(
      (acc, e) => acc + (Number(e.awarded_points) || 0),
      0
    );
    return pointsToGrade(awarded, totalPoints, scale);
  }, [editing, edits, evaluation.final_grade, totalPoints, scale]);

  function setEdit(id: string, patch: Partial<CriterionEdit>) {
    setEdits((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  /**
   * Vuelve a evaluar el trabajo con IA usando la configuración actual de la
   * sesión. Destructivo: reemplaza la evaluación vigente y sus ediciones.
   */
  async function handleRegrade() {
    const warning = evaluation.was_edited
      ? `Esta evaluación fue EDITADA MANUALMENTE por ti (calificación ${formatGradeWithScale(evaluation.final_grade, scale)}).\n\nAl recalificar con IA se perderán tus cambios y se generará una evaluación nueva desde cero.\n\n¿Continuar?`
      : `Se volverá a evaluar el trabajo con la IA usando la configuración actual de la sesión (severidad ${session.severity}/5, rúbrica y perfil de voz).\n\nLa evaluación actual (${formatGradeWithScale(evaluation.final_grade, scale)}) será reemplazada.\n\n¿Continuar?`;
    if (!confirm(warning)) return;

    setRegrading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/submissions/${submission.id}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al recalificar");
      // El trabajo vuelve a la cola; se sigue su avance desde la sesión.
      onRegraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setRegrading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/submissions/${submission.id}/evaluation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general_feedback: generalFeedback,
          criteria: edits.map((e) => ({
            ...e,
            awarded_points: Number(e.awarded_points),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setEvaluation(data.evaluation);
      setCriteria(data.criteria);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  // Los cortes de color se anclan a la calificación APROBATORIA de la escala,
  // no a porcentajes fijos: rojo es exactamente "reprobado", y los demás
  // tramos reparten lo que hay entre el aprobado y el máximo.
  const passed = isPassing(liveGrade, scale);
  const abovePassing =
    scale.max === scale.passingGrade
      ? 1
      : (liveGrade - scale.passingGrade) / (scale.max - scale.passingGrade);
  const gradeColor = !passed
    ? "text-red-600"
    : abovePassing >= 0.8
      ? "text-emerald-600"
      : abovePassing >= 0.5
        ? "text-blue-600"
        : "text-amber-600";

  return (
    <div className="space-y-6">
      {/* ---------- Encabezado ---------- */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            <button type="button" onClick={onBack} className="hover:text-indigo-700 hover:underline">
              ← {subjectName} · {session.name}
            </button>
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {submission.student_names}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2.5 py-0.5 font-medium ${
                evaluation.was_edited
                  ? "bg-amber-100 text-amber-800"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {evaluation.was_edited ? "Editado ✏️" : "Generado por IA"}
            </span>
            <span className="text-slate-500">
              Modelo: {evaluation.model_used}
            </span>
            {readOnly && (
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-600">
                Solo lectura (sesión archivada)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-5xl font-bold ${gradeColor}`}>
            {formatGrade(liveGrade, scale)}
          </p>
          <p className="text-xs text-slate-500">de {scale.max}</p>
          <p
            className={`mt-0.5 text-xs font-medium ${
              passed ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {passed ? "Aprobado" : "Reprobado"}
          </p>
          {evaluation.was_edited && showOriginal && (
            <p className="mt-1 text-xs text-slate-500">
              Original IA: {formatGrade(evaluation.final_grade_original, scale)}
            </p>
          )}
        </div>
      </div>

      {/* ---------- Barra de acciones ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {!editing && !readOnly && (
            <button
              onClick={startEditing}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              ✏️ Editar evaluación
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "✓ Guardar cambios"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
            </>
          )}
          {evaluation.was_edited && !editing && (
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              {showOriginal ? "Ocultar original de la IA" : "Ver original de la IA"}
            </button>
          )}
          {!editing && !readOnly && (
            <button
              onClick={handleRegrade}
              disabled={regrading}
              title="Volver a evaluar este trabajo con IA usando la configuración actual de la sesión"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              {regrading ? "Enviando a la cola…" : "↻ Recalificar con IA"}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/calificador/submissions/${submission.id}/export?formato=docx`}
            className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            ⬇ Exportar Word
          </a>
          <a
            href={`/api/calificador/submissions/${submission.id}/export?formato=pdf`}
            className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            ⬇ Exportar PDF
          </a>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ---------- Criterios ---------- */}
      <div className="space-y-4">
        {criteria.map((criterion) => {
          const edit = edits.find((e) => e.id === criterion.id);
          return (
            <section
              key={criterion.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {criterion.criterion_name}
                    {criterion.was_edited && (
                      <span
                        className="ml-2 text-sm"
                        title="Criterio editado manualmente"
                      >
                        ✏️
                      </span>
                    )}
                  </h3>
                  {criterion.level_achieved && (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      Nivel: {criterion.level_achieved}
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {editing && edit ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={criterion.max_points}
                        value={edit.awarded_points}
                        onChange={(e) =>
                          setEdit(criterion.id, {
                            awarded_points: Number(e.target.value),
                          })
                        }
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-right font-semibold focus:border-indigo-500"
                      />
                      <span className="text-slate-500">
                        / {criterion.max_points}
                      </span>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-slate-800">
                      {criterion.awarded_points} / {criterion.max_points}
                    </p>
                  )}
                  {showOriginal && criterion.was_edited && (
                    <p className="text-xs text-slate-500">
                      Original IA: {criterion.awarded_points_original}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-3 rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                <strong className="text-slate-700">Justificación:</strong>{" "}
                {criterion.justification}
              </div>

              {editing && edit ? (
                <textarea
                  value={edit.feedback}
                  onChange={(e) =>
                    setEdit(criterion.id, { feedback: e.target.value })
                  }
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-indigo-500"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {showOriginal && criterion.was_edited
                    ? criterion.feedback_original
                    : criterion.feedback}
                </p>
              )}
              {showOriginal && criterion.was_edited && !editing && (
                <p className="mt-2 text-xs italic text-slate-500">
                  ↑ Mostrando el texto original generado por la IA
                </p>
              )}
            </section>
          );
        })}
      </div>

      {/* ---------- Feedback general ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-slate-800">
          Retroalimentación general
        </h3>
        {editing ? (
          <textarea
            value={generalFeedback}
            onChange={(e) => setGeneralFeedback(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-indigo-500"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {showOriginal && evaluation.was_edited
              ? evaluation.general_feedback_original
              : evaluation.general_feedback}
          </p>
        )}
        {showOriginal && evaluation.was_edited && !editing && (
          <p className="mt-2 text-xs italic text-slate-500">
            ↑ Mostrando el texto original generado por la IA
          </p>
        )}
      </section>
    </div>
  );
}
