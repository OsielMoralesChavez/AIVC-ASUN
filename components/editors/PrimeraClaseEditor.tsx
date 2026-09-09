"use client";

import type {
  ComparisonTableRow,
  FormulaDefinitionItem,
  Matrix2x2Quadrant,
  MarcoTeoricoItem,
  PrimeraClaseContent,
  PrimeraClaseSlideKey,
  ProfessionalPanelContent,
  VerifiedFigure,
} from "../../types/unir";
import { Banner } from "../Banner";
import { ProgressStatus, type ProgressState } from "../ProgressStatus";
import {
  AgendaEditor,
  BloomEditor,
  CardsEditor,
  GlassPartsEditor,
  LinksEditor,
  PresenterNotesEditor,
  StepsEditor,
  StringListEditor,
  TextAreaField,
  TextField,
} from "./SharedEditors";

interface PrimeraClaseEditorProps {
  content: PrimeraClaseContent;
  onChange: (content: PrimeraClaseContent) => void;
  onGeneratePptx: () => void;
  onDownload: () => void;
  generateProgress: ProgressState | null;
  downloadReady: boolean;
}

const PRESENTER_NOTES_LABELS: Record<PrimeraClaseSlideKey, string> = {
  portada: "Portada",
  docente: "Presentación del docente",
  modam: "Modelo de aprendizaje (MODAM)",
  logicaSistema: "La lógica del sistema",
  agenda: "Agenda",
  retoMapaMental: "Continúa… Reto: mapa mental con datos reales",
  conceptosClave: "Continúa… Conceptos clave a la práctica",
  matrizUbicaCaso: "Continúa… Matriz: ubica tu caso",
  caso2Situacion: "Caso práctico 2 · Situación",
  practicaDirigida2: "Continúa… Práctica dirigida 2",
  retoEquipo: "Reto en equipo (mini-casos)",
  anexosPortada: "Anexos (divisor)",
  glosario: "Anexo · Glosario",
  curso: "Presentación del curso",
  actividades: "Actividades y evaluación",
  examen: "Examen",
  medios: "Medios de comunicación",
  resultadosAprendizaje: "Resultados de aprendizaje",
  introduccion: "Introducción",
  panelEncuadre: "Panel profesional — Encuadre",
  mapaMental: "Mapa mental del tema",
  tarjetasModulares: "Desarrollo — tarjetas modulares",
  marcoTeorico: "Marco teórico",
  infografiaPasos: "Desarrollo — infografía de pasos",
  formulas: "Fórmulas / definiciones clave",
  tablaComparativa: "Tabla comparativa",
  matriz2x2: "Matriz 2×2",
  cifras: "Cifras verificadas",
  panelAplicacion: "Panel profesional — Aplicación",
  practicaDirigida: "Práctica dirigida",
  debate: "Debate estructurado",
  erroresFrecuentes: "Errores frecuentes",
  autoevaluacion: "Autoevaluación",
  enlaces: "Enlaces de interés",
  conclusion: "Conclusión",
  proximaClase: "Próxima clase",
  referencias: "Referencias",
  cierre: "Cierre",
};

const PRESENTER_NOTES_KEYS = Object.keys(PRESENTER_NOTES_LABELS) as PrimeraClaseSlideKey[];

function ProfessionalPanelEditor({
  idPrefix,
  title,
  panel,
  onChange,
}: {
  idPrefix: string;
  title: string;
  panel: ProfessionalPanelContent;
  onChange: (panel: ProfessionalPanelContent) => void;
}) {
  return (
    <div className="panel" style={{ padding: "0.75rem" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <TextField id={`${idPrefix}-title`} label="Título" value={panel.title} onChange={(v) => onChange({ ...panel, title: v })} />
      <TextAreaField id={`${idPrefix}-body`} label="Texto" value={panel.body} onChange={(v) => onChange({ ...panel, body: v })} rows={3} />
      <StringListEditor label="Viñetas" items={panel.bullets} onChange={(bullets) => onChange({ ...panel, bullets })} min={1} />
      <TextAreaField
        id={`${idPrefix}-prompt`}
        label="Prompt sugerido para imagen IA"
        value={panel.imagePrompt}
        onChange={(v) => onChange({ ...panel, imagePrompt: v })}
        rows={2}
      />
    </div>
  );
}

export function PrimeraClaseEditor({
  content,
  onChange,
  onGeneratePptx,
  onDownload,
  generateProgress,
  downloadReady,
}: PrimeraClaseEditorProps) {
  const update = (patch: Partial<PrimeraClaseContent>) => onChange({ ...content, ...patch });
  const totalMinutes = content.agenda.reduce((sum, item) => sum + item.minutes, 0);

  const updateUnit = (index: number, patch: Partial<PrimeraClaseContent["units"][number]>) => {
    const units = [...content.units];
    units[index] = { ...units[index], ...patch };
    update({ units });
  };

  const updateCommonError = (index: number, patch: Partial<PrimeraClaseContent["commonErrors"][number]>) => {
    const commonErrors = [...content.commonErrors];
    commonErrors[index] = { ...commonErrors[index], ...patch };
    update({ commonErrors });
  };

  const updateFlashcard = (index: number, patch: Partial<PrimeraClaseContent["flashcards"][number]>) => {
    const flashcards = [...content.flashcards];
    flashcards[index] = { ...flashcards[index], ...patch };
    update({ flashcards });
  };

  const updateMarcoTeoricoItem = (index: number, patch: Partial<MarcoTeoricoItem>) => {
    const marcoTeorico = [...content.marcoTeorico];
    marcoTeorico[index] = { ...marcoTeorico[index], ...patch };
    update({ marcoTeorico });
  };

  const updateVerifiedFigure = (index: number, patch: Partial<VerifiedFigure>) => {
    const verifiedFigures = [...content.verifiedFigures];
    verifiedFigures[index] = { ...verifiedFigures[index], ...patch };
    update({ verifiedFigures });
  };

  const updateGuidedPracticeStep = (index: number, patch: Partial<PrimeraClaseContent["guidedPractice"]["steps"][number]>) => {
    const steps = [...content.guidedPractice.steps];
    steps[index] = { ...steps[index], ...patch };
    update({ guidedPractice: { ...content.guidedPractice, steps } });
  };

  const formulasDefinitions = content.formulasDefinitions ?? [];
  const updateFormula = (index: number, patch: Partial<FormulaDefinitionItem>) => {
    const next = [...formulasDefinitions];
    next[index] = { ...next[index], ...patch };
    update({ formulasDefinitions: next });
  };
  const addFormula = () => update({ formulasDefinitions: [...formulasDefinitions, { formula: "", name: "", usage: "" }] });
  const removeFormula = (index: number) => update({ formulasDefinitions: formulasDefinitions.filter((_, i) => i !== index) });

  const comparisonTable = content.comparisonTable;
  const updateComparisonRow = (index: number, patch: Partial<ComparisonTableRow>) => {
    if (!comparisonTable) return;
    const rows = [...comparisonTable.rows];
    rows[index] = { ...rows[index], ...patch };
    update({ comparisonTable: { ...comparisonTable, rows } });
  };
  const addComparisonRow = () => {
    if (!comparisonTable) return;
    update({ comparisonTable: { ...comparisonTable, rows: [...comparisonTable.rows, { label: "", body: "" }] } });
  };
  const removeComparisonRow = (index: number) => {
    if (!comparisonTable) return;
    update({ comparisonTable: { ...comparisonTable, rows: comparisonTable.rows.filter((_, i) => i !== index) } });
  };

  const matrix2x2 = content.matrix2x2;
  const updateMatrixQuadrant = (index: number, patch: Partial<Matrix2x2Quadrant>) => {
    if (!matrix2x2) return;
    const quadrants = [...matrix2x2.quadrants] as typeof matrix2x2.quadrants;
    quadrants[index] = { ...quadrants[index], ...patch };
    update({ matrix2x2: { ...matrix2x2, quadrants } });
  };

  return (
    <section className="panel" aria-labelledby="editor-heading">
      <h2 id="editor-heading">Esquema de la primera clase</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">Duración de la agenda</div>
          <div className="value">
            {totalMinutes} / {content.durationMinutes} min
          </div>
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

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Docente</h3>
        <div className="summary-grid">
          <TextField id="teacher-name" label="Nombre" value={content.teacherName} onChange={(v) => update({ teacherName: v })} />
          <TextField id="teacher-title" label="Grado / cargo" value={content.teacherTitle} onChange={(v) => update({ teacherTitle: v })} />
        </div>
        <TextField id="teacher-formation" label="Formación académica" value={content.teacherFormation} onChange={(v) => update({ teacherFormation: v })} />
        <TextField id="teacher-experience" label="Experiencia profesional" value={content.teacherExperience} onChange={(v) => update({ teacherExperience: v })} />
        <TextField id="teacher-specialty" label="Áreas de especialidad" value={content.teacherSpecialty} onChange={(v) => update({ teacherSpecialty: v })} />
        <TextField id="teacher-contact" label="Contacto" value={content.teacherContact} onChange={(v) => update({ teacherContact: v })} />
        <TextAreaField
          id="teacher-photo-prompt"
          label="Prompt sugerido para foto del docente (IA)"
          value={content.teacherPhotoPrompt}
          onChange={(v) => update({ teacherPhotoPrompt: v })}
          rows={2}
        />
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Unidades del curso</h3>
        {content.units.map((unit, i) => (
          <div key={i} className="summary-grid">
            <TextField id={`unit-title-${i}`} label={`Unidad ${i + 1} — título`} value={unit.title} onChange={(v) => updateUnit(i, { title: v })} />
            <TextField id={`unit-topics-${i}`} label="Temas" value={unit.topics} onChange={(v) => updateUnit(i, { topics: v })} />
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Actividades y evaluación</h3>
        <TextAreaField
          id="team-activity"
          label="Actividad en equipo"
          value={content.teamActivity.description}
          onChange={(v) => update({ teamActivity: { ...content.teamActivity, description: v } })}
        />
        <TextField
          id="team-activity-date"
          label="Fecha de entrega (equipo)"
          value={content.teamActivity.dueDate}
          onChange={(v) => update({ teamActivity: { ...content.teamActivity, dueDate: v } })}
        />
        <TextAreaField
          id="individual-activity"
          label="Actividad individual"
          value={content.individualActivity.description}
          onChange={(v) => update({ individualActivity: { ...content.individualActivity, description: v } })}
        />
        <TextField
          id="individual-activity-date"
          label="Fecha de entrega (individual)"
          value={content.individualActivity.dueDate}
          onChange={(v) => update({ individualActivity: { ...content.individualActivity, dueDate: v } })}
        />
        <TextAreaField
          id="evaluation-scheme-note"
          label="Franja de esquema de evaluación (opcional — tests por tema, máximo computable, etc.)"
          value={content.evaluationSchemeNote ?? ""}
          onChange={(v) => update({ evaluationSchemeNote: v || undefined })}
          rows={2}
        />
      </div>

      <TextAreaField id="forum" label="Foro «Pregúntale al profesor»" value={content.forumDescription} onChange={(v) => update({ forumDescription: v })} />

      <BloomEditor objective={content.learningObjective} onChange={(o) => update({ learningObjective: o })} />

      <AgendaEditor items={content.agenda} onChange={(agenda) => update({ agenda })} />

      <TextAreaField id="introduction" label="Introducción" value={content.introduction} onChange={(v) => update({ introduction: v })} />
      <TextAreaField
        id="introduction-image-prompt"
        label="Prompt sugerido para imagen de introducción (IA)"
        value={content.introductionImagePrompt}
        onChange={(v) => update({ introductionImagePrompt: v })}
        rows={2}
      />

      <ProfessionalPanelEditor
        idPrefix="panel-encuadre"
        title="Panel profesional — Encuadre"
        panel={content.professionalPanelEncuadre}
        onChange={(panel) => update({ professionalPanelEncuadre: panel })}
      />

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Mapa mental</h3>
        <TextField id="concept-map-center" label="Nodo central" value={content.conceptMapCenter} onChange={(v) => update({ conceptMapCenter: v })} />
        {content.conceptMapBranches.map((branch, i) => (
          <p key={i} className="field-hint">
            {branch.unit}: {branch.concepts.join(", ")}
          </p>
        ))}
      </div>

      <CardsEditor
        title={content.developmentCardsTitle}
        onTitleChange={(v) => update({ developmentCardsTitle: v })}
        cards={content.developmentCards}
        onChange={(developmentCards) => update({ developmentCards })}
      />

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Marco teórico (autor + año)</h3>
        {content.marcoTeorico.map((item, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <TextField id={`marco-concept-${i}`} label="Concepto" value={item.concept} onChange={(v) => updateMarcoTeoricoItem(i, { concept: v })} />
            <div className="summary-grid">
              <TextField id={`marco-author-${i}`} label="Autor" value={item.author} onChange={(v) => updateMarcoTeoricoItem(i, { author: v })} />
              <TextField
                id={`marco-year-${i}`}
                label="Año"
                value={item.year != null ? String(item.year) : ""}
                onChange={(v) => updateMarcoTeoricoItem(i, { year: v ? Number(v) : undefined })}
              />
            </div>
            <TextAreaField id={`marco-body-${i}`} label="Descripción" value={item.body} onChange={(v) => updateMarcoTeoricoItem(i, { body: v })} rows={2} />
          </div>
        ))}
      </div>

      <StepsEditor
        title={content.developmentStepsTitle}
        onTitleChange={(v) => update({ developmentStepsTitle: v })}
        steps={content.developmentSteps}
        onChange={(developmentSteps) => update({ developmentSteps })}
      />

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Fórmulas / definiciones clave (opcional)</h3>
        {formulasDefinitions.map((item, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <div className="bullet-row">
              <input
                aria-label={`Fórmula ${i + 1}`}
                type="text"
                placeholder="Fórmula / término"
                value={item.formula}
                onChange={(e) => updateFormula(i, { formula: e.target.value })}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-text" onClick={() => removeFormula(i)}>
                ×
              </button>
            </div>
            <TextField id={`formula-name-${i}`} label="Nombre" value={item.name} onChange={(v) => updateFormula(i, { name: v })} />
            <TextAreaField id={`formula-usage-${i}`} label="Para qué sirve" value={item.usage} onChange={(v) => updateFormula(i, { usage: v })} rows={2} />
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={addFormula}>
          <span className="btn-label" data-label="+ Agregar fórmula">
            + Agregar fórmula
          </span>
        </button>
      </div>

      {comparisonTable && (
        <div className="panel" style={{ padding: "0.75rem" }}>
          <h3 style={{ marginTop: 0 }}>Tabla comparativa (opcional)</h3>
          <TextField
            id="comparison-question"
            label="Pregunta de cierre (¿Responde a…?)"
            value={comparisonTable.question}
            onChange={(v) => update({ comparisonTable: { ...comparisonTable, question: v } })}
          />
          <div className="summary-grid">
            <TextField
              id="comparison-col1"
              label="Etiqueta columna 1"
              value={comparisonTable.col1Label}
              onChange={(v) => update({ comparisonTable: { ...comparisonTable, col1Label: v } })}
            />
            <TextField
              id="comparison-col2"
              label="Etiqueta columna 2"
              value={comparisonTable.col2Label}
              onChange={(v) => update({ comparisonTable: { ...comparisonTable, col2Label: v } })}
            />
          </div>
          {comparisonTable.rows.map((row, i) => (
            <div key={i} className="bullet-row">
              <input
                aria-label={`Fila ${i + 1} — etiqueta`}
                type="text"
                value={row.label}
                onChange={(e) => updateComparisonRow(i, { label: e.target.value })}
                style={{ flex: 1 }}
              />
              <input
                aria-label={`Fila ${i + 1} — contenido`}
                type="text"
                value={row.body}
                onChange={(e) => updateComparisonRow(i, { body: e.target.value })}
                style={{ flex: 2 }}
              />
              <button type="button" className="btn btn-text" onClick={() => removeComparisonRow(i)}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addComparisonRow}>
            <span className="btn-label" data-label="+ Agregar fila">
              + Agregar fila
            </span>
          </button>
        </div>
      )}

      {matrix2x2 && (
        <div className="panel" style={{ padding: "0.75rem" }}>
          <h3 style={{ marginTop: 0 }}>Matriz 2×2 (opcional)</h3>
          <div className="summary-grid">
            <TextField
              id="matrix-x-axis"
              label="Etiqueta eje X"
              value={matrix2x2.xAxisLabel}
              onChange={(v) => update({ matrix2x2: { ...matrix2x2, xAxisLabel: v } })}
            />
            <TextField
              id="matrix-y-axis"
              label="Etiqueta eje Y"
              value={matrix2x2.yAxisLabel}
              onChange={(v) => update({ matrix2x2: { ...matrix2x2, yAxisLabel: v } })}
            />
          </div>
          {matrix2x2.quadrants.map((quadrant, i) => (
            <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
              <TextField id={`quadrant-label-${i}`} label={`Cuadrante ${i + 1} — etiqueta`} value={quadrant.label} onChange={(v) => updateMatrixQuadrant(i, { label: v })} />
              <TextAreaField id={`quadrant-body-${i}`} label="Contenido" value={quadrant.body} onChange={(v) => updateMatrixQuadrant(i, { body: v })} rows={2} />
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Cifras verificadas</h3>
        {content.verifiedFigures.map((figure, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <div className="summary-grid">
              <TextField id={`figure-value-${i}`} label="Cifra" value={figure.value} onChange={(v) => updateVerifiedFigure(i, { value: v })} />
              <TextField id={`figure-year-${i}`} label="Año" value={String(figure.year)} onChange={(v) => updateVerifiedFigure(i, { year: Number(v) || figure.year })} />
            </div>
            <TextField id={`figure-label-${i}`} label="Etiqueta" value={figure.label} onChange={(v) => updateVerifiedFigure(i, { label: v })} />
            <TextField id={`figure-source-${i}`} label="Fuente" value={figure.source} onChange={(v) => updateVerifiedFigure(i, { source: v })} />
          </div>
        ))}
      </div>

      <ProfessionalPanelEditor
        idPrefix="panel-aplicacion"
        title="Panel profesional — Aplicación"
        panel={content.professionalPanelAplicacion}
        onChange={(panel) => update({ professionalPanelAplicacion: panel })}
      />

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Práctica dirigida</h3>
        <TextField
          id="guided-practice-data-title"
          label="Título del panel de datos"
          value={content.guidedPractice.dataPanelTitle}
          onChange={(v) => update({ guidedPractice: { ...content.guidedPractice, dataPanelTitle: v } })}
        />
        <TextAreaField
          id="guided-practice-data-body"
          label="Datos del ejercicio"
          value={content.guidedPractice.dataPanelBody}
          onChange={(v) => update({ guidedPractice: { ...content.guidedPractice, dataPanelBody: v } })}
          rows={3}
        />
        {content.guidedPractice.steps.map((step, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <TextField id={`guided-step-title-${i}`} label={`Paso ${i + 1} — título`} value={step.title} onChange={(v) => updateGuidedPracticeStep(i, { title: v })} />
            <TextAreaField id={`guided-step-body-${i}`} label="Resolución" value={step.body} onChange={(v) => updateGuidedPracticeStep(i, { body: v })} rows={2} />
          </div>
        ))}
        <TextField
          id="guided-practice-now-you"
          label="Pregunta «Ahora tú»"
          value={content.guidedPractice.nowYouQuestion}
          onChange={(v) => update({ guidedPractice: { ...content.guidedPractice, nowYouQuestion: v } })}
        />
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Debate estructurado</h3>
        <TextField id="debate-question" label="Pregunta del debate" value={content.debate.question} onChange={(v) => update({ debate: { ...content.debate, question: v } })} />
        <div className="summary-grid">
          <TextAreaField
            id="debate-position-a"
            label="Postura A"
            value={content.debate.positionA.argument}
            onChange={(v) => update({ debate: { ...content.debate, positionA: { ...content.debate.positionA, argument: v } } })}
            rows={3}
          />
          <TextAreaField
            id="debate-position-b"
            label="Postura B"
            value={content.debate.positionB.argument}
            onChange={(v) => update({ debate: { ...content.debate, positionB: { ...content.debate.positionB, argument: v } } })}
            rows={3}
          />
        </div>
        <TextField
          id="debate-reflection"
          label="Pregunta de reflexión"
          value={content.debate.reflectionPrompt}
          onChange={(v) => update({ debate: { ...content.debate, reflectionPrompt: v } })}
        />
        <TextField
          id="debate-ground-rule"
          label="Regla de tiempo/turno de la dinámica"
          value={content.debate.groundRule ?? ""}
          onChange={(v) => update({ debate: { ...content.debate, groundRule: v || undefined } })}
        />
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Errores frecuentes</h3>
        {content.commonErrors.map((error, i) => (
          <div key={i} className="panel" style={{ padding: "0.6rem", marginBottom: "0.5rem" }}>
            <TextField id={`error-believed-${i}`} label="Se cree" value={error.believed} onChange={(v) => updateCommonError(i, { believed: v })} />
            <TextField id={`error-reality-${i}`} label="En realidad" value={error.reality} onChange={(v) => updateCommonError(i, { reality: v })} />
            <TextField id={`error-why-${i}`} label="Por qué" value={error.why} onChange={(v) => updateCommonError(i, { why: v })} />
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Autoevaluación</h3>
        {content.flashcards.map((card, i) => (
          <div key={i} className="summary-grid">
            <TextField id={`flash-q-${i}`} label="Pregunta" value={card.question} onChange={(v) => updateFlashcard(i, { question: v })} />
            <TextField id={`flash-a-${i}`} label="Respuesta" value={card.answer} onChange={(v) => updateFlashcard(i, { answer: v })} />
          </div>
        ))}
      </div>

      <GlassPartsEditor
        eyebrow="Caso práctico"
        onEyebrowChange={() => {}}
        parts={content.caseStudy}
        onChange={(caseStudy) => update({ caseStudy })}
        showNotes
      />

      <LinksEditor links={content.links} onChange={(links) => update({ links })} />

      <StringListEditor label="Conclusión (máx. 3 puntos)" items={content.conclusion} onChange={(conclusion) => update({ conclusion })} min={1} max={3} />

      <TextField id="next-topic" label="Tema de la próxima clase" value={content.nextClassTopic ?? ""} onChange={(v) => update({ nextClassTopic: v })} />
      <TextAreaField
        id="next-class-image-prompt"
        label="Prompt sugerido para imagen de próxima clase (opcional)"
        value={content.nextClassImagePrompt ?? ""}
        onChange={(v) => update({ nextClassImagePrompt: v || undefined })}
        rows={2}
      />

      <StringListEditor label="Referencias (APA 7)" items={content.references} onChange={(references) => update({ references })} />

      <TextField id="closing-question" label="Pregunta de cierre" value={content.closingQuestion} onChange={(v) => update({ closingQuestion: v })} />

      <PresenterNotesEditor
        keys={PRESENTER_NOTES_KEYS}
        labels={PRESENTER_NOTES_LABELS}
        notes={content.presenterNotes}
        onChange={(presenterNotes) => update({ presenterNotes })}
      />

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
