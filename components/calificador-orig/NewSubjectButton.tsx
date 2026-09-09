"use client";

import { useState } from "react";

export function NewSubjectButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Escribe el nombre de la materia.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/calificador/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear la materia");
      setName("");
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        + Nueva materia
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nombre de la materia"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        onClick={handleCreate}
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Creando…" : "Crear"}
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
      >
        Cancelar
      </button>
    </div>
  );
}
