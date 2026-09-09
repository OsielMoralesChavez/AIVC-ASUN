import type { RunnerStatus } from "@/lib/calificador/grading/runner-state";
import type { Submission, SubmissionFile } from "@/lib/calificador/types";

/**
 * Solo los tipos.
 *
 * En la aplicación real este módulo consulta SQLite; la versión de escaparate no tiene base de
 * datos, así que se conservan únicamente las formas que el front necesita para compilar. Las
 * pantallas del Calificador las importan con `import type`, que desaparece al compilar, de modo
 * que ningún componente pierde nada.
 */
export interface QueueSubmission extends Submission {
  files: SubmissionFile[];
  final_grade: number | null;
  was_edited: boolean;
}

export interface SessionQueue {
  submissions: QueueSubmission[];
  runner: RunnerStatus;
}
