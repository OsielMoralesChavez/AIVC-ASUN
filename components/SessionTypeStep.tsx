"use client";

import { DECK_TYPE_DESCRIPTIONS, DECK_TYPE_LABELS, type UnirDeckType, type UnirSessionType } from "../types/unir";
import { ProgressStatus, type ProgressState } from "./ProgressStatus";
import { Banner } from "./Banner";

interface SessionTypeStepProps {
  sessionType: UnirSessionType | null;
  onChange: (type: UnirSessionType) => void;
  bulkProgress: ProgressState | null;
  bulkError: string | null;
  bulkResults: Record<UnirDeckType, string> | null;
  onGenerateBulk: () => void;
  onDownloadBulkItem: (presentationId: string, title: string) => void;
}

// Orden del selector según §7 de la especificación: primera clase, normal, repaso, actividad,
// solución. El valor que viaja al backend es el enum estable, nunca una ruta ni un nombre de
// habilidad; el backend resuelve la habilidad con lib/presentation-skills/skill-router.ts.
const TYPES: UnirSessionType[] = ["primera-clase", "normal", "repaso", "actividad", "solucion"];
const BULK_ORDER: UnirDeckType[] = ["primera-clase", "normal", "actividad", "solucion", "repaso"];

export function SessionTypeStep({
  sessionType,
  onChange,
  bulkProgress,
  bulkError,
  bulkResults,
  onGenerateBulk,
  onDownloadBulkItem,
}: SessionTypeStepProps) {
  return (
    <section className="panel" aria-labelledby="step3-heading">
      <h2 id="step3-heading">3. Modalidad de la sesión</h2>
      <div className="option-grid" role="radiogroup" aria-label="Modalidad de la sesión">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={sessionType === type}
            aria-label={DECK_TYPE_LABELS[type]}
            aria-describedby={`session-type-desc-${type}`}
            className="option-card"
            data-selected={sessionType === type}
            onClick={() => onChange(type)}
          >
            <h3 aria-hidden="true">{DECK_TYPE_LABELS[type]}</h3>
            <p id={`session-type-desc-${type}`}>{DECK_TYPE_DESCRIPTIONS[type]}</p>
          </button>
        ))}
      </div>

      <div className="field-group" style={{ marginTop: "1.5rem" }}>
        <span className="field-legend">¿Prefieres generarlas todas de una vez?</span>
        <p className="field-hint">
          Genera las 5 modalidades del curso (primera clase, normal, actividad, solución y repaso) con los
          mismos documentos cargados, cada una lista para descargar.
        </p>
        <button type="button" className="btn btn-secondary" onClick={onGenerateBulk} disabled={bulkProgress?.busy}>
          <span className="btn-label" data-label="Generar las 5 modalidades a la vez">
            Generar las 5 modalidades a la vez
          </span>
        </button>

        {bulkError && (
          <Banner type="error" title="No se pudieron generar las 5 modalidades">
            {bulkError}
          </Banner>
        )}
        {bulkProgress && <ProgressStatus state={bulkProgress} />}

        {bulkResults && (
          <ul className="file-list" aria-label="Modalidades generadas">
            {BULK_ORDER.map((type) => {
              const presentationId = bulkResults[type];
              if (!presentationId) return null;
              return (
                <li key={type} className="file-item">
                  <div className="file-meta">
                    <div className="file-name">{DECK_TYPE_LABELS[type]}</div>
                  </div>
                  <span className="badge badge-ok">Listo</span>
                  <button
                    type="button"
                    className="btn btn-text"
                    onClick={() => onDownloadBulkItem(presentationId, DECK_TYPE_LABELS[type])}
                  >
                    <span className="btn-label" data-label="Descargar .pptx">
                      Descargar .pptx
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
