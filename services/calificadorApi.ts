import { downloadFile, apiFetch } from "./httpClient";
import type {
  Evaluation,
  EvaluationCriterion,
  GradingLogic,
  RubricParsed,
  Session,
  Subject,
  SubmissionWithFiles,
} from "../lib/calificador/types";
import type { SessionQueue } from "../lib/calificador/db/queue";
import type { SearchResult } from "../lib/calificador/db/search";

const BASE = "/api/calificador";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error de red");
  return data as T;
}

export interface SubjectWithSessions extends Subject {
  sessions: Session[];
}

export async function listSubjects(): Promise<SubjectWithSessions[]> {
  const res = await apiFetch(`${BASE}/subjects`);
  const data = await json<{ subjects: SubjectWithSessions[] }>(res);
  return data.subjects;
}

export async function createSubject(name: string): Promise<Subject> {
  const res = await apiFetch(`${BASE}/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await json<{ subject: Subject }>(res);
  return data.subject;
}

export async function deleteSubject(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/subjects/${id}`, { method: "DELETE" });
  await json(res);
}

export interface NewSessionInput {
  subject_id: string;
  name: string;
  level: string;
  severity: number;
  work_type: "individual" | "grupal";
  files_per_submission: number;
}

export async function createSession(input: NewSessionInput): Promise<Session> {
  const res = await apiFetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await json<{ session: Session }>(res);
  return data.session;
}

export async function getSession(id: string): Promise<{ session: Session; subject?: Subject }> {
  const res = await apiFetch(`${BASE}/sessions/${id}`);
  return json(res);
}

export async function deleteSession(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/sessions/${id}`, { method: "DELETE" });
  await json(res);
}

export async function uploadSessionFile(
  sessionId: string,
  kind: "rubrica" | "instrucciones",
  file: File
): Promise<Session> {
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file);
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/files`, { method: "POST", body: formData });
  const data = await json<{ session: Session }>(res);
  return data.session;
}

export async function extractRubric(
  sessionId: string
): Promise<{ session: Session; rubric_parsed: RubricParsed; grading_logic_proposal: GradingLogic }> {
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/extract-rubric`, { method: "POST" });
  return json(res);
}

export async function saveGradingLogic(sessionId: string, gradingLogic: GradingLogic): Promise<Session> {
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/grading-logic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grading_logic: gradingLogic }),
  });
  const data = await json<{ session: Session }>(res);
  return data.session;
}

export interface UploadSubmissionGroup {
  student_names: string;
  files: number[];
}

export async function uploadSubmissions(
  sessionId: string,
  files: File[],
  groups: UploadSubmissionGroup[]
): Promise<{ submissions: SubmissionWithFiles[]; warning?: string }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("groups", JSON.stringify(groups));
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/submissions`, { method: "POST", body: formData });
  return json(res);
}

export async function getQueue(sessionId: string): Promise<SessionQueue> {
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/queue`);
  return json(res);
}

export async function controlQueue(sessionId: string, action: "start" | "pause") {
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return json(res);
}

export interface EvaluationDetail {
  submission: SubmissionWithFiles;
  evaluation: Evaluation;
  criteria: EvaluationCriterion[];
  session?: Session;
  subject?: Subject;
}

export async function getEvaluation(submissionId: string): Promise<EvaluationDetail> {
  const res = await apiFetch(`${BASE}/submissions/${submissionId}/evaluation`);
  return json(res);
}

export async function saveEvaluationEdits(
  submissionId: string,
  patch: { general_feedback: string; criteria: { id: string; awarded_points: number; feedback: string }[] }
): Promise<{ evaluation: Evaluation; criteria: EvaluationCriterion[] }> {
  const res = await apiFetch(`${BASE}/submissions/${submissionId}/evaluation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return json(res);
}

export async function retrySubmission(submissionId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/submissions/${submissionId}/retry`, { method: "POST" });
  await json(res);
}

export interface NameDetection {
  names: string[];
  name: string;
  confidence: "alta" | "media" | "baja";
  source: string;
  model?: string;
}

/** Escanea la portada de un archivo AÚN SIN SUBIR (dentro de una sesión) para prellenar el nombre. */
export async function detectNameFromFile(sessionId: string, file: File): Promise<NameDetection> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch(`${BASE}/sessions/${sessionId}/detect-name`, { method: "POST", body: formData });
  return json(res);
}

/** Reescanea la portada de un trabajo YA subido y actualiza su nombre. */
export async function detectNameForSubmission(
  submissionId: string
): Promise<{ submission: SubmissionWithFiles; detected: boolean; name: string }> {
  const res = await apiFetch(`${BASE}/submissions/${submissionId}/detect-name`, { method: "POST" });
  return json(res);
}

export async function searchHistory(filters: { subjectId?: string; studentQuery?: string }): Promise<SearchResult[]> {
  const params = new URLSearchParams();
  if (filters.subjectId) params.set("materia", filters.subjectId);
  if (filters.studentQuery) params.set("alumno", filters.studentQuery);
  const res = await apiFetch(`${BASE}/buscar?${params.toString()}`);
  const data = await json<{ results: SearchResult[] }>(res);
  return data.results;
}

export async function downloadBackup(): Promise<void> {
  await downloadFile(`${BASE}/respaldo`, `respaldo-calificador-${new Date().toISOString().slice(0, 10)}.zip`);
}

export async function restoreBackup(file: File): Promise<{ ok: true }> {
  const formData = new FormData();
  formData.append("archivo", file);
  const res = await apiFetch(`${BASE}/respaldo`, { method: "POST", body: formData });
  return json(res);
}

export interface AjustesData {
  teacherTitle: string;
  teacherName: string;
  aiProvider: "anthropic" | "gemini" | "local";
  imageGenerationEnabled: boolean;
  geminiModel: string;
  geminiThrottleMs: number;
  anthropicApiKeyMasked: string;
  geminiApiKeyMasked: string;
  geminiApiKeyPaidMasked: string;
}

export async function getAjustes(): Promise<AjustesData> {
  const res = await apiFetch(`${BASE}/ajustes`);
  const data = await json<{ settings: AjustesData }>(res);
  return data.settings;
}

export interface AjustesPatch {
  teacherTitle?: string;
  teacherName?: string;
  aiProvider?: "anthropic" | "gemini" | "local";
  anthropicApiKey?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  geminiThrottleMs?: number;
}

export async function saveAjustes(patch: AjustesPatch): Promise<void> {
  const res = await apiFetch(`${BASE}/ajustes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  await json(res);
}

export async function testGeminiKey(apiKey: string, model?: string): Promise<{ ok: boolean; error?: string; model?: string }> {
  const res = await apiFetch("/api/setup/probar-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, model }),
  });
  const data = await res.json();
  return data.data ?? data;
}

export async function downloadSubmissionExport(submissionId: string, formato: "docx" | "pdf", fileName: string) {
  await downloadFile(`${BASE}/submissions/${submissionId}/export?formato=${formato}`, fileName);
}

export async function downloadSessionExport(
  sessionId: string,
  tipo: "excel" | "zip",
  formato: "docx" | "pdf",
  fileName: string
) {
  const query = tipo === "excel" ? "tipo=excel" : `tipo=zip&formato=${formato}`;
  await downloadFile(`${BASE}/sessions/${sessionId}/export?${query}`, fileName);
}
