// Tipos compartidos de la aplicación (dominio Calificador)

/**
 * Nivel académico de una sesión. Es un string libre —no un enum— porque los
 * niveles los define el usuario en Ajustes (ver AcademicLevel en
 * lib/config/types.ts): una institución puede tener "Bachillerato",
 * "Doctorado" o niveles con otros nombres. El valor guardado aquí es el `id`
 * de uno de sus niveles configurados.
 */
export type Level = string;
export type WorkType = "individual" | "grupal";
export type SessionStatus = "configurando" | "activa" | "archivada";
export type QueueStatus = "pendiente" | "procesando" | "completado" | "error";
export type FileType = "docx" | "pptx" | "pdf";

export interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Nivel de desempeño de un criterio en la rúbrica (Excelente/Bueno/... si existe). */
export interface RubricLevel {
  name: string;
  description: string;
  points: number;
}

/** Criterio extraído de la rúbrica por Gemini. */
export interface RubricCriterion {
  name: string;
  description: string;
  max_points: number;
  levels: RubricLevel[];
  /**
   * true  = los puntos venían escritos en la rúbrica y se copiaron tal cual.
   * false = la rúbrica no los especificaba y la IA propuso una distribución.
   */
  points_explicit: boolean;
}

/** Estructura completa extraída de la rúbrica (se guarda en sessions.rubric_parsed). */
export interface RubricParsed {
  criteria: RubricCriterion[];
  total_points: number;
  uses_levels: boolean;
  notes: string;
}

/** Equivalencia numérica de un nivel cualitativo dentro de la lógica de calificación. */
export interface GradingLevelEquivalence {
  level_name: string;
  points: number;
}

export interface GradingCriterion {
  criterion_name: string;
  max_points: number;
  level_equivalences: GradingLevelEquivalence[];
}

/** Lógica de calificación aprobada por el usuario (sessions.grading_logic). */
export interface GradingLogic {
  criteria: GradingCriterion[];
  total_points: number;
  /**
   * Fórmula legible de conversión a la escala configurada,
   * ej. "(puntos_obtenidos / 60) × 10, redondeado a 1 decimal".
   */
  conversion_formula: string;
}

export interface Session {
  id: string;
  subject_id: string;
  name: string;
  level: Level;
  severity: number;
  work_type: WorkType;
  rubric_file_path: string | null;
  rubric_file_name: string | null;
  instructions_file_path: string | null;
  instructions_file_name: string | null;
  rubric_parsed: RubricParsed | null;
  grading_logic: GradingLogic | null;
  status: SessionStatus;
  /**
   * Cuántos archivos componen UNA entrega en esta sesión (1-3). Con más de
   * uno, la IA los evalúa juntos como un solo trabajo. Es un máximo: una
   * entrega puede tener menos.
   */
  files_per_submission: number;
  created_at: string;
  updated_at: string;
}

/** Un archivo de una entrega. Una entrega puede tener 1-3. */
export interface SubmissionFile {
  id: string;
  submission_id: string;
  file_path: string;
  file_name: string;
  file_type: FileType;
  file_order: number;
  created_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  student_names: string;
  /** Espejo del PRIMER archivo de la entrega (la lista vive en submission_files). */
  file_path: string;
  file_name: string;
  file_type: FileType;
  queue_status: QueueStatus;
  error_message: string | null;
  queue_order: number;
  created_at: string;
  updated_at: string;
}

/** Entrega con todos sus archivos (lo que consumen el runner y la UI). */
export interface SubmissionWithFiles extends Submission {
  files: SubmissionFile[];
}

export interface Evaluation {
  id: string;
  submission_id: string;
  final_grade: number;
  final_grade_original: number;
  general_feedback: string;
  general_feedback_original: string;
  was_edited: boolean;
  edited_at: string | null;
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCriterion {
  id: string;
  evaluation_id: string;
  criterion_name: string;
  criterion_order: number;
  max_points: number;
  awarded_points: number;
  awarded_points_original: number;
  level_achieved: string | null;
  feedback: string;
  feedback_original: string;
  justification: string;
  was_edited: boolean;
}

export interface VoiceProfile {
  id: string;
  sample_files: { path: string; name: string }[];
  extracted_style_notes: string | null;
  updated_at: string;
}
