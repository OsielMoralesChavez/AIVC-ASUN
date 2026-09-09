import type { GradeScale } from "@/lib/config/types";
import type { GradingLogic, RubricParsed } from "@/lib/calificador/types";

// Funciones puras de ponderación y cálculo de calificación.
// Sin dependencias de Gemini ni de SQLite, para poder usarlas tanto en el
// servidor como en los componentes de cliente.
//
// La escala de calificación llega SIEMPRE por parámetro (nunca se lee la
// configuración aquí): así estas funciones siguen siendo puras y los
// componentes de cliente pueden usarlas recibiendo la escala como prop.

/**
 * Deriva la lógica de calificación DIRECTAMENTE de la rúbrica extraída,
 * sin pasar por la IA. Así se garantiza que los rubros y los puntajes son
 * exactamente los de la rúbrica del profesor: no hay margen para que el
 * modelo los reescale, redondee o reinterprete.
 *
 * El usuario sigue pudiendo ajustar todo en la tabla antes de aprobar.
 */
export function deriveGradingLogic(
  rubric: RubricParsed,
  scale: GradeScale
): GradingLogic {
  const criteria = rubric.criteria.map((criterion) => ({
    criterion_name: criterion.name,
    max_points: criterion.max_points,
    level_equivalences: criterion.levels.map((level) => ({
      level_name: level.name,
      points: level.points,
    })),
  }));

  const total =
    Math.round(criteria.reduce((acc, c) => acc + c.max_points, 0) * 100) / 100;

  return {
    criteria,
    total_points: total,
    conversion_formula: conversionFormula(total, scale),
  };
}

/**
 * Texto legible de la conversión de puntos a calificación.
 *
 * Vive aquí y no en cada pantalla porque se guarda en la sesión y se imprime
 * en el export de Excel que el profesor entrega: si la fórmula que se muestra
 * y la que se guarda se calcularan por separado, tarde o temprano dirían
 * cosas distintas.
 */
export function conversionFormula(
  totalPoints: number,
  scale: GradeScale
): string {
  const rounding =
    scale.decimals > 0
      ? `redondeado a ${scale.decimals} decimal${scale.decimals === 1 ? "" : "es"}`
      : "redondeado al entero";
  return `(puntos_obtenidos / ${totalPoints}) × ${scale.max}, ${rounding}`;
}

export function validateGradingLogic(logic: GradingLogic): void {
  if (!logic.criteria || logic.criteria.length === 0) {
    throw new Error("La lógica de calificación no tiene criterios.");
  }
  const sum = logic.criteria.reduce((acc, c) => acc + c.max_points, 0);
  // Tolerancia por redondeos decimales
  if (Math.abs(sum - logic.total_points) > 0.01) {
    logic.total_points = Math.round(sum * 100) / 100;
  }
  if (!(logic.total_points > 0)) {
    throw new Error("El total de puntos debe ser mayor que cero.");
  }
  for (const criterion of logic.criteria) {
    if (!(criterion.max_points > 0)) {
      throw new Error(
        `El criterio "${criterion.criterion_name}" debe tener puntaje máximo mayor que cero.`
      );
    }
    for (const eq of criterion.level_equivalences) {
      if (eq.points > criterion.max_points) {
        throw new Error(
          `El nivel "${eq.level_name}" del criterio "${criterion.criterion_name}" excede su puntaje máximo.`
        );
      }
    }
  }
}

/** Convierte los puntos obtenidos a la escala de calificación. */
export function pointsToGrade(
  points: number,
  totalPoints: number,
  scale: GradeScale
): number {
  const ratio = totalPoints > 0 ? points / totalPoints : 0;
  const raw = scale.min + ratio * (scale.max - scale.min);
  return roundToScale(clampToScale(raw, scale), scale);
}

/**
 * Puntos totales de una evaluación YA guardada, sumando el máximo de sus
 * propios criterios.
 *
 * Es deliberadamente independiente de `sessions.grading_logic`: la lógica de
 * la sesión puede haber cambiado (al reemplazar la rúbrica se borra), y una
 * evaluación vieja tiene que seguir recalculándose contra el total con el que
 * se calificó, no contra el vigente. Además, así editar una evaluación no
 * revienta cuando la sesión se quedó sin lógica.
 */
export function evaluationTotalPoints(
  criteria: { max_points: number }[]
): number {
  const total = criteria.reduce((acc, c) => acc + (Number(c.max_points) || 0), 0);
  return Math.round(total * 100) / 100;
}

/** Limita una calificación al rango válido de la escala. */
export function clampToScale(grade: number, scale: GradeScale): number {
  return Math.max(scale.min, Math.min(scale.max, grade));
}

/** Redondea una calificación a los decimales de la escala. */
export function roundToScale(grade: number, scale: GradeScale): number {
  const factor = Math.pow(10, scale.decimals);
  return Math.round(grade * factor) / factor;
}

/** Formatea una calificación con los decimales de la escala. */
export function formatGrade(grade: number, scale: GradeScale): string {
  return grade.toFixed(scale.decimals);
}

/**
 * Formato largo, para exportes y encabezados: "8.5 / 10". Deja claro contra
 * qué máximo se calificó, que es justo lo que un alumno necesita para
 * interpretar su calificación.
 */
export function formatGradeWithScale(grade: number, scale: GradeScale): string {
  return `${grade.toFixed(scale.decimals)} / ${scale.max}`;
}

/** true si la calificación alcanza el mínimo aprobatorio de la escala. */
export function isPassing(grade: number, scale: GradeScale): boolean {
  return grade >= scale.passingGrade;
}
