import { handleJsonResponse, apiFetch } from "./httpClient";

export type AiProvider = "anthropic" | "gemini" | "openai" | "deepseek" | "qwen" | "local";

/** Proveedores que llevan credencial, en el orden en que se muestran. */
export const KEYED_PROVIDERS = ["gemini", "deepseek", "qwen", "openai", "anthropic"] as const;
export type KeyedProvider = (typeof KEYED_PROVIDERS)[number];

export interface AiConfig {
  /** Proveedor preferido: el primero que se intenta. */
  provider: AiProvider;
  /** Qué proveedores tienen credencial guardada. */
  hasKey: Record<KeyedProvider, boolean>;
  /** Cadena efectiva ya resuelta por el servidor: lo que de verdad se intentará, en orden. */
  chain: AiProvider[];
  /** Si el modelo local cierra la cascada cuando ningún proveedor remoto puede atender. */
  localModelFallback: boolean;
  imageGenerationEnabled: boolean;
}

/**
 * Forma real que expone /api/settings. El frontend usaba otra (`provider`, `hasApiKey`) que el
 * backend nunca ha aceptado ni devuelto: el esquema Zod ignoraba en silencio los campos
 * desconocidos, así que guardar respondía 200 sin guardar nada. Aquí se traduce entre ambas
 * formas, en un solo sitio.
 */
interface AiSettingsResponse {
  aiProvider: AiProvider;
  hasAnthropicApiKey: boolean;
  hasGeminiApiKey: boolean;
  hasOpenaiApiKey: boolean;
  hasDeepseekApiKey: boolean;
  hasQwenApiKey: boolean;
  providerChain: AiProvider[];
  localModelFallback: boolean;
  imageGenerationEnabled: boolean;
}

/** Nombre del campo con el que viaja la clave de cada proveedor. */
const KEY_FIELD: Record<KeyedProvider, string> = {
  gemini: "geminiApiKey",
  deepseek: "deepseekApiKey",
  qwen: "qwenApiKey",
  openai: "openaiApiKey",
  anthropic: "anthropicApiKey",
};

function toAiConfig(res: AiSettingsResponse): AiConfig {
  return {
    provider: res.aiProvider,
    hasKey: {
      gemini: res.hasGeminiApiKey,
      deepseek: res.hasDeepseekApiKey,
      qwen: res.hasQwenApiKey,
      openai: res.hasOpenaiApiKey,
      anthropic: res.hasAnthropicApiKey,
    },
    chain: res.providerChain ?? [],
    localModelFallback: res.localModelFallback ?? true,
    imageGenerationEnabled: res.imageGenerationEnabled,
  };
}

export async function getAiConfig(): Promise<AiConfig> {
  const res = await apiFetch("/api/settings");
  return toAiConfig(await handleJsonResponse<AiSettingsResponse>(res));
}

export interface AiConfigPatch {
  provider?: AiProvider;
  /**
   * Claves a modificar, por proveedor. Solo se manda lo que el usuario tocó:
   * - ausente → no se toca la guardada. Es el caso normal al cambiar solo de preferido; mandarla
   *   vacía borraría un dato que nadie pidió borrar.
   * - `""` → borra la clave de ese proveedor.
   */
  keys?: Partial<Record<KeyedProvider, string>>;
  localModelFallback?: boolean;
  imageGenerationEnabled?: boolean;
}

export async function setAiConfig(patch: AiConfigPatch): Promise<AiConfig> {
  const body: Record<string, unknown> = {};
  if (patch.provider !== undefined) body.aiProvider = patch.provider;
  if (patch.imageGenerationEnabled !== undefined) body.imageGenerationEnabled = patch.imageGenerationEnabled;
  if (patch.localModelFallback !== undefined) body.localModelFallback = patch.localModelFallback;
  for (const [provider, value] of Object.entries(patch.keys ?? {})) {
    if (value !== undefined) body[KEY_FIELD[provider as KeyedProvider]] = value;
  }
  const res = await apiFetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toAiConfig(await handleJsonResponse<AiSettingsResponse>(res));
}
