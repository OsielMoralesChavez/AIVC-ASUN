// ============================================================
// Tipos de la configuración de la aplicación. Tres niveles, deliberadamente
// separados (mismo diseño que traía el Calificador, adoptado para toda la
// app — ver el plan de integración):
//
//  0. InstitutionProfile (institution.ts) — perfil de calificación fijo en
//     código. No editable por el usuario, ver el comentario de ese archivo.
//  1. BootstrapConfig — config.json en la carpeta de datos de usuario del
//     SO (fuera de la carpeta de datos elegida). Solo lo necesario ANTES de
//     poder abrir la base: dónde vive, si el asistente terminó, y el
//     secreto que cifra las credenciales.
//  2. AppSettings — documento único dentro de app.db (tabla app_settings).
//     Identidad del docente, credenciales de IA (Anthropic/Gemini) y
//     defaults, tanto para presentaciones/entrenamiento como para el
//     Calificador.
// ============================================================

import { ACTIVE_INSTITUTION } from "./institution";

export interface BootstrapConfig {
  version: number;
  /** Carpeta donde viven app.db, calificador.db y los archivos generados/subidos. null = falta el asistente inicial. */
  dataDir: string | null;
  setupCompletedAt: string | null;
  /** Secreto de 32 bytes (hex) generado una sola vez por instalación; cifra las credenciales guardadas en app.db. */
  installSecret: string;
}

export interface GradeScale {
  label: string;
  max: number;
  min: number;
  decimals: number;
  passingGrade: number;
}

export interface AcademicLevel {
  id: string;
  label: string;
  rigor: string;
}

export interface ConsentRecord {
  acceptedAt: string | null;
  version: number;
  acceptedBy: string;
}

/**
 * Proveedores de IA disponibles. El catálogo con su transporte, URL y modelo vive en
 * lib/ai/providers.ts; aquí solo el tipo, para que config/ no dependa de ai/.
 */
export type AiProvider = "anthropic" | "gemini" | "openai" | "deepseek" | "qwen" | "local";

export interface AppSettings {
  // --- Identidad del docente (exportes del Calificador) ---
  teacherTitle: string;
  teacherName: string;

  // --- Proveedor de IA para presentaciones/entrenamiento (ya existía) ---
  /**
   * Proveedor preferido. Ya NO se antepone a toda la cascada: el tramo gratuito de Gemini va
   * siempre primero (ver lib/ai/ladder.ts) y este valor solo adelanta dentro del tramo de pago.
   * Anteponerlo a todo, con "anthropic" por defecto, era justamente lo que hacía que una
   * instalación nueva llamara al modelo más caro en la primera petición.
   */
  aiProvider: AiProvider;
  anthropicApiKey: string;
  imageGenerationEnabled: boolean;
  /**
   * Si el modelo local cierra la cascada cuando todos los proveedores remotos fallan. Rescata
   * llamadas cortas (enlaces, cifras, minicasos); una presentación completa necesita 8+ llamadas
   * y agotaría antes PRESENTATION_TIMEOUT_MS.
   */
  localModelFallback: boolean;

  // --- Cadena de proveedores con relevo automático ---
  /**
   * Orden en el que se intentan los proveedores. Cuando a uno se le agota la cuota o su credencial
   * deja de ser válida, se pasa al siguiente que tenga clave, sin interrumpir la generación.
   * Vacío = orden por defecto (ver DEFAULT_CHAIN_ORDER), con el preferido al frente.
   */
  aiProviderChain: AiProvider[];
  openaiApiKey: string;
  deepseekApiKey: string;
  qwenApiKey: string;

  // --- Catador de clases: exportación a Excel y a Power BI ---
  /** Carpeta (OneDrive/red) donde se escribe el Excel al pulsar "Actualizar". El control de
   * acceso a las personas autorizadas lo maneja esa carpeta compartida, no la aplicación. */
  catadorExcelFolderPath: string;
  powerBiTenantId: string;
  powerBiClientId: string;
  powerBiClientSecret: string;
  powerBiWorkspaceId: string;
  powerBiDatasetName: string;
  powerBiTableName: string;

  // --- Credenciales y comportamiento de Gemini — compartidas: Calificador
  // y generación de presentaciones/entrenamiento cuando aiProvider="gemini" ---
  geminiApiKey: string;
  /** API key de pago opcional del Calificador, usada solo como último recurso ante cuota agotada. */
  geminiApiKeyPaid: string;
  geminiModel: string;
  geminiFallbackModels: string[];
  geminiThrottleMs: number;

  // --- Perfil institucional de calificación (solo lectura, ver institution.ts) ---
  institutionName: string;
  gradeScale: GradeScale;
  academicLevels: AcademicLevel[];
  feedbackLanguage: string;

  // --- Defaults de sesión de calificación nueva ---
  defaultLevelId: string;
  defaultSeverity: number;
  defaultWorkType: "individual" | "grupal";
  defaultFilesPerSubmission: number;

  /**
   * Perfil de voz ACTIVO, de `voice_profiles` (Entrenamiento) — fuente única para toda la app.
   * Antes el Calificador tenía su propia tabla `voice_profile` en calificador.db con sus propias
   * notas de estilo: dos perfiles distintos que el usuario tenía que mantener por separado.
   * `null` = ninguno seleccionado (el Calificador entonces evalúa sin notas de estilo, como antes
   * de que existiera el perfil).
   */
  activeVoiceProfileId: string | null;

  // --- Compliance (Calificador) ---
  consent: ConsentRecord;
}

export const CONSENT_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  teacherTitle: "",
  teacherName: "",
  // Gemini por defecto: es el escalón más barato y el único con tier gratuito real.
  aiProvider: "gemini",
  anthropicApiKey: "",
  imageGenerationEnabled: false,
  localModelFallback: true,
  aiProviderChain: [],
  openaiApiKey: "",
  deepseekApiKey: "",
  qwenApiKey: "",
  catadorExcelFolderPath: "",
  powerBiTenantId: "",
  powerBiClientId: "",
  powerBiClientSecret: "",
  powerBiWorkspaceId: "",
  powerBiDatasetName: "CatadorDeClases",
  powerBiTableName: "Revisiones",
  geminiApiKey: "",
  geminiApiKeyPaid: "",
  // Cadena Flash: los cuatro figuran como "Free of charge" en el nivel gratuito de la tabla de
  // precios oficial (ai.google.dev/gemini-api/docs/pricing). Se empieza por un Flash completo
  // —la generación de una lámina es JSON estructurado con razonamiento, no clasificación de alto
  // volumen— y se cae a Flash-Lite y al alias `-latest`, que siempre apunta a un modelo vigente.
  geminiModel: "gemini-3.6-flash",
  geminiFallbackModels: ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"],
  geminiThrottleMs: 5000,
  institutionName: ACTIVE_INSTITUTION.institutionName,
  gradeScale: ACTIVE_INSTITUTION.gradeScale,
  academicLevels: ACTIVE_INSTITUTION.academicLevels,
  feedbackLanguage: ACTIVE_INSTITUTION.feedbackLanguage,
  defaultLevelId: ACTIVE_INSTITUTION.academicLevels[0].id,
  defaultSeverity: 3,
  defaultWorkType: "individual",
  defaultFilesPerSubmission: 1,
  activeVoiceProfileId: null,
  consent: { acceptedAt: null, version: CONSENT_VERSION, acceptedBy: "" },
};
