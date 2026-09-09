"use client";
import { useEffect, useState } from "react";
import { ApiError, getPresentationPlan, listSessionPresentations, type SessionPresentationSummary } from "../services/api";
import { DECK_TYPE_LABELS, type PrimeraClaseContent, type UnirDeckContent } from "../types/unir";
import { Banner } from "./Banner";
import { buildWeeklyPost, buildWelcomePost, type ForoPost } from "../lib/foro/greetings";

interface ForoTabProps {
  materiaId: string;
}

/**
 * Una publicación lista para pegar en el aula virtual: asunto y cuerpo, separados, porque el foro
 * los pide en campos distintos. El botón copia el cuerpo — es lo único que se hace con este texto.
 */
function ForoPostCard({ post }: { post: ForoPost }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(post.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles el texto sigue visible y seleccionable: no se bloquea nada.
      setCopied(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "1rem" }}>
      <div className="file-meta" style={{ marginBottom: "0.6rem" }}>
        <div className="file-name">Asunto: {post.subject}</div>
        <button type="button" className="btn btn-ghost" onClick={copy}>
          <span className="btn-label">{copied ? "Copiado" : "Copiar cuerpo"}</span>
        </button>
      </div>
      <div style={{ whiteSpace: "pre-wrap" }}>{post.body}</div>
    </div>
  );
}

interface WeeklyGreeting {
  id: string;
  weekNumber: number;
  sessionTitle: string;
  deckType: SessionPresentationSummary["deckType"];
  greeting: string;
}

/** No genera nada nuevo ni llama a ningún modelo de IA — solo arma el saludo de bienvenida a
 * partir de los datos del docente ya capturados en la primera clase, y un saludo por cada semana
 * (no solo la primera) a partir del objetivo de aprendizaje ya generado en cada clase de la
 * materia (ver hooks/useMaterias.ts para el patrón equivalente de "vista derivada, sin
 * generación"). */
export function ForoTab({ materiaId }: ForoTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primeraClase, setPrimeraClase] = useState<PrimeraClaseContent | null>(null);
  const [weeklyGreetings, setWeeklyGreetings] = useState<WeeklyGreeting[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await listSessionPresentations(materiaId);
        if (cancelled) return;

        const weeklySummaries = list
          .filter((p) => p.deckType !== "repaso" && typeof p.weekNumber === "number")
          .sort((a, b) => (a.weekNumber as number) - (b.weekNumber as number));

        const fullContents = await Promise.all(weeklySummaries.map((s) => getPresentationPlan(s.id)));
        if (cancelled) return;

        const greetings: WeeklyGreeting[] = weeklySummaries.map((summary, i) => {
          const content = fullContents[i].content as UnirDeckContent;
          const objective = "learningObjective" in content ? content.learningObjective.statement : "";
          return {
            id: summary.id,
            weekNumber: summary.weekNumber as number,
            sessionTitle: summary.title,
            deckType: summary.deckType,
            greeting: objective,
          };
        });
        setWeeklyGreetings(greetings);

        const primeraClaseSummary = [...weeklySummaries]
          .filter((p) => p.deckType === "primera-clase")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (primeraClaseSummary) {
          const idx = weeklySummaries.indexOf(primeraClaseSummary);
          const stored = fullContents[idx];
          if (stored.content.type === "primera-clase") {
            setPrimeraClase(stored.content);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudo cargar el foro.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [materiaId]);

  if (loading) {
    return (
      <section className="panel" aria-label="Foro">
        <p className="field-hint">Cargando…</p>
      </section>
    );
  }

  if (error) {
    return (
      <Banner type="error" title="No se pudo cargar el foro">
        {error}
      </Banner>
    );
  }

  if (!primeraClase) {
    return (
      <section className="panel" aria-label="Foro">
        <h2>Foro</h2>
        <p className="field-hint">
          Genera la primera clase de esta materia para armar automáticamente el saludo de bienvenida y el
          seguimiento semanal.
        </p>
      </section>
    );
  }

  const welcome = buildWelcomePost(primeraClase);

  return (
    <div>
      <section className="panel" aria-labelledby="foro-greeting-heading">
        <h2 id="foro-greeting-heading">Publicación de apertura</h2>
        <p className="field-hint">
          Armada con la formación, la experiencia y la especialidad capturadas en la presentación de
          primera clase. Lista para pegar en el foro.
        </p>
        <ForoPostCard post={welcome} />
      </section>

      <section className="panel" aria-labelledby="foro-followup-heading">
        <h2 id="foro-followup-heading">Seguimiento semanal</h2>
        <p className="field-hint">
          Una publicación por semana, derivada del objetivo de aprendizaje ya generado en cada clase.
        </p>
        {weeklyGreetings.length === 0 ? (
          <p className="field-hint">Todavía no hay clases con número de semana asignado.</p>
        ) : (
          <ul aria-label="Seguimiento semanal" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {weeklyGreetings.map((w, i) => (
              <li key={w.id}>
                <div className="file-meta">
                  <div className="file-name">Semana {w.weekNumber}</div>
                  <div className="file-sub">{DECK_TYPE_LABELS[w.deckType]}</div>
                </div>
                <ForoPostCard
                  post={buildWeeklyPost({
                    weekNumber: w.weekNumber,
                    sessionTitle: w.sessionTitle,
                    objective: w.greeting,
                    previousTopic: weeklyGreetings[i - 1]?.sessionTitle,
                    teacherName: primeraClase.teacherName,
                    teacherTitle: primeraClase.teacherTitle,
                  })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
