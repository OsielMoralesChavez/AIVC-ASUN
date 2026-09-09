import { z } from "zod";

export const rubricCriterionSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  maxScore: z.number().positive().max(1000),
});

export const createRubricSchema = z.object({
  name: z.string().trim().min(1).max(160),
  criteria: z.array(rubricCriterionSchema).min(1).max(20),
});

export const updateRubricSchema = createRubricSchema;

export const catadorSettingsPatchSchema = z
  .object({
    excelFolderPath: z.string().trim().max(1000).optional(),
    powerBi: z
      .object({
        tenantId: z.string().trim().max(200).optional(),
        clientId: z.string().trim().max(200).optional(),
        clientSecret: z.string().trim().max(500).optional(),
        workspaceId: z.string().trim().max(200).optional(),
        datasetName: z.string().trim().min(1).max(120).optional(),
        tableName: z.string().trim().min(1).max(120).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
