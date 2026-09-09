export type AcademicLevel = "licenciatura" | "maestria" | "tfm";

/** Rol que el usuario asigna a un documento al subirlo: además del material general (PDF de
 * clase), puede marcar un archivo como sus ideas clave (se prioriza en la síntesis), su hoja de
 * datos para el caso práctico, o la programación semanal del curso. */
export type DocumentRole = "material" | "ideas-clave" | "excel-practica" | "programacion-semanal";

export type DocumentSourceKind = "pdf" | "docx" | "xlsx";

export interface DocumentPageText {
  page: number;
  text: string;
  charCount: number;
}

/** Una hoja de un Excel de práctica, preservada como filas estructuradas (no aplanada a prosa)
 * para que el caso práctico pueda citar cifras reales en vez de inventarlas. */
export interface DocumentTableSheet {
  sheet: string;
  headers: string[];
  rows: string[][];
}

export interface ProcessedDocument {
  documentId: string;
  fileName: string;
  storedFileName: string;
  sizeBytes: number;
  pageCount: number;
  pages: DocumentPageText[];
  totalExtractedChars: number;
  hasSufficientText: boolean;
  warning?: string;
  role: DocumentRole;
  sourceKind: DocumentSourceKind;
  tableRows?: DocumentTableSheet[];
}

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  fileName: string;
  startPage: number;
  endPage: number;
  text: string;
}

export interface ChunkSummary {
  chunkId: string;
  documentId: string;
  fileName: string;
  startPage: number;
  endPage: number;
  keyConcepts: string[];
  objectives: string[];
  examples: string[];
  activities: string[];
  data: string[];
  references: string[];
  rawExcerpt: string;
}

export type JobStatus = "queued" | "extracting" | "analyzing" | "generating" | "downloading" | "done" | "error";

/** Fase real dentro de la generación de un curso completo — lo que la interfaz muestra como
 * texto ("Preparando documentos", "Generando presentación 3 de 12"...). Es información añadida:
 * `JobStatus` sigue siendo el estado grueso que consumen los demás flujos sin cambios. */
export type GenerationPhase =
  | "validating"
  | "preparing-sources"
  | "planning-course"
  | "generating-content"
  | "building-powerpoint"
  | "saving-files"
  | "completed"
  | "failed";

/** Resultado terminal de un curso. `partial` = algunas presentaciones se generaron y otras no
 * (se pueden reintentar solo las fallidas, sin rehacer las que ya existen). */
export type CourseJobOutcome = "queued" | "running" | "completed" | "partial" | "failed";

export type PresentationJobState =
  | "pending"
  | "generating-content"
  | "validating-content"
  | "building-pptx"
  | "completed"
  | "failed";

export interface PresentationJobItem {
  weekNumber: number;
  title: string;
  deckType: string;
  state: PresentationJobState;
  presentationId?: string;
  error?: string;
}

/** Detalle de un job de "generar todo el curso". Opcional en `JobRecord` a propósito: los otros
 * cinco tipos de job (clase suelta, minicasos, entrenamiento, modelo local, 5 modalidades) no lo
 * llenan y siguen funcionando exactamente igual. */
export interface CourseJobDetail {
  courseId: string;
  outcome: CourseJobOutcome;
  phase: GenerationPhase;
  totalPresentations: number;
  completedPresentations: number;
  failedPresentations: number;
  currentPresentation?: { weekNumber: number; title: string; index: number };
  items: PresentationJobItem[];
  /** Modo con el que se generó: la interfaz debe dejar claro si el contenido es simulado. */
  simulated: boolean;
  /** Proveedor de IA efectivo ("anthropic" | "gemini" | "local"). La interfaz lo muestra porque
   * el rendimiento cambia por órdenes de magnitud entre uno y otro. */
  provider?: string;
  /** Aviso de viabilidad medido, p. ej. cuando el proveedor local haría el curso inabordable. */
  providerWarning?: string;
  startedAt?: string;
  finishedAt?: string;
}

/** Los jobs viven en memoria de proceso Y se escriben en SQLite (ver lib/jobs/jobRunner.ts) — la
 * copia persistida es la que permite recuperar el seguimiento tras recargar la página o
 * reiniciar el servidor. Ya no llevan sessionId porque no hay más sesiones: cada job pertenece al
 * único usuario local. */
export interface JobRecord {
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  resultId?: string;
  /** Solo para jobs de generación masiva (ver bulkPresentationsController.ts): un
   * presentationId por modalidad generada, p. ej. `{ "primera-clase": "...", "normal": "..." }`. */
  resultIds?: Record<string, string>;
  error?: string;
  /** Presente solo en jobs de "generar todo el curso". */
  course?: CourseJobDetail;
  createdAt: string;
  updatedAt: string;
}
