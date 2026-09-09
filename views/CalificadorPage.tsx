"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsGate } from "../components/calificador-orig/SettingsGate";
import { SubjectsHome } from "../components/calificador-orig/SubjectsHome";
import { NewSessionWizard } from "../components/calificador-orig/NewSessionWizard";
import { SessionView } from "../components/calificador-orig/SessionView";
import { EvaluationDetail } from "../components/calificador-orig/EvaluationDetail";
import { HistorySearch } from "../components/calificador-orig/HistorySearch";
import { CalificadorEffectiveSettings } from "../components/CalificadorEffectiveSettings";
import type { Subject } from "../lib/calificador/types";

/**
 * "ajustes" y "voz" ya no existen aquí: la conexión con IA, los defaults de calificación y la
 * identidad docente viven en Configuración global, y el perfil de voz en Entrenamiento. Eran
 * segundos formularios sobre exactamente los mismos datos.
 */
type View =
  | { name: "subjects" }
  | { name: "newSession"; subjectId: string | null }
  | { name: "session"; sessionId: string }
  | { name: "submission"; submissionId: string }
  | { name: "buscador" };

interface CalificadorPageProps {
  /** Lleva a Configuración → pestaña Calificador/IA (lo inyecta AppShell). */
  onOpenSettings?: () => void;
  /** Lleva a Entrenamiento, donde se edita el perfil de voz. */
  onOpenTraining?: () => void;
}

/**
 * Calificador — puerto directo del Calificador original (mismos componentes en
 * components/calificador-orig/**, mismos endpoints bajo /api/calificador/**): la lógica y las
 * pantallas no cambiaron, solo la navegación pasa de rutas reales de Next a un pequeño estado de
 * cliente (este archivo), el mismo patrón que ya usa MateriaWorkspace en el resto de la app.
 */
export function CalificadorPage({ onOpenSettings, onOpenTraining }: CalificadorPageProps = {}) {
  const [view, setView] = useState<View>({ name: "subjects" });

  return (
    <div className="app-shell">
      <SettingsGate>
        <header className="app-header">
          <h1>Calificador</h1>
          <p>Califica trabajos de alumnos contra una rúbrica, con retroalimentación redactada en tu estilo.</p>
        </header>

        <div className="calificador-nav" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setView({ name: "subjects" })}>
            <span className="btn-label" data-label="Materias">
              Materias
            </span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setView({ name: "buscador" })}>
            <span className="btn-label" data-label="Buscador">
              Buscador
            </span>
          </button>
        </div>

        {/* Resumen de lo que se va a usar al evaluar (perfil de voz, escala, exigencia, estado de
            la IA) con enlaces a donde se edita cada cosa — reemplaza a los formularios que antes
            estaban aquí dentro. */}
        <CalificadorEffectiveSettings onOpenSettings={onOpenSettings} onOpenTraining={onOpenTraining} />

        {view.name === "subjects" && (
          <SubjectsHome
            onOpenSession={(sessionId) => setView({ name: "session", sessionId })}
            onNewSession={(subjectId) => setView({ name: "newSession", subjectId })}
          />
        )}

        {view.name === "newSession" && (
          <NewSessionContainer
            preselectedSubjectId={view.subjectId}
            onCreated={(sessionId) => setView({ name: "session", sessionId })}
            onCancel={() => setView({ name: "subjects" })}
          />
        )}

        {view.name === "session" && (
          <SessionContainer
            sessionId={view.sessionId}
            onBack={() => setView({ name: "subjects" })}
            onDeleted={() => setView({ name: "subjects" })}
            onOpenSubmission={(submissionId) => setView({ name: "submission", submissionId })}
          />
        )}

        {view.name === "submission" && (
          <SubmissionContainer
            submissionId={view.submissionId}
            onBack={(sessionId) => setView({ name: "session", sessionId })}
          />
        )}

        {view.name === "buscador" && (
          <BuscadorContainer onOpenSubmission={(submissionId) => setView({ name: "submission", submissionId })} />
        )}

      </SettingsGate>
    </div>
  );
}

function NewSessionContainer({
  preselectedSubjectId,
  onCreated,
  onCancel,
}: {
  preselectedSubjectId: string | null;
  onCreated: (sessionId: string) => void;
  onCancel: () => void;
}) {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    fetch("/api/calificador/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects ?? []));
  }, []);

  if (!subjects) return <p className="field-hint">Cargando…</p>;
  return (
    <NewSessionWizard subjects={subjects} preselectedSubjectId={preselectedSubjectId} onCreated={onCreated} onCancel={onCancel} />
  );
}

function SessionContainer({
  sessionId,
  onBack,
  onDeleted,
  onOpenSubmission,
}: {
  sessionId: string;
  onBack: () => void;
  onDeleted: () => void;
  onOpenSubmission: (submissionId: string) => void;
}) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadSession>> | null>(null);

  const load = useCallback(() => loadSession(sessionId).then(setData), [sessionId]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <p className="field-hint">Cargando sesión…</p>;
  return (
    <SessionView
      initialSession={data.session}
      subjectName={data.subject?.name ?? "—"}
      contents={data.contents}
      initialQueue={data.queue}
      onBack={onBack}
      onDeleted={onDeleted}
      onOpenSubmission={onOpenSubmission}
    />
  );
}

async function loadSession(sessionId: string) {
  const [sessionRes, queueRes] = await Promise.all([
    fetch(`/api/calificador/sessions/${sessionId}`).then((r) => r.json()),
    fetch(`/api/calificador/sessions/${sessionId}/queue`).then((r) => r.json()),
  ]);
  return { session: sessionRes.session, subject: sessionRes.subject, contents: sessionRes.contents, queue: queueRes };
}

function SubmissionContainer({
  submissionId,
  onBack,
}: {
  submissionId: string;
  onBack: (sessionId: string) => void;
}) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadEvaluation>> | null>(null);

  const load = useCallback(() => loadEvaluation(submissionId).then(setData), [submissionId]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <p className="field-hint">Cargando trabajo…</p>;
  return (
    <EvaluationDetail
      submission={data.submission}
      evaluation={data.evaluation}
      criteria={data.criteria}
      session={data.session}
      subjectName={data.subject?.name ?? "—"}
      onBack={() => onBack(data.session.id)}
      onRegraded={() => onBack(data.session.id)}
    />
  );
}

async function loadEvaluation(submissionId: string) {
  const res = await fetch(`/api/calificador/submissions/${submissionId}/evaluation`);
  return res.json();
}

function BuscadorContainer({ onOpenSubmission }: { onOpenSubmission: (submissionId: string) => void }) {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    fetch("/api/calificador/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects ?? []));
  }, []);

  if (!subjects) return <p className="field-hint">Cargando…</p>;
  return (
    <HistorySearch subjects={subjects} initialSubjectId="" initialStudentQuery="" onOpenSubmission={onOpenSubmission} />
  );
}
