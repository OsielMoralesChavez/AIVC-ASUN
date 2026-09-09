"use client";

import { useState } from "react";

/**
 * Elimina una materia con todo lo que cuelga de ella.
 *
 * La confirmación dice el número exacto de sesiones y de trabajos
 * calificados que se van a perder: "¿estás seguro?" no le da a nadie la
 * información que necesita para decidir, y aquí lo que se borra puede ser un
 * semestre entero de calificaciones.
 */
export function DeleteSubjectButton({
  subjectId,
  subjectName,
  counts,
  onDeleted,
}: {
  subjectId: string;
  subjectName: string;
  counts: { sessions: number; submissions: number; graded: number };
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const lines = [`Se eliminará la materia "${subjectName}".`];
    if (counts.sessions > 0) {
      lines.push(
        `\nArrastra ${counts.sessions} ${counts.sessions === 1 ? "sesión" : "sesiones"} y ${counts.submissions} ${counts.submissions === 1 ? "trabajo" : "trabajos"}, de los cuales ${counts.graded} ${counts.graded === 1 ? "está calificado" : "están calificados"}.`
      );
      lines.push(
        "\nSe borran también las evaluaciones, la retroalimentación y los archivos que subiste."
      );
    } else {
      lines.push("\nNo tiene sesiones, así que no se pierde ningún trabajo.");
    }
    lines.push("\nEsta acción no se puede deshacer. ¿Continuar?");
    if (!confirm(lines.join("\n"))) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/calificador/subjects/${subjectId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo eliminar la materia.");
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        aria-label={`Eliminar la materia ${subjectName} y todo su contenido`}
        title="Eliminar esta materia y todo su contenido"
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
      >
        {busy ? "Eliminando…" : "🗑"}
      </button>
      {error && (
        <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
