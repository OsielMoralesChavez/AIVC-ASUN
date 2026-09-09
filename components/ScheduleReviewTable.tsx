"use client";

import type { ScheduleWeek } from "../services/api";
import { TrashIcon } from "./TrashIcon";
import { DECK_TYPE_LABELS, type UnirDeckType } from "../types/unir";

export interface AvailableDocument {
  id: string;
  fileName: string;
}

interface ScheduleReviewTableProps {
  weeks: ScheduleWeek[];
  onUpdateWeek: <K extends keyof ScheduleWeek>(weekNumber: number, key: K, value: ScheduleWeek[K]) => void;
  /** Quita una semana detectada por completo (ej. duplicada o que el usuario no quiere generar). */
  onRemoveWeek: (weekNumber: number) => void;
  /** PDFs con rol "Ideas clave" ya cargados en la materia — el emparejamiento automático por
   * nombre de archivo (ver lib/documents/scheduleParsing.ts::extractTemaNumber) no siempre
   * acierta, así que aquí se pueden asignar/reasignar manualmente por semana. */
  availableDocuments: AvailableDocument[];
}

const DECK_TYPES: UnirDeckType[] = ["primera-clase", "normal", "actividad", "solucion", "repaso"];

/** Tabla editable de revisión: la detección automática de la programación semanal (ver
 * lib/documents/scheduleParsing.ts) no es infalible, así que cada semana se muestra aquí para que
 * el usuario corrija el tipo de clase, la duración, o la asociación de documentos antes de lanzar
 * la generación masiva. */
export function ScheduleReviewTable({ weeks, onUpdateWeek, onRemoveWeek, availableDocuments }: ScheduleReviewTableProps) {
  const toggleDocument = (week: ScheduleWeek, documentId: string, checked: boolean) => {
    const next = checked
      ? [...week.temaDocumentIds, documentId]
      : week.temaDocumentIds.filter((id) => id !== documentId);
    onUpdateWeek(week.weekNumber, "temaDocumentIds", next);
  };

  return (
    <div className="table-scroll" style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Semana</th>
            <th>Título de la sesión</th>
            <th>Temas detectados</th>
            <th>Documentos de ideas clave</th>
            <th>Tipo de clase</th>
            <th>Duración (min)</th>
            <th>Objetivos detectados (Excel)</th>
            <th aria-label="Quitar semana" />
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekNumber}>
              <td>{week.weekNumber}</td>
              <td>
                <input
                  type="text"
                  value={week.sessionTitle}
                  aria-label={`Título de la semana ${week.weekNumber}`}
                  onChange={(e) => onUpdateWeek(week.weekNumber, "sessionTitle", e.target.value)}
                />
              </td>
              <td>
                {week.temaTitles.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    {week.temaTitles.map((t, i) => (
                      <li key={i} style={{ fontSize: "0.82rem" }}>
                        {t}
                        {week.temaDocumentIds.length === 0 && (
                          <span style={{ color: "var(--color-danger)" }}> — sin PDF asociado</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="field-hint">Sin tema (repaso)</span>
                )}
              </td>
              <td>
                {week.deckType === "repaso" ? (
                  <span className="field-hint">No requiere documentos</span>
                ) : availableDocuments.length === 0 ? (
                  <span className="field-hint">No hay PDFs de ideas clave cargados</span>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.3rem",
                      minWidth: "16rem",
                      maxHeight: "10rem",
                      overflowY: "auto",
                      padding: "0.4rem",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    {availableDocuments.map((doc) => (
                      <label key={doc.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.35rem", fontSize: "0.82rem" }}>
                        <input
                          type="checkbox"
                          checked={week.temaDocumentIds.includes(doc.id)}
                          onChange={(e) => toggleDocument(week, doc.id, e.target.checked)}
                        />
                        <span>{doc.fileName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </td>
              <td>
                <select
                  value={week.deckType}
                  aria-label={`Tipo de clase de la semana ${week.weekNumber}`}
                  onChange={(e) => onUpdateWeek(week.weekNumber, "deckType", e.target.value as UnirDeckType)}
                >
                  {DECK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {DECK_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={week.durationMinutes}
                  aria-label={`Duración de la semana ${week.weekNumber}`}
                  onChange={(e) => onUpdateWeek(week.weekNumber, "durationMinutes", Number(e.target.value))}
                  style={{ width: "5rem" }}
                />
              </td>
              <td>
                <span className="field-hint">{week.learningObjectiveHint || "—"}</span>
              </td>
              <td>
                <button
                  type="button"
                  className="btn-text"
                  aria-label={`Quitar la semana ${week.weekNumber} de la lista`}
                  title="Quitar semana"
                  onClick={() => onRemoveWeek(week.weekNumber)}
                  style={{ color: "var(--color-danger)", padding: "0.3rem" }}
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
