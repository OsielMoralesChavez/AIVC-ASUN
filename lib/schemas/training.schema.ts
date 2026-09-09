import { z } from "zod";

export const createVoiceProfileSchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateVoiceProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  toneDescription: z.string().max(2000).optional(),
  styleGuidelines: z.array(z.string().min(1).max(300)).max(20).optional(),
  vocabularyNotes: z.array(z.string().min(1).max(120)).max(30).optional(),
});

export const trainingDataEntrySchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(1000),
});

/** Cuestionario de tono de voz (alternativa a subir PDFs de muestra, ver
 * components/VoiceQuestionnaire.tsx): el texto ya viene concatenado desde el cliente — el
 * mínimo de 150 caracteres exige una muestra real, no un par de palabras sueltas. */
export const analyzeTextRequestSchema = z.object({
  text: z.string().min(150).max(20000),
  sourceLabel: z.string().min(1).max(120).optional(),
});

export const voiceAnalysisResponseSchema = z.object({
  toneDescription: z.string().min(1).max(2000),
  styleGuidelines: z.array(z.string().min(1).max(300)).min(1).max(20),
  vocabularyNotes: z.array(z.string().min(1).max(120)).max(30).default([]),
});
