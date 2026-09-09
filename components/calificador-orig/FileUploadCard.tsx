"use client";

import { useRef, useState } from "react";
import type { Session } from "@/lib/calificador/types";

export function FileUploadCard({
  sessionId,
  kind,
  title,
  accept,
  currentFileName,
  disabled,
  confirmMessage,
  onUploaded,
}: {
  sessionId: string;
  kind: "rubrica" | "instrucciones";
  title: string;
  accept: string;
  currentFileName: string | null;
  disabled: boolean;
  /** Si no es null, se pide confirmación antes de reemplazar. */
  confirmMessage: string | null;
  onUploaded: (session: Session) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);
      const res = await fetch(`/api/calificador/sessions/${sessionId}/files`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir el archivo");
      onUploaded(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 truncate text-sm text-slate-500">
        {currentFileName ? (
          <>📄 {currentFileName}</>
        ) : (
          <span className="italic">Sin archivo</span>
        )}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading || disabled}
        className="mt-3 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
      >
        {uploading
          ? "Subiendo…"
          : currentFileName
            ? "Reemplazar archivo"
            : "Subir archivo"}
      </button>
      <p className="mt-1 text-[11px] text-slate-500">Formatos: {accept}</p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
