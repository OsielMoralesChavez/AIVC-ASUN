import type { AcademicLevel } from "./presentation";

export type UnirSessionType = "primera-clase" | "normal" | "actividad" | "solucion" | "repaso";
export type UnirDeckType = UnirSessionType;

/** Alcance institucional de la sesión: solo "mexico" incluye el logo de UNIR en el deck. */
export type InstitutionScope = "mexico" | "internacional" | "mixto";

export const INSTITUTION_SCOPE_LABELS: Record<InstitutionScope, string> = {
  mexico: "UNIR México",
  internacional: "Internacional",
  mixto: "Mixto",
};

export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface BloomObjective {
  level: BloomLevel;
  verb: string;
  statement: string;
}

export interface AgendaItem {
  label: string;
  minutes: number;
}

export interface CardContent {
  title: string;
  body: string;
}

export interface StepContent {
  title: string;
  body: string;
}

export interface GlassPartContent {
  label: string;
  body: string;
  /** Nota del presentador para esta parte del caso práctico — "[nivel N · verbo] ...". */
  note?: string;
}

/** Lámina con un panel de texto de prompt sugerido (para pedir una imagen a una IA externa) y un
 * panel de desarrollo de texto — nunca se genera ni referencia una imagen real, solo el prompt. */
export interface ImagePromptSlideContent {
  title: string;
  body: string;
  imagePrompt: string;
}

export interface DebatePosition {
  title: string;
  argument: string;
}

export interface DebateContent {
  question: string;
  positionA: DebatePosition;
  positionB: DebatePosition;
  reflectionPrompt: string;
  /** Regla de tiempo/turno de la dinámica (p. ej. "Cada postura dispone de 2 minutos..."). */
  groundRule?: string;
}

/** Una semana del curso completo (temario), usada solo por la primera clase para mostrar todos
 * los temas del curso — se pasa determinísticamente desde scheduleBulkController, no la genera la IA. */
export interface SyllabusWeek {
  weekNumber: number;
  topic: string;
}

export interface MarcoTeoricoItem {
  concept: string;
  author: string;
  year?: number;
  body: string;
}

/** Reusado por primera clase ("Fórmulas/definiciones clave") y opcionalmente por repaso
 * ("Fórmulas/procesos clave") — mismo builder, mismo tipo. */
export interface FormulaDefinitionItem {
  formula: string;
  name: string;
  usage: string;
}

export interface ComparisonTableRow {
  label: string;
  body: string;
}

export interface ComparisonTableContent {
  question: string;
  col1Label: string;
  col2Label: string;
  rows: ComparisonTableRow[];
}

export interface Matrix2x2Quadrant {
  label: string;
  body: string;
  dark: boolean;
}

/** Orden fijo: superior-izquierda, superior-derecha, inferior-izquierda, inferior-derecha. */
export interface Matrix2x2Content {
  xAxisLabel: string;
  yAxisLabel: string;
  quadrants: [Matrix2x2Quadrant, Matrix2x2Quadrant, Matrix2x2Quadrant, Matrix2x2Quadrant];
}

export interface VerifiedFigure {
  value: string;
  label: string;
  source: string;
  year: number;
}

/** Panel oscuro "a sangre" con un imagePromptBox (nunca una imagen real) — "Encuadre profesional"
 * y "Aplicación profesional" en la primera clase. */
export interface ProfessionalPanelContent {
  title: string;
  body: string;
  bullets: string[];
  imagePrompt: string;
}

/**
 * Autoevaluación de la lámina «06» en la habilidad de 38 láminas: un minicaso con cuatro opciones
 * (una correcta) y la explicación de por qué lo es. Sustituye a las flashcards de pregunta suelta,
 * que no obligaban a decidir entre alternativas.
 */
export interface SelfAssessmentOption {
  text: string;
  correct: boolean;
}

export interface SelfAssessmentContent {
  scenario: string;
  options: SelfAssessmentOption[];
  explanation: string;
}

/** Uno de los tres mini-casos del «04.4 Reto en equipo»: se reparten y se resuelven en 3 minutos. */
export interface TeamChallengeCase {
  title: string;
  prompt: string;
}

export interface GuidedPracticeContent {
  dataPanelTitle: string;
  dataPanelBody: string;
  /** 4 pasos YA RESUELTOS (a diferencia de developmentCards, que plantea un ejemplo sin resolver). */
  steps: StepContent[];
  nowYouQuestion: string;
}

export type PrimeraClaseSlideKey =
  | "portada"
  | "docente"
  // Láminas institucionales fijas de UNIR México (modelo MODAM y su lógica): su contenido NO se
  // reescribe por tema, así que no tienen campos propios en el contenido — solo nota de presentador.
  | "modam"
  | "logicaSistema"
  | "curso"
  | "actividades"
  | "examen"
  | "medios"
  | "resultadosAprendizaje"
  | "introduccion"
  | "panelEncuadre"
  | "mapaMental"
  | "tarjetasModulares"
  | "marcoTeorico"
  | "infografiaPasos"
  | "formulas"
  | "tablaComparativa"
  | "matriz2x2"
  | "cifras"
  | "panelAplicacion"
  | "practicaDirigida"
  | "debate"
  | "erroresFrecuentes"
  | "autoevaluacion"
  | "enlaces"
  | "conclusion"
  | "proximaClase"
  | "referencias"
  | "cierre"
  // --- Añadidas por el catálogo de 38 láminas ---
  | "agenda"
  | "retoMapaMental"
  | "conceptosClave"
  | "matrizUbicaCaso"
  | "caso2Situacion"
  | "practicaDirigida2"
  | "retoEquipo"
  | "anexosPortada"
  | "glosario";

/** Notas del presentador para las láminas de estructura fija — cada valor DEBE empezar con
 * "[nivel N · verbo] " (convención de la skill "primera-clase-unir"), reforzado por instrucción
 * del prompt, no por el schema. Las láminas de arreglo repetido (caso práctico) llevan su nota en
 * el propio item (`GlassPartContent.note`), no aquí. */
export type PresenterNotes = Partial<Record<PrimeraClaseSlideKey, string>>;

/**
 * Familias de composición del bloque de desarrollo de `/presentacion-unir`.
 *
 * La habilidad ofrece 16 y prohíbe usar una «solo por variedad»: se eligen por función
 * comunicativa. Aquí están las que la aplicación sabe construir con evidencia real extraída de
 * documentos; las que exigen datos que un PDF no da estructurados (ciclo, línea de tiempo,
 * antes/después, gráfico) se dejan fuera en vez de fabricarlas vacías.
 */
export type DevelopmentLayout =
  | "section-divider"
  | "concept-5050"
  | "definition-focus"
  | "four-cards"
  | "process"
  | "comparison"
  | "data-highlight"
  | "transfer-summary";

interface DevelopmentSlideBase {
  title: string;
  /** Nivel Bloom y verbo de ESTA lámina; encabezan su nota del presentador. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  verb: string;
  /** Minutos estimados. La habilidad pide entre 2 y 5 por lámina de desarrollo. */
  minutes: number;
  note: string;
}

/**
 * Una lámina del desarrollo. Unión discriminada por `layout` para que el ensamblador del deck no
 * pueda olvidarse de una familia: el `switch` es exhaustivo y una familia nueva sin renderizador
 * es un error de compilación.
 */
export type DevelopmentSlide =
  | (DevelopmentSlideBase & { layout: "section-divider"; eyebrow: string; subtitle: string })
  | (DevelopmentSlideBase & { layout: "concept-5050"; body: string; imagePrompt: string })
  | (DevelopmentSlideBase & {
      layout: "definition-focus";
      term: string;
      definition: string;
      attributes: { title: string; text: string }[];
    })
  | (DevelopmentSlideBase & { layout: "four-cards"; cards: CardContent[] })
  | (DevelopmentSlideBase & { layout: "process"; steps: StepContent[] })
  | (DevelopmentSlideBase & { layout: "comparison"; table: ComparisonTableContent })
  | (DevelopmentSlideBase & { layout: "data-highlight"; figures: VerifiedFigure[] })
  | (DevelopmentSlideBase & {
      layout: "transfer-summary";
      rule: string;
      useWhen: string;
      evidence: string;
      commonError: string;
      /** Microactividad: la habilidad exige interacción al menos cada seis láminas. */
      interaction: string;
    });

/**
 * Láminas de la clase regular (normal, actividad y solución), que comparten `/presentacion-unir`.
 * Las cuatro láminas del caso llevan su nota en cada parte (`GlassPartContent.note`), no aquí.
 */
export type NormalLikeSlideKey =
  | "portada"
  | "agenda"
  | "repasoClaseAnterior"
  | "introduccion"
  | "desarrolloTarjetas"
  | "desarrolloPasos"
  | "actividadProyectable"
  | "ejercicioTransferencia"
  | "enlaces"
  | "conclusion"
  | "proximaClase"
  | "referencias"
  | "cierre";

export type NormalLikePresenterNotes = Partial<Record<NormalLikeSlideKey, string>>;

export type RepasoSlideKey =
  | "portada"
  | "comoUsar"
  | "objetivo"
  | "mapaGlobal"
  | "glosario"
  | "formulas"
  | "erroresFrecuentes"
  | "flashcards"
  | "conexiones"
  | "hojaDeRuta"
  | "enlaces"
  | "referencias"
  | "cierre";

export type RepasoPresenterNotes = Partial<Record<RepasoSlideKey, string>>;

export interface LinkResourceContent {
  name: string;
  description: string;
  year?: number;
  verified: boolean;
  sourceNote?: string;
}

export interface SourceRef {
  documentId: string;
  fileName: string;
  page: number;
}

export interface UnirSessionInputs {
  courseName?: string;
  weekNumber: number;
  topicNumber: number;
  sessionTitle: string;
  academicLevel: AcademicLevel;
  durationMinutes: number;
  institutionScope?: InstitutionScope;
  audience?: string;
  previousClassTopic?: string;
  nextClassTopic?: string;
  learningObjectiveHint?: string;
  courseSyllabus?: SyllabusWeek[];
  teacherName?: string;
  teacherTitle?: string;
  teacherFormation?: string;
  teacherExperience?: string;
  teacherSpecialty?: string;
  teacherContact?: string;
  teamActivityDescription?: string;
  teamActivityDueDate?: string;
  individualActivityDescription?: string;
  individualActivityDueDate?: string;
  forumDescription?: string;
  evaluationSchemeNote?: string;
}

interface UnirBaseContent {
  weekNumber: number;
  topicNumber: number;
  courseName?: string;
  sessionTitle: string;
  academicLevel: AcademicLevel;
  durationMinutes: number;
  institutionScope?: InstitutionScope;
  learningObjective: BloomObjective;
  agenda: AgendaItem[];
  introduction: string;
  /** Pregunta corta que detona el tema, mostrada sola (sin el párrafo de `introduction`) en la
   * lámina de Introducción, junto a un panel de imagen al 50% — mismo patrón que
   * `RepasoContent.hookQuestion`. */
  introductionHook: string;
  developmentCardsTitle: string;
  developmentCards: CardContent[];
  developmentStepsTitle: string;
  developmentSteps: StepContent[];
  links: LinkResourceContent[];
  conclusion: string[];
  references: string[];
  nextClassTopic?: string;
  nextClassPreview?: string;
  closingQuestion: string;
  closingNote: string;
  assumptions: string[];
  warnings: string[];
  sourceReferences: SourceRef[];
}

export interface PrimeraClaseContent extends UnirBaseContent {
  type: "primera-clase";
  caseStudy: GlassPartContent[];
  teacherName: string;
  teacherTitle: string;
  teacherFormation: string;
  teacherExperience: string;
  teacherSpecialty: string;
  teacherContact: string;
  /** Prompt de texto para pedir una foto de retrato profesional del docente a una IA externa —
   * nunca se genera una imagen real. Reemplaza la silueta genérica de versiones anteriores. */
  teacherPhotoPrompt: string;
  units: { title: string; topics: string }[];
  teamActivity: { description: string; dueDate: string };
  individualActivity: { description: string; dueDate: string };
  forumDescription: string;
  /** Franja inferior de la lámina de actividades (tests por tema, máximo computable, etc.). */
  evaluationSchemeNote?: string;

  // Temario completo del curso (determinístico, no generado por IA) y objetivos de aprendizaje
  // crudos del Excel de práctica — ambos opcionales porque el flujo manual "una clase a la vez"
  // no tiene programación semanal ni Excel disponibles.
  courseSyllabus?: SyllabusWeek[];
  learningObjectiveHint?: string;

  /** Prompt de imagen para la lámina de Introducción (concepto ilustrativo del tema). */
  introductionImagePrompt: string;

  // Catálogo de 30 láminas de la skill "primera-clase-unir".
  professionalPanelEncuadre: ProfessionalPanelContent;
  conceptMapCenter: string;
  conceptMapBranches: ConceptMapBranch[];
  marcoTeorico: MarcoTeoricoItem[];
  formulasDefinitions?: FormulaDefinitionItem[];
  comparisonTable?: ComparisonTableContent;
  matrix2x2?: Matrix2x2Content;
  verifiedFigures: VerifiedFigure[];
  professionalPanelAplicacion: ProfessionalPanelContent;
  guidedPractice: GuidedPracticeContent;
  debate: DebateContent;
  commonErrors: CommonError[];
  flashcards: Flashcard[];
  /** Prompt de imagen para la lámina "Próxima clase". */
  nextClassImagePrompt?: string;

  // --- Catálogo de 38 láminas (actualización de la habilidad primera-clase-unir) ---
  // El cuerpo pasó a tener DOS casos prácticos con su práctica dirigida cada uno, tres láminas
  // "Continúa…" que convierten teoría en ejercicio, un reto en equipo y una autoevaluación con
  // opciones; la metodología/propósito/resultado de ambos casos se movió a los Anexos.
  /** Segundo caso práctico (situación + metodología/propósito/resultado en anexos), de un sector
   * o país latinoamericano distinto al primero. Mismas 4 partes que `caseStudy`. */
  secondCaseStudy: GlassPartContent[];
  /** Práctica dirigida del segundo caso, con menos guía que la primera. */
  secondGuidedPractice: GuidedPracticeContent;
  /** Tres mini-casos del «04.4 Reto en equipo», uno por equipo. */
  teamChallenge: TeamChallengeCase[];
  /** Minicaso con cuatro opciones de la lámina «06. Autoevaluación». */
  selfAssessment: SelfAssessmentContent;
  /** Glosario del anexo: términos esenciales de la sesión, en dos columnas. */
  glossary: GlossaryEntry[];
  /** Frase motivacional del cierre, ligada al tema trabajado — nunca un cliché genérico. */
  closingMotivation: string;
  /** Consignas «Aplica» de las tres láminas "Continúa…": convierten cada lámina teórica en un
   * ejercicio con datos del caso, que es lo que sube el nivel de Bloom de 2 pasivo a 3-4. */
  conceptMapApply: string;
  marcoTeoricoApply: string;
  matrix2x2Apply?: string;
  presenterNotes: PresenterNotes;
}

export type CaseStudyKind = "caso-practico" | "actividad" | "solucion";
export type NormalLikeSessionType = "normal" | "actividad" | "solucion";

export interface NormalLikeContent extends UnirBaseContent {
  type: NormalLikeSessionType;
  caseKind: CaseStudyKind;
  caseStudyEyebrow: string;
  previousClassTopic?: string;
  previousClassSummary?: string;
  /** Prompt de imagen para la lámina de Introducción (concepto ilustrativo del tema). */
  introductionImagePrompt: string;
  caseStudy: GlassPartContent[];
  activityProjectableSlide?: { title: string; bullets: string[] };
  transferExercise?: string;
  linkedActivityPresentationId?: string;
  /**
   * Bloque de desarrollo de duración variable: D láminas, cada una con su familia de composición.
   * La habilidad fija D por la duración de la sesión (6-8 para 60 min, 9-12 para 90, hasta 20-24
   * para 180) y su propio generador lanza si el total no cuadra.
   */
  development: DevelopmentSlide[];
  /**
   * Notas del presentador de las láminas fijas. `/presentacion-unir` las exige en TODAS las
   * láminas, empezando por "[nivel N · verbo]". Las del caso práctico van en `caseStudy[].note`.
   */
  presenterNotes: NormalLikePresenterNotes;
}

export interface UnitSynthesis {
  unit: string;
  centralIdea: string;
  keyPoints: string[];
  connection: string;
  /** Nota del presentador para esta lámina de síntesis — "[nivel N · verbo] ...". */
  note?: string;
}

export interface ConceptMapBranch {
  unit: string;
  concepts: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface CommonError {
  believed: string;
  reality: string;
  why: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface ConnectionEntry {
  from: string;
  to: string;
  relation: string;
}

export interface RepasoContent {
  type: "repaso";
  subjectName: string;
  academicLevel: AcademicLevel;
  unitCount: number;
  objective: BloomObjective;
  howToUse: string;
  hookQuestion: string;
  conceptMapCenter: string;
  conceptMapBranches: ConceptMapBranch[];
  unitSyntheses: UnitSynthesis[];
  glossary: GlossaryEntry[];
  /** Opcional — solo si la materia realmente tiene fórmulas/procesos/modelos clave. */
  formulasProcesses?: FormulaDefinitionItem[];
  commonErrors: CommonError[];
  flashcards: Flashcard[];
  connections: ConnectionEntry[];
  studyRoadmap: string[];
  links: LinkResourceContent[];
  references: string[];
  closingQuestion: string;
  assumptions: string[];
  warnings: string[];
  sourceReferences: SourceRef[];
  sourcePresentationIds: string[];
  presenterNotes: RepasoPresenterNotes;
}

export type UnirDeckContent = PrimeraClaseContent | NormalLikeContent | RepasoContent;

export const DECK_TYPE_LABELS: Record<UnirDeckType, string> = {
  "primera-clase": "Primera clase",
  normal: "Clase normal",
  repaso: "Clase de repaso",
  actividad: "Clase con actividad",
  solucion: "Clase con solución de actividad",
};

export const DECK_TYPE_DESCRIPTIONS: Record<UnirSessionType, string> = {
  "primera-clase":
    "Presentación del docente, del curso, actividades, medios de comunicación, agenda, desarrollo y caso práctico. Sin resumen de clase anterior.",
  normal: "Resumen de la clase anterior, agenda, desarrollo, caso práctico, enlaces, conclusión y próxima clase.",
  actividad: "Igual que una clase normal, pero el bloque central plantea una actividad práctica para el grupo.",
  solucion: "Igual que una clase normal, pero el bloque central resuelve la actividad planteada en la sesión de 'Actividad'.",
  repaso: "Sintetiza lo más relevante de todos los documentos cargados: mapa conceptual, glosario, errores frecuentes y flashcards de autoevaluación.",
};

export function deckTitle(content: UnirDeckContent): string {
  return content.type === "repaso" ? content.subjectName : content.sessionTitle;
}
