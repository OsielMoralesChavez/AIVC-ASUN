import type { AcademicLevel, GradeScale } from "./types";

// ============================================================
// Perfil institucional de calificación (portado del Calificador, ver
// lib/calificador/**). Institución, escala y niveles académicos NO los elige
// el profesor: son propiedad de la institución para la que se compila esta
// versión, fijos en código a propósito.
//
// `evaluations.final_grade` (lib/calificador/db/evaluations.ts) se guarda en
// las unidades de la escala vigente; si la escala cambiara después de
// calificar, todo el historial quedaría reinterpretado contra una escala
// distinta (un 8.5/10 pasaría a leerse como 8.5/100). Fijándola, ese
// problema no puede ocurrir. Solo aplica al dominio de calificación — no
// afecta presentaciones ni entrenamiento de tono de voz.
// ============================================================

export interface InstitutionProfile {
  id: string;
  institutionName: string;
  gradeScale: GradeScale;
  feedbackLanguage: string;
  academicLevels: AcademicLevel[];
}

const UNIR_ACADEMIC_LEVELS: AcademicLevel[] = [
  {
    id: "licenciatura",
    label: "Licenciatura",
    rigor:
      "Exige calidad proporcional al nivel formativo: comprensión correcta de los conceptos, aplicación adecuada, redacción clara y fuentes pertinentes. No exijas rigor de posgrado.",
  },
  {
    id: "maestria",
    label: "Maestría",
    rigor:
      "Exige mayor profundidad de análisis, rigor metodológico, calidad de fuentes (académicas y actuales) y redacción impecable. Un trabajo meramente descriptivo o superficial no alcanza los niveles altos de la rúbrica.",
  },
];

const SCALE_0_10: GradeScale = {
  label: "0 a 10",
  max: 10,
  min: 0,
  decimals: 1,
  passingGrade: 6,
};

export const INSTITUTION_PROFILES: Record<string, InstitutionProfile> = {
  "unir-mx": {
    id: "unir-mx",
    institutionName: "UNIR México",
    gradeScale: SCALE_0_10,
    feedbackLanguage: "es-MX",
    academicLevels: UNIR_ACADEMIC_LEVELS,
  },
};

export const ACTIVE_INSTITUTION_ID = "unir-mx";

export const ACTIVE_INSTITUTION: InstitutionProfile = INSTITUTION_PROFILES[ACTIVE_INSTITUTION_ID];
