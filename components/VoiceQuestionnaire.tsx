"use client";
import { useState } from "react";

export interface VoiceQuestion {
  id: string;
  /** Se manda al análisis como encabezado de esa sección del texto — debe leerse bien seguido
   * de la respuesta ("Cómo saluda\n<respuesta>"). */
  label: string;
  hint: string;
  rows: number;
  /** Si viene, se renderiza como opciones en vez de textarea (ej. tú/usted) — el valor elegido
   * se manda igual como texto plano, así el heurístico de análisis (que busca literalmente
   * "tú"/"usted" en la muestra) lo detecta sin cambios. */
  options?: { value: string; label: string }[];
}

/** Preguntas para que el docente le "enseñe" su tono de voz a la IA respondiendo directamente,
 * sin necesidad de tener documentos de muestra a la mano. Mezcla preguntas cortas (saludo,
 * despedida, muletillas) con preguntas más largas que funcionan como muestra real de redacción
 * (explicación de un concepto, retroalimentación, saludo del foro) — estas últimas son las que
 * más aportan al análisis de ritmo y vocabulario, igual que un PDF de muestra. */
export const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    id: "treatment",
    label: "Trato con los estudiantes",
    hint: "¿Te diriges a tus estudiantes de tú o de usted?",
    rows: 0,
    options: [
      { value: "Prefiero dirigirme a mis estudiantes de tú.", label: "De tú" },
      { value: "Prefiero dirigirme a mis estudiantes de usted.", label: "De usted" },
    ],
  },
  {
    id: "greeting",
    label: "Cómo saludas",
    hint: "¿Cómo sueles saludar a tus estudiantes al inicio de una clase o mensaje? Una o dos frases.",
    rows: 2,
  },
  {
    id: "closing",
    label: "Cómo te despides",
    hint: "¿Cómo cierras tus mensajes o tus clases? Una o dos frases.",
    rows: 2,
  },
  {
    id: "toneDescription",
    label: "Tu tono en tus propias palabras",
    hint: "Describe el tono que buscas transmitir (cercano, formal, motivador, técnico...) y por qué. Unas 3-5 frases.",
    rows: 4,
  },
  {
    id: "explanationSample",
    label: "Explica un concepto de tu materia",
    hint: "Como si estuvieras en clase, explica en un párrafo cualquier concepto de lo que enseñas. Esta es la muestra más importante para el análisis.",
    rows: 5,
  },
  {
    id: "feedbackSample",
    label: "Un ejemplo de retroalimentación",
    hint: "Escribe cómo le darías retroalimentación a un estudiante que cometió un error común. Unas 3-5 frases.",
    rows: 4,
  },
  {
    id: "catchphrases",
    label: "Frases o muletillas características",
    hint: "¿Hay expresiones que uses con frecuencia y te gustaría que aparecieran en tus materiales? (opcional)",
    rows: 2,
  },
  {
    id: "forumWelcome",
    label: "Saludo de bienvenida del foro",
    hint: "Si tuvieras que escribir ahora mismo el mensaje de bienvenida del foro de tu clase, ¿qué dirías? Se guarda también como dato reutilizable.",
    rows: 5,
  },
];

interface VoiceQuestionnaireProps {
  onSubmit: (answers: Record<string, string>) => void;
  busy: boolean;
}

export function VoiceQuestionnaire({ onSubmit, busy }: VoiceQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answeredCount = VOICE_QUESTIONS.filter((q) => answers[q.id]?.trim()).length;
  const canSubmit = answeredCount >= 4 && !busy;

  return (
    <div className="field-group">
      <span className="field-legend">Responde este cuestionario para enseñarle tu tono de voz</span>
      <p className="field-hint">
        No hace falta que respondas las 8 — con al menos 4, sobre todo las más largas, ya hay suficiente muestra
        para analizar tu estilo. Puedes editarlas después.
      </p>

      {VOICE_QUESTIONS.map((q) => (
        <div key={q.id} className="field-group">
          <label htmlFor={`voice-q-${q.id}`}>{q.label}</label>
          <p className="field-hint" style={{ marginTop: "-0.2rem" }}>
            {q.hint}
          </p>
          {q.options ? (
            <div className="option-grid" role="radiogroup" aria-label={q.label}>
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.id] === opt.value}
                  className="option-card"
                  data-selected={answers[q.id] === opt.value}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                >
                  <h3>{opt.label}</h3>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              id={`voice-q-${q.id}`}
              rows={q.rows}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />
          )}
        </div>
      ))}

      <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={() => onSubmit(answers)}>
        <span className="btn-label" data-label={busy ? "Analizando…" : "Analizar mis respuestas"}>
          {busy ? "Analizando…" : "Analizar mis respuestas"}
        </span>
      </button>
      {!canSubmit && !busy && (
        <p className="field-hint">Responde al menos 4 preguntas ({answeredCount}/4) para poder analizar.</p>
      )}
    </div>
  );
}
