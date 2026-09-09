"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/components/calificador-orig/SettingsProvider";
import {
  formatGrade,
  formatGradeWithScale,
  isPassing,
} from "@/lib/calificador/grading/logic";
import type { QueueSubmission, SessionQueue } from "@/lib/calificador/db/queue";

type DetectionState = "pendiente" | "detectando" | "listo" | "fallido";
type NameConfidence = "alta" | "media" | "baja";

/** Un archivo aún sin subir, ya escaneado y asignado a una entrega. */
interface PendingFile {
  id: string;
  file: File;
  detection: DetectionState;
  /** Nombres que la IA leyó en la portada de ESTE archivo. */
  detectedNames: string[];
  confidence: NameConfidence | null;
  /** Dónde encontró el nombre, o por qué no lo encontró. */
  note: string | null;
  /** Entrega a la que pertenece; null = sin asignar. */
  groupId: string | null;
}

/** Una entrega en preparación: un alumno o equipo con sus 1-3 archivos. */
interface PendingGroup {
  id: string;
  studentNames: string;
  /** Integrantes normalizados detectados, para emparejar archivos nuevos. */
  members: string[];
  /** Si el profesor escribió el nombre a mano, la detección ya no lo pisa. */
  manualName: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  procesando: "Procesando…",
  completado: "Completado",
  error: "Error",
};

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-600",
  procesando: "bg-blue-100 text-blue-700 animate-pulse",
  completado: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-700",
};

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

/** Referencia estable para los grupos sin archivos: evita crear un array por consulta. */
const SIN_ARCHIVOS: PendingFile[] = [];

/**
 * Mismo tope que aplica el servidor (MAX_WORK_FILE_BYTES). Se revisa tambien
 * aqui para no gastar una llamada de escaneo de portada —y cinco segundos de
 * throttle— en un archivo que la subida va a rechazar de todas formas.
 */
const MAX_FILE_BYTES = 60 * 1024 * 1024;

/** Quita la extensión de un nombre de archivo (respaldo si no se detecta nada). */
function suggestName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Dos archivos son del mismo equipo si comparten al menos un nombre completo
 * (dos palabras o más). Un solo apellido suelto no basta: se repite demasiado
 * entre alumnos distintos.
 */
function sharesMember(a: string[], b: string[]): boolean {
  const full = (names: string[]) =>
    names.map(normalizeName).filter((n) => n.split(" ").length >= 2);
  const setB = new Set(full(b));
  return full(a).some((name) => setB.has(name));
}

export function SubmissionsPanel({
  sessionId,
  workType,
  filesPerSubmission,
  archived,
  initialQueue,
  onOpenSubmission,
}: {
  sessionId: string;
  workType: "individual" | "grupal";
  filesPerSubmission: number;
  archived: boolean;
  /** Cola ya resuelta al abrir la sesión (ver hooks/useCalificador.ts). */
  initialQueue: SessionQueue;
  onOpenSubmission: (submissionId: string) => void;
}) {
  const [submissions, setSubmissions] = useState<QueueSubmission[]>(
    initialQueue.submissions
  );
  const [runner, setRunner] = useState<SessionQueue["runner"] | null>(
    initialQueue.runner
  );
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [groups, setGroups] = useState<PendingGroup[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [zipFormat, setZipFormat] = useState<"docx" | "pdf">("docx");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** id del trabajo de la tabla con una acción en curso (renombrar/detectar/eliminar). */
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const multiFile = filesPerSubmission > 1;
  const { gradeScale } = useSettings();

  /** Calificación con su escala para los mensajes de confirmación. */
  const gradeText = (grade: number | null) =>
    grade === null ? "—" : formatGradeWithScale(grade, gradeScale);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/calificador/sessions/${sessionId}/queue`);
      if (!res.ok) return;
      const data = await res.json();
      setSubmissions(data.submissions);
      setRunner(data.runner);
    } catch {
      // Silencio en errores de red del polling; el siguiente ciclo reintenta
    }
  }, [sessionId]);

  // Sondeo: 2.5s mientras corre la cola, 8s en reposo.
  //
  // Con la ventana oculta no se pide nada. La aplicación se queda abierta todo
  // el día en la computadora del profesor, y sondear en segundo plano solo
  // gasta batería para pintar algo que nadie está viendo. Al volver a
  // mostrarse se refresca de inmediato, así que la pausa no se nota.
  useEffect(() => {
    const visible = () =>
      typeof document === "undefined" || document.visibilityState === "visible";

    const tick = () => {
      if (visible()) void refresh();
    };

    tick();
    const interval = setInterval(tick, runner?.running ? 2500 : 8000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh, runner?.running]);

  const patchPending = useCallback((id: string, patch: Partial<PendingFile>) => {
    setPendingFiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  // Espejos para poder decidir la agrupación con el estado vigente sin
  // encadenar setStates (la detección es secuencial: entre archivo y archivo
  // siempre hay un render de por medio).
  const groupsRef = useRef<PendingGroup[]>([]);
  const filesRef = useRef<PendingFile[]>([]);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);
  useEffect(() => {
    filesRef.current = pendingFiles;
  }, [pendingFiles]);

  /**
   * Coloca un archivo ya escaneado en una entrega: lo une a la que comparte
   * integrantes (si aún tiene cupo) o abre una nueva. Si no se detectó ningún
   * nombre y la sesión es multi-archivo, el archivo queda sin asignar para
   * que el profesor lo coloque a mano.
   */
  const placeInGroup = useCallback(
    (fileId: string, names: string[], fallbackName: string) => {
      const currentGroups = groupsRef.current;
      const currentFiles = filesRef.current;
      let targetId: string | null = null;
      let updatedGroups = currentGroups;

      if (names.length > 0) {
        const match = currentGroups.find(
          (group) =>
            sharesMember(names, group.members) &&
            currentFiles.filter((f) => f.groupId === group.id).length <
              filesPerSubmission
        );
        if (match) {
          targetId = match.id;
          // Un archivo puede traer la lista más completa de integrantes.
          const merged = Array.from(new Set([...match.members, ...names]));
          updatedGroups = currentGroups.map((group) =>
            group.id === match.id
              ? {
                  ...group,
                  members: merged,
                  studentNames: group.manualName
                    ? group.studentNames
                    : merged.join(", "),
                }
              : group
          );
        }
      }

      if (!targetId) {
        if (names.length === 0 && multiFile) return; // queda sin asignar
        const created: PendingGroup = {
          id: nextId("g"),
          studentNames: names.length > 0 ? names.join(", ") : fallbackName,
          members: names,
          manualName: false,
        };
        targetId = created.id;
        updatedGroups = [...updatedGroups, created];
      }

      setGroups(updatedGroups);
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, groupId: targetId } : f))
      );
    },
    [filesPerSubmission, multiFile]
  );

  /**
   * Escanea la portada de cada archivo para saber de quién es. Va de uno en
   * uno (la API está throttleada) y coloca cada archivo en su entrega en
   * cuanto llega su resultado.
   */
  const detectNames = useCallback(
    async (items: PendingFile[]) => {
      for (const item of items) {
        patchPending(item.id, { detection: "detectando", note: null });
        try {
          const formData = new FormData();
          formData.append("file", item.file);
          const res = await fetch(`/api/calificador/sessions/${sessionId}/detect-name`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Error al escanear la portada");

          const names: string[] = Array.isArray(data.names) ? data.names : [];
          patchPending(item.id, {
            detection: names.length > 0 ? "listo" : "fallido",
            detectedNames: names,
            confidence: names.length > 0 ? (data.confidence ?? null) : null,
            note:
              names.length > 0
                ? data.source || null
                : data.source ||
                  "No se encontró ningún nombre de alumno en la portada.",
          });
          placeInGroup(item.id, names, suggestName(item.file.name));
        } catch (err) {
          patchPending(item.id, {
            detection: "fallido",
            detectedNames: [],
            confidence: null,
            note: err instanceof Error ? err.message : "Error al escanear la portada",
          });
          placeInGroup(item.id, [], suggestName(item.file.name));
        }
      }
    },
    [patchPending, placeInGroup, sessionId]
  );

  function addFiles(files: FileList | File[]) {
    const all = Array.from(files);
    const badFormat = all.filter((f) => !/\.(docx|pptx|pdf)$/i.test(f.name));
    const tooBig = all.filter(
      (f) => /\.(docx|pptx|pdf)$/i.test(f.name) && f.size > MAX_FILE_BYTES
    );
    const list = all.filter(
      (f) => /\.(docx|pptx|pdf)$/i.test(f.name) && f.size <= MAX_FILE_BYTES
    );

    const avisos: string[] = [];
    if (badFormat.length > 0) {
      avisos.push(
        `${badFormat.length} archivo(s) ignorado(s): solo se admiten .docx, .pptx y .pdf`
      );
    }
    if (tooBig.length > 0) {
      avisos.push(
        `${tooBig.length} archivo(s) ignorado(s) por pesar más de ${MAX_FILE_BYTES / 1024 / 1024} MB: ${tooBig.map((f) => f.name).join(", ")}`
      );
    }
    setError(avisos.length > 0 ? avisos.join(". ") : null);
    if (list.length === 0) return;

    const added: PendingFile[] = list.map((file) => ({
      id: nextId("f"),
      file,
      detection: "pendiente",
      detectedNames: [],
      confidence: null,
      note: null,
      groupId: null,
    }));
    setPendingFiles((prev) => [...prev, ...added]);
    void detectNames(added);
  }

  // Un solo recorrido de los archivos por render, en vez de uno por cada
  // consulta de grupo. Además la lista que recibe cada grupo mantiene su
  // identidad entre renders mientras no cambie, así que React no vuelve a
  // pintar los grupos que no se movieron.
  const filesByGroup = useMemo(() => {
    const map = new Map<string, PendingFile[]>();
    for (const file of pendingFiles) {
      if (file.groupId === null) continue;
      const list = map.get(file.groupId);
      if (list) list.push(file);
      else map.set(file.groupId, [file]);
    }
    return map;
  }, [pendingFiles]);

  function filesOfGroup(groupId: string): PendingFile[] {
    return filesByGroup.get(groupId) ?? SIN_ARCHIVOS;
  }

  function moveFile(fileId: string, target: string) {
    if (target === "nueva") {
      const file = pendingFiles.find((f) => f.id === fileId);
      const created: PendingGroup = {
        id: nextId("g"),
        studentNames: file
          ? file.detectedNames.join(", ") || suggestName(file.file.name)
          : "",
        members: file?.detectedNames ?? [],
        manualName: false,
      };
      setGroups((prev) => [...prev, created]);
      patchPending(fileId, { groupId: created.id });
      return;
    }
    patchPending(fileId, { groupId: target === "sin-asignar" ? null : target });
  }

  function removePendingFile(fileId: string) {
    setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  // Las entregas que se quedan sin archivos desaparecen solas.
  useEffect(() => {
    setGroups((prev) =>
      prev.filter((group) => pendingFiles.some((f) => f.groupId === group.id))
    );
  }, [pendingFiles]);

  async function handleUpload() {
    const unassigned = pendingFiles.filter((f) => f.groupId === null);
    if (unassigned.length > 0) {
      setError(
        `Hay ${unassigned.length} archivo(s) sin asignar a una entrega. Colócalos o quítalos antes de continuar.`
      );
      return;
    }
    const usedGroups = groups.filter((g) => filesOfGroup(g.id).length > 0);
    if (usedGroups.length === 0) {
      setError("No hay ninguna entrega que subir.");
      return;
    }
    if (usedGroups.some((g) => !g.studentNames.trim())) {
      setError(
        workType === "grupal"
          ? "Escribe los integrantes de cada equipo antes de agregar."
          : "Escribe el nombre del alumno de cada entrega antes de agregar."
      );
      return;
    }
    const excess = usedGroups.find(
      (g) => filesOfGroup(g.id).length > filesPerSubmission
    );
    if (excess) {
      setError(
        `La entrega de "${excess.studentNames}" tiene ${filesOfGroup(excess.id).length} archivos y esta sesión admite hasta ${filesPerSubmission}.`
      );
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      const ordered: string[] = [];
      for (const pending of pendingFiles) {
        formData.append("files", pending.file);
        ordered.push(pending.id);
      }
      formData.append(
        "groups",
        JSON.stringify(
          usedGroups.map((group) => ({
            student_names: group.studentNames.trim(),
            files: filesOfGroup(group.id).map((f) => ordered.indexOf(f.id)),
          }))
        )
      );
      const res = await fetch(`/api/calificador/sessions/${sessionId}/submissions`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir trabajos");
      if (data.warning) setError(data.warning);
      setPendingFiles([]);
      setGroups([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUploading(false);
    }
  }

  async function queueAction(action: "start" | "pause") {
    setError(null);
    const res = await fetch(`/api/calificador/sessions/${sessionId}/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al controlar la cola");
      return;
    }
    setRunner(data.runner);
    await refresh();
  }

  async function handleRetry(submissionId: string) {
    setError(null);
    const res = await fetch(`/api/calificador/submissions/${submissionId}/retry`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Error al reintentar");
    await refresh();
  }

  /**
   * Vuelve a evaluar con IA un trabajo YA calificado. Es destructivo:
   * reemplaza la evaluación actual, incluidas las ediciones manuales.
   */
  async function handleRegrade(submission: QueueSubmission) {
    const warning = submission.was_edited
      ? `"${submission.student_names}" tiene una evaluación EDITADA MANUALMENTE por ti (calificación ${gradeText(submission.final_grade)}).\n\nAl recalificar con IA se perderán esos cambios y se generará una evaluación nueva desde cero.\n\n¿Continuar?`
      : `Se volverá a evaluar "${submission.student_names}" con la IA usando la configuración actual de la sesión (severidad, rúbrica y perfil de voz).\n\nLa evaluación actual (${gradeText(submission.final_grade)}) será reemplazada.\n\n¿Continuar?`;
    if (!confirm(warning)) return;
    await handleRetry(submission.id);
  }

  /** Escanea de nuevo la portada de un trabajo ya subido y corrige el ALUMNO. */
  async function handleDetectRow(submission: QueueSubmission) {
    setError(null);
    setNotice(null);
    setBusyId(submission.id);
    try {
      const res = await fetch(`/api/calificador/submissions/${submission.id}/detect-name`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al escanear la portada");
      setNotice(
        data.detected
          ? `Nombre detectado: "${data.name}" (confianza ${data.confidence}). ${data.source ?? ""}`.trim()
          : `No se encontró ningún nombre de alumno en la portada de "${submission.file_name}"; el nombre actual no se modificó.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al escanear la portada");
    } finally {
      setBusyId(null);
    }
  }

  async function saveRename(submissionId: string) {
    const value = renameValue.trim();
    if (!value) {
      setError("El nombre del alumno no puede quedar vacío.");
      return;
    }
    setError(null);
    setBusyId(submissionId);
    try {
      const res = await fetch(`/api/calificador/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_names: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al renombrar");
      setRenamingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al renombrar");
    } finally {
      setBusyId(null);
    }
  }

  /** Elimina un trabajo de la cola (con o sin calificación) y sus archivos. */
  async function handleDelete(submission: QueueSubmission) {
    const fileCount = submission.files.length || 1;
    const detail =
      submission.final_grade !== null
        ? `Se eliminará "${submission.student_names}" JUNTO CON SU EVALUACIÓN (calificación ${gradeText(submission.final_grade)}${submission.was_edited ? ", editada manualmente" : ""}).`
        : `Se eliminará "${submission.student_names}" de la cola.`;
    if (
      !confirm(
        `${detail}\n\nTambién se borrará${fileCount > 1 ? "n sus " + fileCount + " archivos" : ` el archivo "${submission.file_name}"`} de la carpeta de datos.\n\nEsta acción no se puede deshacer. ¿Continuar?`
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusyId(submission.id);
    try {
      const res = await fetch(`/api/calificador/submissions/${submission.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar el trabajo");
      setNotice(`Trabajo de "${submission.student_names}" eliminado.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el trabajo");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = submissions.filter(
    (s) => s.queue_status === "pendiente"
  ).length;
  const completedCount = submissions.filter(
    (s) => s.queue_status === "completado"
  ).length;
  const running = runner?.running ?? false;
  const detecting = pendingFiles.some(
    (p) => p.detection === "pendiente" || p.detection === "detectando"
  );
  // Un archivo que aún se está escaneando no está "sin asignar": todavía no
  // se sabe de quién es. Se muestra aparte para no alarmar al profesor.
  const scanningFiles = pendingFiles.filter(
    (f) =>
      f.groupId === null &&
      (f.detection === "pendiente" || f.detection === "detectando")
  );
  const unassignedFiles = pendingFiles.filter(
    (f) =>
      f.groupId === null &&
      f.detection !== "pendiente" &&
      f.detection !== "detectando"
  );
  const activeGroups = groups.filter((g) => filesOfGroup(g.id).length > 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Trabajos ({submissions.length})
          </h2>
          <p
            aria-live="polite"
            className="mt-1 text-sm font-medium text-blue-700 empty:mt-0"
          >
            {runner?.progressMessage ? `⏳ ${runner.progressMessage}` : ""}
          </p>
        </div>
        {!archived && submissions.length > 0 && (
          <div className="flex gap-2">
            {!running && pendingCount > 0 && (
              <button
                onClick={() => queueAction("start")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                ▶ {submissions.some((s) => s.queue_status === "completado" || s.queue_status === "error") ? "Reanudar" : "Iniciar"} calificación ({pendingCount})
              </button>
            )}
            {running && !runner?.pauseRequested && (
              <button
                onClick={() => queueAction("pause")}
                className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                ⏸ Pausar
              </button>
            )}
            {running && runner?.pauseRequested && (
              <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
                Pausando…
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700"
        >
          {notice}
        </p>
      )}

      {/* ---------- Exports por lote ---------- */}
      {completedCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">
            Exportar sesión ({completedCount} calificados):
          </span>
          <a
            href={`/api/calificador/sessions/${sessionId}/export?tipo=excel`}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            📊 Excel consolidado
          </a>
          <a
            href={`/api/calificador/sessions/${sessionId}/export?tipo=zip&formato=${zipFormat}`}
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
          >
            🗜️ ZIP de documentos
          </a>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 text-xs">
            {(["docx", "pdf"] as const).map((format) => (
              <button
                key={format}
                onClick={() => setZipFormat(format)}
                className={`px-2.5 py-1.5 transition ${
                  zipFormat === format
                    ? "bg-slate-800 font-medium text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {format === "docx" ? "Word" : "PDF"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Zona de carga ---------- */}
      {!archived && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"
          }`}
        >
          <p className="text-sm text-slate-600">
            📥 Arrastra aquí los trabajos (.docx, .pptx, .pdf) o haz clic para
            seleccionarlos
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {multiFile
              ? `Se escaneará la portada de cada archivo y se agruparán en entregas de hasta ${filesPerSubmission} archivos.`
              : "Se escaneará la portada de cada archivo para detectar el nombre del alumno."}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".docx,.pptx,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* ---------- Entregas en preparación ---------- */}
      {pendingFiles.length > 0 && (
        <div className="mb-4 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {multiFile
                ? `${pendingFiles.length} archivo(s) en ${activeGroups.length} entrega(s) — revisa la agrupación:`
                : workType === "grupal"
                  ? "Integrantes detectados en la portada (revisa y corrige si hace falta):"
                  : "Nombre del alumno detectado en la portada (revisa y corrige si hace falta):"}
            </p>
            {detecting && (
              <span className="text-xs text-slate-500">
                Escaneando portadas…
              </span>
            )}
          </div>

          {activeGroups.map((group) => {
            const groupFiles = filesOfGroup(group.id);
            const excess = groupFiles.length > filesPerSubmission;
            return (
              <div
                key={group.id}
                className={`rounded-lg border bg-white p-3 ${
                  excess ? "border-red-300" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={group.studentNames}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((g) =>
                          g.id === group.id
                            ? {
                                ...g,
                                studentNames: e.target.value,
                                manualName: true,
                              }
                            : g
                        )
                      )
                    }
                    placeholder={
                      workType === "grupal"
                        ? "Ana López, Juan Pérez, …"
                        : "Nombre del alumno"
                    }
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium focus:border-indigo-500"
                  />
                  {multiFile && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        excess
                          ? "bg-red-100 text-red-700"
                          : groupFiles.length < filesPerSubmission
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {groupFiles.length} de {filesPerSubmission}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1.5">
                  {groupFiles.map((pending) => (
                    <PendingFileRow
                      key={pending.id}
                      pending={pending}
                      groups={activeGroups}
                      multiFile={multiFile}
                      onMove={moveFile}
                      onRemove={removePendingFile}
                    />
                  ))}
                </div>

                {excess && (
                  <p className="mt-2 text-xs text-red-600">
                    Esta entrega excede el máximo de {filesPerSubmission}{" "}
                    archivos de la sesión. Mueve los sobrantes a otra entrega.
                  </p>
                )}
              </div>
            );
          })}

          {scanningFiles.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-medium text-slate-600">
                Escaneando portada ({scanningFiles.length} pendiente
                {scanningFiles.length > 1 ? "s" : ""})…
              </p>
              <div className="space-y-1.5">
                {scanningFiles.map((pending) => (
                  <PendingFileRow
                    key={pending.id}
                    pending={pending}
                    groups={activeGroups}
                    multiFile={multiFile}
                    onMove={moveFile}
                    onRemove={removePendingFile}
                  />
                ))}
              </div>
            </div>
          )}

          {unassignedFiles.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-white p-3">
              <p className="mb-2 text-sm font-medium text-amber-800">
                Sin asignar ({unassignedFiles.length}) — no se detectó a quién
                pertenecen; colócalos en una entrega.
              </p>
              <div className="space-y-1.5">
                {unassignedFiles.map((pending) => (
                  <PendingFileRow
                    key={pending.id}
                    pending={pending}
                    groups={activeGroups}
                    multiFile={multiFile}
                    onMove={moveFile}
                    onRemove={removePendingFile}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={handleUpload}
              disabled={uploading || detecting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading
                ? "Subiendo…"
                : detecting
                  ? "Escaneando portadas…"
                  : `Agregar ${activeGroups.length} entrega(s) a la cola`}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Cola de calificación ---------- */}
      {submissions.length === 0 ? (
        <p className="text-sm text-slate-500">
          {archived
            ? "Esta sesión no tiene trabajos."
            : "Aún no hay trabajos en la cola."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">
                  {workType === "grupal" ? "Integrantes" : "Alumno"}
                </th>
                <th className="px-4 py-2">Archivos</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2 text-right">Calificación</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {renamingId === submission.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveRename(submission.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-56 rounded-lg border border-indigo-400 px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => void saveRename(submission.id)}
                          disabled={busyId === submission.id}
                          className="rounded-lg border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                          aria-label="Guardar el nombre"
                          title="Guardar"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                          aria-label="Cancelar el renombrado"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {submission.queue_status === "completado" ? (
                          <button
                            type="button"
                            onClick={() => onOpenSubmission(submission.id)}
                            className="text-indigo-700 hover:underline"
                          >
                            {submission.student_names}
                          </button>
                        ) : (
                          submission.student_names
                        )}
                        {!archived && (
                          <>
                            <button
                              onClick={() => {
                                setRenameValue(submission.student_names);
                                setRenamingId(submission.id);
                              }}
                              aria-label={`Corregir a mano el nombre de ${submission.student_names}`}
                              title="Corregir el nombre a mano"
                              className="text-slate-500 transition hover:text-indigo-600"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => void handleDetectRow(submission)}
                              disabled={busyId === submission.id}
                              aria-label={`Detectar el nombre en la portada de ${submission.file_name}`}
                              title="Detectar el nombre escaneando la portada del archivo"
                              className="text-slate-500 transition hover:text-indigo-600 disabled:opacity-40"
                            >
                              {busyId === submission.id ? "…" : "🔍"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="max-w-56 px-4 py-2.5 text-slate-500">
                    <span
                      className="block truncate"
                      title={
                        submission.files.length > 0
                          ? submission.files.map((f) => f.file_name).join("\n")
                          : submission.file_name
                      }
                    >
                      {submission.file_name}
                    </span>
                    {submission.files.length > 1 && (
                      <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        +{submission.files.length - 1} archivo(s) más
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[submission.queue_status]}`}
                    >
                      {STATUS_LABEL[submission.queue_status]}
                    </span>
                    {submission.queue_status === "error" &&
                      submission.error_message && (
                        <p
                          className="mt-1 max-w-72 text-xs text-red-600"
                          title={submission.error_message}
                        >
                          {submission.error_message.slice(0, 140)}
                          {submission.error_message.length > 140 && "…"}
                        </p>
                      )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    {submission.final_grade !== null ? (
                      <>
                        <span
                          className={
                            isPassing(submission.final_grade, gradeScale)
                              ? "text-emerald-700"
                              : "text-red-600"
                          }
                          title={
                            isPassing(submission.final_grade, gradeScale)
                              ? `Aprobado (mínimo ${gradeScale.passingGrade})`
                              : `Reprobado (mínimo ${gradeScale.passingGrade})`
                          }
                        >
                          {formatGrade(submission.final_grade, gradeScale)}
                        </span>
                        {submission.was_edited && (
                          <span title="Editada manualmente"> ✏️</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {submission.queue_status === "error" && !archived && (
                        <button
                          onClick={() => handleRetry(submission.id)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          ↻ Reintentar
                        </button>
                      )}
                      {submission.queue_status === "completado" && (
                        <>
                          {!archived && (
                            <button
                              onClick={() => handleRegrade(submission)}
                              disabled={running}
                              title="Volver a evaluar este trabajo con IA"
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                            >
                              ↻ Recalificar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenSubmission(submission.id)}
                            className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50"
                          >
                            Ver detalle
                          </button>
                        </>
                      )}
                      {!archived && submission.queue_status !== "procesando" && (
                        <button
                          onClick={() => void handleDelete(submission)}
                          disabled={busyId === submission.id}
                          title="Eliminar este trabajo (y su evaluación) definitivamente"
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        >
                          🗑 Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Un archivo dentro de una entrega en preparación. */
function PendingFileRow({
  pending,
  groups,
  multiFile,
  onMove,
  onRemove,
}: {
  pending: PendingFile;
  groups: PendingGroup[];
  multiFile: boolean;
  onMove: (fileId: string, target: string) => void;
  onRemove: (fileId: string) => void;
}) {
  const scanning =
    pending.detection === "pendiente" || pending.detection === "detectando";

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
      <span className="flex-1 truncate text-xs text-slate-600" title={pending.file.name}>
        📄 {pending.file.name}
      </span>
      <DetectionBadge pending={pending} />
      {multiFile && !scanning && (
        <select
          value={pending.groupId ?? "sin-asignar"}
          onChange={(e) => onMove(pending.id, e.target.value)}
          title="Mover este archivo a otra entrega"
          className="max-w-40 rounded-lg border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-600 focus:border-indigo-500"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.studentNames.slice(0, 40) || "(sin nombre)"}
            </option>
          ))}
          <option value="nueva">➕ Nueva entrega</option>
          <option value="sin-asignar">Sin asignar</option>
        </select>
      )}
      <button
        onClick={() => onRemove(pending.id)}
        className="px-1 text-slate-500 hover:text-red-600"
        aria-label={`Quitar ${pending.file.name} de la lista`}
        title="Quitar de la lista"
      >
        ✕
      </button>
    </div>
  );
}

/** Resultado del escaneo de portada de un archivo, en corto. */
function DetectionBadge({ pending }: { pending: PendingFile }) {
  if (pending.detection === "pendiente" || pending.detection === "detectando") {
    return (
      <span className="shrink-0 text-xs text-slate-500">🔍 Escaneando…</span>
    );
  }
  if (pending.detection === "fallido") {
    return (
      <span
        className="shrink-0 text-xs text-amber-700"
        title={pending.note ?? undefined}
      >
        ⚠ Sin nombre en la portada
      </span>
    );
  }
  const lowConfidence = pending.confidence !== "alta";
  return (
    <span
      className={`shrink-0 text-xs ${lowConfidence ? "text-amber-700" : "text-emerald-700"}`}
      title={`${pending.detectedNames.join(", ")}${pending.note ? ` · ${pending.note}` : ""}`}
    >
      {lowConfidence ? "⚠" : "✨"} {pending.detectedNames.length} nombre(s) ·
      confianza {pending.confidence}
    </span>
  );
}
