"use client";

import { useEffect, useState } from "react";
import { Banner } from "./Banner";
import { getUserConfiguration, type UserConfiguration } from "../services/configurationApi";

const SEVERITY_LABELS = ["Muy indulgente", "Indulgente", "Equilibrada", "Exigente", "Muy exigente"];

/**
 * Resumen discreto de lo que se usará al evaluar. Reemplaza a los formularios de conexión y de
 * ajustes que antes vivían dentro del Calificador: aquí solo se MUESTRA el valor efectivo, y se
 * enlaza al sitio donde se edita (Configuración o Entrenamiento).
 *
 * No muestra claves, endpoints ni detalles técnicos — solo si la IA está configurada.
 */
export function CalificadorEffectiveSettings({
  onOpenSettings,
  onOpenTraining,
}: {
  onOpenSettings?: () => void;
  onOpenTraining?: () => void;
}) {
  const [config, setConfig] = useState<UserConfiguration | null>(null);

  useEffect(() => {
    getUserConfiguration()
      .then(setConfig)
      .catch(() => {
        // Que no se pueda leer el resumen no debe impedir usar el Calificador.
      });
  }, []);

  if (!config) return null;

  const { aiStatus, grading, voiceProfile } = config;

  return (
    <>
      {!aiStatus.configured && (
        <Banner type="warning" title="La conexión con inteligencia artificial requiere configuración">
          Revisa el proveedor y el modelo desde Configuración para continuar. Tu trabajo y tu
          rúbrica se conservan.
          {onOpenSettings && (
            <div className="actions-row" style={{ marginTop: "0.6rem" }}>
              <div />
              <button type="button" className="btn btn-secondary" onClick={onOpenSettings}>
                <span className="btn-label" data-label="Ir a Configuración">
                  Ir a Configuración
                </span>
              </button>
            </div>
          )}
        </Banner>
      )}

      <section className="panel" aria-label="Configuración efectiva de la evaluación">
        <h2 style={{ fontSize: "1rem" }}>Se evaluará con</h2>
        <ul className="data-summary">
          <li>
            <span className="label">Perfil de voz</span>
            <span>{voiceProfile ? voiceProfile.name : "Sin perfil"}</span>
          </li>
          <li>
            <span className="label">Escala</span>
            <span>{describeScale(grading.gradeScale)}</span>
          </li>
          <li>
            <span className="label">Exigencia</span>
            <span>{SEVERITY_LABELS[grading.defaultSeverity - 1] ?? grading.defaultSeverity}</span>
          </li>
          <li>
            <span className="label">Conexión IA</span>
            <span className={aiStatus.configured ? "badge badge-ok" : "badge badge-warn"}>
              {aiStatus.configured ? "Lista" : "Sin configurar"}
            </span>
          </li>
        </ul>
        <div className="actions-row" style={{ marginTop: "0.75rem" }}>
          <button type="button" className="btn btn-text" onClick={onOpenTraining} disabled={!onOpenTraining}>
            <span className="btn-label" data-label="Editar perfil de voz">
              Editar perfil de voz
            </span>
          </button>
          <button type="button" className="btn btn-text" onClick={onOpenSettings} disabled={!onOpenSettings}>
            <span className="btn-label" data-label="Editar ajustes">
              Editar ajustes
            </span>
          </button>
        </div>
      </section>
    </>
  );
}

function describeScale(scale: UserConfiguration["grading"]["gradeScale"]): string {
  const s = scale as { min?: number; max?: number; passing?: number };
  if (typeof s?.min === "number" && typeof s?.max === "number") {
    return typeof s.passing === "number" ? `${s.min}–${s.max} (aprueba con ${s.passing})` : `${s.min}–${s.max}`;
  }
  return "—";
}
