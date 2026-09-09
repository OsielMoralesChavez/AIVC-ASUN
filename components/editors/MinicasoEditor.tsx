"use client";

import { BLOOM_CASE_LABELS, MINICASO_LEVEL_LABELS, type MinicasoBank, type MinicasoItem } from "../../types/minicasos";
import { Banner } from "../Banner";
import { ProgressStatus, type ProgressState } from "../ProgressStatus";
import { TextField } from "./SharedEditors";

interface MinicasoEditorProps {
  bank: MinicasoBank;
  onChange: (bank: MinicasoBank) => void;
  onExport: () => void;
  onDownload: () => void;
  exportProgress: ProgressState | null;
  downloadReady: boolean;
}

export function MinicasoEditor({ bank, onChange, onExport, onDownload, exportProgress, downloadReady }: MinicasoEditorProps) {
  const updateItem = (index: number, patch: Partial<MinicasoItem>) => {
    const items = [...bank.items];
    items[index] = { ...items[index], ...patch };
    onChange({ ...bank, items });
  };

  const updateOption = (itemIndex: number, optionIndex: number, value: string) => {
    const items = [...bank.items];
    const options = [...items[itemIndex].options];
    options[optionIndex] = value;
    items[itemIndex] = { ...items[itemIndex], options };
    onChange({ ...bank, items });
  };

  // El esquema exige al menos 1 minicaso (minicasoBankCoreSchema items.min(1)); no se permite bajar de ahí.
  const removeItem = (index: number) => {
    if (bank.items.length <= 1) return;
    onChange({ ...bank, items: bank.items.filter((_, i) => i !== index) });
  };

  return (
    <section className="panel" aria-labelledby="minicasos-editor-heading">
      <h2 id="minicasos-editor-heading">Banco de minicasos</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">Minicasos</div>
          <div className="value">{bank.items.length}</div>
        </div>
        <div className="summary-item">
          <div className="label">Nivel</div>
          <div className="value">{MINICASO_LEVEL_LABELS[bank.academicLevel]}</div>
        </div>
      </div>

      {bank.warnings.length > 0 && (
        <Banner type="warning" title="Advertencias">
          <ul>
            {bank.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Banner>
      )}
      {bank.assumptions.length > 0 && (
        <Banner type="info" title="Supuestos aplicados">
          <ul>
            {bank.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Banner>
      )}

      <TextField id="subject-name" label="Materia" value={bank.subjectName} onChange={(subjectName) => onChange({ ...bank, subjectName })} />

      <div className="slide-list">
        {bank.items.map((item, index) => (
          <article key={item.id} className="slide-card">
            <div className="slide-card-header">
              <span className="type-badge">
                {index + 1}. {BLOOM_CASE_LABELS[item.bloomLevel]} · {item.topic}
              </span>
              <button
                type="button"
                className="btn btn-text"
                style={{ color: "var(--color-danger)" }}
                onClick={() => removeItem(index)}
                disabled={bank.items.length <= 1}
              >
                <span className="btn-label" data-label="Eliminar">
                  Eliminar
                </span>
              </button>
            </div>

            <div className="field-group">
              <label htmlFor={`scenario-${item.id}`}>Escenario y pregunta</label>
              <textarea
                id={`scenario-${item.id}`}
                rows={3}
                value={item.scenario}
                onChange={(e) => updateItem(index, { scenario: e.target.value })}
              />
            </div>

            <div className="field-group">
              <span className="field-legend">Opciones (marca la correcta)</span>
              {item.options.map((option, optionIndex) => (
                <div className="bullet-row" key={optionIndex}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="radio"
                      name={`correct-${item.id}`}
                      checked={item.correctIndex === optionIndex}
                      onChange={() => updateItem(index, { correctIndex: optionIndex })}
                      aria-label={`Marcar opción ${optionIndex + 1} como correcta`}
                    />
                  </label>
                  <textarea
                    aria-label={`Opción ${optionIndex + 1}`}
                    rows={2}
                    value={option}
                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {exportProgress && <ProgressStatus state={exportProgress} />}

      <div className="actions-row">
        <button type="button" className="btn btn-primary" onClick={onExport} disabled={exportProgress?.busy}>
          <span className="btn-label" data-label="Exportar a GIFT">
            Exportar a GIFT
          </span>
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDownload} disabled={!downloadReady}>
          <span className="btn-label" data-label="Descargar .txt">
            Descargar .txt
          </span>
        </button>
      </div>
    </section>
  );
}
