export type AcademicLevel = "licenciatura" | "maestria" | "tfm";

/** Rol que el usuario asigna a un documento al subirlo — ver lib/types/presentation.ts para el
 * detalle de qué hace cada uno en la generación de contenido. */
export type DocumentRole = "material" | "ideas-clave" | "excel-practica" | "programacion-semanal";

export const DOCUMENT_ROLE_LABELS: Record<DocumentRole, string> = {
  material: "Material general",
  "ideas-clave": "Ideas clave",
  "excel-practica": "Excel de práctica",
  "programacion-semanal": "Programación semanal",
};

export interface DocumentSummary {
  documentId: string;
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  hasSufficientText: boolean;
  warning?: string;
  valid: boolean;
  errorMessage?: string;
  role: DocumentRole;
}

export type JobStatus = "queued" | "extracting" | "analyzing" | "generating" | "downloading" | "done" | "error";

/** Espejo de lib/types/presentation.ts (archivo duplicado a mano, no compartido — mismo patrón
 * ya establecido para los tipos de unir.ts). Mantener ambos en sincronía al editar. */
export type GenerationPhase =
  | "validating"
  | "preparing-sources"
  | "planning-course"
  | "generating-content"
  | "building-powerpoint"
  | "saving-files"
  | "completed"
  | "failed";

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

export interface CourseJobDetail {
  courseId: string;
  outcome: CourseJobOutcome;
  phase: GenerationPhase;
  totalPresentations: number;
  completedPresentations: number;
  failedPresentations: number;
  currentPresentation?: { weekNumber: number; title: string; index: number };
  items: PresentationJobItem[];
  simulated: boolean;
  provider?: string;
  providerWarning?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface JobRecord {
  jobId: string;
  status: JobStatus;
  progress: number;
  message: string;
  resultId?: string;
  /** Solo para jobs de generación masiva: un presentationId por modalidad generada. */
  resultIds?: Record<string, string>;
  error?: string;
  /** Presente solo en jobs de "generar todo el curso". */
  course?: CourseJobDetail;
  createdAt: string;
  updatedAt: string;
}

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  licenciatura: "Licenciatura",
  maestria: "Maestría",
  tfm: "TFM (Trabajo Fin de Máster)",
};
