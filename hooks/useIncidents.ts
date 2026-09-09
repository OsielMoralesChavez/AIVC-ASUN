"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/httpClient";
import {
  createIncident,
  deleteIncident,
  getIncidentSummary,
  listIncidents,
  updateIncidentStatus,
} from "../services/incidentsApi";
import type { Incident, IncidentCategory, IncidentSeverity, IncidentStatus, IncidentSummary } from "../types/incidents";

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([listIncidents(), getIncidentSummary()]);
      setIncidents(list);
      setSummary(sum);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las incidencias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const report = useCallback(
    async (input: { title: string; description: string; category: IncidentCategory; severity: IncidentSeverity }) => {
      setError(null);
      try {
        await createIncident(input);
        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo reportar la incidencia.");
        return false;
      }
    },
    [refresh]
  );

  const setStatus = useCallback(
    async (id: string, status: IncidentStatus) => {
      setError(null);
      try {
        await updateIncidentStatus(id, status);
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado de la incidencia.");
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteIncident(id);
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo eliminar la incidencia.");
      }
    },
    [refresh]
  );

  return { incidents, summary, error, setError, loading, report, setStatus, remove };
}
