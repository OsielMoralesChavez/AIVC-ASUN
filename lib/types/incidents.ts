export type IncidentCategory = "bug" | "soporte" | "contenido" | "cuenta" | "otro";
export type IncidentSeverity = "baja" | "media" | "alta" | "critica";
export type IncidentStatus = "abierta" | "en_progreso" | "resuelta" | "cerrada";

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  bug: "Error del sistema",
  soporte: "Soporte técnico",
  contenido: "Contenido académico",
  cuenta: "Cuenta y acceso",
  otro: "Otro",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  abierta: "Abierta",
  en_progreso: "En progreso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedByEmail: string | null;
  reportedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentSummary {
  totals: {
    total: number;
    /** `abierta` + `en_progreso`. */
    open: number;
    /** `resuelta` + `cerrada`. */
    resolved: number;
    /** Severidad `critica` con estado todavía abierto — la cifra que de verdad exige atención. */
    criticalOpen: number;
  };
  byCategory: { category: IncidentCategory; count: number }[];
  byStatus: { status: IncidentStatus; count: number }[];
  recent: Incident[];
}
