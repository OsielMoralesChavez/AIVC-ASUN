import type {
  CatadorSettings,
  CatadorSettingsPatch,
  ClassReview,
  ClassReviewSummary,
  Rubric,
  RubricCriterion,
  UpdateRunResult,
} from "../lib/types/catador";
import { apiFetch, handleJsonResponse } from "./httpClient";

export async function listRubrics(): Promise<Rubric[]> {
  const res = await apiFetch("/api/catador/rubrics");
  const data = await handleJsonResponse<{ rubrics: Rubric[] }>(res);
  return data.rubrics;
}

export async function createRubric(name: string, criteria: RubricCriterion[]): Promise<Rubric> {
  const res = await apiFetch("/api/catador/rubrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, criteria }),
  });
  return handleJsonResponse(res);
}

export async function updateRubric(id: string, name: string, criteria: RubricCriterion[]): Promise<Rubric> {
  const res = await apiFetch(`/api/catador/rubrics/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, criteria }),
  });
  return handleJsonResponse(res);
}

export async function deleteRubric(id: string): Promise<void> {
  const res = await apiFetch(`/api/catador/rubrics/${id}`, { method: "DELETE" });
  await handleJsonResponse(res);
}

export async function listReviews(): Promise<ClassReviewSummary[]> {
  const res = await apiFetch("/api/catador/reviews");
  const data = await handleJsonResponse<{ reviews: ClassReviewSummary[] }>(res);
  return data.reviews;
}

export async function getReview(id: string): Promise<ClassReview> {
  const res = await apiFetch(`/api/catador/reviews/${id}`);
  return handleJsonResponse(res);
}

export async function uploadReviewVideo(rubricId: string, file: File): Promise<{ review: ClassReview; jobId: string }> {
  const formData = new FormData();
  formData.append("rubricId", rubricId);
  formData.append("video", file);
  const res = await apiFetch("/api/catador/reviews", { method: "POST", body: formData });
  return handleJsonResponse(res);
}

export async function getCatadorSettings(): Promise<CatadorSettings> {
  const res = await apiFetch("/api/catador/settings");
  return handleJsonResponse(res);
}

export async function updateCatadorSettings(patch: CatadorSettingsPatch): Promise<CatadorSettings> {
  const res = await apiFetch("/api/catador/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return handleJsonResponse(res);
}

export async function runCatadorUpdate(): Promise<UpdateRunResult> {
  const res = await apiFetch("/api/catador/actualizar", { method: "POST" });
  return handleJsonResponse(res);
}
