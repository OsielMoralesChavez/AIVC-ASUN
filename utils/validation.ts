import { z } from "zod";

export const MAX_FILES = 15;
export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DURATION_MIN = 10;
export const DURATION_MAX = 600;
export const DURATION_PRESETS = [60, 90, 120, 180];

export const durationSchema = z
  .number({ invalid_type_error: "Ingresa un número de minutos válido." })
  .int("La duración debe ser un número entero de minutos.")
  .min(DURATION_MIN, `La duración mínima es de ${DURATION_MIN} minutos.`)
  .max(DURATION_MAX, `La duración máxima es de ${DURATION_MAX} minutos.`);

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".xlsx"];
const ACCEPTED_MIMES = new Set([
  "",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

export function validateFileBeforeUpload(file: File): string | null {
  const name = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasAcceptedExtension || !ACCEPTED_MIMES.has(file.type)) {
    return "Solo se admiten archivos PDF, Word (.docx) o Excel (.xlsx).";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE_MB} MB).`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
