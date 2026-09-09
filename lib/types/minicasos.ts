export type MinicasoAcademicLevel = "licenciatura" | "maestria";
export type BloomCaseLevel = 2 | 3 | 4 | 5 | 6;

export interface MinicasoSourceRef {
  documentId: string;
  fileName: string;
  page: number;
}

export interface MinicasoItem {
  id: string;
  scenario: string;
  options: string[];
  correctIndex: number;
  bloomLevel: BloomCaseLevel;
  topic: string;
  sourceReferences: MinicasoSourceRef[];
}

/** Ya no lleva sessionId: el banco pertenece directamente al único usuario local
 * (biblioteca permanente, ver lib/db/minicasoRepository.ts). Se genera a partir de clases
 * (presentaciones) ya generadas de la misma materia, no de documentos re-subidos — ver
 * lib/minicasos/minicasosGenerator.ts. */
export interface MinicasoBank {
  id: string;
  sourcePresentationIds: string[];
  materiaId: string | null;
  academicLevel: MinicasoAcademicLevel;
  subjectName: string;
  requestedCount: number;
  items: MinicasoItem[];
  topicsCovered: string[];
  assumptions: string[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export const BLOOM_CASE_LABELS: Record<BloomCaseLevel, string> = {
  2: "Comprender",
  3: "Aplicar",
  4: "Analizar",
  5: "Evaluar",
  6: "Crear",
};
