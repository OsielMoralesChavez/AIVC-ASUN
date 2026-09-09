"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/httpClient";
import { createMateria, deleteMateria, listMaterias, renameMateria } from "../services/materiasApi";
import type { MateriaSummary } from "../types/materias";

/** `category` acota tanto la lista como las materias nuevas que se crean desde este hook:
 * omitido → todas las materias sin filtrar (usado por el Dashboard); `null` → solo materias sin
 * categoría (la lista principal "Materias"); un string → solo esa categoría (p. ej. "curso-sello").
 * Así "Materias" y "Curso sello" quedan como vistas separadas sobre la misma tabla. */
export function useMaterias(category?: string | null) {
  const [materias, setMaterias] = useState<MateriaSummary[]>([]);
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMaterias = useCallback(async () => {
    try {
      const list = await listMaterias();
      const scoped = category === undefined ? list : list.filter((m) => (m.category ?? null) === category);
      setMaterias(scoped);
      return scoped;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las asignaturas.");
      return [];
    }
  }, [category]);

  useEffect(() => {
    refreshMaterias();
  }, [refreshMaterias]);

  const addMateria = useCallback(
    async (name: string) => {
      setError(null);
      try {
        const materia = await createMateria(name, category);
        await refreshMaterias();
        setSelectedMateriaId(materia.id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo crear la asignatura.");
      }
    },
    [refreshMaterias, category]
  );

  const removeMateria = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteMateria(id);
        await refreshMaterias();
        setSelectedMateriaId((prev) => (prev === id ? null : prev));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo eliminar la asignatura.");
      }
    },
    [refreshMaterias]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      setError(null);
      try {
        await renameMateria(id, name);
        await refreshMaterias();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo renombrar la asignatura.");
      }
    },
    [refreshMaterias]
  );

  const selectedMateria = materias.find((m) => m.id === selectedMateriaId) ?? null;

  return {
    materias,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedMateria,
    error,
    setError,
    addMateria,
    removeMateria,
    rename,
  };
}
