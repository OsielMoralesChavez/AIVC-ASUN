"use client";

import { useRef, useState } from "react";
import type { VoiceProfile } from "@/lib/calificador/types";

/**
 * Perfil de voz global: el profesor sube ejemplos reales de su
 * retroalimentación y Gemini extrae un análisis de estilo que se inyecta
 * en cada prompt de calificación.
 */
export function VoiceProfileEditor({
  initialProfile,
}: {
  initialProfile: VoiceProfile | null;
}) {
  const [profile, setProfile] = useState<VoiceProfile | null>(initialProfile);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList) {
    const valid = Array.from(files).filter((f) => /\.(docx|pdf)$/i.test(f.name));
    if (valid.length === 0) {
      setError("Solo se admiten archivos .docx y .pdf.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const file of valid) formData.append("files", file);
      const res = await fetch("/api/calificador/voice-profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al analizar las muestras");
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(path: string) {
    if (!confirm("¿Quitar esta muestra? Se regenerará el análisis de estilo."))
      return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/calificador/voice-profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al quitar la muestra");
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setWorking(false);
    }
  }

  async function handleRegenerate() {
    if (!profile || profile.sample_files.length === 0) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/calificador/voice-profile", { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al regenerar");
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Perfil de voz</h1>
        <p className="text-sm text-slate-500">
          Sube ejemplos reales de retroalimentación que hayas escrito. La IA
          analizará tu estilo y lo imitará al redactar el feedback de cada
          trabajo.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-slate-800">
          Muestras de retroalimentación
        </h2>

        {profile && profile.sample_files.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {profile.sample_files.map((sample) => (
              <li
                key={sample.path}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                <span className="truncate text-slate-700">📄 {sample.name}</span>
                <button
                  onClick={() => handleRemove(sample.path)}
                  disabled={working}
                  className="shrink-0 text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                  aria-label={`Quitar la muestra ${sample.name}`}
                  title="Quitar muestra"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            Aún no hay muestras cargadas. Sin perfil de voz, la IA usará un
            estilo académico neutro.
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".docx,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={working}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {working ? "Analizando con IA…" : "+ Subir muestras (.docx / .pdf)"}
          </button>
          {profile && profile.sample_files.length > 0 && (
            <button
              onClick={handleRegenerate}
              disabled={working}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              ↻ Regenerar análisis
            </button>
          )}
        </div>
      </section>

      {profile?.extracted_style_notes && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Análisis de estilo generado
            </h2>
            <span className="text-xs text-slate-500">
              Actualizado:{" "}
              {new Date(profile.updated_at).toLocaleString("es-MX")}
            </span>
          </div>
          <div className="whitespace-pre-wrap rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {profile.extracted_style_notes}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Este análisis se inyecta automáticamente en cada calificación para
            que el feedback suene como lo escribirías tú.
          </p>
        </section>
      )}
    </div>
  );
}
