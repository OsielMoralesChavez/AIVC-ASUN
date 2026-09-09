import { z } from "zod";

export const chunkSummaryResponseSchema = z.object({
  keyConcepts: z.array(z.string().max(200)).max(15).default([]),
  objectives: z.array(z.string().max(200)).max(10).default([]),
  examples: z.array(z.string().max(200)).max(10).default([]),
  activities: z.array(z.string().max(200)).max(10).default([]),
  data: z.array(z.string().max(200)).max(10).default([]),
  references: z.array(z.string().max(200)).max(10).default([]),
});

export type ChunkSummaryResponse = z.infer<typeof chunkSummaryResponseSchema>;
