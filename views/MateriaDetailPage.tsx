"use client";

import { useEffect, useState } from "react";
import { Banner } from "../components/Banner";
import { getMateriaDetail, type MateriaDetail } from "../services/dashboardApi";
import { downloadPresentation } from "../services/api";
import { ApiError } from "../services/httpClient";
import { DECK_TYPE_LABELS } from "../types/unir";

type Tab = "resumen" | "clases" | "preguntas" | "archivos";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "clases", label: "Clases y presentaciones" },
  { id: "preguntas", label: "Banco de preguntas" },
  { id: "archivos", label: "Archivos de origen" },
];

/**
 * Vista de solo lectura de una materia. Muestra únicamente lo que el modelo guarda de verdad;
 * las secciones que la especificación pedía pero para las que no hay datos (información
 * académica, saludos persistidos, calendario) se declaran explícitamente con su motivo, en vez
 * de mostrarse vacías o rellenarse con datos inventados.
 */
export function MateriaDetailPage({
  materiaId,
  onBack,
  onEdit,
}: {
  materiaId: string;
  onBack: () => void;
  onEdit: (materiaId: string) => void;
}) {
  const [detail, setDetail] = useState<MateriaDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");

  useEffect(() => {
    setDetail(null);
    setNotFound(false);
    getMateriaDetail(materiaId)
      .then(setDetail)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err instanceof ApiError ? err.message : "No se pudo cargar la asignatura.");
      });
  }, [materiaId]);

  if (notFound) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <h1>Asignatura no encontrada</h1>
          <p>La asignatura que intentas abrir ya no existe. Es posible que se haya eliminado.</p>
        </header>
        <div className="actions-row">
          <button type="button" className="btn btn-primary" onClick={onBack}>
            <span className="btn-label" data-label="Volver al Dashboard">
              Volver al Dashboard
            </span>
          </button>
          <div />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Banner type="error" title="Error">{error}</Banner>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <span className="btn-label" data-label="Volver">Volver</span>
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="app-shell">
        <div className="skeleton-block" aria-hidden />
      </div>
    );
  }

  const { materia, counts, classes, questionBanks, sourceDocuments, missingData } = detail;

  return (
    <div className="app-shell-wide">
      <div className="actions-row" style={{ marginBottom: "0.5rem" }}>
        <button type="button" className="btn btn-text" onClick={onBack}>
          <span className="btn-label" data-label="← Dashboard">← Dashboard</span>
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onEdit(materia.id)}>
          <span className="btn-label" data-label="Editar asignatura">Editar asignatura</span>
        </button>
      </div>

      <header className="app-header">
        <h1>{materia.name}</h1>
        <p>Vista completa en modo lectura.</p>
      </header>

      <nav className="config-tabs" aria-label="Secciones de la asignatura">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="config-tab"
            data-active={tab === t.id}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "resumen" && (
        <>
          <section className="panel" aria-labelledby="md-resumen">
            <h2 id="md-resumen">Resumen</h2>
            <ul className="data-summary">
              <li><span className="label">Nombre</span><span>{materia.name}</span></li>
              <li><span className="label">Categoría</span><span>{materia.category ?? "General"}</span></li>
              <li><span className="label">Clases generadas</span><span>{counts.classes}</span></li>
              <li><span className="label">Bancos de preguntas</span><span>{counts.questionBanks}</span></li>
              <li><span className="label">Preguntas totales</span><span>{counts.questions}</span></li>
              <li><span className="label">Creada</span><span>{new Date(materia.createdAt).toLocaleString()}</span></li>
              <li><span className="label">Última actualización</span><span>{new Date(materia.updatedAt).toLocaleString()}</span></li>
            </ul>
          </section>

          <Banner type="info" title="Datos no disponibles en este momento">
            <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.1rem" }}>
              {Object.values(missingData).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </Banner>
        </>
      )}

      {tab === "clases" && (
        <section className="panel" aria-labelledby="md-clases">
          <h2 id="md-clases">Clases y presentaciones ({classes.length})</h2>
          {classes.length === 0 ? (
            <p className="field-hint">Esta asignatura todavía no tiene clases generadas.</p>
          ) : (
            <ul className="materia-rows">
              {classes.map((c) => (
                <li key={c.id} className="materia-row">
                  <div className="materia-row-main">
                    <strong>
                      {c.weekNumber !== null ? `Semana ${c.weekNumber} — ` : ""}
                      {c.title}
                    </strong>
                    <span className="field-hint">
                      {DECK_TYPE_LABELS[c.deckType as keyof typeof DECK_TYPE_LABELS] ?? c.deckType} ·{" "}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="badge badge-ok">Generada</span>
                  <button
                    type="button"
                    className="btn btn-text"
                    onClick={() => void downloadPresentation(c.id, `${c.title}.pptx`)}
                  >
                    <span className="btn-label" data-label="Descargar">Descargar</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "preguntas" && (
        <section className="panel" aria-labelledby="md-preguntas">
          <h2 id="md-preguntas">Banco de preguntas</h2>
          {questionBanks.length === 0 ? (
            <p className="field-hint">Esta asignatura todavía no tiene banco de preguntas.</p>
          ) : (
            questionBanks.map((bank) => (
              <div key={bank.id} style={{ marginBottom: "1.5rem" }}>
                <h3>
                  {bank.subjectName} — {bank.questionCount} pregunta(s)
                </h3>
                <ul className="materia-rows">
                  {bank.items.map((q, i) => (
                    <li key={q.id} className="materia-row" style={{ gridTemplateColumns: "1fr" }}>
                      <div className="materia-row-main">
                        <strong>
                          {i + 1}. {q.scenario}
                        </strong>
                        <ol style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
                          {q.options.map((opt, oi) => (
                            <li key={opt} style={oi === q.correctIndex ? { fontWeight: 600, color: "var(--color-success)" } : undefined}>
                              {opt}
                              {oi === q.correctIndex ? " ✓" : ""}
                            </li>
                          ))}
                        </ol>
                        <span className="field-hint">
                          Tema: {q.topic} · Bloom {q.bloomLevel}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      {tab === "archivos" && (
        <section className="panel" aria-labelledby="md-archivos">
          <h2 id="md-archivos">Archivos de origen ({sourceDocuments.length})</h2>
          <p className="field-hint">
            Los documentos no se guardan ligados a la asignatura: esta lista se deriva de los que usó cada
            clase generada.
          </p>
          {sourceDocuments.length === 0 ? (
            <p className="field-hint">No hay archivos asociados.</p>
          ) : (
            <ul className="materia-rows">
              {sourceDocuments.map((d) => (
                <li key={d.id} className="materia-row">
                  <div className="materia-row-main">
                    <strong>{d.fileName}</strong>
                    <span className="field-hint">
                      {d.sourceKind.toUpperCase()} · {d.pageCount} pág · rol: {d.role}
                    </span>
                  </div>
                  <span className="field-hint materia-row-date">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                  <span />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
