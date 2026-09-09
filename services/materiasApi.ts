import type { Materia, MateriaSummary } from "../types/materias";
import { handleJsonResponse, apiFetch } from "./httpClient";

export async function createMateria(name: string, category?: string | null): Promise<Materia> {
  const res = await apiFetch("/api/materias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category }),
  });
  return handleJsonResponse(res);
}

export async function listMaterias(): Promise<MateriaSummary[]> {
  const res = await apiFetch("/api/materias");
  const data = await handleJsonResponse<{ materias: MateriaSummary[] }>(res);
  return data.materias;
}

export async function renameMateria(id: string, name: string): Promise<Materia> {
  const res = await apiFetch(`/api/materias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleJsonResponse(res);
}

export async function deleteMateria(id: string): Promise<void> {
  const res = await apiFetch(`/api/materias/${id}`, { method: "DELETE" });
  await handleJsonResponse(res);
}
