"use client";

import { withBasePath } from "../utils/basePath";

import { useState } from "react";

/**
 * Videos y material didáctico para que el profesorado se actualice en el uso de herramientas de
 * IA en el aula, organizados por curso dentro de una categoría (Anthropic, OpenAI, Google,
 * Microsoft, Automatización). Al elegir una categoría se entra a una sección propia con el
 * desarrollo del curso: infografías, complemento escrito, ejercicios y videos. Sin backend propio
 * a propósito: no hay pedido de un sistema de carga/gestión de contenido, así que esto es un
 * catálogo estático en código — listo para poblarse, sin inventar contenido que la institución no
 * ha publicado (mismo criterio que el resto de la app: nunca fabricar datos, mostrar un estado
 * vacío honesto en su lugar).
 *
 * Las imágenes de cada curso viven en public/cursos-actualizacion/<id-del-curso>/ — Next.js sirve
 * ese contenido de public/ tal cual en la raíz, así que `src: "/cursos-actualizacion/x/y.png"`
 * apunta a public/cursos-actualizacion/x/y.png.
 */

type CourseCategory = "anthropic" | "openai" | "google" | "microsoft" | "automatizacion";

const CATEGORIES: { id: CourseCategory; label: string }[] = [
  { id: "anthropic", label: "Anthropic" },
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Google" },
  { id: "microsoft", label: "Microsoft" },
  { id: "automatizacion", label: "Automatización" },
];

interface CourseVideo {
  title: string;
  description: string;
  /** URL de YouTube o Vimeo — se incrusta como reproductor. Cualquier otra URL se muestra como enlace. */
  url: string;
  durationMinutes?: number;
}

interface CourseMaterial {
  title: string;
  description: string;
  url: string;
  /** Ej. "PDF", "Guía", "Plantilla". */
  format: string;
}

interface CourseImage {
  title: string;
  description: string;
  src: string;
  alt: string;
}

interface CourseExercise {
  title: string;
  description: string;
  /** Instrucciones del ejercicio, un párrafo por elemento. */
  steps: string[];
}

/** Complemento escrito que amplía por texto lo que una infografía del curso muestra visualmente. */
interface CourseArticle {
  title: string;
  /** Título de la CourseImage a la que amplía — solo para trazabilidad editorial, no se usa para enlazar en UI. */
  relatedImageTitle: string;
  /** Un párrafo por elemento. */
  sections: { heading: string; paragraphs: string[] }[];
}

interface Course {
  id: string;
  category: CourseCategory;
  title: string;
  description: string;
  images: CourseImage[];
  articles: CourseArticle[];
  materials: CourseMaterial[];
  videos: CourseVideo[];
  exercises: CourseExercise[];
}

const COURSES: Course[] = [
  {
    id: "uso-de-claude-ai",
    category: "anthropic",
    title: "Uso de Claude.ai",
    description: "Curso introductorio al ecosistema Claude: qué herramienta usar, qué modelo elegir y qué plan conviene según la tarea.",
    images: [
      {
        title: "Módulo 1 · El ecosistema Claude",
        description: "Anthropic y Claude, las cuatro formas de trabajar (Chat, Cowork, Design, Claude Code), cómo elegir modelo (Haiku/Sonnet/Opus/Fable) y plan (Free/Pro/Max).",
        src: withBasePath("/cursos-actualizacion/uso-de-claude-ai/modulo-1-ecosistema-claude.png"),
        alt: "Infografía: Módulo 1 — El ecosistema Claude. Herramienta + modelo + plan: elige la combinación adecuada.",
      },
    ],
    articles: [
      {
        title: "Complemento — Cómo elegir bien dentro del ecosistema Claude",
        relatedImageTitle: "Módulo 1 · El ecosistema Claude",
        sections: [
          {
            heading: "Anthropic y Claude",
            paragraphs: [
              "Anthropic desarrolla Claude, un asistente de IA con varias herramientas y modelos. Elegir bien es decidir en ese orden: qué tarea tengo → con qué herramienta → con qué modelo.",
            ],
          },
          {
            heading: "Herramienta según la tarea",
            paragraphs: [
              "Chat para consultas puntuales (redactar, resumir, dudas). Cowork para proyectos que se retoman varias veces. Design para entregables visuales. Claude Code para tareas de programación.",
            ],
          },
          {
            heading: "Modelo según la complejidad",
            paragraphs: [
              "Haiku: rápido y económico, para tareas simples. Sonnet: el equilibrio recomendado para el día a día. Opus: máximo razonamiento, para análisis complejos. Fable: escritura creativa. Empieza siempre por el más sencillo y sube solo si hace falta.",
            ],
          },
          {
            heading: "Plan según la frecuencia de uso",
            paragraphs: [
              "Free para explorar la herramienta. Pro para uso habitual con acceso a Opus. Max para uso intensivo y constante. Prueba Free primero y decide el plan según tu necesidad real.",
            ],
          },
        ],
      },
    ],
    materials: [],
    videos: [],
    exercises: [
      {
        title: "Ejercicio 1 — Diagnóstico de tarea",
        description: "Practica el criterio de elección herramienta + modelo + plan antes de usarlo en una tarea real de tu materia.",
        steps: [
          "Elige una tarea docente real que tengas pendiente esta semana (por ejemplo: adaptar un texto de lectura, preparar una rúbrica, resolver dudas de un tema, o revisar un documento extenso).",
          "Clasifícala según el criterio del Módulo 1: ¿es una consulta puntual (Chat), un proyecto que se retoma varias veces (Cowork), un entregable con formato visual (Design) o una tarea de código (Claude Code)?",
          "Elige el modelo más sencillo que razonablemente podría resolverla (Haiku, Sonnet u Opus) y justifica por qué no elegiste uno mayor ni uno menor.",
          "Ejecuta la tarea en Claude.ai con esa combinación y anota si el resultado fue suficiente o si tuviste que subir de modelo — esa observación es la que forma criterio para la próxima vez.",
        ],
      },
    ],
  },
];

function embedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoCard({ video }: { video: CourseVideo }) {
  const embed = embedUrl(video.url);
  return (
    <div className="option-card" style={{ cursor: "default" }}>
      {embed ? (
        <div style={{ position: "relative", paddingTop: "56.25%", marginBottom: "0.6rem", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <iframe
            src={embed}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      ) : (
        <p className="field-hint">
          <a href={video.url} target="_blank" rel="noreferrer noopener">
            Ver video ↗
          </a>
        </p>
      )}
      <h3>{video.title}</h3>
      <p>
        {video.description}
        {video.durationMinutes ? ` · ${video.durationMinutes} min` : ""}
      </p>
    </div>
  );
}

function CourseSection({ course }: { course: Course }) {
  const isEmpty =
    course.images.length === 0 &&
    course.articles.length === 0 &&
    course.materials.length === 0 &&
    course.videos.length === 0 &&
    course.exercises.length === 0;

  return (
    <section className="panel" aria-labelledby={`course-${course.id}-h`}>
      <h2 id={`course-${course.id}-h`}>{course.title}</h2>
      <p className="field-hint">{course.description}</p>

      {isEmpty && <p className="field-hint">Todavía no hay contenido cargado en este curso.</p>}

      {course.images.length > 0 && (
        <div className="option-grid">
          {course.images.map((img) => (
            <figure key={img.src} className="option-card" style={{ cursor: "default", margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- material estático servido desde public/, sin optimización de Next necesaria */}
              <img
                src={img.src}
                alt={img.alt}
                style={{ display: "block", width: "100%", maxWidth: "360px", margin: "0 auto 0.6rem", borderRadius: "var(--radius)" }}
              />
              <figcaption>
                <h3>{img.title}</h3>
                <p>{img.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {course.articles.length > 0 && (
        <div style={{ marginTop: course.images.length > 0 ? "0.75rem" : 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {course.articles.map((article) => (
            <article
              key={article.title}
              className="option-card"
              style={{ cursor: "default" }}
              aria-label={`Complemento escrito: ${article.title}`}
            >
              <h3>{article.title}</h3>
              <p className="field-hint">Complemento escrito de la infografía «{article.relatedImageTitle}».</p>
              {article.sections.map((sec) => (
                <div key={sec.heading} style={{ marginTop: "0.6rem" }}>
                  <h4 style={{ margin: "0 0 0.3rem" }}>{sec.heading}</h4>
                  {sec.paragraphs.map((p, i) => (
                    <p key={i} style={{ margin: "0 0 0.5rem" }}>
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </article>
          ))}
        </div>
      )}

      {course.videos.length > 0 && (
        <div className="option-grid" style={{ marginTop: course.images.length > 0 || course.articles.length > 0 ? "0.75rem" : 0 }}>
          {course.videos.map((video) => (
            <VideoCard key={video.url} video={video} />
          ))}
        </div>
      )}

      {course.exercises.length > 0 && (
        <div
          className="option-grid"
          style={{
            marginTop: course.images.length > 0 || course.articles.length > 0 || course.videos.length > 0 ? "0.75rem" : 0,
          }}
        >
          {course.exercises.map((exercise) => (
            <div key={exercise.title} className="option-card" style={{ cursor: "default" }}>
              <h3>{exercise.title}</h3>
              <p>{exercise.description}</p>
              <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {exercise.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {course.materials.length > 0 && (
        <ul
          aria-label={`Material didáctico de ${course.title}`}
          style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}
        >
          {course.materials.map((material) => (
            <li key={material.url} className="option-card" style={{ cursor: "default" }}>
              <div className="file-meta">
                <div className="file-name">
                  <a href={material.url} target="_blank" rel="noreferrer noopener">
                    {material.title}
                  </a>
                </div>
                <div className="file-sub">{material.format}</div>
              </div>
              <p style={{ margin: "0.4rem 0 0" }}>{material.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CursosActualizacionPage() {
  const [category, setCategory] = useState<CourseCategory | null>(null);

  if (category === null) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <h1>Cursos de actualización</h1>
          <p>Elige un modelo de IA para entrar al desarrollo de su curso: infografías, complemento escrito, ejercicios y videos.</p>
        </header>

        <div className="option-grid" role="tablist" aria-label="Categorías de cursos">
          {CATEGORIES.map((cat) => {
            const count = COURSES.filter((course) => course.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={false}
                className="option-card"
                onClick={() => setCategory(cat.id)}
              >
                <h3>{cat.label}</h3>
                <p>{count > 0 ? `${count} curso(s)` : "Sin cursos todavía"}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const activeLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const coursesInCategory = COURSES.filter((course) => course.category === category);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="btn btn-secondary" onClick={() => setCategory(null)} style={{ marginBottom: "0.75rem" }}>
          <span className="btn-label" data-label="← Cursos de actualización">
            ← Cursos de actualización
          </span>
        </button>
        <h1>{activeLabel}</h1>
        <p>Desarrollo del curso: infografías, complemento escrito, ejercicios y videos.</p>
      </header>

      {coursesInCategory.length === 0 ? (
        <section className="panel" aria-label={`Cursos de ${activeLabel}`}>
          <p className="field-hint">
            Todavía no hay cursos publicados en esta categoría. Aparecerán aquí en cuanto la coordinación los suba.
          </p>
        </section>
      ) : (
        coursesInCategory.map((course) => <CourseSection key={course.id} course={course} />)
      )}
    </div>
  );
}
