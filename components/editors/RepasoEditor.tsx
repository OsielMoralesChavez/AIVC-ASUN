"use client";

import type { RepasoContent } from "../../types/unir";
import { Banner } from "../Banner";
import { ProgressStatus, type ProgressState } from "../ProgressStatus";
import { BloomEditor, LinksEditor, StringListEditor, TextAreaField, TextField } from "./SharedEditors";

interface RepasoEditorProps {
  content: RepasoContent;
  onChange: (content: RepasoContent) => void;
  onGeneratePptx: () => void;
  onDownload: () => void;
  generateProgress: ProgressState | null;
  downloadReady: boolean;
}

export function RepasoEditor({ content, onChange, onGeneratePptx, onDownload, generateProgress, downloadReady }: RepasoEditorProps) {
  const update = (patch: Partial<RepasoContent>) => onChange({ ...content, ...patch });

  const updateUnit = (index: number, patch: Partial<RepasoContent["unitSyntheses"][number]>) => {
    const unitSyntheses = [...content.unitSyntheses];
    unitSyntheses[index] = { ...unitSyntheses[index], ...patch };
    update({ unitSyntheses });
  };

  const updateGlossary = (index: number, patch: Partial<RepasoContent["glossary"][number]>) => {
    const glossary = [...content.glossary];
    glossary[index] = { ...glossary[index], ...patch };
    update({ glossary });
  };

  const updateError = (index: number, patch: Partial<RepasoContent["commonErrors"][number]>) => {
    const commonErrors = [...content.commonErrors];
    commonErrors[index] = { ...commonErrors[index], ...patch };
    update({ commonErrors });
  };

  const updateFlashcard = (index: number, patch: Partial<RepasoContent["flashcards"][number]>) => {
    const flashcards = [...content.flashcards];
    flashcards[index] = { ...flashcards[index], ...patch };
    update({ flashcards });
  };

  return (
    <section className="panel" aria-labelledby="editor-heading">
      <h2 id="editor-heading">Esquema del repaso general</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">Unidades cubiertas</div>
          <div className="value">{content.unitCount}</div>
        </div>
      </div>

      {content.warnings.length > 0 && (
        <Banner type="warning" title="Advertencias del contenido">
          <ul>
            {content.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Banner>
      )}
      {content.assumptions.length > 0 && (
        <Banner type="info" title="Supuestos aplicados">
          <ul>
            {content.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Banner>
      )}

      <TextField id="subject-name" label="Materia" value={content.subjectName} onChange={(v) => update({ subjectName: v })} />
      <BloomEditor objective={content.objective} onChange={(o) => update({ objective: o })} />
      <TextAreaField id="how-to-use" label="Cómo usar este repaso" value={content.howToUse} onChange={(v) => update({ howToUse: v })} />
      <TextField id="hook-question" label="Pregunta gancho" value={content.hookQuestion} onChange={(v) => update({ hookQuestion: v })} />

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Mapa conceptual global</h3>
        <TextField id="concept-map-center" label="Nodo central (materia)" value={content.conceptMapCenter} onChange={(v) => update({ conceptMapCenter: v })} />
        {content.conceptMapBranches.map((branch, i) => (
          <p key={i} className="field-hint">
            {branch.unit}: {branch.concepts.join(", ")}
          </p>
        ))}
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Síntesis por unidad</h3>
        {content.unitSyntheses.map((unit, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <TextField id={`unit-name-${i}`} label="Unidad" value={unit.unit} onChange={(v) => updateUnit(i, { unit: v })} />
            <TextAreaField id={`unit-idea-${i}`} label="Idea central" value={unit.centralIdea} onChange={(v) => updateUnit(i, { centralIdea: v })} rows={2} />
            <StringListEditor
              label="Puntos clave"
              items={unit.keyPoints}
              onChange={(keyPoints) => updateUnit(i, { keyPoints })}
              min={1}
              max={5}
            />
            <TextAreaField id={`unit-connection-${i}`} label="Conexión con otra unidad" value={unit.connection} onChange={(v) => updateUnit(i, { connection: v })} rows={2} />
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Glosario esencial</h3>
        {content.glossary.map((entry, i) => (
          <div key={i} className="summary-grid">
            <TextField id={`glossary-term-${i}`} label="Término" value={entry.term} onChange={(v) => updateGlossary(i, { term: v })} />
            <TextField id={`glossary-def-${i}`} label="Definición" value={entry.definition} onChange={(v) => updateGlossary(i, { definition: v })} />
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Errores frecuentes</h3>
        {content.commonErrors.map((error, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <TextField id={`error-believed-${i}`} label="Se cree" value={error.believed} onChange={(v) => updateError(i, { believed: v })} />
            <TextField id={`error-reality-${i}`} label="En realidad" value={error.reality} onChange={(v) => updateError(i, { reality: v })} />
            <TextField id={`error-why-${i}`} label="Por qué" value={error.why} onChange={(v) => updateError(i, { why: v })} />
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Flashcards de autoevaluación</h3>
        {content.flashcards.map((card, i) => (
          <div key={i} className="summary-grid">
            <TextField id={`flash-q-${i}`} label="Pregunta" value={card.question} onChange={(v) => updateFlashcard(i, { question: v })} />
            <TextField id={`flash-a-${i}`} label="Respuesta" value={card.answer} onChange={(v) => updateFlashcard(i, { answer: v })} />
          </div>
        ))}
      </div>

      <StringListEditor label="Hoja de ruta de estudio" items={content.studyRoadmap} onChange={(studyRoadmap) => update({ studyRoadmap })} min={1} max={10} />

      <LinksEditor links={content.links} onChange={(links) => update({ links })} />

      <StringListEditor label="Referencias (APA 7)" items={content.references} onChange={(references) => update({ references })} />

      <TextField id="closing-question" label="Pregunta de cierre" value={content.closingQuestion} onChange={(v) => update({ closingQuestion: v })} />

      {generateProgress && <ProgressStatus state={generateProgress} />}

      <div className="actions-row">
        <button type="button" className="btn btn-primary" onClick={onGeneratePptx} disabled={generateProgress?.busy}>
          <span className="btn-label" data-label="Generar PowerPoint">
            Generar PowerPoint
          </span>
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDownload} disabled={!downloadReady}>
          <span className="btn-label" data-label="Descargar .pptx">
            Descargar .pptx
          </span>
        </button>
      </div>
    </section>
  );
}
