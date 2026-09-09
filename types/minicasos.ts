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

export interface MinicasoBankSummary {
  id: string;
  subjectName: string;
  academicLevel: MinicasoAcademicLevel;
  itemCount: number;
  createdAt: string;
}

export const BLOOM_CASE_LABELS: Record<BloomCaseLevel, string> = {
  2: "Comprender",
  3: "Aplicar",
  4: "Analizar",
  5: "Evaluar",
  6: "Crear",
};

export const MINICASO_LEVEL_LABELS: Record<MinicasoAcademicLevel, string> = {
  licenciatura: "Licenciatura",
  maestria: "Maestría",
};
