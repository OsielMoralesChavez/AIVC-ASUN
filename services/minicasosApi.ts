import type { MinicasoAcademicLevel, MinicasoBank, MinicasoBankSummary } from "../types/minicasos";
import { downloadFile, handleJsonResponse, apiFetch } from "./httpClient";

export interface MinicasoPlanInput {
  materiaId: string;
  sourcePresentationIds: string[];
  academicLevel: MinicasoAcademicLevel;
  subjectName?: string;
  count: number;
}

export async function requestMinicasoPlan(input: MinicasoPlanInput): Promise<{ jobId: string }> {
  const res = await apiFetch("/api/minicasos/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

export async function listMinicasoBanks(materiaId: string): Promise<MinicasoBankSummary[]> {
  const res = await apiFetch(`/api/minicasos?materiaId=${encodeURIComponent(materiaId)}`);
  const data = await handleJsonResponse<{ banks: MinicasoBankSummary[] }>(res);
  return data.banks;
}

export async function getMinicasoBank(id: string): Promise<MinicasoBank> {
  const res = await apiFetch(`/api/minicasos/${id}`);
  return handleJsonResponse(res);
}

export async function updateMinicasoBank(
  id: string,
  patch: Pick<MinicasoBank, "academicLevel" | "subjectName" | "requestedCount" | "items" | "topicsCovered" | "assumptions" | "warnings">
): Promise<MinicasoBank> {
  const res = await apiFetch(`/api/minicasos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return handleJsonResponse(res);
}

export async function requestMinicasoExport(id: string): Promise<{ jobId: string; bankId: string }> {
  const res = await apiFetch(`/api/minicasos/${id}/export`, { method: "POST" });
  return handleJsonResponse(res);
}

export async function downloadMinicasoBank(id: string, suggestedName: string): Promise<void> {
  await downloadFile(`/api/minicasos/${id}/download`, suggestedName);
}
