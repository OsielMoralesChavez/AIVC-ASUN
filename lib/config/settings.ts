import type { AppSettings } from "./types";

/**
 * Solo el tipo público.
 *
 * En la aplicación real este módulo lee y escribe los ajustes en SQLite. La versión de escaparate
 * no tiene base de datos, así que conserva únicamente la forma que las pantallas del Calificador
 * importan (siempre con `import type`, que desaparece al compilar).
 */
export interface PublicSettings {
  teacherTitle: string;
  teacherName: string;
  institutionName: string;
  gradeScale: AppSettings["gradeScale"];
  academicLevels: AppSettings["academicLevels"];
  feedbackLanguage: string;
  defaultLevelId: string;
  defaultSeverity: number;
  defaultWorkType: AppSettings["defaultWorkType"];
  defaultFilesPerSubmission: number;
}
