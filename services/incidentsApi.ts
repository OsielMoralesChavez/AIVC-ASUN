import type { Incident, IncidentCategory, IncidentSeverity, IncidentStatus, IncidentSummary } from "../types/incidents";
import { handleJsonResponse, apiFetch } from "./httpClient";

export async function createIncident(input: {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
}): Promise<Incident> {
  const res = await apiFetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJsonResponse(res);
}

export async function listIncidents(): Promise<Incident[]> {
  const res = await apiFetch("/api/incidents");
  const data = await handleJsonResponse<{ incidents: Incident[] }>(res);
  return data.incidents;
}

export async function getIncidentSummary(): Promise<IncidentSummary> {
  const res = await apiFetch("/api/incidents/summary");
  return handleJsonResponse(res);
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const res = await apiFetch(`/api/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleJsonResponse(res);
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await apiFetch(`/api/incidents/${id}`, { method: "DELETE" });
  await handleJsonResponse(res);
}
