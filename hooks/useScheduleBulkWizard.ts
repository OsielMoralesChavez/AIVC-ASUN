"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  chooseDownloadDirectory,
  getCourseJob,
  getJob,
  isElectron,
  requestScheduleBulkPlan,
  requestSchedulePreview,
  uploadDocuments,
  type ScheduleWeek,
} from "../services/api";
import type { JobRecord } from "../types/presentation";
import { downloadPresentation, downloadPresentationToDirectory } from "../services/api";
import { useBackgroundJobs } from "../components/BackgroundJobsProvider";
import type { ProgressState } from "../components/ProgressStatus";
import type { PrimeraClaseFieldValues } from "../components/PrimeraClaseFields";
import type { SessionConfigFields } from "../components/AcademicConfigStep";
import type { DocumentRole } from "../types/presentation";
import type { UnirDeckType, UnirSessionInputs } from "../types/unir";
import type { VoiceProfileSummary } from "../types/training";
import type { WizardFile } from "../types/wizard";
import { listVoiceProfiles } from "../services/trainingApi";
import { buildWeekDownloadFileName } from "../utils/downloadFileName";
import { randomLocalId } from "../utils/id";
import { MAX_FILES, validateFileBeforeUpload } from "../utils/validation";

const JOB_STAGE_MESSAGES: Record<string, string> = {
  queued: "El trabajo está en cola.",
  extracting: "Preparando la generación del curso completo.",
  analyzing: "Generando las presentaciones del curso.",
  generating: "Finalizando.",
  done: "Completado.",
  error: "Ocurrió un error.",
};

const POLL_INTERVAL_MS = 2000;

/**
 * Consulta el job hasta que alcanza un estado terminal. `shouldStop` corta el bucle cuando el
 * componente se desmonta: eso cancela SOLO el seguimiento en el navegador, nunca el trabajo del
 * backend (que sigue corriendo y se puede volver a enganchar al recargar, ver `resumeActiveJob`).
 *
 * Un error de red puntual no aborta el seguimiento: se reintenta en el siguiente ciclo. Solo un
 * 404 (job inexistente) se considera definitivo.
 */
async function pollJob(
  jobId: string,
  onUpdate: (job: JobRecord) => void,
  shouldStop: () => boolean
): Promise<JobRecord | null> {
  let consecutiveNetworkErrors = 0;
  for (;;) {
    if (shouldStop()) return null;
    try {
      const job = await getJob(jobId);
      consecutiveNetworkErrors = 0;
      onUpdate(job);
      if (job.status === "done" || job.status === "error") return job;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw error;
      consecutiveNetworkErrors += 1;
      if (consecutiveNetworkErrors >= 10) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

const PHASE_LABELS: Record<string, string> = {
  validating: "Validando la materia",
  "preparing-sources": "Preparando documentos",
  "planning-course": "Planeando las clases",
  "generating-content": "Generando contenido",
  "building-powerpoint": "Construyendo archivo PowerPoint",
  "saving-files": "Guardando archivos",
  completed: "Completado",
  failed: "Con errores",
};

const defaultConfigFields: SessionConfigFields = {
  academicLevel: null,
  durationMinutes: 90,
  institutionScope: null,
};

const SCHEDULE_NAME_HINT = /programaci|cronograma|calendario/i;

/** El selector de rol de DocumentUploadStep aplica un solo rol a todo el lote que se suelta —
 * si el usuario suelta la programación semanal, el Excel y los PDFs de tema juntos (lo natural,
 * dado que el checklist los pide a la vez), todos quedarían con el mismo rol y scheduleDocumentId
 * nunca se detectaría. Por eso, para esta pantalla, el rol de la programación y del Excel se
 * infiere del nombre/extensión del archivo sin depender de lo que esté seleccionado en el
 * dropdown; solo se cae al rol elegido manualmente cuando el archivo no es claramente uno de
 * esos dos (típicamente un PDF de "Tema", que sigue siendo "ideas-clave" por defecto). */
function inferDocumentRole(fileName: string, fallback: DocumentRole): DocumentRole {
  if (/\.xlsx?$/i.test(fileName)) return "excel-practica";
  if (SCHEDULE_NAME_HINT.test(fileName)) return "programacion-semanal";
  return fallback;
}

const defaultPrimeraClaseFields: PrimeraClaseFieldValues = {
  teacherName: "",
  teacherTitle: "",
  teacherFormation: "",
  teacherExperience: "",
  teacherSpecialty: "",
  teacherContact: "",
  teamActivityDescription: "",
  teamActivityDueDate: "",
  individualActivityDescription: "",
  individualActivityDueDate: "",
  forumDescription: "",
};

/** Asistente para generar TODAS las presentaciones de un curso de una sola vez, a partir de una
 * programación semanal en PDF (+ PDFs de ideas clave por tema + Excel de práctica opcional). Ver
 * lib/controllers/scheduleBulkController.ts para el detalle de detección/generación. */
export function useScheduleBulkWizard(materiaId: string, materiaName: string, onPresentationCreated?: () => void) {
  /** Ver components/BackgroundJobsProvider.tsx: mantiene visible el progreso del curso aunque el
   * docente se vaya a otra sección mientras se genera. */
  const backgroundJobs = useBackgroundJobs();
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  const [files, setFiles] = useState<WizardFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<DocumentRole>("ideas-clave");

  const [weeks, setWeeks] = useState<ScheduleWeek[]>([]);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [courseName, setCourseName] = useState(materiaName);
  const [configFields, setConfigFields] = useState<SessionConfigFields>(defaultConfigFields);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [primeraClaseFields, setPrimeraClaseFields] = useState<PrimeraClaseFieldValues>(defaultPrimeraClaseFields);

  const [generateProgress, setGenerateProgress] = useState<ProgressState | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string> | null>(null);
  /** Detalle en vivo del curso (fase, contadores, estado por presentación) — es lo que permite
   * mostrar "Generando presentación 3 de 12" y "2 necesitan reintentarse". */
  const [courseJob, setCourseJob] = useState<JobRecord | null>(null);
  /** Evita envíos duplicados por doble clic. Un ref, no un estado: debe leerse de forma síncrona
   * dentro del propio handler, antes de que React vuelva a renderizar. */
  const generatingRef = useRef(false);
  /** Solo detiene el seguimiento en el navegador al desmontar — nunca el job del backend. */
  const unmountedRef = useRef(false);
  /** Evita que dos bucles de polling queden vivos a la vez (p. ej. reenganche + generación). */
  const pollingJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  const applyJob = useCallback(
    (job: JobRecord) => {
      setCourseJob(job);
      const course = job.course;
      const phaseLabel = course ? PHASE_LABELS[course.phase] : undefined;
      const detail =
        course?.currentPresentation && course.phase !== "completed" && course.phase !== "failed"
          ? `${phaseLabel}: ${course.currentPresentation.index} de ${course.totalPresentations} — ${course.currentPresentation.title}`
          : job.message || JOB_STAGE_MESSAGES[job.status] || phaseLabel || "";

      if (job.status === "done") {
        setResults(job.resultIds ?? null);
        setGenerateProgress({
          status: "done",
          progress: 100,
          message: "El curso completo se generó correctamente.",
          busy: false,
        });
        return;
      }
      if (job.status === "error") {
        // Un curso parcial conserva sus presentaciones buenas: se muestran igual, junto al aviso
        // de cuántas hay que reintentar.
        if (job.resultIds && Object.keys(job.resultIds).length > 0) setResults(job.resultIds);
        setGenerateError(job.error ?? "No se pudieron generar las presentaciones del curso.");
        setGenerateProgress(null);
        return;
      }
      setGenerateProgress({
        status: job.status as ProgressState["status"],
        progress: job.progress,
        message: detail,
        busy: true,
      });
    },
    []
  );

  const trackJob = useCallback(
    async (jobId: string) => {
      // Seguimiento global: sobrevive a que este asistente se desmonte al cambiar de sección.
      backgroundJobs?.track({ jobId, label: `Curso completo — ${materiaName}`, section: "materias" });
      if (pollingJobIdRef.current === jobId) return;
      pollingJobIdRef.current = jobId;
      try {
        const finalJob = await pollJob(jobId, applyJob, () => unmountedRef.current);
        if (finalJob && finalJob.status === "done") onPresentationCreated?.();
        if (finalJob && finalJob.status === "error") onPresentationCreated?.();
      } catch (error) {
        setGenerateError(
          error instanceof ApiError ? error.message : "Se perdió la conexión con el servidor durante la generación."
        );
        setGenerateProgress(null);
      } finally {
        pollingJobIdRef.current = null;
      }
    },
    [applyJob, onPresentationCreated, backgroundJobs, materiaName]
  );

  /** Al montar, se pregunta al backend si esta materia tiene una generación en curso (o la última
   * terminada) y se retoma el seguimiento — así recargar la página no pierde el trabajo. */
  useEffect(() => {
    let cancelled = false;
    getCourseJob(materiaId)
      .then(({ job }) => {
        if (cancelled || !job) return;
        applyJob(job);
        if (job.status !== "done" && job.status !== "error") {
          generatingRef.current = true;
          void trackJob(job.jobId).finally(() => {
            generatingRef.current = false;
          });
        }
      })
      .catch(() => {
        // No poder reenganchar un job previo no debe impedir arrancar uno nuevo.
      });
    return () => {
      cancelled = true;
    };
  }, [materiaId, applyJob, trackJob]);

  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfileSummary[]>([]);
  const [useVoiceProfile, setUseVoiceProfile] = useState(false);
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null);

  useEffect(() => {
    listVoiceProfiles()
      .then((profiles) => {
        setVoiceProfiles(profiles);
        if (profiles.length > 0) setVoiceProfileId((prev) => prev ?? profiles[0].id);
      })
      .catch(() => {
        // Si falla, simplemente no se ofrece la opción de aplicar un perfil de tono.
      });
  }, []);

  const goToStep = useCallback(
    (target: number) => {
      if (target <= maxReachedStep) setStep(target);
    },
    [maxReachedStep]
  );

  const advanceTo = useCallback((target: number) => {
    setStep(target);
    setMaxReachedStep((prev) => Math.max(prev, target));
  }, []);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setUploadError(null);
      const availableSlots = MAX_FILES - files.length;
      if (availableSlots <= 0) {
        setUploadError(`Ya alcanzaste el máximo de ${MAX_FILES} archivos.`);
        return;
      }
      const toProcess = incoming.slice(0, availableSlots);
      if (incoming.length > availableSlots) {
        setUploadError(`Solo se agregaron ${availableSlots} archivo(s); se alcanzó el máximo de ${MAX_FILES}.`);
      }

      const newEntries: WizardFile[] = toProcess.map((file) => {
        const clientError = validateFileBeforeUpload(file);
        return {
          localId: randomLocalId(),
          file,
          status: clientError ? "invalid" : "uploading",
          clientError: clientError ?? undefined,
          role: inferDocumentRole(file.name, pendingRole),
        };
      });

      setFiles((prev) => [...prev, ...newEntries]);

      const uploadable = newEntries.filter((e) => !e.clientError);
      if (uploadable.length === 0) return;

      try {
        const result = await uploadDocuments(
          uploadable.map((e) => e.file),
          uploadable.map((e) => e.role)
        );
        setFiles((prev) =>
          prev.map((item) => {
            const idx = uploadable.findIndex((u) => u.localId === item.localId);
            if (idx === -1) return item;
            const doc = result.documents[idx];
            if (!doc) return item;
            return {
              ...item,
              status: doc.valid ? "valid" : "invalid",
              documentId: doc.documentId || undefined,
              pageCount: doc.pageCount,
              hasSufficientText: doc.hasSufficientText,
              warning: doc.warning,
              errorMessage: doc.errorMessage,
            };
          })
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((item) =>
            uploadable.some((u) => u.localId === item.localId)
              ? { ...item, status: "invalid", errorMessage: "No se pudo cargar el archivo. Intenta de nuevo." }
              : item
          )
        );
        setUploadError(error instanceof ApiError ? error.message : "No se pudo conectar con el servidor.");
      }
    },
    [files.length, pendingRole]
  );

  const removeFile = useCallback((localId: string) => {
    setFiles((prev) => prev.filter((f) => f.localId !== localId));
  }, []);

  const scheduleDocumentId = files.find((f) => f.role === "programacion-semanal" && f.documentId)?.documentId;
  const practiceDocumentId = files.find((f) => f.role === "excel-practica" && f.documentId)?.documentId;
  const ideasClaveDocumentIds = files.filter((f) => f.role === "ideas-clave" && f.documentId).map((f) => f.documentId as string);

  const runPreview = useCallback(async () => {
    if (!scheduleDocumentId) {
      setPreviewError("Carga el PDF de la programación semanal (rol «Programación semanal») antes de continuar.");
      return;
    }
    if (ideasClaveDocumentIds.length === 0) {
      setPreviewError("Carga al menos un PDF de ideas clave (rol «Ideas clave») antes de continuar.");
      return;
    }
    setPreviewError(null);
    setPreviewBusy(true);
    try {
      const { weeks: detected, parsedActivities } = await requestSchedulePreview({
        materiaId,
        scheduleDocumentId,
        practiceDocumentId,
        ideasClaveDocumentIds,
      });
      setWeeks(detected);
      if (parsedActivities) {
        setPrimeraClaseFields((prev) => ({
          ...prev,
          teamActivityDescription: prev.teamActivityDescription || parsedActivities.teamActivityDescription || "",
          teamActivityDueDate: prev.teamActivityDueDate || parsedActivities.teamActivityDueDate || "",
          individualActivityDescription:
            prev.individualActivityDescription || parsedActivities.individualActivityDescription || "",
          individualActivityDueDate: prev.individualActivityDueDate || parsedActivities.individualActivityDueDate || "",
        }));
      }
      advanceTo(2);
    } catch (error) {
      setPreviewError(error instanceof ApiError ? error.message : "No se pudo analizar la programación semanal.");
    } finally {
      setPreviewBusy(false);
    }
  }, [materiaId, scheduleDocumentId, practiceDocumentId, ideasClaveDocumentIds, advanceTo]);

  const updateWeek = useCallback(<K extends keyof ScheduleWeek>(weekNumber: number, key: K, value: ScheduleWeek[K]) => {
    setWeeks((prev) => prev.map((w) => (w.weekNumber === weekNumber ? { ...w, [key]: value } : w)));
  }, []);

  /** Quita una semana detectada que el usuario no quiere generar (ej. duplicada o mal
   * detectada) — no vuelve a numerar las semanas restantes, `weekNumber` sigue siendo el de la
   * programación real. */
  const removeWeek = useCallback((weekNumber: number) => {
    setWeeks((prev) => prev.filter((w) => w.weekNumber !== weekNumber));
  }, []);

  const setConfigField = useCallback(<K extends keyof SessionConfigFields>(key: K, value: SessionConfigFields[K]) => {
    setConfigFields((prev) => ({ ...prev, [key]: value }));
    if (key === "durationMinutes") {
      const minutes = value as number;
      setDurationError(!Number.isFinite(minutes) || minutes < 10 || minutes > 600 ? "Ingresa una duración entre 10 y 600 minutos." : null);
    }
  }, []);

  const setPrimeraClaseField = useCallback(
    <K extends keyof PrimeraClaseFieldValues>(key: K, value: PrimeraClaseFieldValues[K]) => {
      setPrimeraClaseFields((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const runGenerate = useCallback(async (retryOfJobId?: string) => {
    if (weeks.length === 0) return;
    // Guardia contra doble clic / doble envío: mientras haya una generación en curso en esta
    // pantalla, no se manda otra petición (el backend además es idempotente por materia).
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenerateError(null);
    setResults(null);
    setGenerateProgress({ status: "queued", progress: 5, message: "Solicitando la generación del curso completo…", busy: true });

    try {
      const inputs: UnirSessionInputs = {
        courseName: courseName || undefined,
        weekNumber: 1,
        topicNumber: 1,
        sessionTitle: weeks[0]?.sessionTitle ?? "Sesión",
        academicLevel: configFields.academicLevel!,
        durationMinutes: configFields.durationMinutes,
        institutionScope: configFields.institutionScope ?? undefined,
        teacherName: primeraClaseFields.teacherName || undefined,
        teacherTitle: primeraClaseFields.teacherTitle || undefined,
        teacherFormation: primeraClaseFields.teacherFormation || undefined,
        teacherExperience: primeraClaseFields.teacherExperience || undefined,
        teacherSpecialty: primeraClaseFields.teacherSpecialty || undefined,
        teacherContact: primeraClaseFields.teacherContact || undefined,
        teamActivityDescription: primeraClaseFields.teamActivityDescription || undefined,
        teamActivityDueDate: primeraClaseFields.teamActivityDueDate || undefined,
        individualActivityDescription: primeraClaseFields.individualActivityDescription || undefined,
        individualActivityDueDate: primeraClaseFields.individualActivityDueDate || undefined,
        forumDescription: primeraClaseFields.forumDescription || undefined,
      };

      const { jobId } = await requestScheduleBulkPlan({
        materiaId,
        weeks,
        inputs,
        voiceProfileId: useVoiceProfile && voiceProfileId ? voiceProfileId : undefined,
        retryOfJobId,
      });

      await trackJob(jobId);
    } catch (error) {
      setGenerateError(error instanceof ApiError ? error.message : "No se pudieron generar las presentaciones del curso.");
      setGenerateProgress(null);
    } finally {
      generatingRef.current = false;
    }
  }, [weeks, courseName, configFields, primeraClaseFields, materiaId, useVoiceProfile, voiceProfileId, trackJob]);

  /** Reintenta únicamente las presentaciones que fallaron: las que ya se generaron bien se
   * conservan (el backend las reusa por `retryOfJobId`, no las regenera ni las duplica). */
  const retryFailed = useCallback(() => {
    const failedJobId = courseJob?.jobId;
    if (!failedJobId) return;
    void runGenerate(failedJobId);
  }, [courseJob?.jobId, runGenerate]);

  const downloadResult = useCallback(
    async (weekNumber: number, topic: string, presentationId: string) => {
      try {
        await downloadPresentation(presentationId, buildWeekDownloadFileName(weekNumber, topic, primeraClaseFields.teacherName));
      } catch (error) {
        setGenerateError(error instanceof ApiError ? error.message : "No se pudo descargar el archivo.");
      }
    },
    [primeraClaseFields.teacherName]
  );

  const downloadAllResults = useCallback(async () => {
    if (!results) return;
    setGenerateError(null);

    // App de escritorio: un solo diálogo nativo para elegir la carpeta, y cada archivo se
    // escribe ahí directamente (sin N descargas de navegador una por una).
    if (isElectron()) {
      const directory = await chooseDownloadDirectory();
      if (!directory) return; // el usuario canceló el diálogo
      for (const week of weeks) {
        const presentationId = results[`semana-${week.weekNumber}`];
        if (!presentationId) continue;
        try {
          await downloadPresentationToDirectory(
            presentationId,
            buildWeekDownloadFileName(week.weekNumber, week.sessionTitle, primeraClaseFields.teacherName),
            directory
          );
        } catch (error) {
          setGenerateError(error instanceof ApiError ? error.message : `No se pudo guardar la semana ${week.weekNumber}.`);
        }
      }
      return;
    }

    // Navegador normal (ej. `npm run dev` sin Electron): sin acceso a un diálogo nativo de
    // carpeta, se cae de vuelta a descargas de navegador una por una.
    for (const week of weeks) {
      const presentationId = results[`semana-${week.weekNumber}`];
      if (!presentationId) continue;
      try {
        await downloadPresentation(
          presentationId,
          buildWeekDownloadFileName(week.weekNumber, week.sessionTitle, primeraClaseFields.teacherName)
        );
      } catch (error) {
        setGenerateError(error instanceof ApiError ? error.message : `No se pudo descargar la semana ${week.weekNumber}.`);
      }
      // Pequeña espera entre descargas: los navegadores bloquean/preguntan si se disparan muchas
      // descargas seguidas en el mismo tick.
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }, [results, weeks, primeraClaseFields.teacherName]);

  return {
    step,
    maxReachedStep,
    goToStep,
    advanceTo,
    files,
    uploadError,
    addFiles,
    removeFile,
    pendingRole,
    setPendingRole,
    scheduleDocumentId,
    practiceDocumentId,
    ideasClaveDocumentIds,
    weeks,
    updateWeek,
    removeWeek,
    previewBusy,
    previewError,
    runPreview,
    courseName,
    setCourseName,
    configFields,
    setConfigField,
    durationError,
    primeraClaseFields,
    setPrimeraClaseField,
    generateProgress,
    generateError,
    results,
    runGenerate,
    courseJob,
    retryFailed,
    /** `true` mientras haya una generación activa para esta materia — deshabilita el botón. */
    generationActive: Boolean(
      courseJob && courseJob.status !== "done" && courseJob.status !== "error"
    ),
    downloadResult,
    downloadAllResults,
    voiceProfiles,
    useVoiceProfile,
    setUseVoiceProfile,
    voiceProfileId,
    setVoiceProfileId,
  };
}

export type { ScheduleWeek, UnirDeckType };
