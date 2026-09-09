"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/components/calificador-orig/SettingsProvider";
import { formatGrade } from "@/lib/calificador/grading/logic";
import type { SearchResult } from "@/lib/calificador/db/search";
import type { Subject } from "@/lib/calificador/types";

export function HistorySearch({
  subjects,
  initialSubjectId,
  initialStudentQuery,
  onOpenSubmission,
}: {
  subjects: Subject[];
  initialSubjectId: string;
  initialStudentQuery: string;
  onOpenSubmission: (submissionId: string) => void;
}) {
  const { gradeScale } = useSettings();
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [studentQuery, setStudentQuery] = useState(initialStudentQuery);
  const [results, setResults] = useState<SearchResult[]>([]);

  async function applyFilters(nextSubject: string, nextStudent: string) {
    const params = new URLSearchParams();
    if (nextSubject) params.set("materia", nextSubject);
    if (nextStudent.trim()) params.set("alumno", nextStudent.trim());
    const res = await fetch(`/api/calificador/buscar${params.toString() ? `?${params}` : ""}`);
    const data = await res.json();
    setResults(data.results ?? []);
  }

  useEffect(() => {
    applyFilters(initialSubjectId, initialStudentQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buscador histórico</h1>
        <p className="text-sm text-slate-500">
          Consulta todas las calificaciones registradas por materia o alumno.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Materia
          </label>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              applyFilters(e.target.value, studentQuery);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
          >
            <option value="">Todas las materias</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-56 flex-[2]">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Alumno o integrante
          </label>
          <input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && applyFilters(subjectId, studentQuery)
            }
            placeholder="Buscar por nombre (sin importar acentos ni mayúsculas)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => applyFilters(subjectId, studentQuery)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Buscar
          </button>
          {(subjectId || studentQuery) && (
            <button
              onClick={() => {
                setSubjectId("");
                setStudentQuery("");
                applyFilters("", "");
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {results.length === 0
          ? "Sin resultados."
          : `${results.length} resultado(s).`}
      </p>

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Alumno / Equipo</th>
                <th className="px-4 py-2.5">Materia</th>
                <th className="px-4 py-2.5">Sesión</th>
                <th className="px-4 py-2.5 text-right">Calificación</th>
                <th className="px-4 py-2.5">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result.submission_id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 font-medium">
                    <button
                      type="button"
                      onClick={() => onOpenSubmission(result.submission_id)}
                      className="text-indigo-700 hover:underline"
                    >
                      {result.student_names}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {result.subject_name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {result.session_name}
                    {result.session_status === "archivada" && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        archivada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    {result.final_grade !== null
                      ? formatGrade(result.final_grade, gradeScale)
                      : "—"}
                    {result.was_edited && (
                      <span title="Editada manualmente"> ✏️</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {result.graded_at
                      ? new Date(result.graded_at).toLocaleDateString("es-MX")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
