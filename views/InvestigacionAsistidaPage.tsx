"use client";

import { useEffect, useMemo, useState } from "react";
import { Banner } from "../components/Banner";
import { ResearchAssistant } from "../components/research/ResearchAssistant";
import { ResearchToolTable } from "../components/research/ResearchToolTable";
import { listResearchTools, type ResearchTool } from "../services/researchApi";
import { ApiError } from "../services/httpClient";

/**
 * Investigación asistida: dos bloques independientes — el asistente con IA (que solo recomienda
 * herramientas del catálogo) y el catálogo completo navegable. El catálogo funciona aunque la IA
 * no esté configurada; el asistente avisa y enlaza a Configuración en ese caso.
 */
export function InvestigacionAsistidaPage({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [tools, setTools] = useState<ResearchTool[] | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listResearchTools()
      .then((data) => {
        setTools(data.tools);
        setAiConfigured(data.aiStatus.configured);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo."));
  }, []);

  const total = tools?.length ?? 0;

  const lastVerified = useMemo(() => {
    if (!tools || tools.length === 0) return null;
    return tools.reduce((latest, t) => (t.lastVerifiedAt > latest ? t.lastVerifiedAt : latest), tools[0].lastVerifiedAt);
  }, [tools]);

  return (
    <div className="app-shell-wide">
      <header className="app-header">
        <h1>Investigación asistida por IA</h1>
        <p>
          Un asistente que te dice <strong>dónde</strong> buscar, y un catálogo de {total || "…"} herramientas de
          consulta gratuita.
        </p>
      </header>

      {error && (
        <Banner type="error" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}

      <ResearchAssistant aiConfigured={aiConfigured} onOpenSettings={onOpenSettings} />

      <section className="panel" aria-labelledby="research-catalog">
        <h2 id="research-catalog">Catálogo de herramientas</h2>
        <Banner type="info">
          Herramientas de consulta gratuita verificadas
          {lastVerified ? ` el ${new Date(lastVerified).toLocaleDateString()}` : ""}. La disponibilidad de los
          documentos enlazados y las condiciones de cada servicio pueden cambiar.
        </Banner>
        {tools === null ? (
          <div className="skeleton-block" aria-hidden />
        ) : (
          <ResearchToolTable tools={tools} />
        )}
      </section>
    </div>
  );
}
