/**
 * En la app de escritorio, el frontend y la API viven en el mismo origen (Next.js sirve
 * ambos), así que las peticiones usan rutas relativas — no hace falta `API_BASE_URL`, CORS,
 * ni el header `x-session-id` (ya no hay sesiones: la biblioteca es permanente y de un único
 * usuario). La configuración de IA (BYOK) tampoco viaja por headers: el servidor la lee
 * directo de SQLite (ver lib/ai/settings.ts) — el frontend solo la edita vía /api/settings
 * (ver services/settingsApi.ts).
 */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * `fetch` con el fallo de red convertido en `ApiError`.
 *
 * Sin esto, cuando el servidor de la aplicación no responde —está arrancando, se cerró, o el
 * proceso murió— `fetch` lanza un `TypeError` que NO es `ApiError`, así que cada pantalla caía en
 * su mensaje genérico: «No se pudo crear la materia», «No se pudo guardar…». El usuario leía que
 * había fallado *su acción* cuando en realidad no había con quién hablar, y ninguno de esos
 * mensajes le decía qué hacer.
 *
 * Convirtiéndolo aquí, cualquier pantalla que ya distingue `ApiError` muestra la causa real sin
 * tener que tocarla una por una.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw new ApiError(
      "No hay conexión con el servidor de la aplicación. Si la abriste desde el instalador, " +
        "ciérrala y vuelve a abrirla; si la estás ejecutando en modo desarrollo, comprueba que " +
        "la ventana donde corre siga abierta.",
      "NETWORK_ERROR",
      0,
      { cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function handleJsonResponse<T>(res: Response): Promise<T> {
  let body: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiError("Respuesta inesperada del servidor.", "PARSE_ERROR", res.status);
    }
  }

  if (!res.ok) {
    const errorBody = body as { error?: { code?: string; message?: string; details?: unknown } } | null;
    throw new ApiError(
      errorBody?.error?.message ?? "Ocurrió un error al comunicarse con el servidor.",
      errorBody?.error?.code ?? "UNKNOWN_ERROR",
      res.status,
      errorBody?.error?.details
    );
  }

  return (body as { data: T }).data;
}

/** `true` solo dentro de la app de escritorio (Electron expone `window.electronAPI` desde
 * electron/preload.ts) — en un navegador normal (incluida la vista previa de desarrollo) esto
 * es `false` y el código cae de vuelta a descargas de navegador una por una. */
export function isElectron(): boolean {
  return typeof window !== "undefined" && Boolean(window.electronAPI?.isElectron);
}

/** Abre el diálogo nativo "elegir carpeta" (solo Electron). `null` si el usuario cancela o si
 * no se está corriendo dentro de Electron. */
export async function chooseDownloadDirectory(): Promise<string | null> {
  if (!isElectron()) return null;
  return window.electronAPI!.chooseDirectory();
}

/** Descarga un archivo directamente a una carpeta ya elegida (solo Electron) — sin el diálogo
 * "Guardar como" del navegador por cada archivo. Ver `downloadFile` para el equivalente de
 * navegador (descarga una por una). */
export async function downloadFileToDirectory(url: string, fileName: string, directory: string): Promise<void> {
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new ApiError("No se pudo descargar el archivo.", "DOWNLOAD_ERROR", res.status);
  }
  const buffer = await res.arrayBuffer();
  await window.electronAPI!.saveFile(directory, fileName, buffer);
}

export async function downloadFile(url: string, suggestedName: string): Promise<void> {
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new ApiError("No se pudo descargar el archivo.", "DOWNLOAD_ERROR", res.status);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  // El nombre que pide quien llama siempre gana — el servidor solo deriva un nombre genérico del
  // título de la sesión (sin semana ni docente), así que dejar que gane el suyo rompería nombres
  // como "Semana N - Tema - Docente.pptx" que sí llevan ese contexto.
  link.download = suggestedName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
