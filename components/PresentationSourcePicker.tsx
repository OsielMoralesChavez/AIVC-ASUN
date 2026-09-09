"use client";
import type { SessionPresentationSummary } from "../services/api";
import { DECK_TYPE_LABELS } from "../types/unir";

interface PresentationSourcePickerProps {
  presentations: SessionPresentationSummary[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

/** Selector de clases ya generadas de la materia, usadas como fuente para el banco de
 * preguntas — reemplaza la carga de PDFs: el banco depende de las ideas clave ya generadas,
 * no de documentos re-subidos. */
export function PresentationSourcePicker({ presentations, selectedIds, onToggle }: PresentationSourcePickerProps) {
  if (presentations.length === 0) {
    return <p className="field-hint">Todavía no hay clases generadas en esta asignatura.</p>;
  }

  return (
    <ul aria-label="Clases de la asignatura" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {presentations.map((p) => (
        <li key={p.id}>
          <label className="bullet-row" style={{ alignItems: "center" }}>
            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => onToggle(p.id)} />
            <span style={{ flex: 1 }}>
              {DECK_TYPE_LABELS[p.deckType]} — {p.title}
            </span>
            <span className="field-hint" style={{ margin: 0 }}>
              {new Date(p.createdAt).toLocaleDateString()}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
