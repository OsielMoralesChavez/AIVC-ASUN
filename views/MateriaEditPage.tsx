"use client";

import { useEffect, useState } from "react";
import { Banner } from "../components/Banner";
import { getMateriaDetail, type MateriaDetail } from "../services/dashboardApi";
import { renameMateria } from "../services/materiasApi";
import { ApiError } from "../services/httpClient";
import { DECK_TYPE_LABELS } from "../types/unir";

/**
 * Edición de una materia.
 *
 * Alcance real: el modelo solo guarda `name` y `category` como campos editables de la materia.
 * Las demás pestañas que pedía la especificación (editar contenido de una presentación, del
 * banco de preguntas o de los saludos) NO se implementan aquí porque ya existen en su propio
 * flujo —el editor de presentaciones vive en Materias, y los saludos no se persisten—, y
 * duplicarlas produciría otra vez dos formularios sobre el mismo dato, que es justo lo que se
 * consolidó antes. Se enlaza a donde sí se editan.
 */
export function MateriaEditPage({
  materiaId,
  onBack,
  onSaved,
  onOpenMaterias,
}: {
  materiaId: string;
  onBack: () => void;
  onSaved: () => void;
  onOpenMaterias: () => void;
}) {
  const [detail, setDetail] = useState<MateriaDetail | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    getMateriaDetail(materiaId)
      .then((d) => {
        setDetail(d);
        setName(d.materia.name);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar la asignatura."));
  }, [materiaId]);

  const dirty = detail !== null && name.trim() !== detail.materia.name;

  /** Aviso del navegador si se intenta cerrar/recargar con cambios pendientes. */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const leave = (go: () => void) => {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
    go();
  };

  async function handleSave() {
    if (!dirty || saving) return; // guarda contra envío duplicado
    setSaving(true);
    setError(null);
    try {
      await renameMateria(materiaId, name.trim());
      const fresh = await getMateriaDetail(materiaId);
      setDetail(fresh);
      setName(fresh.materia.name);
      // Sin punto final: en es-MX `toLocaleTimeString` ya termina en "a. m."/"p. m.".
      setSavedAt(new Date().toLocaleTimeString());
      // Avisa al Dashboard para que vuelva a pedir métricas al backend, en vez de ajustar su
      // copia local (que quedaría desincronizada).
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !detail) {
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

  return (
    <div className="app-shell">
      <div className="actions-row" style={{ marginBottom: "0.5rem" }}>
        <button type="button" className="btn btn-text" onClick={() => leave(onBack)}>
          <span className="btn-label" data-label="← Dashboard">← Dashboard</span>
        </button>
        <div />
      </div>

      <header className="app-header">
        <h1>Editar asignatura</h1>
        <p>Modifica los datos de la asignatura. Los recursos generados se editan en su propio flujo.</p>
      </header>

      {error && (
        <Banner type="error" title="No se pudo guardar" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      {savedAt && !dirty && <Banner type="info">Cambios guardados a las {savedAt}</Banner>}
      {dirty && <Banner type="warning">Tienes cambios sin guardar.</Banner>}

      <section className="panel" aria-labelledby="me-general">
        <h2 id="me-general">Datos generales</h2>
        <div className="field-group">
          <label htmlFor="me-name">Nombre de la asignatura</label>
          <input
            id="me-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            aria-invalid={name.trim().length === 0 ? "true" : undefined}
          />
          {name.trim().length === 0 && <span className="field-error">El nombre no puede quedar vacío.</span>}
        </div>
        <div className="field-group">
          <label htmlFor="me-cat">Categoría</label>
          <input id="me-cat" type="text" value={detail.materia.category ?? "General"} disabled readOnly />
          <span className="field-hint">La categoría se define al crear la asignatura y no es editable.</span>
        </div>
      </section>

      <section className="panel" aria-labelledby="me-recursos">
        <h2 id="me-recursos">Recursos de la asignatura</h2>
        <p className="field-hint">
          Estas piezas se editan y regeneran desde <strong>Asignaturas</strong>, donde vive el editor
          completo de cada una — aquí solo se listan para no tener dos formularios sobre el mismo dato.
        </p>
        <ul className="data-summary">
          <li><span className="label">Clases</span><span>{detail.counts.classes}</span></li>
          <li><span className="label">Bancos de preguntas</span><span>{detail.counts.questionBanks}</span></li>
          <li><span className="label">Preguntas</span><span>{detail.counts.questions}</span></li>
        </ul>
        {detail.classes.length > 0 && (
          <ul className="materia-rows" style={{ marginTop: "0.75rem" }}>
            {detail.classes.slice(0, 5).map((c) => (
              <li key={c.id} className="materia-row">
                <div className="materia-row-main">
                  <strong>{c.title}</strong>
                  <span className="field-hint">
                    {DECK_TYPE_LABELS[c.deckType as keyof typeof DECK_TYPE_LABELS] ?? c.deckType}
                  </span>
                </div>
                <span />
                <span />
              </li>
            ))}
          </ul>
        )}
        <div className="actions-row">
          <div />
          <button type="button" className="btn btn-secondary" onClick={() => leave(onOpenMaterias)}>
            <span className="btn-label" data-label="Abrir en Asignaturas">Abrir en Asignaturas</span>
          </button>
        </div>
      </section>

      <div className="actions-row">
        <button
          type="button"
          className="btn btn-text"
          onClick={() => setName(detail.materia.name)}
          disabled={!dirty || saving}
        >
          <span className="btn-label" data-label="Descartar cambios">Descartar cambios</span>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty || saving || name.trim().length === 0}
          data-loading={saving || undefined}
        >
          <span className="btn-label" data-label="Guardar cambios">Guardar cambios</span>
        </button>
      </div>
    </div>
  );
}
