import { z } from "zod";

export const minicasoAcademicLevelSchema = z.enum(["licenciatura", "maestria"]);
export const bloomCaseLevelSchema = z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);

export const minicasoSourceRefSchema = z.object({
  documentId: z.string().min(1),
  fileName: z.string().min(1),
  page: z.number().int().min(1),
});

export const minicasoItemSchema = z.object({
  id: z.string().min(1),
  scenario: z.string().min(20).max(1200),
  options: z.array(z.string().min(1).max(400)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  bloomLevel: bloomCaseLevelSchema,
  topic: z.string().min(1).max(160),
  sourceReferences: z.array(minicasoSourceRefSchema).max(10),
});

export const minicasoBankCoreSchema = z.object({
  academicLevel: minicasoAcademicLevelSchema,
  subjectName: z.string().min(1).max(200),
  requestedCount: z.number().int().min(1).max(80),
  items: z.array(minicasoItemSchema).min(1).max(80),
  topicsCovered: z.array(z.string().min(1).max(160)).max(40),
  assumptions: z.array(z.string().max(400)).max(20),
  warnings: z.array(z.string().max(400)).max(20),
});

/** El banco se genera a partir de clases (presentaciones) ya generadas de una materia, nunca de
 * documentos re-subidos — ver lib/minicasos/minicasosGenerator.ts. */
export const minicasoPlanRequestSchema = z.object({
  materiaId: z.string().min(1),
  sourcePresentationIds: z.array(z.string().min(1)).min(1).max(20),
  academicLevel: minicasoAcademicLevelSchema,
  subjectName: z.string().min(1).max(200).optional(),
  count: z.number().int().min(1).max(80).default(30),
});

/** Respuesta de un lote de minicasos generado por el modelo (sin ids todavía). */
export const minicasoItemDraftSchema = z.object({
  scenario: z.string().min(20).max(1200),
  options: z.array(z.string().min(1).max(400)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  bloomLevel: bloomCaseLevelSchema,
  topic: z.string().min(1).max(160),
});

export const minicasoBatchResponseSchema = z.object({
  items: z.array(minicasoItemDraftSchema).min(1),
});
