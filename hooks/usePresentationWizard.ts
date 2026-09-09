"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  downloadPresentation,
  downloadTopicMap,
  getJob,
  getPresentationPlan,
  listSessionPresentations,
  requestBulkPresentationPlan,
  requestPptxGeneration,
  requestPresentationPlan,
  requestTopicMap,
  updatePresentationPlan,
  uploadDocuments,
  type SessionPresentationSummary,
} from "../services/api";
import { useBackgroundJobs } from "../components/BackgroundJobsProvider";
import type { ProgressState } from "../components/ProgressStatus";
import type { PrimeraClaseFieldValues } from "../components/PrimeraClaseFields";
import type { SessionConfigFields } from "../components/AcademicConfigStep";
import type { AcademicLevel, DocumentRole } from "../types/presentation";
import type { UnirDeckContent, UnirDeckType, UnirSessionInputs, UnirSessionType } from "../types/unir";
import type { VoiceProfileSummary } from "../types/training";
import type { WizardFile } from "../types/wizard";
import { listVoiceProfiles } from "../services/trainingApi";
import { randomLocalId } from "../utils/id";
import { MAX_FILES, validateFileBeforeUpload } from "../utils/validation";

const JOB_STAGE_MESSAGES: Record<string, string> = {
  queued: "El trabajo está en cola.",
  extracting: "Preparando fragmentos de los documentos.",
  analyzing: "Analizando el contenido de los documentos.",
  generating: "Generando el resultado.",
  done: "Completado.",
  error: "Ocurrió un error.",
};

async function pollJob(jobId: string, onUpdate: (job: { status: string; progress: number; message: string; error?: string }) => void) {
  for (;;) {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "done" || job.status === "error") return job;
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
}

const defaultConfigFields: SessionConfigFields = {
  academicLevel: null,
  durationMinutes: 90,
  institutionScope: null,
};

/** El tema de la sesión ya no se pide manualmente: se deriva del primer documento cargado. */
function deriveSessionTitle(files: WizardFile[]): string {
  const firstValid = files.find((f) => f.status === "valid" && f.hasSufficientText);
  if (!firstValid) return "Tema de la sesión";
  const baseName = firstValid.file.name.replace(/\.(pdf|docx|xlsx)$/i, "");
  const cleaned = baseName.replace(/[-_]+/g, " ").trim();
  return cleaned
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
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

export function usePresentationWizard(materiaId: string, onPresentationCreated?: () => void) {
  /** Registra el job en el seguimiento global para que siga visible aunque el docente navegue a
   * otra sección y este asistente se desmonte (ver components/BackgroundJobsProvider.tsx). */
  const backgroundJobs = useBackgroundJobs();
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  const [files, setFiles] = useState<WizardFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<DocumentRole>("material");

  const [configFields, setConfigFields] = useState<SessionConfigFields>(defaultConfigFields);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<UnirSessionType | null>(null);
  const [primeraClaseFields, setPrimeraClaseFields] = useState<PrimeraClaseFieldValues>(defaultPrimeraClaseFields);

  const [schemaProgress, setSchemaProgress] = useState<ProgressState | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [content, setContent] = useState<UnirDeckContent | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [activeDeckType, setActiveDeckType] = useState<UnirDeckType | null>(null);

  const [pptxProgress, setPptxProgress] = useState<ProgressState | null>(null);
  const [pptxError, setPptxError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);

  const [sessionPresentations, setSessionPresentations] = useState<SessionPresentationSummary[]>([]);

  const [topicMapBusy, setTopicMapBusy] = useState(false);
  const [topicMapError, setTopicMapError] = useState<string | null>(null);

  const [bulkProgress, setBulkProgress] = useState<ProgressState | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<Record<UnirDeckType, string> | null>(null);

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

  const hasUnsavedWork = useRef(false);
  hasUnsavedWork.current = Boolean(content) && !downloadReady;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWork.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const refreshSessionPresentations = useCallback(async () => {
    try {
      const list = await listSessionPresentations(materiaId);
      setSessionPresentations(list);
    } catch {
      // No es crítico: el botón de repaso simplemente no se mostrará hasta reintentar.
    }
  }, [materiaId]);

  useEffect(() => {
    refreshSessionPresentations();
  }, [refreshSessionPresentations]);

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
          role: pendingRole,
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

  const buildInputs = useCallback((): UnirSessionInputs => {
    const base: UnirSessionInputs = {
      weekNumber: 1,
      topicNumber: 1,
      sessionTitle: deriveSessionTitle(files),
      academicLevel: configFields.academicLevel as AcademicLevel,
      durationMinutes: configFields.durationMinutes,
      institutionScope: configFields.institutionScope ?? undefined,
    };
    if (sessionType === "primera-clase") {
      return {
        ...base,
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
    }
    return base;
  }, [configFields, sessionType, primeraClaseFields, files]);

  const generateSchema = useCallback(async () => {
    if (!sessionType) return;
    const documentIds = files
      .filter((f) => f.status === "valid" && f.hasSufficientText && f.documentId)
      .map((f) => f.documentId as string);

    if (documentIds.length === 0) {
      setSchemaError("Ningún documento cargado tiene texto suficiente para generar contenido.");
      return;
    }

    setSchemaError(null);
    setDownloadReady(false);
    setSchemaProgress({ status: "queued", progress: 5, message: "Solicitando generación del esquema…", busy: true });

    try {
      const { jobId, presentationId: newPresentationId } = await requestPresentationPlan({
        materiaId,
        documentIds,
        deckType: sessionType,
        inputs: buildInputs(),
        voiceProfileId: useVoiceProfile && voiceProfileId ? voiceProfileId : undefined,
      });
      backgroundJobs?.track({ jobId, label: `Clase — ${deriveSessionTitle(files)}`, section: "materias" });

      const finalJob = await pollJob(jobId, (job) => {
        setSchemaProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message || JOB_STAGE_MESSAGES[job.status] || "",
          busy: true,
        });
      });

      if (finalJob.status === "error") {
        setSchemaError(finalJob.error ?? "No se pudo generar el esquema. Intenta de nuevo.");
        setSchemaProgress(null);
        return;
      }

      const fetched = await getPresentationPlan(newPresentationId);
      setContent(fetched.content);
      setPresentationId(fetched.id);
      setActiveDeckType(fetched.deckType);
      setSchemaProgress({ status: "done", progress: 100, message: "Esquema generado.", busy: false });
      refreshSessionPresentations();
      onPresentationCreated?.();
      // Se queda en "Revisión" para mostrar la vista previa; el usuario avanza manualmente a editar.
      setMaxReachedStep((prev) => Math.max(prev, 5));
    } catch (error) {
      setSchemaError(error instanceof ApiError ? error.message : "No se pudo generar el esquema. Intenta de nuevo.");
      setSchemaProgress(null);
    }
  }, [
    sessionType,
    files,
    buildInputs,
    refreshSessionPresentations,
    useVoiceProfile,
    voiceProfileId,
    materiaId,
    onPresentationCreated,
    backgroundJobs,
  ]);

  const generateRepaso = useCallback(async () => {
    setSchemaError(null);
    setDownloadReady(false);
    setSchemaProgress({ status: "queued", progress: 5, message: "Solicitando la generación del repaso…", busy: true });

    try {
      const { jobId, presentationId: newPresentationId } = await requestPresentationPlan({
        materiaId,
        deckType: "repaso",
      });
      backgroundJobs?.track({ jobId, label: "Clase de repaso", section: "materias" });

      const finalJob = await pollJob(jobId, (job) => {
        setSchemaProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message || JOB_STAGE_MESSAGES[job.status] || "",
          busy: true,
        });
      });

      if (finalJob.status === "error") {
        setSchemaError(finalJob.error ?? "No se pudo generar el repaso. Intenta de nuevo.");
        setSchemaProgress(null);
        return;
      }

      const fetched = await getPresentationPlan(newPresentationId);
      setContent(fetched.content);
      setPresentationId(fetched.id);
      setActiveDeckType(fetched.deckType);
      setSchemaProgress({ status: "done", progress: 100, message: "Repaso generado.", busy: false });
      refreshSessionPresentations();
    } catch (error) {
      setSchemaError(error instanceof ApiError ? error.message : "No se pudo generar el repaso. Intenta de nuevo.");
      setSchemaProgress(null);
    }
  }, [refreshSessionPresentations, materiaId, backgroundJobs]);

  const generateTopicMap = useCallback(async () => {
    setTopicMapError(null);
    setTopicMapBusy(true);
    try {
      const { artifactId } = await requestTopicMap({ materiaId });
      await downloadTopicMap(artifactId, "mapa-de-temas.html");
    } catch (error) {
      setTopicMapError(error instanceof ApiError ? error.message : "No se pudo generar el mapa de temas.");
    } finally {
      setTopicMapBusy(false);
    }
  }, [materiaId]);

  const generateBulk = useCallback(async () => {
    const documentIds = files
      .filter((f) => f.status === "valid" && f.hasSufficientText && f.documentId)
      .map((f) => f.documentId as string);

    if (documentIds.length === 0) {
      setBulkError("Ningún documento cargado tiene texto suficiente para generar contenido.");
      return;
    }

    setBulkError(null);
    setBulkResults(null);
    setBulkProgress({ status: "queued", progress: 5, message: "Solicitando la generación de las 5 modalidades…", busy: true });

    try {
      // Las 5 modalidades incluyen "primera clase", así que siempre se envían sus datos aunque
      // el usuario no haya seleccionado esa modalidad en el paso 3.
      const bulkInputs: UnirSessionInputs = {
        ...buildInputs(),
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

      const { jobId } = await requestBulkPresentationPlan({
        materiaId,
        documentIds,
        inputs: bulkInputs,
        voiceProfileId: useVoiceProfile && voiceProfileId ? voiceProfileId : undefined,
      });
      backgroundJobs?.track({ jobId, label: "Las 5 modalidades de clase", section: "materias" });

      const finalJob = await pollJob(jobId, (job) => {
        setBulkProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message || JOB_STAGE_MESSAGES[job.status] || "",
          busy: true,
        });
      });

      if (finalJob.status === "error" || !finalJob.resultIds) {
        setBulkError(finalJob.error ?? "No se pudieron generar las 5 modalidades. Intenta de nuevo.");
        setBulkProgress(null);
        return;
      }

      setBulkResults(finalJob.resultIds as Record<UnirDeckType, string>);
      setBulkProgress({ status: "done", progress: 100, message: "Las 5 modalidades se generaron correctamente.", busy: false });
      refreshSessionPresentations();
      onPresentationCreated?.();
      setMaxReachedStep((prev) => Math.max(prev, 5));
    } catch (error) {
      setBulkError(error instanceof ApiError ? error.message : "No se pudieron generar las 5 modalidades. Intenta de nuevo.");
      setBulkProgress(null);
    }
  }, [
    files,
    buildInputs,
    primeraClaseFields,
    useVoiceProfile,
    voiceProfileId,
    refreshSessionPresentations,
    materiaId,
    onPresentationCreated,
    backgroundJobs,
  ]);

  const loadPresentation = useCallback(async (id: string) => {
    setDownloadReady(false);
    setPptxError(null);
    try {
      const fetched = await getPresentationPlan(id);
      setContent(fetched.content);
      setPresentationId(fetched.id);
      setActiveDeckType(fetched.deckType);
    } catch (error) {
      setSchemaError(error instanceof ApiError ? error.message : "No se pudo cargar la presentación seleccionada.");
    }
  }, []);

  /**
   * Abre una presentación YA generada y salta a su revisión.
   *
   * Es lo que faltaba cuando la generación corre en segundo plano: al volver de otra sección el
   * asistente remonta en el paso 1 con `content` vacío, así que la presentación existía en la
   * base pero no había ningún camino en la interfaz para llegar a ella, editarla ni descargarla.
   */
  const openPresentation = useCallback(
    async (id: string) => {
      await loadPresentation(id);
      advanceTo(5);
    },
    [loadPresentation, advanceTo]
  );

  const savePlan = useCallback((updated: UnirDeckContent) => {
    setContent(updated);
  }, []);

  const generatePptx = useCallback(async () => {
    if (!presentationId || !content) return;
    setPptxError(null);
    setDownloadReady(false);
    setPptxProgress({ status: "generating", progress: 10, message: "Guardando cambios del esquema…", busy: true });

    try {
      await updatePresentationPlan(presentationId, content);

      const { jobId } = await requestPptxGeneration(presentationId);
      const finalJob = await pollJob(jobId, (job) => {
        setPptxProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message || JOB_STAGE_MESSAGES[job.status] || "",
          busy: true,
        });
      });

      if (finalJob.status === "error") {
        setPptxError(finalJob.error ?? "No se pudo generar el archivo PowerPoint.");
        setPptxProgress(null);
        return;
      }

      setPptxProgress({ status: "done", progress: 100, message: "Archivo generado. Ya puedes descargarlo.", busy: false });
      setDownloadReady(true);
    } catch (error) {
      setPptxError(error instanceof ApiError ? error.message : "No se pudo generar el archivo PowerPoint.");
      setPptxProgress(null);
    }
  }, [presentationId, content]);

  const download = useCallback(async () => {
    if (!presentationId || !content) return;
    const title = content.type === "repaso" ? content.subjectName : content.sessionTitle;
    try {
      await downloadPresentation(presentationId, `${title || "presentacion"}.pptx`);
    } catch (error) {
      setPptxError(error instanceof ApiError ? error.message : "No se pudo descargar el archivo.");
    }
  }, [presentationId, content]);

  const downloadBulkItem = useCallback(async (targetPresentationId: string, title: string) => {
    try {
      await downloadPresentation(targetPresentationId, `${title || "presentacion"}.pptx`);
    } catch (error) {
      setBulkError(error instanceof ApiError ? error.message : "No se pudo descargar el archivo.");
    }
  }, []);

  const resetAll = useCallback(() => {
    setStep(1);
    setMaxReachedStep(1);
    setFiles([]);
    setUploadError(null);
    setConfigFields(defaultConfigFields);
    setDurationError(null);
    setSessionType(null);
    setPrimeraClaseFields(defaultPrimeraClaseFields);
    setSchemaProgress(null);
    setSchemaError(null);
    setContent(null);
    setPresentationId(null);
    setActiveDeckType(null);
    setPptxProgress(null);
    setPptxError(null);
    setDownloadReady(false);
  }, []);

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
    configFields,
    setConfigField,
    durationError,
    sessionType,
    setSessionType,
    primeraClaseFields,
    setPrimeraClaseField,
    schemaProgress,
    schemaError,
    generateSchema,
    generateRepaso,
    topicMapBusy,
    topicMapError,
    generateTopicMap,
    bulkProgress,
    bulkError,
    bulkResults,
    generateBulk,
    downloadBulkItem,
    content,
    activeDeckType,
    savePlan,
    pptxProgress,
    pptxError,
    generatePptx,
    downloadReady,
    download,
    resetAll,
    sessionPresentations,
    refreshSessionPresentations,
    loadPresentation,
    openPresentation,
    voiceProfiles,
    useVoiceProfile,
    setUseVoiceProfile,
    voiceProfileId,
    setVoiceProfileId,
  };
}
