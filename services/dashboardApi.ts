import { handleJsonResponse, apiFetch } from "./httpClient";
import type { MinicasoItem } from "../types/minicasos";

export interface DashboardSummary {
  totals: { subjects: number; generatedClasses: number; presentations: number; questionBanks: number };
  classesBySubject: { subjectId: string; subjectName: string; generatedClasses: number }[];
}

export interface MateriaResourceCounts {
  classes: number;
  presentations: number;
  questionBanks: number;
  questions: number;
}

export interface MateriaDetail {
  materia: { id: string; name: string; category: string | null; createdAt: string; updatedAt: string };
  counts: MateriaResourceCounts;
  classes: {
    id: string;
    deckType: string;
    title: string;
    weekNumber: number | null;
    createdAt: string;
    updatedAt: string;
  }[];
  questionBanks: {
    id: string;
    subjectName: string;
    academicLevel: string;
    questionCount: number;
    createdAt: string;
    items: MinicasoItem[];
  }[];
  sourceDocuments: {
    id: string;
    fileName: string;
    sourceKind: string;
    role: string;
    pageCount: number;
    createdAt: string;
  }[];
  missingData: Record<string, string>;
}

/** Fuente ÚNICA de las métricas del Dashboard — se vuelve a pedir tras cada cambio en vez de
 * restar localmente, para que tarjetas y gráfica no puedan desincronizarse del backend. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiFetch("/api/dashboard/summary");
  return handleJsonResponse(res);
}

export async function getMateriaDetail(materiaId: string): Promise<MateriaDetail> {
  const res = await apiFetch(`/api/materias/${materiaId}/detail`);
  return handleJsonResponse(res);
}

export async function getMateriaCounts(
  materiaId: string
): Promise<{ materia: { id: string; name: string }; counts: MateriaResourceCounts }> {
  const res = await apiFetch(`/api/materias/${materiaId}/counts`);
  return handleJsonResponse(res);
}
