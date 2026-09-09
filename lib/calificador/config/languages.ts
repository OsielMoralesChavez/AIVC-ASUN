// ============================================================
// Idiomas de redacción de la retroalimentación.
//
// Cuál se usa NO lo elige el profesor: lo fija el perfil institucional (ver
// lib/config/institution.ts). UNIR México redacta en es-MX. La entrada
// es-ES queda lista para cuando se compile la versión de UNIR España.
//
// El prompt de calificación original estaba escrito para español de
// México/Latinoamérica, con reglas muy específicas de persona gramatical
// ("ustedes" y no "vosotros") y de vocabulario prohibido. Esas reglas son
// buenas, pero solo aplican a ese idioma y variante.
//
// Para que la app sirva fuera de ese contexto, todo el texto que depende del
// idioma vive aquí, agrupado por variante. La entrada "es-MX" conserva
// palabra por palabra las reglas de la versión original, así que quien la
// deje seleccionada obtiene exactamente el mismo comportamiento de siempre.
// ============================================================

export interface FeedbackLanguage {
  /** Identificador estable que se guarda en la configuración. */
  id: string;
  /** Nombre visible en la interfaz. */
  label: string;
  /** Cómo se le nombra el idioma a la IA dentro del prompt. */
  promptName: string;
  /**
   * Reglas de variante y registro: qué conjugaciones o vocabulario evitar.
   * Cadena vacía si el idioma no necesita restricciones.
   */
  variantRules: string;
  /** Persona gramatical para dirigirse a UN alumno. */
  individualPerson: string;
  /** Persona gramatical para dirigirse a UN EQUIPO. */
  groupPerson: string;
  /** Regla de que el evaluador es una sola persona (no "nosotros"). */
  evaluatorPerson: string;
}

export const FEEDBACK_LANGUAGES: FeedbackLanguage[] = [
  {
    id: "es-MX",
    label: "Español (México / Latinoamérica)",
    promptName: "español de México/Latinoamérica",
    variantRules: `Todo el texto en ESPAÑOL DE MÉXICO/LATINOAMÉRICA. Prohibido cualquier rasgo del español de España: conjugaciones de "vosotros" (habéis, tenéis, podéis, generasteis, vuestro/a), y vocabulario peninsular como "vale", "coger" (en el sentido de tomar/agarrar), "ordenador" (di "computadora"), "móvil" (di "celular"), "guay", "genial" como muletilla, "flipante", "mola". Revisa que esta regla se cumpla en TODOS los criterios y en el feedback general por igual, no solo en el primero que redactes.`,
    individualPerson: `TIPO DE TRABAJO: Individual. Cuando te refieras al alumno, hazlo en segunda persona del singular (ej. "Presentaste un proceso de investigación muy completo…"). NUNCA uses plural para referirte al alumno.`,
    groupPerson: `TIPO DE TRABAJO: Grupal. Cuando te refieras al EQUIPO (lo que hicieron, lograron o les faltó), usa la forma "ustedes" (ej. "Generaron un análisis detallado…", "Han presentado…", "Lograron…", "les faltó..."). NUNCA la forma "vosotros" (prohibido: "habéis", "generasteis", "vuestro/a"). NUNCA uses singular para referirte al equipo.`,
    evaluatorPerson: `EL PROFESOR QUE EVALÚA ES UNO SOLO, incluso en trabajos grupales: nunca escribas desde tu propio punto de vista en plural. Cuando el sujeto de la oración seas TÚ como evaluador (lo que recomiendas, observas, sugieres o reconoces), usa SIEMPRE primera persona del SINGULAR: "te recomiendo" / "les recomiendo" (nunca "recomendamos"), "observé" (nunca "observamos"), "sugiero" (nunca "sugerimos"), "reconozco" / "felicito" (nunca "reconocemos" / "felicitamos"), "encontré" / "he encontrado" (nunca "encontramos" / "hemos encontrado"). La forma plural de la regla anterior ("ustedes", "generaron") es solo para cuando el sujeto es el EQUIPO, jamás para cuando el sujeto eres tú. Puedes usar "les" o "los" (a ustedes) como complemento sin que eso vuelva plural el verbo del que hablas tú: "les sugiero" es correcto, "les sugerimos" no lo es.`,
  },
  {
    id: "es-ES",
    label: "Español (España)",
    promptName: "español de España",
    variantRules: `Todo el texto en ESPAÑOL DE ESPAÑA. Usa el vocabulario y las conjugaciones peninsulares con naturalidad. Evita los rasgos exclusivamente latinoamericanos ("ustedes" para el trato informal en plural, "computadora" en lugar de "ordenador", "celular" en lugar de "móvil").`,
    individualPerson: `TIPO DE TRABAJO: Individual. Cuando te refieras al alumno, hazlo en segunda persona del singular (ej. "Has presentado un proceso de investigación muy completo…"). NUNCA uses plural para referirte al alumno.`,
    groupPerson: `TIPO DE TRABAJO: Grupal. Cuando te refieras al EQUIPO (lo que hicieron, lograron o les faltó), usa la forma "vosotros" (ej. "Habéis generado un análisis detallado…", "Habéis presentado…", "Lograsteis…", "os faltó..."). NUNCA uses singular para referirte al equipo.`,
    evaluatorPerson: `EL PROFESOR QUE EVALÚA ES UNO SOLO, incluso en trabajos grupales: nunca escribas desde tu propio punto de vista en plural. Cuando el sujeto de la oración seas TÚ como evaluador, usa SIEMPRE primera persona del SINGULAR: "te recomiendo" / "os recomiendo" (nunca "recomendamos"), "observé" (nunca "observamos"), "sugiero" (nunca "sugerimos"), "reconozco" / "felicito" (nunca "reconocemos" / "felicitamos").`,
  },
];

/** Idioma de respaldo si el perfil apunta a uno que no existe. */
export const DEFAULT_LANGUAGE_ID = "es-MX";

/**
 * Resuelve un idioma por su id. Si el id guardado no existe (por ejemplo,
 * porque se editó la configuración a mano), cae al default en vez de romper
 * la calificación.
 */
export function resolveLanguage(id: string): FeedbackLanguage {
  return (
    FEEDBACK_LANGUAGES.find((language) => language.id === id) ??
    FEEDBACK_LANGUAGES.find((language) => language.id === DEFAULT_LANGUAGE_ID)!
  );
}
