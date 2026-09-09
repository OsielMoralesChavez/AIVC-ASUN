/** Catador de clases: sube un video de una sesión y lo evalúa contra una rúbrica. */

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  /** Puntaje máximo de este criterio — permite pesar criterios distintos dentro de la misma rúbrica. */
  maxScore: number;
}

export interface Rubric {
  id: string;
  name: string;
  criteria: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
}

export interface CriterionScore {
  criterionId: string;
  score: number;
  justification: string;
}

export type ReviewStatus = "pending" | "processing" | "done" | "error";

export interface ClassReview {
  id: string;
  rubricId: string;
  videoFileName: string;
  status: ReviewStatus;
  /** Síntesis de lo observado en el video — no la transcripción palabra por palabra. */
  transcriptSummary: string | null;
  scores: CriterionScore[];
  overallScore: number | null;
  overallNotes: string | null;
  error: string | null;
  /** `true` si se generó sin IA en vivo (sin Gemini configurado) — los puntajes son placeholders. */
  simulated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassReviewSummary {
  id: string;
  rubricId: string;
  rubricName: string;
  videoFileName: string;
  status: ReviewStatus;
  overallScore: number | null;
  simulated: boolean;
  createdAt: string;
}

export interface CatadorSettings {
  /** Carpeta (OneDrive/red) donde se escribe el Excel al pulsar «Actualizar». El control de acceso
   * a esas dos personas lo maneja la carpeta compartida, no la aplicación. */
  excelFolderPath: string;
  powerBi: {
    tenantId: string;
    clientId: string;
    hasClientSecret: boolean;
    workspaceId: string;
    datasetName: string;
    tableName: string;
  };
}

export interface CatadorSettingsPatch {
  excelFolderPath?: string;
  powerBi?: {
    tenantId?: string;
    clientId?: string;
    /** `""` borra la guardada; ausente = no tocarla; texto = reemplazarla. */
    clientSecret?: string;
    workspaceId?: string;
    datasetName?: string;
    tableName?: string;
  };
}

export interface UpdateRunResult {
  excelPath: string | null;
  excelError: string | null;
  powerBiConfigured: boolean;
  powerBiPushed: boolean;
  powerBiError: string | null;
  reviewCount: number;
}
