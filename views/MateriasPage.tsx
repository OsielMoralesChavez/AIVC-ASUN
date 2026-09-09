"use client";
import { useState } from "react";
import { Banner } from "../components/Banner";
import { MateriaWorkspace } from "../components/MateriaWorkspace";
import { TrashIcon } from "../components/TrashIcon";
import { useMaterias } from "../hooks/useMaterias";

interface MateriasPageProps {
  /** `null` (por defecto) = materias sin categoría; una cadena acota a esa categoría (p. ej.
   * "curso-sello", usado por CursoSelloPage) — las materias nuevas creadas aquí heredan la misma. */
  category?: string | null;
  title?: string;
  description?: string;
  emptyHint?: string;
}

export function MateriasPage({
  category = null,
  title = "Asignaturas",
  description = "Organiza tus clases y bancos de preguntas por asignatura. Primero se generan las clases; el banco de preguntas depende de ellas.",
  emptyHint = "Todavía no tienes asignaturas. Crea una abajo para empezar.",
}: MateriasPageProps = {}) {
  const materias = useMaterias(category);
  const [newMateriaName, setNewMateriaName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visibleMaterias = query.trim()
    ? materias.materias.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
    : materias.materias;

  if (materias.selectedMateria) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <h1>{materias.selectedMateria.name}</h1>
          <p>Genera primero las clases; el banco de preguntas se construye a partir de ellas.</p>
        </header>

        {materias.error && (
          <Banner type="error" title="Ocurrió un error" onDismiss={() => materias.setError(null)}>
            {materias.error}
          </Banner>
        )}

        <MateriaWorkspace materia={materias.selectedMateria} onBack={() => materias.setSelectedMateriaId(null)} />

        <div className="actions-row" style={{ marginTop: "1rem" }}>
          <div />
          <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <span className="btn-label" data-label="Eliminar asignatura">
              Eliminar asignatura
            </span>
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="panel" role="alertdialog" aria-labelledby="delete-materia-heading">
            <h2 id="delete-materia-heading">¿Eliminar &ldquo;{materias.selectedMateria.name}&rdquo;?</h2>
            <p>Se eliminarán también todas sus clases y bancos de preguntas generados. Esta acción no se puede deshacer.</p>
            <div className="actions-row">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                <span className="btn-label" data-label="Cancelar">
                  Cancelar
                </span>
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  materias.removeMateria(materias.selectedMateria!.id);
                }}
              >
                <span className="btn-label" data-label="Sí, eliminar">
                  Sí, eliminar
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      {materias.error && (
        <Banner type="error" title="Ocurrió un error" onDismiss={() => materias.setError(null)}>
          {materias.error}
        </Banner>
      )}

      <div className="option-grid" role="group" aria-label="Acciones de asignaturas" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="option-card"
          aria-pressed={createOpen}
          data-selected={createOpen}
          onClick={() => {
            setCreateOpen((v) => !v);
            setSearchOpen(false);
          }}
        >
          <h3>+ Crear asignatura</h3>
          <p>Da de alta una nueva asignatura</p>
        </button>
        <button
          type="button"
          className="option-card"
          aria-pressed={searchOpen}
          data-selected={searchOpen}
          onClick={() => {
            setSearchOpen((v) => !v);
            setCreateOpen(false);
          }}
        >
          <h3>Buscar asignatura</h3>
          <p>Filtra tu lista por nombre</p>
        </button>
      </div>

      {createOpen && (
        <section className="panel" aria-labelledby="create-materia-h" style={{ marginBottom: "1rem" }}>
          <h2 id="create-materia-h">Crear asignatura</h2>
          <div className="bullet-row">
            <input
              type="text"
              aria-label="Nombre de la nueva asignatura"
              placeholder="Nombre de la asignatura (ej. Finanzas corporativas)"
              value={newMateriaName}
              onChange={(e) => setNewMateriaName(e.target.value)}
              style={{ flex: 1 }}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={newMateriaName.trim().length === 0}
              onClick={() => {
                materias.addMateria(newMateriaName.trim());
                setNewMateriaName("");
                setCreateOpen(false);
              }}
            >
              <span className="btn-label" data-label="Crear">
                Crear
              </span>
            </button>
          </div>
        </section>
      )}

      {searchOpen && (
        <section className="panel" aria-labelledby="search-materia-h" style={{ marginBottom: "1rem" }}>
          <h2 id="search-materia-h">Buscar asignatura</h2>
          <div className="field-group">
            <label htmlFor="materia-search">Nombre de la asignatura</label>
            <input
              id="materia-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe para filtrar"
              autoFocus
            />
          </div>
        </section>
      )}

      <section className="panel" aria-label={title}>
        <h2>Tus asignaturas</h2>
        {materias.materias.length === 0 ? (
          <p className="field-hint">{emptyHint}</p>
        ) : visibleMaterias.length === 0 ? (
          <p className="field-hint">Ninguna asignatura coincide con «{query}».</p>
        ) : null}
        <ul aria-label="Lista de asignaturas" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {visibleMaterias.map((m) => (
            <li key={m.id}>
              <div className="option-card" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem" }}>
                <button
                  type="button"
                  onClick={() => materias.setSelectedMateriaId(m.id)}
                  style={{ flex: 1, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  <h3>{m.name}</h3>
                  <p>
                    {m.presentationCount} clase(s) · {m.minicasoBankCount} banco(s) de preguntas
                  </p>
                </button>
                <button
                  type="button"
                  className="btn-text"
                  aria-label={`Eliminar asignatura "${m.name}"`}
                  title="Eliminar asignatura"
                  onClick={() => setConfirmDeleteListId(m.id)}
                  style={{ color: "var(--color-danger)", padding: "0.3rem", flexShrink: 0 }}
                >
                  <TrashIcon />
                </button>
              </div>

              {confirmDeleteListId === m.id && (
                <div className="panel" role="alertdialog" aria-labelledby={`confirm-delete-list-${m.id}`} style={{ marginTop: "0.5rem", padding: "0.75rem" }}>
                  <p id={`confirm-delete-list-${m.id}`} style={{ margin: "0 0 0.6rem" }}>
                    ¿Eliminar &ldquo;{m.name}&rdquo;? Se eliminarán también todas sus clases y bancos de preguntas. Esta
                    acción no se puede deshacer.
                  </p>
                  <div className="actions-row" style={{ margin: 0 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteListId(null)}>
                      <span className="btn-label" data-label="Cancelar">
                        Cancelar
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setConfirmDeleteListId(null);
                        materias.removeMateria(m.id);
                      }}
                    >
                      <span className="btn-label" data-label="Sí, eliminar">
                        Sí, eliminar
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
