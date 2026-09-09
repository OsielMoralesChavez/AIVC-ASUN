"use client";

import { useCallback, useEffect, useState } from "react";
import { useSettings } from "./SettingsProvider";
import { NewSubjectButton } from "./NewSubjectButton";
import { DeleteSubjectButton } from "./DeleteSubjectButton";
import type { Session, Subject } from "@/lib/calificador/types";

interface SubjectWithSessions extends Subject {
  sessions: Session[];
  counts: { sessions: number; submissions: number; graded: number };
}

const STATUS_STYLE: Record<string, string> = {
  configurando: "bg-amber-100 text-amber-800",
  activa: "bg-emerald-100 text-emerald-800",
  archivada: "bg-slate-200 text-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  configurando: "Configurando",
  activa: "Activa",
  archivada: "Archivada",
};

/**
 * Puerto cliente de `app/(app)/page.tsx` del Calificador original — mismo JSX y lógica, solo el
 * fetch de datos pasa de una Server Component a un `useEffect`, y los `<Link>` de navegación se
 * cambian por callbacks (esta app no tiene rutas reales, ver views/CalificadorPage.tsx).
 */
export function SubjectsHome({
  onOpenSession,
  onNewSession,
}: {
  onOpenSession: (sessionId: string) => void;
  onNewSession: (subjectId: string | null) => void;
}) {
  const { academicLevels } = useSettings();
  const [subjects, setSubjects] = useState<SubjectWithSessions[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/calificador/subjects");
    const data = await res.json();
    setSubjects(data.subjects ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const levelLabel = (id: string) =>
    academicLevels.find((level) => level.id === id)?.label ?? id;

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materias</h1>
          <p className="text-sm text-slate-500">
            Selecciona una sesión de trabajo o crea una nueva.
          </p>
        </div>
        <NewSubjectButton onCreated={refresh} />
      </div>

      {subjects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">
            Aún no hay materias. Crea la primera con el botón{" "}
            <strong>Nueva materia</strong>.
          </p>
        </div>
      )}

      {subjects.map((subject) => {
        const active = subject.sessions.filter((s) => s.status !== "archivada");
        const archived = subject.sessions.filter((s) => s.status === "archivada");
        return (
          <section
            key={subject.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-800">{subject.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNewSession(subject.id)}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  + Nueva sesión
                </button>
                <DeleteSubjectButton
                  subjectId={subject.id}
                  subjectName={subject.name}
                  counts={subject.counts}
                  onDeleted={refresh}
                />
              </div>
            </div>
            <div className="space-y-2">
              {active.length === 0 && archived.length === 0 && (
                <p className="text-sm text-slate-500">Sin sesiones todavía.</p>
              )}
              {active.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  levelLabel={levelLabel(session.level)}
                  onOpen={() => onOpenSession(session.id)}
                />
              ))}
            </div>
            {archived.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                  Archivadas ({archived.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {archived.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      levelLabel={levelLabel(session.level)}
                      onOpen={() => onOpenSession(session.id)}
                    />
                  ))}
                </div>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SessionRow({
  session,
  levelLabel,
  onOpen,
}: {
  session: Session;
  levelLabel: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="text-left">
        <p className="font-medium text-slate-900">{session.name}</p>
        <p className="text-xs text-slate-500">
          {levelLabel} · {session.work_type === "individual" ? "Individual" : "Grupal"} · Severidad {session.severity}/5
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[session.status]}`}>
        {STATUS_LABEL[session.status]}
      </span>
    </button>
  );
}
