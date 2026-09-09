"use client";

import type { NormalLikeContent } from "../../types/unir";
import { Banner } from "../Banner";
import { ProgressStatus, type ProgressState } from "../ProgressStatus";
import {
  AgendaEditor,
  BloomEditor,
  CardsEditor,
  GlassPartsEditor,
  LinksEditor,
  StepsEditor,
  StringListEditor,
  TextAreaField,
  TextField,
} from "./SharedEditors";

interface NormalLikeEditorProps {
  content: NormalLikeContent;
  onChange: (content: NormalLikeContent) => void;
  onGeneratePptx: () => void;
  onDownload: () => void;
  generateProgress: ProgressState | null;
  downloadReady: boolean;
}

export function NormalLikeEditor({
  content,
  onChange,
  onGeneratePptx,
  onDownload,
  generateProgress,
  downloadReady,
}: NormalLikeEditorProps) {
  const update = (patch: Partial<NormalLikeContent>) => onChange({ ...content, ...patch });
  const totalMinutes = content.agenda.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <section className="panel" aria-labelledby="editor-heading">
      <h2 id="editor-heading">Esquema de la presentación</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">Duración de la agenda</div>
          <div className="value">
            {totalMinutes} / {content.durationMinutes} min
          </div>
        </div>
        <div className="summary-item">
          <div className="label">Tipo</div>
          <div className="value">{content.caseStudyEyebrow}</div>
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
        <Banner type="info" title="Supuestos aplicados (revisa y ajusta si es necesario)">
          <ul>
            {content.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Banner>
      )}

      <TextField id="session-title" label="Tema de la sesión" value={content.sessionTitle} onChange={(v) => update({ sessionTitle: v })} />

      <BloomEditor objective={content.learningObjective} onChange={(o) => update({ learningObjective: o })} />

      <AgendaEditor items={content.agenda} onChange={(agenda) => update({ agenda })} />

      <TextAreaField id="introduction" label="Introducción" value={content.introduction} onChange={(v) => update({ introduction: v })} />

      {content.previousClassTopic && (
        <TextAreaField
          id="previous-summary"
          label={`Resumen de la clase anterior (${content.previousClassTopic})`}
          value={content.previousClassSummary ?? ""}
          onChange={(v) => update({ previousClassSummary: v })}
        />
      )}

      <CardsEditor
        title={content.developmentCardsTitle}
        onTitleChange={(v) => update({ developmentCardsTitle: v })}
        cards={content.developmentCards}
        onChange={(developmentCards) => update({ developmentCards })}
      />

      <StepsEditor
        title={content.developmentStepsTitle}
        onTitleChange={(v) => update({ developmentStepsTitle: v })}
        steps={content.developmentSteps}
        onChange={(developmentSteps) => update({ developmentSteps })}
      />

      <GlassPartsEditor
        eyebrow={content.caseStudyEyebrow}
        onEyebrowChange={(v) => update({ caseStudyEyebrow: v })}
        parts={content.caseStudy}
        onChange={(caseStudy) => update({ caseStudy })}
      />

      {content.activityProjectableSlide && (
        <div className="panel" style={{ padding: "0.75rem" }}>
          <TextField
            id="projectable-title"
            label="Título de la diapositiva proyectable"
            value={content.activityProjectableSlide.title}
            onChange={(v) => update({ activityProjectableSlide: { ...content.activityProjectableSlide!, title: v } })}
          />
          <StringListEditor
            label="Instrucciones (diapositiva proyectable)"
            items={content.activityProjectableSlide.bullets}
            onChange={(bullets) => update({ activityProjectableSlide: { ...content.activityProjectableSlide!, bullets } })}
            min={1}
            max={6}
          />
        </div>
      )}

      {content.transferExercise !== undefined && (
        <TextAreaField
          id="transfer-exercise"
          label="Ejercicio de transferencia"
          value={content.transferExercise}
          onChange={(v) => update({ transferExercise: v })}
        />
      )}

      <LinksEditor links={content.links} onChange={(links) => update({ links })} />

      <StringListEditor label="Conclusión (máx. 3 puntos)" items={content.conclusion} onChange={(conclusion) => update({ conclusion })} min={1} max={3} />

      {content.nextClassTopic !== undefined && (
        <TextField id="next-topic" label="Tema de la próxima clase" value={content.nextClassTopic ?? ""} onChange={(v) => update({ nextClassTopic: v })} />
      )}

      <StringListEditor label="Referencias (APA 7)" items={content.references} onChange={(references) => update({ references })} />

      <TextField id="closing-question" label="Pregunta de cierre" value={content.closingQuestion} onChange={(v) => update({ closingQuestion: v })} />
      <TextField id="closing-note" label="Nota secundaria de cierre" value={content.closingNote} onChange={(v) => update({ closingNote: v })} />

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
