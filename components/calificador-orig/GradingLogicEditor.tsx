"use client";

import { useMemo, useState } from "react";
import { useSettings } from "@/components/calificador-orig/SettingsProvider";
import { conversionFormula } from "@/lib/calificador/grading/logic";
import type { GradingLogic, RubricParsed } from "@/lib/calificador/types";

/**
 * Tabla editable del desglose de ponderación propuesto por la IA.
 * El usuario puede ajustar puntos máximos por criterio y equivalencias
 * de niveles antes de aprobar. El total y la fórmula se recalculan en vivo.
 */
export function GradingLogicEditor({
  initialLogic,
  rubric,
  readOnly,
  approved,
  onApprove,
  onRegenerate,
  regenerating,
}: {
  initialLogic: GradingLogic;
  rubric: RubricParsed | null;
  readOnly: boolean;
  approved: boolean;
  onApprove: (logic: GradingLogic) => Promise<void>;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const { gradeScale } = useSettings();
  const [logic, setLogic] = useState<GradingLogic>(
    // Copia profunda para no mutar la propuesta original
    JSON.parse(JSON.stringify(initialLogic))
  );
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () =>
      Math.round(
        logic.criteria.reduce((acc, c) => acc + (Number(c.max_points) || 0), 0) *
          100
      ) / 100,
    [logic]
  );

  /**
   * Criterios donde el nivel más alto no llega al puntaje máximo: con esa
   * configuración ningún alumno podría obtener el máximo del criterio.
   */
  const mismatched = useMemo(
    () =>
      logic.criteria.filter((criterion) => {
        if (criterion.level_equivalences.length === 0) return false;
        const highest = Math.max(
          ...criterion.level_equivalences.map((eq) => Number(eq.points) || 0)
        );
        return Math.abs(highest - (Number(criterion.max_points) || 0)) > 0.01;
      }),
    [logic]
  );

  function setMaxPoints(index: number, value: number) {
    setLogic((prev) => {
      const next = structuredClone(prev);
      next.criteria[index].max_points = value;
      return next;
    });
  }

  function setLevelPoints(cIndex: number, lIndex: number, value: number) {
    setLogic((prev) => {
      const next = structuredClone(prev);
      next.criteria[cIndex].level_equivalences[lIndex].points = value;
      return next;
    });
  }

  async function handleApprove() {
    setSaving(true);
    try {
      await onApprove({
        ...logic,
        total_points: total,
        conversion_formula: conversionFormula(total, gradeScale),
      });
    } finally {
      setSaving(false);
    }
  }

  /** Criterios cuyos puntos NO venían escritos en la rúbrica. */
  const inferred = useMemo(
    () =>
      (rubric?.criteria ?? [])
        .filter((c) => c.points_explicit === false)
        .map((c) => c.name),
    [rubric]
  );
  const allExplicit =
    rubric !== null && rubric.criteria.length > 0 && inferred.length === 0;

  return (
    <div>
      {allExplicit && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          ✓ Los rubros y puntajes se tomaron tal cual de tu rúbrica.
        </p>
      )}
      {inferred.length > 0 && (
        <div className="mb-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <strong>Puntajes propuestos por la IA</strong> (tu rúbrica no los
          especificaba para estos rubros). Revísalos y ajústalos si hace falta:
          <ul className="mt-1 list-inside list-disc">
            {inferred.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Criterio</th>
              <th className="px-4 py-2">Niveles (equivalencia numérica)</th>
              <th className="w-32 px-4 py-2 text-right">Puntos máx.</th>
            </tr>
          </thead>
          <tbody>
            {logic.criteria.map((criterion, cIndex) => (
              <tr key={cIndex} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {criterion.criterion_name}
                </td>
                <td className="px-4 py-3">
                  {criterion.level_equivalences.length === 0 ? (
                    <span className="text-slate-500">Sin niveles</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {criterion.level_equivalences.map((eq, lIndex) => (
                        <label
                          key={lIndex}
                          className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {eq.level_name}:
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            value={eq.points}
                            disabled={readOnly}
                            onChange={(e) =>
                              setLevelPoints(
                                cIndex,
                                lIndex,
                                Number(e.target.value)
                              )
                            }
                            className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-right text-xs focus:border-indigo-500 disabled:border-transparent disabled:bg-transparent"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={criterion.max_points}
                    disabled={readOnly}
                    onChange={(e) => setMaxPoints(cIndex, Number(e.target.value))}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-right focus:border-indigo-500 disabled:border-transparent disabled:bg-transparent"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-800">
              <td className="px-4 py-2" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-2 text-right">{total}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        <strong>
          Conversión a escala {gradeScale.min}-{gradeScale.max}:
        </strong>{" "}
        {conversionFormula(total, gradeScale)}
      </p>

      {mismatched.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Revisa estos criterios:</strong> su nivel más alto no llega al
          puntaje máximo, así que ningún alumno podría alcanzarlo.
          <ul className="mt-1 list-inside list-disc">
            {mismatched.map((criterion) => (
              <li key={criterion.criterion_name}>
                {criterion.criterion_name} — nivel más alto:{" "}
                {Math.max(
                  ...criterion.level_equivalences.map((eq) => Number(eq.points) || 0)
                )}
                , máximo: {criterion.max_points}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onRegenerate}
            disabled={regenerating || saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            {regenerating ? "Regenerando…" : "↻ Regenerar con IA"}
          </button>
          <button
            onClick={handleApprove}
            disabled={saving || regenerating || total <= 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "✓ Aprobar y activar sesión"}
          </button>
        </div>
      )}

      {approved && readOnly && (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          ✓ Lógica de calificación aprobada
        </p>
      )}
    </div>
  );
}
