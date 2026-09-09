"use client";

import { useState } from "react";
import { Banner } from "../Banner";
import { requestResearchRecommendation, type ResearchRecommendationResponse } from "../../services/researchApi";
import { ApiError } from "../../services/httpClient";
import { RESEARCH_TOOL_ACCESS_LABELS } from "../../lib/research/researchTools";

const SOURCE_TYPES = [
  { id: "articulos", label: "Artículos académicos" },
  { id: "libros", label: "Libros" },
  { id: "datos", label: "Datos y estadísticas" },
  { id: "noticias", label: "Noticias actuales" },
  { id: "patentes", label: "Patentes" },
];

const LANGUAGES = [
  { id: "es", label: "Español" },
  { id: "en", label: "Inglés" },
  { id: "pt", label: "Portugués" },
  { id: "fr", label: "Francés" },
];

export function ResearchAssistant({
  aiConfigured,
  onOpenSettings,
}: {
  aiConfigured: boolean;
  onOpenSettings?: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [sourceTypes, setSourceTypes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["es"]);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [knowledgeArea, setKnowledgeArea] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchRecommendationResponse | null>(null);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const canSubmit = topic.trim().length >= 3 && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await requestResearchRecommendation({
          topic: topic.trim(),
          researchQuestion: researchQuestion.trim() || undefined,
          sourceTypes,
          languages,
          periodFrom: periodFrom || undefined,
          periodTo: periodTo || undefined,
          knowledgeArea: knowledgeArea.trim() || undefined,
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo obtener la recomendación.");
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="research-assistant">
      <h2 id="research-assistant">Asistente de investigación</h2>
      <p className="field-hint">
        Recomienda <strong>dónde buscar</strong> según tu tema. No consulta las plataformas ni devuelve
        artículos concretos: solo herramientas del catálogo y cadenas de búsqueda listas para usar.
      </p>

      {!aiConfigured && (
        <Banner type="warning" title="La conexión con inteligencia artificial requiere configuración">
          Revisa el proveedor y el modelo desde Configuración para usar el asistente. El catálogo de abajo
          funciona igual.
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

      {error && (
        <Banner type="error" title="No se pudo generar la recomendación" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="ra-topic">Tema</label>
          <input
            id="ra-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Transformación digital e IA en la educación superior en México"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="ra-question">Pregunta de investigación (opcional)</label>
          <textarea
            id="ra-question"
            rows={2}
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
          />
        </div>

        <div className="field-group">
          <span className="field-legend">¿Qué necesitas encontrar?</span>
          <div className="chip-row">
            {SOURCE_TYPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="preset-btn"
                data-selected={sourceTypes.includes(s.id)}
                aria-pressed={sourceTypes.includes(s.id)}
                onClick={() => toggle(sourceTypes, setSourceTypes, s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-legend">Idiomas</span>
          <div className="chip-row">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                className="preset-btn"
                data-selected={languages.includes(l.id)}
                aria-pressed={languages.includes(l.id)}
                onClick={() => toggle(languages, setLanguages, l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tool-filters">
          <div className="field-group">
            <label htmlFor="ra-from">Desde (año)</label>
            <input id="ra-from" type="text" inputMode="numeric" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} placeholder="2024" />
          </div>
          <div className="field-group">
            <label htmlFor="ra-to">Hasta (año)</label>
            <input id="ra-to" type="text" inputMode="numeric" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} placeholder="2026" />
          </div>
          <div className="field-group">
            <label htmlFor="ra-area">Área de conocimiento</label>
            <input id="ra-area" type="text" value={knowledgeArea} onChange={(e) => setKnowledgeArea(e.target.value)} placeholder="Educación" />
          </div>
        </div>

        <div className="actions-row">
          <div />
          <button type="submit" className="btn btn-primary" disabled={!canSubmit} data-loading={busy || undefined}>
            <span className="btn-label" data-label="Recomendar herramientas">
              Recomendar herramientas
            </span>
          </button>
        </div>
      </form>

      {result && (
        <div className="research-result">
          {result.warnings.length > 0 && (
            <Banner type="warning" title="Avisos">
              <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.1rem" }}>
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Banner>
          )}

          <h3>Herramientas recomendadas ({result.tools.length})</h3>
          <ul className="tool-rows">
            {result.tools.map(({ tool, reason }) => (
              <li key={tool.id} className="tool-row">
                <div className="tool-row-head">
                  <h3>{tool.name}</h3>
                  <span className="badge badge-ok tool-access-badge">
                    {RESEARCH_TOOL_ACCESS_LABELS[tool.accessType]}
                  </span>
                </div>
                <p className="tool-row-desc">{reason || tool.description}</p>
                <a className="btn btn-secondary tool-row-action" href={tool.officialUrl} target="_blank" rel="noopener noreferrer">
                  <span className="btn-label" data-label="Abrir herramienta">
                    Abrir herramienta
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {result.suggestedQueries.length > 0 && (
            <>
              <h3>Cadenas de búsqueda sugeridas</h3>
              <ul className="query-list">
                {result.suggestedQueries.map((q) => (
                  <li key={q}>
                    <code>{q}</code>
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.suggestedKeywords.length > 0 && (
            <>
              <h3>Palabras clave</h3>
              <div className="chip-row">
                {result.suggestedKeywords.map((k) => (
                  <span key={k} className="badge badge-ok">
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
