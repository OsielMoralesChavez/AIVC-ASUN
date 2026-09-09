"use client";
import { useEffect, useState } from "react";
import { MinicasosPage } from "../views/MinicasosPage";
import { PresentationsPage } from "../views/PresentationsPage";
import { ForoTab } from "./ForoTab";
import { ScheduleBulkWizard } from "./ScheduleBulkWizard";
import type { MateriaSummary } from "../types/materias";

type WorkspaceTab = "presentaciones" | "banco" | "foro";
type GenerationMode = "unchosen" | "all" | "one-by-one";

interface MateriaWorkspaceProps {
  materia: MateriaSummary;
  onBack: () => void;
}

/** Espacio de trabajo de una materia: clases (presentaciones) y banco de preguntas, en pestañas.
 * El banco queda deshabilitado hasta que exista al menos una clase generada — el orden es
 * obligatorio porque el banco depende de las ideas clave de las clases ya generadas.
 *
 * `hasPresentations` se inicializa desde el resumen de la materia (que puede estar desactualizado
 * si el usuario acaba de entrar) pero se vuelve `true` de inmediato al generar la primera clase
 * en esta misma sesión (`onPresentationCreated`), sin esperar a que se refresque la lista de
 * materias — si no, la pestaña seguiría deshabilitada tras generar la primera clase. */
export function MateriaWorkspace({ materia, onBack }: MateriaWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("presentaciones");
  const [hasPresentations, setHasPresentations] = useState(materia.presentationCount > 0);
  const [mode, setMode] = useState<GenerationMode>(materia.presentationCount > 0 ? "one-by-one" : "unchosen");

  useEffect(() => {
    setHasPresentations(materia.presentationCount > 0);
    setMode((prev) => (materia.presentationCount > 0 && prev === "unchosen" ? "one-by-one" : prev));
  }, [materia.id, materia.presentationCount]);

  return (
    <div>
      <div className="actions-row" style={{ marginBottom: "0.75rem" }}>
        <button type="button" className="btn btn-text" onClick={onBack}>
          <span className="btn-label" data-label="← Asignaturas">
            ← Asignaturas
          </span>
        </button>
        {tab === "presentaciones" && mode !== "all" && (
          <button type="button" className="btn btn-secondary" onClick={() => setMode("all")}>
            <span className="btn-label" data-label="Generar todo el curso">
              Generar todo el curso
            </span>
          </button>
        )}
      </div>

      <div className="option-grid" role="tablist" aria-label="Secciones de la asignatura" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "presentaciones"}
          className="option-card"
          data-selected={tab === "presentaciones"}
          onClick={() => setTab("presentaciones")}
        >
          <h3>Presentaciones</h3>
          <p>{materia.presentationCount} clase(s) generada(s)</p>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "banco"}
          className="option-card"
          data-selected={tab === "banco"}
          disabled={!hasPresentations}
          title={hasPresentations ? undefined : "Genera al menos una clase antes de crear el banco de preguntas."}
          onClick={() => hasPresentations && setTab("banco")}
        >
          <h3>Banco de preguntas</h3>
          <p>
            {hasPresentations
              ? `${materia.minicasoBankCount} banco(s) generado(s)`
              : "Genera al menos una clase primero"}
          </p>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "foro"}
          className="option-card"
          data-selected={tab === "foro"}
          disabled={!hasPresentations}
          title={hasPresentations ? undefined : "Genera al menos la primera clase para armar el foro."}
          onClick={() => hasPresentations && setTab("foro")}
        >
          <h3>Foro</h3>
          <p>{hasPresentations ? "Saludo y seguimiento semanal" : "Genera al menos una clase primero"}</p>
        </button>
      </div>

      {tab === "presentaciones" && mode === "unchosen" && (
        <section className="panel" aria-labelledby="generation-mode-heading">
          <h2 id="generation-mode-heading">¿Cómo quieres generar las presentaciones?</h2>
          <div className="option-grid" role="radiogroup" aria-label="Modo de generación">
            <button type="button" role="radio" aria-checked={false} className="option-card" onClick={() => setMode("all")}>
              <h3>Generar todo el curso de una vez</h3>
              <p>
                Carga la programación semanal y los documentos de todas las clases; el sistema detecta cuántas
                sesiones hay y genera todas encadenadas.
              </p>
            </button>
            <button type="button" role="radio" aria-checked={false} className="option-card" onClick={() => setMode("one-by-one")}>
              <h3>Generar una clase a la vez</h3>
              <p>Flujo tradicional: eliges los documentos y la modalidad de cada clase por separado.</p>
            </button>
          </div>
        </section>
      )}
      {tab === "presentaciones" && mode === "all" && (
        <ScheduleBulkWizard
          materiaId={materia.id}
          materiaName={materia.name}
          onBack={() => setMode(hasPresentations ? "one-by-one" : "unchosen")}
          onPresentationCreated={() => setHasPresentations(true)}
        />
      )}
      {tab === "presentaciones" && mode === "one-by-one" && (
        <PresentationsPage materiaId={materia.id} onPresentationCreated={() => setHasPresentations(true)} />
      )}
      {tab === "banco" && hasPresentations && <MinicasosPage materiaId={materia.id} />}
      {tab === "foro" && hasPresentations && <ForoTab materiaId={materia.id} />}
    </div>
  );
}
