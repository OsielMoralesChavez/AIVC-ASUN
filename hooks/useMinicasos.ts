"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProgressState } from "../components/ProgressStatus";
import { getJob, listSessionPresentations, type SessionPresentationSummary } from "../services/api";
import { ApiError } from "../services/httpClient";
import {
  downloadMinicasoBank,
  getMinicasoBank,
  requestMinicasoExport,
  requestMinicasoPlan,
  updateMinicasoBank,
} from "../services/minicasosApi";
import type { MinicasoAcademicLevel, MinicasoBank } from "../types/minicasos";

async function pollJob(jobId: string, onUpdate: (job: { status: string; progress: number; message: string; error?: string; resultId?: string }) => void) {
  for (;;) {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "done" || job.status === "error") return job;
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
}

export function useMinicasos(materiaId: string) {
  const [sourcePresentations, setSourcePresentations] = useState<SessionPresentationSummary[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const [academicLevel, setAcademicLevel] = useState<MinicasoAcademicLevel>("licenciatura");
  const [count, setCount] = useState(30);

  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bank, setBank] = useState<MinicasoBank | null>(null);

  const [exportProgress, setExportProgress] = useState<ProgressState | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);

  const refreshSourcePresentations = useCallback(async () => {
    try {
      const list = await listSessionPresentations(materiaId);
      // El repaso general no sirve como fuente del banco: no aporta ideas clave propias, solo
      // resume las demás clases.
      const usable = list.filter((p) => p.deckType !== "repaso");
      setSourcePresentations(usable);
      setSelectedSourceIds(new Set(usable.map((p) => p.id)));
    } catch (err) {
      setSourcesError(err instanceof ApiError ? err.message : "No se pudieron cargar las clases de esta materia.");
    }
  }, [materiaId]);

  useEffect(() => {
    refreshSourcePresentations();
  }, [refreshSourcePresentations]);

  const toggleSource = useCallback((id: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const generateBank = useCallback(async () => {
    const sourcePresentationIds = Array.from(selectedSourceIds);
    if (sourcePresentationIds.length === 0) {
      setError("Selecciona al menos una clase generada de esta materia.");
      return;
    }

    setError(null);
    setDownloadReady(false);
    setBank(null);
    setProgress({ status: "queued", progress: 5, message: "Solicitando generación del banco…", busy: true });

    try {
      const { jobId } = await requestMinicasoPlan({
        materiaId,
        sourcePresentationIds,
        academicLevel,
        count,
      });

      const finalJob = await pollJob(jobId, (job) => {
        setProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message,
          busy: true,
        });
      });

      if (finalJob.status === "error" || !finalJob.resultId) {
        setError(finalJob.error ?? "No se pudo generar el banco de minicasos.");
        setProgress(null);
        return;
      }

      const fetched = await getMinicasoBank(finalJob.resultId);
      setBank(fetched);
      setProgress({ status: "done", progress: 100, message: "Banco generado.", busy: false });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo generar el banco de minicasos.");
      setProgress(null);
    }
  }, [materiaId, selectedSourceIds, academicLevel, count]);

  const saveBank = useCallback(
    async (updated: MinicasoBank) => {
      setBank(updated);
      try {
        await updateMinicasoBank(updated.id, updated);
      } catch {
        // Los cambios quedan en el estado local; se reintentará al exportar.
      }
    },
    []
  );

  const exportBank = useCallback(async () => {
    if (!bank) return;
    setExportError(null);
    setDownloadReady(false);
    setExportProgress({ status: "generating", progress: 20, message: "Construyendo el archivo GIFT…", busy: true });
    try {
      await updateMinicasoBank(bank.id, bank);
      const { jobId } = await requestMinicasoExport(bank.id);
      const finalJob = await pollJob(jobId, (job) => {
        setExportProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message,
          busy: true,
        });
      });
      if (finalJob.status === "error") {
        setExportError(finalJob.error ?? "No se pudo exportar el banco de minicasos.");
        setExportProgress(null);
        return;
      }
      setExportProgress({ status: "done", progress: 100, message: "Archivo listo para descargar.", busy: false });
      setDownloadReady(true);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "No se pudo exportar el banco de minicasos.");
      setExportProgress(null);
    }
  }, [bank]);

  const download = useCallback(async () => {
    if (!bank) return;
    try {
      await downloadMinicasoBank(bank.id, `minicasos-${bank.subjectName}.txt`);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "No se pudo descargar el archivo.");
    }
  }, [bank]);

  return {
    sourcePresentations,
    selectedSourceIds,
    toggleSource,
    sourcesError,
    academicLevel,
    setAcademicLevel,
    count,
    setCount,
    progress,
    error,
    setError,
    generateBank,
    bank,
    saveBank,
    exportProgress,
    exportError,
    exportBank,
    downloadReady,
    download,
  };
}
