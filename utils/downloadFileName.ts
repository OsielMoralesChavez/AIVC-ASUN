const WINDOWS_INVALID_CHARS = /[<>:"/\\|?*]/g;

export function sanitizeForFileName(part: string): string {
  return part.replace(WINDOWS_INVALID_CHARS, "").replace(/\s+/g, " ").trim();
}

/** "Semana N - Tema - Docente.pptx" — nombre legible (no slug) pedido para "Descargar todas" en
 * el asistente de generación masiva; solo quita caracteres inválidos en Windows. */
export function buildWeekDownloadFileName(weekNumber: number, topic: string, teacherName?: string): string {
  const parts = [`Semana ${weekNumber}`, sanitizeForFileName(topic), sanitizeForFileName(teacherName ?? "")].filter(
    (p) => p.length > 0
  );
  const base = parts.join(" - ").replace(/[.\s]+$/, "").slice(0, 150);
  return `${base || `Semana ${weekNumber}`}.pptx`;
}
