import { handleJsonResponse, apiFetch } from "./httpClient";

/**
 * Configuración efectiva del usuario. Es la ÚNICA vía por la que el frontend lee ajustes de
 * calificación, perfil de voz activo y estado de la IA — el Calificador ya no mantiene su propio
 * formulario ni su propia lectura.
 *
 * La respuesta nunca trae la API key: solo `configured`, `provider` y `model`.
 */
export interface UserConfiguration {
  voiceProfile: {
    id: string;
    name: string;
    toneDescription: string;
    styleGuidelineCount: number;
    vocabularyNoteCount: number;
    updatedAt: string;
  } | null;
  availableVoiceProfiles: { id: string; name: string }[];
  grading: {
    teacherTitle: string;
    teacherName: string;
    defaultLevelId: string;
    defaultSeverity: number;
    defaultWorkType: "individual" | "grupal";
    defaultFilesPerSubmission: number;
    geminiModel: string;
    geminiThrottleMs: number;
    activeVoiceProfileId: string | null;
    gradeScale: { min: number; max: number; passing: number } | Record<string, unknown>;
    academicLevels: { id: string; label: string }[];
    feedbackLanguage: string;
  };
  aiStatus: {
    configured: boolean;
    provider: string;
    model: string;
    simulated: boolean;
    /** Si las presentaciones se generarán simuladas por no caber ningún escalón en su tope. */
    presentationsSimulated: boolean;
    presentationWarning?: string;
  };
}

export type GradingSettingsPatch = Partial<{
  teacherTitle: string;
  teacherName: string;
  defaultLevelId: string;
  defaultSeverity: number;
  defaultWorkType: "individual" | "grupal";
  defaultFilesPerSubmission: number;
  geminiModel: string;
  geminiThrottleMs: number;
  activeVoiceProfileId: string | null;
}>;

export async function getUserConfiguration(): Promise<UserConfiguration> {
  const res = await apiFetch("/api/settings/configuration");
  return handleJsonResponse(res);
}

export async function updateGradingSettings(patch: GradingSettingsPatch): Promise<UserConfiguration> {
  const res = await apiFetch("/api/settings/configuration", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return handleJsonResponse(res);
}
