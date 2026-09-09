import { z } from "zod";

export const aiProviderSchema = z.enum(["anthropic", "gemini", "openai", "deepseek", "qwen", "local"]);

/**
 * `.strict()` a propósito: todos los campos son opcionales, así que sin esto un cuerpo con nombres
 * equivocados valida, no cambia nada y devuelve 200. Fue exactamente lo que pasó — el frontend
 * mandaba `provider`/`apiKey` en vez de `aiProvider`/`anthropicApiKey`, y guardar la configuración
 * de IA no guardaba nada sin que ningún error lo delatara. Ahora un campo desconocido es un 400.
 */
export const updateSettingsSchema = z
  .object({
    aiProvider: aiProviderSchema.optional(),
    anthropicApiKey: z.string().trim().optional(),
    geminiApiKey: z.string().trim().optional(),
    openaiApiKey: z.string().trim().optional(),
    deepseekApiKey: z.string().trim().optional(),
    qwenApiKey: z.string().trim().optional(),
    /** Orden explícito de relevo. Vacío = cascada por defecto (ver lib/ai/ladder.ts). */
    aiProviderChain: z.array(aiProviderSchema).max(6).optional(),
    /** Si el modelo local cierra la cascada cuando todos los proveedores remotos fallan. */
    localModelFallback: z.boolean().optional(),
    /**
     * Cadena de modelos de Gemini que recorre la cascada, del primero al último. Vivían solo en
     * DEFAULT_SETTINGS y en el formulario del Calificador: no había forma de editarlas desde la
     * configuración de IA, que es justo donde se decide qué modelo se llama primero.
     */
    geminiModel: z.string().trim().min(1).max(120).optional(),
    geminiFallbackModels: z.array(z.string().trim().min(1).max(120)).max(8).optional(),
    imageGenerationEnabled: z.boolean().optional(),
  })
  .strict();

/**
 * Ajustes de calificación — mismo esquema en frontend y backend (validación compartida). Los
 * datos ya vivían en AppSettings; lo que se movió es la INTERFAZ, que estaba dentro del
 * Calificador en vez de en la Configuración global.
 */
export const updateGradingSettingsSchema = z.object({
  teacherTitle: z.string().trim().max(80).optional(),
  teacherName: z.string().trim().max(160).optional(),
  defaultLevelId: z.string().trim().min(1).optional(),
  defaultSeverity: z.number().int().min(1).max(5).optional(),
  defaultWorkType: z.enum(["individual", "grupal"]).optional(),
  defaultFilesPerSubmission: z.number().int().min(1).max(20).optional(),
  geminiModel: z.string().trim().min(1).max(120).optional(),
  geminiThrottleMs: z.number().int().min(0).max(60000).optional(),
  /** `null` desactiva el perfil de voz (se evalúa sin notas de estilo). */
  activeVoiceProfileId: z.string().trim().min(1).nullable().optional(),
});
