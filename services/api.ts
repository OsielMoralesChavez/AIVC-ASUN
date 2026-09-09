import type { DocumentRole, DocumentSummary, JobRecord } from "../types/presentation";
import type { UnirDeckContent, UnirDeckType, UnirSessionInputs } from "../types/unir";
import { ApiError, downloadFile, downloadFileToDirectory, handleJsonResponse, apiFetch } from "./httpClient";

export { ApiError, chooseDownloadDirectory, isElectron } from "./httpClient";

export async function uploadDocuments(
  files: File[],
  roles: DocumentRole[],
  onUploadProgress?: (loaded: number, total: number) => void
): Promise<{ documents: DocumentSummary[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("roles", JSON.stringify(roles));

  if (onUploadProgress && typeof XMLHttpRequest !== "undefined") {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/documents");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onUploadProgress(event.loaded, event.total);
      };

      xhr.onload = () => {
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsed.data);
          } else {
            reject(
              new ApiError(
                parsed?.error?.message ?? "No se pudieron cargar los archivos.",
                parsed?.error?.code ?? "UPLOAD_ERROR",
                xhr.status
              )
            );
          }
        } catch {
          reject(new ApiError("Respuesta inesperada del servidor.", "PARSE_ERROR", xhr.status));
        }
      };

      xhr.onerror = () => reject(new ApiError("No se pudo conectar con el servidor.", "NETWORK_ERROR", 0));
      xhr.send(formData);
    });
  }

  const res = await apiFetch("/api/documents", { method: "POST", body: formData });
  return handleJsonResponse(res);
}

export interface PlanRequestInput {
  materiaId: string;
  documentIds?: string[];
  deckType: UnirDeckType;
  inputs?: UnirSessionInputs;
  sourcePresentationIds?: string[];
  voiceProfileId?: string;
}

export async function requestPresentationPlan(
  input: PlanRequestInput
): Promise<{ jobId: string; presentationId: string }> {
  const res = await apiFetch("/api/presentations/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

export async function getJob(jobId: string): Promise<JobRecord> {
  const res = await apiFetch(`/api/jobs/${jobId}`);
  return handleJsonResponse(res);
}

export interface BulkPlanRequestInput {
  materiaId: string;
  documentIds: string[];
  inputs: UnirSessionInputs;
  voiceProfileId?: string;
}

/** Genera las 5 modalidades del curso de un solo golpe (ver lib/controllers/bulkPresentationsController.ts) —
 * un solo job que produce un presentationId por modalidad, cada una ya con su .pptx construido. */
export async function requestBulkPresentationPlan(input: BulkPlanRequestInput): Promise<{ jobId: string }> {
  const res = await apiFetch("/api/presentations/plan/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

export interface StoredPresentation {
  id: string;
  deckType: UnirDeckType;
  content: UnirDeckContent;
}

export async function getPresentationPlan(presentationId: string): Promise<StoredPresentation> {
  const res = await apiFetch(`/api/presentations/${presentationId}`);
  return handleJsonResponse(res);
}

export async function updatePresentationPlan(
  presentationId: string,
  content: UnirDeckContent
): Promise<StoredPresentation> {
  const res = await apiFetch(`/api/presentations/${presentationId}/plan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  return handleJsonResponse(res);
}

export async function requestPptxGeneration(
  presentationId: string
): Promise<{ jobId: string; presentationId: string }> {
  const res = await apiFetch(`/api/presentations/${presentationId}/generate`, { method: "POST" });
  return handleJsonResponse(res);
}

export interface SessionPresentationSummary {
  id: string;
  deckType: UnirDeckType;
  title: string;
  createdAt: string;
  weekNumber?: number;
  /** `true` si el .pptx ya está construido y se puede descargar directamente. */
  hasFile?: boolean;
}

/** Todas las presentaciones del usuario, sin filtrar por materia — el controlador ya devuelve el
 * conjunto completo cuando no se manda `materiaId`. Lo usa el dashboard para su actividad y su
 * distribución, que son globales. */
export async function listAllPresentations(): Promise<SessionPresentationSummary[]> {
  const res = await apiFetch("/api/presentations");
  const data = await handleJsonResponse<{ presentations: SessionPresentationSummary[] }>(res);
  return data.presentations;
}

export async function listSessionPresentations(materiaId: string): Promise<SessionPresentationSummary[]> {
  const res = await apiFetch(`/api/presentations?materiaId=${encodeURIComponent(materiaId)}`);
  const data = await handleJsonResponse<{ presentations: SessionPresentationSummary[] }>(res);
  return data.presentations;
}

export async function downloadPresentation(presentationId: string, suggestedName: string): Promise<void> {
  await downloadFile(`/api/presentations/${presentationId}/download`, suggestedName);
}

/** Igual que `downloadPresentation`, pero escribe directamente en una carpeta ya elegida por el
 * usuario (solo Electron) — ver `services/httpClient.ts::downloadFileToDirectory`. */
export async function downloadPresentationToDirectory(presentationId: string, fileName: string, directory: string): Promise<void> {
  await downloadFileToDirectory(`/api/presentations/${presentationId}/download`, fileName, directory);
}

export interface TopicMapRequestInput {
  materiaId: string;
  subjectName?: string;
  sourcePresentationIds?: string[];
}

/** Mapa mental (HTML, interactivo) de todos los temas y subtemas cubiertos por las sesiones ya
 * generadas de la materia — mismo criterio de selección de fuente que "Generar repaso general". */
export async function requestTopicMap(input: TopicMapRequestInput): Promise<{ artifactId: string }> {
  const res = await apiFetch("/api/presentations/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

export async function downloadTopicMap(artifactId: string, suggestedName: string): Promise<void> {
  await downloadFile(`/api/presentations/mindmap/${artifactId}/download`, suggestedName);
}

/** Una semana detectada (o corregida por el usuario) en la programación semanal — ver
 * lib/controllers/scheduleBulkController.ts y lib/documents/scheduleParsing.ts. */
export interface ScheduleWeek {
  weekNumber: number;
  sessionTitle: string;
  deckType: UnirDeckType;
  durationMinutes: number;
  temaDocumentIds: string[];
  temaTitles: string[];
  learningObjectiveHint?: string;
  rawClassText?: string;
}

export interface SchedulePreviewRequestInput {
  materiaId: string;
  scheduleDocumentId: string;
  practiceDocumentId?: string;
  ideasClaveDocumentIds: string[];
}

/** Actividades con nombre propio detectadas en el documento de programación semanal (no los
 * "Test Tema N" individuales, que ya cubre `evaluationSchemeNote`) — heurística de asignación
 * equipo/individual, ver lib/documents/scheduleParsing.ts::parseActivities. */
export interface ParsedActivities {
  teamActivityDescription?: string;
  teamActivityDueDate?: string;
  individualActivityDescription?: string;
  individualActivityDueDate?: string;
}

/** Analiza los documentos ya subidos (programación semanal, Excel de práctica opcional, PDFs de
 * ideas clave) y propone la lista de semanas del curso — no genera nada todavía; el usuario debe
 * revisar/corregir el resultado antes de llamar a requestScheduleBulkPlan. */
export async function requestSchedulePreview(
  input: SchedulePreviewRequestInput
): Promise<{ weeks: ScheduleWeek[]; parsedActivities?: ParsedActivities }> {
  const res = await apiFetch("/api/presentations/schedule/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

export interface ScheduleBulkPlanRequestInput {
  materiaId: string;
  weeks: ScheduleWeek[];
  inputs: UnirSessionInputs;
  voiceProfileId?: string;
  /** Reintento: solo se regeneran las semanas que fallaron en ese job. */
  retryOfJobId?: string;
}

export interface ScheduleBulkPlanResponse {
  jobId: string;
  courseId: string;
  status: string;
  progress: number;
  totalPresentations: number;
  simulated?: boolean;
  /** `true` cuando ya había una generación en curso para esa materia y se devolvió ese mismo
   * job en vez de arrancar otro (idempotencia). */
  reused?: boolean;
}

/** Genera todas las presentaciones del curso, en orden, encadenadas — ver
 * lib/controllers/scheduleBulkController.ts. Devuelve un jobId; el resultado final trae un
 * resultIds con una clave "semana-N" por cada presentación generada. */
export async function requestScheduleBulkPlan(
  input: ScheduleBulkPlanRequestInput
): Promise<ScheduleBulkPlanResponse> {
  const res = await apiFetch("/api/presentations/schedule/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

/** Job de curso vigente (o el último) de una materia — lo consulta el asistente al montarse para
 * reengancharse al seguimiento tras una recarga de página. */
export async function getCourseJob(materiaId: string): Promise<{ job: JobRecord | null }> {
  const res = await apiFetch(`/api/materias/${materiaId}/course-job`);
  return handleJsonResponse(res);
}
