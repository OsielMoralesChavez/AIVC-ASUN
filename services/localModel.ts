import { handleJsonResponse, apiFetch } from "./httpClient";

export interface LocalModelStatus {
  downloaded: boolean;
  sizeBytes?: number;
}

export async function getLocalModelStatus(): Promise<LocalModelStatus> {
  const res = await apiFetch("/api/ai/local-model");
  return handleJsonResponse(res);
}

export async function requestLocalModelDownload(): Promise<{ jobId: string }> {
  const res = await apiFetch("/api/ai/local-model", { method: "POST" });
  return handleJsonResponse(res);
}
