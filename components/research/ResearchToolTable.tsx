"use client";

import { useMemo, useState } from "react";
import type { ResearchTool } from "../../services/researchApi";
import {
  RESEARCH_TOOL_ACCESS_HINTS,
  RESEARCH_TOOL_ACCESS_LABELS,
  RESEARCH_TOOL_CATEGORY_LABELS,
  RESEARCH_TOOL_FULLTEXT_LABELS,
} from "../../lib/research/researchTools";

const PAGE_SIZE = 12;

type SortBy = "name" | "category";

/**
 * Tabla del catálogo con buscador, filtros, orden y paginación. En pantallas angostas cada fila
 * se convierte en una tarjeta (misma información, sin scroll horizontal) — ver `.tool-row` en
 * globals.css.
 */
export function ResearchToolTable({ tools }: { tools: ResearchTool[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [access, setAccess] = useState("");
  const [language, setLanguage] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [page, setPage] = useState(1);

  const languages = useMemo(() => [...new Set(tools.flatMap((t) => t.languages))].sort(), [tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = tools.filter((t) => {
      if (category && t.category !== category) return false;
      if (access && t.accessType !== access) return false;
      if (language && !t.languages.includes(language)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        RESEARCH_TOOL_CATEGORY_LABELS[t.category].toLowerCase().includes(q)
      );
    });
    return rows.sort((a, b) =>
      sortBy === "name"
        ? a.name.localeCompare(b.name, "es")
        : RESEARCH_TOOL_CATEGORY_LABELS[a.category].localeCompare(RESEARCH_TOOL_CATEGORY_LABELS[b.category], "es") ||
          a.name.localeCompare(b.name, "es")
    );
  }, [tools, query, category, access, language, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasFilters = Boolean(query || category || access || language);

  const reset = () => {
    setQuery("");
    setCategory("");
    setAccess("");
    setLanguage("");
    setPage(1);
  };

  const onFilterChange = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1); // cambiar un filtro sin volver a la página 1 puede dejar la vista vacía
  };

  return (
    <>
      <div className="tool-filters">
        <div className="field-group">
          <label htmlFor="tool-search">Buscar</label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => onFilterChange(setQuery)(e.target.value)}
            placeholder="Nombre, descripción o categoría"
          />
        </div>
        <div className="field-group">
          <label htmlFor="tool-cat">Categoría</label>
          <select id="tool-cat" value={category} onChange={(e) => onFilterChange(setCategory)(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(RESEARCH_TOOL_CATEGORY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="tool-access">Tipo de acceso</label>
          <select id="tool-access" value={access} onChange={(e) => onFilterChange(setAccess)(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(RESEARCH_TOOL_ACCESS_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="tool-lang">Idioma</label>
          <select id="tool-lang" value={language} onChange={(e) => onFilterChange(setLanguage)(e.target.value)}>
            <option value="">Todos</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="tool-sort">Ordenar por</label>
          <select id="tool-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="name">Nombre (A–Z)</option>
            <option value="category">Categoría</option>
          </select>
        </div>
      </div>

      <div className="tool-results-bar">
        <span aria-live="polite">
          {filtered.length} de {tools.length} herramienta(s)
        </span>
        {hasFilters && (
          <button type="button" className="btn btn-text" onClick={reset}>
            <span className="btn-label" data-label="Limpiar filtros">
              Limpiar filtros
            </span>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="field-hint">
          Ninguna herramienta coincide con los filtros. Prueba a limpiarlos o a buscar otro término.
        </p>
      ) : (
        <ul className="tool-rows" aria-label="Herramientas de investigación">
          {pageRows.map((t) => (
            <li key={t.id} className="tool-row">
              <div className="tool-row-head">
                <h3>{t.name}</h3>
                <span className="badge badge-ok tool-access-badge" title={RESEARCH_TOOL_ACCESS_HINTS[t.accessType]}>
                  {RESEARCH_TOOL_ACCESS_LABELS[t.accessType]}
                </span>
              </div>
              <p className="tool-row-desc">{t.description}</p>
              <dl className="tool-row-meta">
                <div>
                  <dt>Categoría</dt>
                  <dd>{RESEARCH_TOOL_CATEGORY_LABELS[t.category]}</dd>
                </div>
                <div>
                  <dt>Texto completo</dt>
                  <dd>{RESEARCH_TOOL_FULLTEXT_LABELS[t.fullTextAvailability]}</dd>
                </div>
                <div>
                  <dt>Idiomas</dt>
                  <dd>{t.languages.join(", ")}</dd>
                </div>
                <div>
                  <dt>Cuenta</dt>
                  <dd>{t.requiresAccount ? "Requiere cuenta gratuita" : "No requiere"}</dd>
                </div>
                <div>
                  <dt>Verificada</dt>
                  <dd>{new Date(t.lastVerifiedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
              <a
                className="btn btn-secondary tool-row-action"
                href={t.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="btn-label" data-label={`Abrir ${t.name}`}>
                  Abrir herramienta
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="tool-pagination" aria-label="Paginación del catálogo">
          <button type="button" className="btn btn-text" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            <span className="btn-label" data-label="Anterior">
              Anterior
            </span>
          </button>
          <span aria-live="polite">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-text"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <span className="btn-label" data-label="Siguiente">
              Siguiente
            </span>
          </button>
        </nav>
      )}
    </>
  );
}
