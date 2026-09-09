// ============================================================
// Estado de las colas de calificación.
//
// Vive separado de runner.ts a propósito. runner.ts arrastra todo lo que hace
// falta para CALIFICAR —el cliente de Gemini, los parsers de docx/pptx/xlsx,
// pdf-lib—, y cargar esos módulos cuesta varios segundos la primera vez. La
// página de una sesión solo necesita saber si la cola está corriendo, y no
// tiene por qué pagar ese arranque para pintar una tabla.
//
// El mapa vive en globalThis por la misma razón que la conexión SQLite: Next
// puede cargar el módulo en más de un bundle, y con una variable por bundle
// cada uno tendría su propia idea de qué se está calificando.
// ============================================================

export interface RunnerStatus {
  running: boolean;
  /** Se solicitó pausa: termina el trabajo en curso y se detiene. */
  pauseRequested: boolean;
  currentSubmissionId: string | null;
  /** Mensaje de progreso legible, ej. "Procesando 3 de 12 — Leyendo documento…" */
  progressMessage: string | null;
}

const globalStore = globalThis as unknown as {
  __gradingRunners?: Map<string, RunnerStatus>;
};

export const runners = (globalStore.__gradingRunners ??= new Map<
  string,
  RunnerStatus
>());

export function getRunnerStatus(sessionId: string): RunnerStatus {
  return (
    runners.get(sessionId) ?? {
      running: false,
      pauseRequested: false,
      currentSubmissionId: null,
      progressMessage: null,
    }
  );
}

export function requestPause(sessionId: string): RunnerStatus {
  const status = runners.get(sessionId);
  if (status?.running) {
    status.pauseRequested = true;
    status.progressMessage =
      "Pausando… se completará el trabajo en curso y la cola se detendrá.";
  }
  return getRunnerStatus(sessionId);
}

/**
 * Descarta el estado del runner de una sesión que ya no existe. Sin esto, el
 * mapa acumularía entradas muertas al borrar sesiones.
 */
export function forgetRunner(sessionId: string): void {
  runners.delete(sessionId);
}

/** Cuántas sesiones están calificando ahora mismo. */
export function activeRunnerCount(): number {
  let count = 0;
  for (const status of runners.values()) {
    if (status.running) count++;
  }
  return count;
}
