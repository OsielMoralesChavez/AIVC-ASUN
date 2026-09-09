import { z } from "zod";
import { academicLevelSchema } from "./presentation.schema";

export const bloomLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const bloomObjectiveSchema = z.object({
  level: bloomLevelSchema,
  verb: z.string().min(1).max(60),
  statement: z.string().min(1).max(400),
});

export const agendaItemSchema = z.object({
  label: z.string().min(1).max(160),
  minutes: z.number().min(1).max(240),
});

export const cardContentSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
});

export const stepContentSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
});

export const glassPartContentSchema = z.object({
  label: z.string().min(1).max(80),
  body: z.string().min(1).max(500),
  note: z.string().max(600).optional(),
});

export const linkResourceSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().min(1).max(300),
  year: z.number().int().min(1990).max(2100).optional(),
  verified: z.boolean(),
  sourceNote: z.string().max(300).optional(),
});

export const sourceRefSchema = z.object({
  documentId: z.string().min(1),
  fileName: z.string().min(1),
  page: z.number().int().min(1),
});

export const institutionScopeSchema = z.enum(["mexico", "internacional", "mixto"]);

export const imagePromptSlideContentSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(600),
  imagePrompt: z.string().min(1).max(400),
});

export const debatePositionSchema = z.object({
  title: z.string().min(1).max(120),
  argument: z.string().min(1).max(400),
});

export const debateContentSchema = z.object({
  question: z.string().min(1).max(300),
  positionA: debatePositionSchema,
  positionB: debatePositionSchema,
  reflectionPrompt: z.string().min(1).max(300),
  groundRule: z.string().max(200).optional(),
});

export const syllabusWeekSchema = z.object({
  weekNumber: z.number().int().min(1).max(60),
  topic: z.string().min(1).max(200),
});

export const marcoTeoricoItemSchema = z.object({
  concept: z.string().min(1).max(160),
  author: z.string().min(1).max(160),
  year: z.number().int().min(1400).max(2100).optional(),
  body: z.string().min(1).max(300),
});

export const formulaDefinitionItemSchema = z.object({
  formula: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  usage: z.string().min(1).max(300),
});

export const comparisonTableRowSchema = z.object({
  label: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
});

export const comparisonTableContentSchema = z.object({
  question: z.string().min(1).max(200),
  col1Label: z.string().min(1).max(60),
  col2Label: z.string().min(1).max(60),
  rows: z.array(comparisonTableRowSchema).min(3).max(6),
});

export const matrixQuadrantSchema = z.object({
  label: z.string().min(1).max(80),
  body: z.string().min(1).max(250),
  dark: z.boolean(),
});

export const matrix2x2ContentSchema = z.object({
  xAxisLabel: z.string().min(1).max(60),
  yAxisLabel: z.string().min(1).max(60),
  quadrants: z.tuple([matrixQuadrantSchema, matrixQuadrantSchema, matrixQuadrantSchema, matrixQuadrantSchema]),
});

export const verifiedFigureSchema = z.object({
  value: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  source: z.string().min(1).max(160),
  year: z.number().int().min(1990).max(2100),
});

export const professionalPanelContentSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(600),
  bullets: z.array(z.string().min(1).max(160)).min(3).max(4),
  imagePrompt: z.string().min(1).max(400),
});

export const guidedPracticeContentSchema = z.object({
  dataPanelTitle: z.string().min(1).max(120),
  dataPanelBody: z.string().min(1).max(500),
  steps: z.array(stepContentSchema).length(4),
  nowYouQuestion: z.string().min(1).max(300),
});

/** Sube aquí desde la sección de repaso: `primeraClaseContentSchema` también lo usa (anexo de
 * glosario) y una `const` referenciada antes de su definición revienta al cargar el módulo. */
export const glossaryEntrySchema = z.object({
  term: z.string().min(1).max(120),
  definition: z.string().min(1).max(300),
});

export const teamChallengeCaseSchema = z.object({
  title: z.string().min(1).max(160),
  prompt: z.string().min(1).max(500),
});

/** Exactamente una opción correcta: dos correctas (o ninguna) harían imposible resaltar la
 * respuesta en la lámina, que es el punto de esta autoevaluación. */
export const selfAssessmentContentSchema = z.object({
  scenario: z.string().min(1).max(700),
  options: z
    .array(z.object({ text: z.string().min(1).max(300), correct: z.boolean() }))
    .length(4)
    .refine((opts) => opts.filter((o) => o.correct).length === 1, {
      message: "La autoevaluación debe tener exactamente una opción correcta.",
    }),
  explanation: z.string().min(1).max(700),
});

/** Registro parcial por clave de lámina — el campo en sí es obligatorio (puede ser `{}`), pero
 * ninguna clave puntual lo es (`Partial<Record<...>>` en TS). */
export const presenterNotesSchema = z.record(z.string(), z.string().min(1).max(600));

export const conceptMapBranchSchema = z.object({
  unit: z.string().min(1).max(160),
  concepts: z.array(z.string().min(1).max(120)).min(1).max(4),
});

export const commonErrorSchema = z.object({
  believed: z.string().min(1).max(200),
  reality: z.string().min(1).max(200),
  why: z.string().min(1).max(300),
});

export const flashcardSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(300),
});

const unirBaseSchema = z.object({
  weekNumber: z.number().int().min(1).max(52),
  topicNumber: z.number().int().min(1).max(52),
  courseName: z.string().max(200).optional(),
  sessionTitle: z.string().min(1).max(200),
  academicLevel: academicLevelSchema,
  durationMinutes: z.number().int().min(10).max(600),
  institutionScope: institutionScopeSchema.optional(),
  learningObjective: bloomObjectiveSchema,
  agenda: z.array(agendaItemSchema).min(1).max(8),
  introduction: z.string().min(1).max(1200),
  introductionHook: z.string().min(1).max(300),
  developmentCardsTitle: z.string().min(1).max(120),
  developmentCards: z.array(cardContentSchema).length(4),
  developmentStepsTitle: z.string().min(1).max(120),
  developmentSteps: z.array(stepContentSchema).min(3).max(5),
  links: z.array(linkResourceSchema).min(1).max(5),
  conclusion: z.array(z.string().min(1).max(300)).min(1).max(3),
  // La bibliografía de un curso real fácilmente supera 20 entradas (se vio en la práctica: un
  // documento fuente extenso produjo 36 referencias únicas) — el tope solo existe para evitar
  // una lista descontrolada, no para reflejar cuántas referencias son razonables.
  references: z.array(z.string().min(1).max(500)).max(80),
  nextClassTopic: z.string().max(200).optional(),
  nextClassPreview: z.string().max(500).optional(),
  closingQuestion: z.string().min(1).max(300),
  closingNote: z.string().max(300),
  assumptions: z.array(z.string().max(400)).max(20),
  warnings: z.array(z.string().max(400)).max(20),
  sourceReferences: z.array(sourceRefSchema).max(40),
});

export const primeraClaseContentSchema = unirBaseSchema.extend({
  type: z.literal("primera-clase"),
  caseStudy: z.array(glassPartContentSchema).min(3).max(5),
  teacherName: z.string().min(1).max(160),
  teacherTitle: z.string().max(200),
  teacherFormation: z.string().max(300),
  teacherExperience: z.string().max(300),
  teacherSpecialty: z.string().max(300),
  teacherContact: z.string().max(200),
  teacherPhotoPrompt: z.string().min(1).max(400),
  units: z.array(z.object({ title: z.string().min(1).max(120), topics: z.string().min(1).max(400) })).min(1).max(8),
  teamActivity: z.object({ description: z.string().min(1).max(500), dueDate: z.string().max(60) }),
  individualActivity: z.object({ description: z.string().min(1).max(500), dueDate: z.string().max(60) }),
  forumDescription: z.string().min(1).max(400),
  evaluationSchemeNote: z.string().max(600).optional(),

  courseSyllabus: z.array(syllabusWeekSchema).max(60).optional(),
  learningObjectiveHint: z.string().max(2000).optional(),

  introductionImagePrompt: z.string().min(1).max(400),
  professionalPanelEncuadre: professionalPanelContentSchema,
  conceptMapCenter: z.string().min(1).max(160),
  conceptMapBranches: z.array(conceptMapBranchSchema).min(1).max(8),
  marcoTeorico: z.array(marcoTeoricoItemSchema).length(4),
  formulasDefinitions: z.array(formulaDefinitionItemSchema).min(2).max(6).optional(),
  comparisonTable: comparisonTableContentSchema.optional(),
  matrix2x2: matrix2x2ContentSchema.optional(),
  verifiedFigures: z.array(verifiedFigureSchema).max(3),
  professionalPanelAplicacion: professionalPanelContentSchema,
  guidedPractice: guidedPracticeContentSchema,
  debate: debateContentSchema,
  commonErrors: z.array(commonErrorSchema).min(1).max(8),
  flashcards: z.array(flashcardSchema).min(1).max(10),
  nextClassImagePrompt: z.string().max(400).optional(),

  // --- Catálogo de 38 láminas ---
  secondCaseStudy: z.array(glassPartContentSchema).min(3).max(5),
  secondGuidedPractice: guidedPracticeContentSchema,
  teamChallenge: z.array(teamChallengeCaseSchema).min(2).max(4),
  selfAssessment: selfAssessmentContentSchema,
  glossary: z.array(glossaryEntrySchema).min(4).max(10),
  closingMotivation: z.string().min(1).max(300),
  conceptMapApply: z.string().min(1).max(400),
  marcoTeoricoApply: z.string().min(1).max(400),
  matrix2x2Apply: z.string().max(400).optional(),
  presenterNotes: presenterNotesSchema,
});

export const caseStudyKindSchema = z.enum(["caso-practico", "actividad", "solucion"]);

/**
 * Una lámina del desarrollo, discriminada por `layout`. Zod valida aquí lo mismo que el tipo: una
 * familia desconocida se rechaza en vez de llegar al deck y quedar en blanco.
 */
const developmentSlideBaseShape = {
  title: z.string().min(1).max(200),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  verb: z.string().min(1).max(40),
  // La habilidad pide entre 2 y 5 minutos por lámina de desarrollo.
  minutes: z.number().int().min(2).max(5),
  note: z.string().min(1).max(900),
};

export const developmentSlideSchema = z.discriminatedUnion("layout", [
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("section-divider"),
    eyebrow: z.string().min(1).max(60),
    subtitle: z.string().min(1).max(300),
  }),
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("concept-5050"),
    body: z.string().min(1).max(600),
    imagePrompt: z.string().min(1).max(400),
  }),
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("definition-focus"),
    term: z.string().min(1).max(160),
    definition: z.string().min(1).max(400),
    attributes: z.array(z.object({ title: z.string().min(1).max(80), text: z.string().min(1).max(200) })).max(3),
  }),
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("four-cards"),
    // «Máximo cuatro tarjetas o cinco pasos por lámina».
    cards: z.array(cardContentSchema).min(1).max(4),
  }),
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("process"),
    steps: z.array(stepContentSchema).min(3).max(5),
  }),
  z.object({ ...developmentSlideBaseShape, layout: z.literal("comparison"), table: comparisonTableContentSchema }),
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("data-highlight"),
    figures: z.array(verifiedFigureSchema).min(1).max(4),
  }),
  z.object({
    ...developmentSlideBaseShape,
    layout: z.literal("transfer-summary"),
    rule: z.string().min(1).max(400),
    useWhen: z.string().min(1).max(300),
    evidence: z.string().min(1).max(300),
    commonError: z.string().min(1).max(300),
    interaction: z.string().min(1).max(300),
  }),
]);

export const normalLikeContentSchema = unirBaseSchema.extend({
  type: z.enum(["normal", "actividad", "solucion"]),
  caseKind: caseStudyKindSchema,
  caseStudyEyebrow: z.string().min(1).max(60),
  previousClassTopic: z.string().max(200).optional(),
  previousClassSummary: z.string().max(600).optional(),
  introductionImagePrompt: z.string().min(1).max(400),
  caseStudy: z.array(glassPartContentSchema).min(3).max(5),
  activityProjectableSlide: z
    .object({ title: z.string().min(1).max(160), bullets: z.array(z.string().min(1).max(200)).min(1).max(6) })
    .optional(),
  transferExercise: z.string().max(600).optional(),
  linkedActivityPresentationId: z.string().optional(),
  // D según la duración: 6 es el mínimo absoluto (60 min) y 24 el máximo (180 min).
  development: z.array(developmentSlideSchema).min(6).max(24),
  presenterNotes: presenterNotesSchema,
});

export const unitSynthesisSchema = z.object({
  unit: z.string().min(1).max(160),
  centralIdea: z.string().min(1).max(300),
  keyPoints: z.array(z.string().min(1).max(200)).min(1).max(5),
  connection: z.string().min(1).max(300),
  note: z.string().max(600).optional(),
});

export const connectionEntrySchema = z.object({
  from: z.string().min(1).max(160),
  to: z.string().min(1).max(160),
  relation: z.string().min(1).max(300),
});

export const repasoContentSchema = z.object({
  type: z.literal("repaso"),
  subjectName: z.string().min(1).max(200),
  academicLevel: academicLevelSchema,
  unitCount: z.number().int().min(1).max(20),
  objective: bloomObjectiveSchema,
  howToUse: z.string().min(1).max(600),
  hookQuestion: z.string().min(1).max(300),
  conceptMapCenter: z.string().min(1).max(160),
  conceptMapBranches: z.array(conceptMapBranchSchema).min(1).max(8),
  unitSyntheses: z.array(unitSynthesisSchema).min(1).max(12),
  glossary: z.array(glossaryEntrySchema).min(1).max(16),
  formulasProcesses: z.array(formulaDefinitionItemSchema).min(2).max(6).optional(),
  commonErrors: z.array(commonErrorSchema).min(1).max(8),
  flashcards: z.array(flashcardSchema).min(1).max(10),
  connections: z.array(connectionEntrySchema).max(8),
  studyRoadmap: z.array(z.string().min(1).max(300)).min(1).max(10),
  links: z.array(linkResourceSchema).min(1).max(5),
  // La bibliografía de un curso real fácilmente supera 20 entradas (se vio en la práctica: un
  // documento fuente extenso produjo 36 referencias únicas) — el tope solo existe para evitar
  // una lista descontrolada, no para reflejar cuántas referencias son razonables.
  references: z.array(z.string().min(1).max(500)).max(80),
  closingQuestion: z.string().min(1).max(300),
  assumptions: z.array(z.string().max(400)).max(20),
  warnings: z.array(z.string().max(400)).max(20),
  sourceReferences: z.array(sourceRefSchema).max(40),
  sourcePresentationIds: z.array(z.string()).max(10),
  presenterNotes: presenterNotesSchema,
});

export const unirDeckContentSchema = z.discriminatedUnion("type", [
  primeraClaseContentSchema,
  normalLikeContentSchema,
  repasoContentSchema,
]);

export const unirSessionInputsSchema = z.object({
  courseName: z.string().max(200).optional(),
  weekNumber: z.number().int().min(1).max(52),
  topicNumber: z.number().int().min(1).max(52),
  sessionTitle: z.string().min(1).max(200),
  academicLevel: academicLevelSchema,
  durationMinutes: z.number().int().min(10).max(600),
  institutionScope: institutionScopeSchema.optional(),
  audience: z.string().max(400).optional(),
  previousClassTopic: z.string().max(200).optional(),
  nextClassTopic: z.string().max(200).optional(),
  learningObjectiveHint: z.string().max(400).optional(),
  teacherName: z.string().max(160).optional(),
  teacherTitle: z.string().max(200).optional(),
  teacherFormation: z.string().max(300).optional(),
  teacherExperience: z.string().max(300).optional(),
  teacherSpecialty: z.string().max(300).optional(),
  teacherContact: z.string().max(200).optional(),
  teamActivityDescription: z.string().max(500).optional(),
  teamActivityDueDate: z.string().max(60).optional(),
  individualActivityDescription: z.string().max(500).optional(),
  individualActivityDueDate: z.string().max(60).optional(),
  forumDescription: z.string().max(400).optional(),
  evaluationSchemeNote: z.string().max(600).optional(),
});

export const unirPlanRequestSchema = z.object({
  materiaId: z.string().min(1),
  documentIds: z.array(z.string().min(1)).min(1).max(10).optional(),
  deckType: z.enum(["primera-clase", "normal", "actividad", "solucion", "repaso"]),
  inputs: unirSessionInputsSchema.optional(),
  sourcePresentationIds: z.array(z.string()).max(10).optional(),
  voiceProfileId: z.string().min(1).optional(),
});

/** Generación masiva: las 5 modalidades del curso a partir de los mismos documentos, en un
 * solo job (ver lib/controllers/bulkPresentationsController.ts). No lleva `deckType` — se
 * generan todas en la secuencia fija primera-clase → normal → actividad → solución → repaso. */
export const bulkPlanRequestSchema = z.object({
  materiaId: z.string().min(1),
  documentIds: z.array(z.string().min(1)).min(1).max(10),
  inputs: unirSessionInputsSchema,
  voiceProfileId: z.string().min(1).optional(),
});

/** Generación masiva desde la programación semanal del curso (ver
 * lib/controllers/scheduleBulkController.ts) — a diferencia de bulkPlanRequestSchema, aquí las N
 * semanas no siguen una secuencia fija de 5 tipos: cada semana trae su propio deckType, detectado
 * (y editable por el usuario) a partir del PDF de programación. */
export const schedulePreviewRequestSchema = z.object({
  materiaId: z.string().min(1),
  scheduleDocumentId: z.string().min(1),
  practiceDocumentId: z.string().min(1).optional(),
  ideasClaveDocumentIds: z.array(z.string().min(1)).min(1).max(15),
});

export const scheduleWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  sessionTitle: z.string().min(1).max(200),
  deckType: z.enum(["primera-clase", "normal", "actividad", "solucion", "repaso"]),
  durationMinutes: z.number().int().min(10).max(600),
  temaDocumentIds: z.array(z.string().min(1)).max(10),
  temaTitles: z.array(z.string()).max(10),
  learningObjectiveHint: z.string().max(2000).optional(),
});

export const scheduleBulkPlanRequestSchema = z.object({
  materiaId: z.string().min(1),
  weeks: z.array(scheduleWeekSchema).min(1).max(30),
  inputs: unirSessionInputsSchema,
  voiceProfileId: z.string().min(1).optional(),
  /** Reintento: id del job anterior. Las semanas que allí terminaron bien se conservan tal cual
   * (no se regeneran ni se duplican) y solo se rehacen las que fallaron. */
  retryOfJobId: z.string().min(1).optional(),
});
