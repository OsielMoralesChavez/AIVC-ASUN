import { z } from "zod";

export const incidentCategorySchema = z.enum(["bug", "soporte", "contenido", "cuenta", "otro"]);
export const incidentSeveritySchema = z.enum(["baja", "media", "alta", "critica"]);
export const incidentStatusSchema = z.enum(["abierta", "en_progreso", "resuelta", "cerrada"]);

export const createIncidentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  category: incidentCategorySchema,
  severity: incidentSeveritySchema,
});

export const updateIncidentStatusSchema = z.object({
  status: incidentStatusSchema,
});
