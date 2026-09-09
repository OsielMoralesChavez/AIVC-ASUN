"use client";

import { useState } from "react";
import type { GradingLogic, Session } from "@/lib/calificador/types";
import { GradingLogicEditor } from "@/components/calificador-orig/GradingLogicEditor";
import { FileUploadCard } from "@/components/calificador-orig/FileUploadCard";
import { SubmissionsPanel } from "@/components/calificador-orig/SubmissionsPanel";
import { SeverityEditor } from "@/components/calificador-orig/SeverityEditor";
import { FilesPerSubmissionEditor } from "@/components/calificador-orig/FilesPerSubmissionEditor";
import { deriveGradingLogic } from "@/lib/calificador/grading/logic";
import { useSettings } from "@/components/calificador-orig/SettingsProvider";
import type { GradeScale } from "@/lib/config/types";
import type { SessionQueue } from "@/lib/calificador/db/queue";

/** Reconstruye la ponderación desde rubric_parsed con la MISMA función que
 *  usa el servidor (si el usuario recarga tras la extracción). */
function proposalFromRubric(
  session: Session,
  scale: GradeScale
): GradingLogic | null {
  return session.rubric_parsed
    ? deriveGradingLogic(session.rubric_parsed, scale)
    : null;
}

export function SessionView({
  initialSession,
  subjectName,
  contents,
  initialQueue,
  onBack,
  onDeleted,
  onOpenSubmission,
}: {
  initialSession: Session;
  subjectName: string;
  /** Cuántos trabajos cuelgan de la sesión, para advertirlo al eliminarla. */
  contents: { submissions: number; graded: number };
  /** Cola resuelta al abrir la sesión, para que el primer render ya sea correcto. */
  initialQueue: SessionQueue;
  onBack: () => void;
  onDeleted: () => void;
  onOpenSubmission: (submissionId: string) => void;
}) {
  const { gradeScale, academicLevels } = useSettings();
  const [session, setSession] = useState<Session>(initialSession);
  const [proposal, setProposal] = useState<GradingLogic | null>(
    initialSession.grading_logic ?? proposalFromRubric(initialSession, gradeScale)
  );
  const [extracting, setExtracting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Cambia cada vez que llega una propuesta nueva de la IA. Se usa como
  // `key` del editor para forzar que se remonte: el editor copia la
  // propuesta a su estado local UNA sola vez (al montarse), así que sin
  // esto "Regenerar con IA" no actualizaba la tabla.
  const [proposalVersion, setProposalVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isArchived = session.status === "archivada";
  const isConfiguring = session.status === "configurando";

  async function handleExtract() {
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/sessions/${session.id}/extract-rubric`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al procesar la rúbrica");
      setSession(data.session);
      setProposal(data.grading_logic_proposal);
      setProposalVersion((version) => version + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setExtracting(false);
    }
  }

  async function handleApprove(logic: GradingLogic) {
    setError(null);
    const res = await fetch(`/api/calificador/sessions/${session.id}/grading-logic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grading_logic: logic }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al guardar la lógica de calificación");
      return;
    }
    setSession(data.session);
    setProposal(data.session.grading_logic);
  }

  async function handleArchiveToggle() {
    const targetStatus = isArchived ? "activa" : "archivada";
    if (
      !isArchived &&
      !confirm(
        "¿Archivar esta sesión? Quedará en modo consulta (solo lectura)."
      )
    )
      return;
    const res = await fetch(`/api/calificador/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      setSession(data.session);
    } else {
      setError(data.error ?? "Error al cambiar el estado de la sesión");
    }
  }

  /**
   * Elimina la sesión completa. Disponible en cualquier estado, incluido
   * "configurando": el caso típico es una sesión creada por error, que
   * archivar no resuelve.
   */
  async function handleDelete() {
    const detail =
      contents.submissions > 0
        ? `Se eliminarán también sus ${contents.submissions} ${contents.submissions === 1 ? "trabajo" : "trabajos"} (${contents.graded} ${contents.graded === 1 ? "calificado" : "calificados"}), con su retroalimentación y sus archivos.`
        : "No tiene trabajos cargados, así que no se pierde ninguna calificación.";
    if (
      !confirm(
        `Se eliminará la sesión "${session.name}".

${detail}

Esta acción no se puede deshacer. ¿Continuar?`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/sessions/${session.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo eliminar la sesión.");
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la sesión");
      setDeleting(false);
    }
  }

  function onFileUploaded(updated: Session) {
    setSession(updated);
    // Si se reemplazó la rúbrica, la lógica anterior quedó invalidada
    if (!updated.rubric_parsed) setProposal(null);
  }

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← {subjectName}
          </button>
          <p className="sr-only">{subjectName}</p>
          <h1 className="text-2xl font-bold text-slate-900">{session.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-700">
              {academicLevels.find((level) => level.id === session.level)?.label ??
                session.level}
            </span>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-medium text-slate-700 capitalize">
              {session.work_type}
            </span>
            <SeverityEditor
              session={session}
              disabled={isArchived}
              onChange={setSession}
            />
            <FilesPerSubmissionEditor
              session={session}
              disabled={isArchived}
              onChange={setSession}
            />
            <span
              className={`rounded-full px-2.5 py-0.5 font-medium ${
                session.status === "activa"
                  ? "bg-emerald-100 text-emerald-800"
                  : session.status === "configurando"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {session.status === "configurando"
                ? "Configurando"
                : session.status === "activa"
                  ? "Activa"
                  : "Archivada"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {session.status !== "configurando" && (
            <button
              onClick={handleArchiveToggle}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              {isArchived ? "Reactivar sesión" : "Archivar sesión"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Eliminar esta sesión y todos sus trabajos"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
          >
            {deleting ? "Eliminando…" : "🗑 Eliminar"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ---------- Paso 2: Documentos ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">
          {isConfiguring ? "Paso 2 de 3 — Documentos" : "Documentos de la sesión"}
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Rúbrica de evaluación e instrucciones del trabajo. Puedes
          reemplazarlos en cualquier momento.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileUploadCard
            sessionId={session.id}
            kind="rubrica"
            title="Rúbrica"
            accept=".docx,.pdf,.xlsx"
            currentFileName={session.rubric_file_name}
            disabled={isArchived}
            confirmMessage={
              session.grading_logic
                ? "Al reemplazar la rúbrica se invalidará la lógica de calificación aprobada y la sesión volverá a configuración. Si ya hay trabajos calificados, sus resultados conservan la lógica anterior. ¿Continuar?"
                : null
            }
            onUploaded={onFileUploaded}
          />
          <FileUploadCard
            sessionId={session.id}
            kind="instrucciones"
            title="Instrucciones del trabajo"
            accept=".docx,.pdf"
            currentFileName={session.instructions_file_name}
            disabled={isArchived}
            confirmMessage={null}
            onUploaded={onFileUploaded}
          />
        </div>
      </section>

      {/* ---------- Paso 3: Lógica de calificación ---------- */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">
          {isConfiguring
            ? "Paso 3 de 3 — Lógica de calificación"
            : "Lógica de calificación"}
        </h2>

        {!session.rubric_file_name && (
          <p className="text-sm text-slate-500">
            Sube primero el archivo de rúbrica para poder generar la lógica de
            calificación.
          </p>
        )}

        {session.rubric_file_name && !session.rubric_parsed && (
          <div className="mt-2">
            <p className="mb-3 text-sm text-slate-600">
              La IA leerá la rúbrica, extraerá sus criterios y propondrá un
              desglose de ponderación que podrás ajustar antes de aprobar.
            </p>
            <button
              onClick={handleExtract}
              disabled={extracting || isArchived}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {extracting
                ? "Analizando rúbrica con IA… (puede tardar un poco)"
                : "Generar lógica de calificación con IA"}
            </button>
          </div>
        )}

        {session.rubric_parsed && proposal && (
          <div className="mt-3 space-y-4">
            {session.rubric_parsed.notes && (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Notas de la IA al interpretar la rúbrica:</strong>{" "}
                {session.rubric_parsed.notes}
              </div>
            )}
            <GradingLogicEditor
              key={proposalVersion}
              initialLogic={proposal}
              rubric={session.rubric_parsed}
              readOnly={!isConfiguring || isArchived}
              approved={session.grading_logic !== null}
              onApprove={handleApprove}
              onRegenerate={handleExtract}
              regenerating={extracting}
            />
          </div>
        )}
      </section>

      {/* ---------- Zona de trabajos ---------- */}
      {(session.status === "activa" || isArchived) && (
        <SubmissionsPanel
          sessionId={session.id}
          workType={session.work_type}
          filesPerSubmission={session.files_per_submission}
          archived={isArchived}
          initialQueue={initialQueue}
          onOpenSubmission={onOpenSubmission}
        />
      )}
    </div>
  );
}
