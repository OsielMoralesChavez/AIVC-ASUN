import type { TrainingDataEntry, VoiceProfile, VoiceProfileSummary } from "../types/training";
import { handleJsonResponse, apiFetch } from "./httpClient";

export async function createVoiceProfile(name: string): Promise<VoiceProfile> {
  const res = await apiFetch("/api/training/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleJsonResponse(res);
}

export async function listVoiceProfiles(): Promise<VoiceProfileSummary[]> {
  const res = await apiFetch("/api/training/profiles");
  const data = await handleJsonResponse<{ profiles: VoiceProfileSummary[] }>(res);
  return data.profiles;
}

export async function getVoiceProfile(id: string): Promise<VoiceProfile> {
  const res = await apiFetch(`/api/training/profiles/${id}`);
  return handleJsonResponse(res);
}

export async function updateVoiceProfile(
  id: string,
  patch: Partial<Pick<VoiceProfile, "name" | "toneDescription" | "styleGuidelines" | "vocabularyNotes">>
): Promise<VoiceProfile> {
  const res = await apiFetch(`/api/training/profiles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return handleJsonResponse(res);
}

export async function deleteVoiceProfile(id: string): Promise<void> {
  const res = await apiFetch(`/api/training/profiles/${id}`, { method: "DELETE" });
  await handleJsonResponse(res);
}

export async function addTrainingDataEntry(profileId: string, label: string, value: string): Promise<TrainingDataEntry> {
  const res = await apiFetch(`/api/training/profiles/${profileId}/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, value }),
  });
  return handleJsonResponse(res);
}

export async function editTrainingDataEntry(
  profileId: string,
  entryId: string,
  patch: { label?: string; value?: string }
): Promise<void> {
  const res = await apiFetch(`/api/training/profiles/${profileId}/data/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  await handleJsonResponse(res);
}

export async function deleteTrainingDataEntry(profileId: string, entryId: string): Promise<void> {
  const res = await apiFetch(`/api/training/profiles/${profileId}/data/${entryId}`, { method: "DELETE" });
  await handleJsonResponse(res);
}

export async function analyzeVoiceProfileDocuments(
  profileId: string,
  files: File[]
): Promise<{ jobId: string; profileId: string }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await apiFetch(`/api/training/profiles/${profileId}/analyze`, { method: "POST", body: formData });
  return handleJsonResponse(res);
}

/** Analiza el tono de voz a partir de texto ya listo (respuestas del cuestionario) en vez de
 * PDFs subidos — mismo resultado (actualiza toneDescription/styleGuidelines/vocabularyNotes),
 * sin pasar por extracción de PDF. */
export async function analyzeVoiceProfileText(
  profileId: string,
  text: string,
  sourceLabel?: string
): Promise<{ jobId: string; profileId: string }> {
  const res = await apiFetch(`/api/training/profiles/${profileId}/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLabel }),
  });
  return handleJsonResponse(res);
}
