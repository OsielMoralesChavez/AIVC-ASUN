import { handleJsonResponse, apiFetch } from "./httpClient";
import type { ResearchTool } from "../lib/research/researchTools";

export type { ResearchTool };

export interface ResearchRecommendationResponse {
  recommendedToolIds: string[];
  reasonByTool: { toolId: string; reason: string }[];
  suggestedKeywords: string[];
  suggestedQueries: string[];
  recommendedSourceTypes: string[];
  warnings: string[];
  rejectedToolIds: string[];
  tools: { tool: ResearchTool; reason: string }[];
  meta: { provider: string; durationMs: number };
}

export interface ResearchQueryInput {
  topic: string;
  researchQuestion?: string;
  sourceTypes?: string[];
  periodFrom?: string;
  periodTo?: string;
  languages?: string[];
  knowledgeArea?: string;
}

export async function listResearchTools(): Promise<{
  tools: ResearchTool[];
  total: number;
  aiStatus: { configured: boolean; provider: string };
}> {
  const res = await apiFetch("/api/research/tools");
  return handleJsonResponse(res);
}

/** El asistente corre EN EL BACKEND con la conexión central: el navegador nunca habla con el
 * proveedor de IA ni ve credenciales. */
export async function requestResearchRecommendation(
  input: ResearchQueryInput
): Promise<ResearchRecommendationResponse> {
  const res = await apiFetch("/api/research/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}
