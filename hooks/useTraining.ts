"use client";
import { useCallback, useEffect, useState } from "react";
import type { ProgressState } from "../components/ProgressStatus";
import { getJob } from "../services/api";
import { ApiError } from "../services/httpClient";
import {
  addTrainingDataEntry,
  analyzeVoiceProfileDocuments,
  analyzeVoiceProfileText,
  createVoiceProfile,
  deleteTrainingDataEntry,
  deleteVoiceProfile,
  editTrainingDataEntry,
  getVoiceProfile,
  listVoiceProfiles,
  updateVoiceProfile,
} from "../services/trainingApi";
import type { VoiceProfile, VoiceProfileSummary } from "../types/training";

async function pollJob(jobId: string, onUpdate: (job: { status: string; progress: number; message: string; error?: string }) => void) {
  for (;;) {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "done" || job.status === "error") return job;
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
}

export function useTraining() {
  const [profiles, setProfiles] = useState<VoiceProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState<ProgressState | null>(null);

  const refreshProfiles = useCallback(async () => {
    try {
      const list = await listVoiceProfiles();
      setProfiles(list);
      return list;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los perfiles.");
      return [];
    }
  }, []);

  const refreshSelectedProfile = useCallback(async (id: string) => {
    try {
      const profile = await getVoiceProfile(id);
      setSelectedProfile(profile);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el perfil seleccionado.");
    }
  }, []);

  useEffect(() => {
    refreshProfiles().then((list) => {
      if (list.length > 0) setSelectedProfileId(list[0].id);
    });
  }, [refreshProfiles]);

  useEffect(() => {
    if (selectedProfileId) refreshSelectedProfile(selectedProfileId);
    else setSelectedProfile(null);
  }, [selectedProfileId, refreshSelectedProfile]);

  const createProfile = useCallback(
    async (name: string) => {
      setError(null);
      try {
        const profile = await createVoiceProfile(name);
        await refreshProfiles();
        setSelectedProfileId(profile.id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo crear el perfil.");
      }
    },
    [refreshProfiles]
  );

  const removeProfile = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteVoiceProfile(id);
        const list = await refreshProfiles();
        setSelectedProfileId(list.length > 0 ? list[0].id : null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo eliminar el perfil.");
      }
    },
    [refreshProfiles]
  );

  const updateProfileMeta = useCallback(
    async (patch: Partial<Pick<VoiceProfile, "name" | "toneDescription" | "styleGuidelines" | "vocabularyNotes">>) => {
      if (!selectedProfileId) return;
      setError(null);
      try {
        const updated = await updateVoiceProfile(selectedProfileId, patch);
        setSelectedProfile(updated);
        await refreshProfiles();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo guardar el perfil.");
      }
    },
    [selectedProfileId, refreshProfiles]
  );

  const addDataEntry = useCallback(
    async (label: string, value: string) => {
      if (!selectedProfileId) return;
      setError(null);
      try {
        await addTrainingDataEntry(selectedProfileId, label, value);
        await refreshSelectedProfile(selectedProfileId);
        await refreshProfiles();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo agregar el dato.");
      }
    },
    [selectedProfileId, refreshSelectedProfile, refreshProfiles]
  );

  const editDataEntry = useCallback(
    async (entryId: string, patch: { label?: string; value?: string }) => {
      if (!selectedProfileId) return;
      setError(null);
      try {
        await editTrainingDataEntry(selectedProfileId, entryId, patch);
        await refreshSelectedProfile(selectedProfileId);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo editar el dato.");
      }
    },
    [selectedProfileId, refreshSelectedProfile]
  );

  const removeDataEntry = useCallback(
    async (entryId: string) => {
      if (!selectedProfileId) return;
      setError(null);
      try {
        await deleteTrainingDataEntry(selectedProfileId, entryId);
        await refreshSelectedProfile(selectedProfileId);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo eliminar el dato.");
      }
    },
    [selectedProfileId, refreshSelectedProfile]
  );

  const analyzeDocuments = useCallback(
    async (files: File[]) => {
      if (!selectedProfileId || files.length === 0) return;
      setError(null);
      setAnalyzeProgress({ status: "queued", progress: 5, message: "Subiendo documentos de muestra…", busy: true });
      try {
        const { jobId } = await analyzeVoiceProfileDocuments(selectedProfileId, files);
        const finalJob = await pollJob(jobId, (job) => {
          setAnalyzeProgress({
            status: job.status as ProgressState["status"],
            progress: job.progress,
            message: job.message,
            busy: true,
          });
        });
        if (finalJob.status === "error") {
          setError(finalJob.error ?? "No se pudo analizar el tono de voz.");
          setAnalyzeProgress(null);
          return;
        }
        setAnalyzeProgress({ status: "done", progress: 100, message: "Perfil actualizado.", busy: false });
        await refreshSelectedProfile(selectedProfileId);
        await refreshProfiles();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo analizar el tono de voz.");
        setAnalyzeProgress(null);
      }
    },
    [selectedProfileId, refreshSelectedProfile, refreshProfiles]
  );

  /** Cuestionario de tono de voz (ver components/VoiceQuestionnaire.tsx) — alternativa a subir
   * PDFs de muestra: junta las respuestas en un solo texto y lo manda a analizar igual que un
   * documento. Además, guarda el saludo del foro y el tratamiento (tú/usted) como datos
   * estándar del perfil (visibles/editables en "Datos que siempre quieres incluir"), ya que son
   * reutilizables tal cual, no solo como muestra de estilo. */
  const analyzeQuestionnaire = useCallback(
    async (answers: Record<string, string>, sections: { id: string; label: string }[]) => {
      if (!selectedProfileId) return;
      setError(null);

      const text = sections
        .map(({ id, label }) => (answers[id]?.trim() ? `${label}\n${answers[id].trim()}` : null))
        .filter((s): s is string => Boolean(s))
        .join("\n\n");

      if (text.trim().length < 150) {
        setError("Responde con un poco más de detalle antes de analizar — hace falta una muestra real de texto.");
        return;
      }

      setAnalyzeProgress({ status: "queued", progress: 5, message: "Enviando tus respuestas…", busy: true });
      try {
        const { jobId } = await analyzeVoiceProfileText(selectedProfileId, text, "Cuestionario de tono de voz");
        const finalJob = await pollJob(jobId, (job) => {
          setAnalyzeProgress({
            status: job.status as ProgressState["status"],
            progress: job.progress,
            message: job.message,
            busy: true,
          });
        });
        if (finalJob.status === "error") {
          setError(finalJob.error ?? "No se pudo analizar el tono de voz.");
          setAnalyzeProgress(null);
          return;
        }
        setAnalyzeProgress({ status: "done", progress: 100, message: "Perfil actualizado.", busy: false });

        if (answers.forumWelcome?.trim()) {
          await addTrainingDataEntry(selectedProfileId, "Saludo de bienvenida (foro)", answers.forumWelcome.trim());
        }
        if (answers.treatment?.trim()) {
          await addTrainingDataEntry(selectedProfileId, "Tratamiento con estudiantes", answers.treatment.trim());
        }

        await refreshSelectedProfile(selectedProfileId);
        await refreshProfiles();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo analizar el tono de voz.");
        setAnalyzeProgress(null);
      }
    },
    [selectedProfileId, refreshSelectedProfile, refreshProfiles]
  );

  return {
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    selectedProfile,
    error,
    setError,
    analyzeProgress,
    createProfile,
    removeProfile,
    updateProfileMeta,
    addDataEntry,
    editDataEntry,
    removeDataEntry,
    analyzeDocuments,
    analyzeQuestionnaire,
  };
}
