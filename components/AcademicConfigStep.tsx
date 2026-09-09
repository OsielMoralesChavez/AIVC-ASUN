"use client";

import { ACADEMIC_LEVEL_LABELS, type AcademicLevel } from "../types/presentation";
import { INSTITUTION_SCOPE_LABELS, type InstitutionScope } from "../types/unir";
import { DURATION_MAX, DURATION_MIN, DURATION_PRESETS } from "../utils/validation";

export interface SessionConfigFields {
  academicLevel: AcademicLevel | null;
  durationMinutes: number;
  institutionScope: InstitutionScope | null;
}

interface AcademicConfigStepProps {
  fields: SessionConfigFields;
  durationError: string | null;
  onFieldChange: <K extends keyof SessionConfigFields>(key: K, value: SessionConfigFields[K]) => void;
  /** La generación masiva ("todo el curso") toma la duración de cada semana directamente de la
   * programación semanal — este valor nunca se usa en ese flujo, así que se deshabilita en vez
   * de mostrar un campo que no tiene ningún efecto. */
  durationDisabled?: boolean;
}

const LEVELS: AcademicLevel[] = ["licenciatura", "maestria", "tfm"];
const SCOPES: InstitutionScope[] = ["mexico", "internacional", "mixto"];

const SCOPE_HINTS: Record<InstitutionScope, string> = {
  mexico: "La presentación incluirá el logo de UNIR.",
  internacional: "La presentación no incluirá el logo de UNIR.",
  mixto: "La presentación no incluirá el logo de UNIR.",
};

export function AcademicConfigStep({ fields, durationError, onFieldChange, durationDisabled = false }: AcademicConfigStepProps) {
  return (
    <section className="panel" aria-labelledby="step2-heading">
      <h2 id="step2-heading">2. Configuración académica</h2>

      <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
        <legend className="field-legend">Nivel académico</legend>
        <div className="option-grid" role="radiogroup" aria-label="Nivel académico">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={fields.academicLevel === level}
              className="option-card"
              data-selected={fields.academicLevel === level}
              onClick={() => onFieldChange("academicLevel", level)}
            >
              <h3>{ACADEMIC_LEVEL_LABELS[level]}</h3>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field-group">
        <label htmlFor="duration-input">Duración total de la clase (minutos)</label>
        <input
          id="duration-input"
          type="number"
          min={DURATION_MIN}
          max={DURATION_MAX}
          value={fields.durationMinutes}
          aria-invalid={Boolean(durationError)}
          aria-describedby="duration-hint"
          disabled={durationDisabled}
          onChange={(e) => onFieldChange("durationMinutes", Number(e.target.value))}
        />
        <div className="preset-row">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="preset-btn"
              disabled={durationDisabled}
              data-selected={fields.durationMinutes === preset}
              onClick={() => onFieldChange("durationMinutes", preset)}
            >
              {preset} min
            </button>
          ))}
        </div>
        <p id="duration-hint" className="field-hint">
          {durationDisabled
            ? "La duración de cada clase ya se tomó de la programación semanal — se ajusta por semana en el paso de revisión."
            : `Entre ${DURATION_MIN} y ${DURATION_MAX} minutos. Los minutos de la agenda se reparten a partir de este valor.`}
        </p>
        {durationError && (
          <p role="alert" style={{ color: "var(--color-danger)", marginTop: "0.3rem" }}>
            {durationError}
          </p>
        )}
      </div>

      <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
        <legend className="field-legend">¿Para qué sede es esta sesión?</legend>
        <div className="option-grid" role="radiogroup" aria-label="Sede">
          {SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              role="radio"
              aria-checked={fields.institutionScope === scope}
              className="option-card"
              data-selected={fields.institutionScope === scope}
              onClick={() => onFieldChange("institutionScope", scope)}
            >
              <h3>{INSTITUTION_SCOPE_LABELS[scope]}</h3>
              <p>{SCOPE_HINTS[scope]}</p>
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
