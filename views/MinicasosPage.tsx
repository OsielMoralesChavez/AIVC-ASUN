"use client";
import { Banner } from "../components/Banner";
import { PresentationSourcePicker } from "../components/PresentationSourcePicker";
import { MinicasoEditor } from "../components/editors/MinicasoEditor";
import { ProgressStatus } from "../components/ProgressStatus";
import { useMinicasos } from "../hooks/useMinicasos";
import { MINICASO_LEVEL_LABELS, type MinicasoAcademicLevel } from "../types/minicasos";

const LEVELS: MinicasoAcademicLevel[] = ["licenciatura", "maestria"];

interface MinicasosPageProps {
  materiaId: string;
}

export function MinicasosPage({ materiaId }: MinicasosPageProps) {
  const mc = useMinicasos(materiaId);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Banco de minicasos</h1>
        <p>Genera un examen de minicasos prácticos en formato GIFT, listo para importar en Moodle, a partir de las clases ya generadas.</p>
      </header>

      <section className="panel" aria-label="Configuración del banco de minicasos">
        <h2>Configuración</h2>

        <div className="field-group">
          <span className="field-legend">Clases fuente</span>
          {mc.sourcesError && <Banner type="error" title="No se pudieron cargar las clases">{mc.sourcesError}</Banner>}
          <PresentationSourcePicker
            presentations={mc.sourcePresentations}
            selectedIds={mc.selectedSourceIds}
            onToggle={mc.toggleSource}
          />
        </div>

        <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
          <legend className="field-legend">Nivel académico</legend>
          <div className="option-grid" role="radiogroup" aria-label="Nivel académico">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={mc.academicLevel === level}
                className="option-card"
                data-selected={mc.academicLevel === level}
                onClick={() => mc.setAcademicLevel(level)}
              >
                <h3>{MINICASO_LEVEL_LABELS[level]}</h3>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field-group">
          <label htmlFor="count-input">Cantidad de minicasos</label>
          <input
            id="count-input"
            type="number"
            min={1}
            max={80}
            value={mc.count}
            onChange={(e) => mc.setCount(Number(e.target.value))}
          />
          <p className="field-hint">30 por defecto. Se distribuyen proporcionalmente entre los temas de las clases seleccionadas y los niveles de Bloom.</p>
        </div>

        {mc.error && (
          <Banner type="error" title="No se pudo generar el banco" onRetry={mc.generateBank}>
            {mc.error}
          </Banner>
        )}

        {mc.progress && <ProgressStatus state={mc.progress} />}

        <div className="actions-row">
          <div />
          <button
            type="button"
            className="btn btn-primary"
            disabled={mc.selectedSourceIds.size === 0 || mc.progress?.busy}
            onClick={mc.generateBank}
          >
            <span className="btn-label" data-label="Generar minicasos">
              Generar minicasos
            </span>
          </button>
        </div>
      </section>

      {mc.bank && (
        <>
          {mc.exportError && (
            <Banner type="error" title="No se pudo exportar" onRetry={mc.exportBank}>
              {mc.exportError}
            </Banner>
          )}
          <MinicasoEditor
            bank={mc.bank}
            onChange={mc.saveBank}
            onExport={mc.exportBank}
            onDownload={mc.download}
            exportProgress={mc.exportProgress}
            downloadReady={mc.downloadReady}
          />
        </>
      )}
    </div>
  );
}
