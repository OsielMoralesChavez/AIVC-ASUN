import type { PrimeraClaseContent } from "../types/unir";

/**
 * Publicaciones del foro «Pregúntale al profesor».
 *
 * Se separan del componente porque son texto que el docente PEGA tal cual en el aula virtual:
 * tienen que poder revisarse y probarse como contenido, no como detalle de una pantalla.
 *
 * Registro: el destinatario son estudiantes de maestría y quien firma es profesorado con
 * doctorado. El saludo anterior («¡Bienvenidas y bienvenidos!», «¡Hola de nuevo!», «¡Les deseo un
 * excelente curso!») era de un registro que no corresponde a ese contexto, y además desaprovechaba
 * la formación, la experiencia y la especialidad del docente, que ya se capturan en la primera
 * clase y no se usaban en ningún sitio.
 */

export interface ForoPost {
  /** Asunto del hilo. Un foro sin asunto útil es un foro que nadie encuentra después. */
  subject: string;
  body: string;
}

/**
 * Los generadores dejan marcadores `[PENDIENTE: …]` cuando no hay evidencia. Un marcador puede
 * quedarse en un borrador de presentación, pero no en un texto que se publica ante el grupo: aquí
 * la línea se omite entera en vez de exponerlo.
 */
function usable(value: string | undefined | null): string | null {
  if (!value) return null;
  const limpio = value.trim();
  if (limpio.length === 0) return null;
  if (limpio.startsWith("[PENDIENTE")) return null;
  return limpio;
}

/** Añade el punto final si falta, para que las líneas enumeradas no queden a medias. */
function oracion(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/** «Dra. Ana Pérez» cuando hay tratamiento; «Ana Pérez» cuando no. */
export function formalName(content: Pick<PrimeraClaseContent, "teacherName" | "teacherTitle">): string {
  const nombre = usable(content.teacherName) ?? "[Nombre del docente]";
  const titulo = usable(content.teacherTitle);
  return titulo ? `${titulo} ${nombre}` : nombre;
}

/**
 * Publicación de apertura del foro.
 *
 * Estructura, en este orden: presentación de quien acompaña el curso y sus credenciales, propósito
 * del canal y su límite, reglas de uso con el compromiso de respuesta, y el objetivo de la primera
 * sesión. Cada bloque se omite si no hay dato real que lo sostenga.
 */
export function buildWelcomePost(content: PrimeraClaseContent): ForoPost {
  const curso = usable(content.courseName);
  const firma = formalName(content);

  // Cada credencial va etiquetada. Sin etiqueta, un valor corto («Dr.», «IA») queda como un
  // fragmento suelto que no dice nada; con ella, incluso un dato breve se lee como lo que es.
  const credenciales: string[] = [];
  for (const [etiqueta, valor] of [
    ["Formación", usable(content.teacherFormation)],
    ["Experiencia", usable(content.teacherExperience)],
    ["Línea de especialización", usable(content.teacherSpecialty)],
  ] as [string, string | null][]) {
    if (valor) credenciales.push(`${etiqueta}: ${oracion(valor)}`);
  }

  const bloques: string[] = [];

  bloques.push("Estimadas y estimados estudiantes:");

  bloques.push(
    curso
      ? `Les doy la bienvenida a ${curso}, asignatura que tendré el gusto de acompañar durante este periodo académico.`
      : "Les doy la bienvenida a esta asignatura, que tendré el gusto de acompañar durante este periodo académico."
  );

  if (credenciales.length > 0) {
    // El nombre encabeza el bloque sin punto: es un rótulo, no una oración. Las credenciales ya
    // vienen puntuadas desde arriba.
    bloques.push(["Quien les acompaña", firma, ...credenciales].join("\n"));
  }

  const proposito = usable(content.forumDescription);
  bloques.push(
    [
      "Propósito de este espacio",
      proposito
        ? oracion(proposito)
        : "Este foro es el canal oficial de consulta académica de la asignatura.",
      "Está destinado a consultas sobre contenidos, actividades y criterios de evaluación. " +
        "Los trámites administrativos y las incidencias de plataforma corresponden a la coordinación del programa.",
    ].join("\n")
  );

  bloques.push(
    [
      "Cómo aprovecharlo",
      "1. Abran un hilo por consulta y titúlenlo con el tema al que se refiere.",
      "2. Expongan el contexto: la sesión o actividad implicada y el razonamiento que ya siguieron.",
      "3. Atenderé sus participaciones en un plazo máximo de 48 horas hábiles.",
      "4. Las respuestas quedan visibles para todo el grupo: una consulta bien planteada beneficia a quienes comparten la misma duda.",
    ].join("\n")
  );

  const objetivo = usable(content.learningObjective?.statement);
  if (objetivo) {
    bloques.push(["Punto de partida", oracion(objetivo)].join("\n"));
  }

  bloques.push("Quedo a su disposición para acompañarles a lo largo del curso.");
  bloques.push(`Atentamente,\n${firma}`);

  return {
    subject: curso
      ? `Presentación del curso y del foro de consultas · ${curso}`
      : "Presentación del curso y del foro de consultas",
    body: bloques.join("\n\n"),
  };
}

export interface WeeklyPostInput {
  weekNumber: number;
  sessionTitle: string;
  /** Objetivo de aprendizaje ya generado para esa sesión. */
  objective: string;
  /** Tema de la sesión anterior, si lo hay, para orientar la preparación. */
  previousTopic?: string;
  teacherName: string;
  teacherTitle?: string;
}

/**
 * Publicación de seguimiento semanal.
 *
 * No repite la bienvenida: sitúa la sesión, enuncia lo que el estudiante podrá hacer al terminarla
 * y pide una consulta concreta. Ese último punto es deliberado — un foro se queda vacío cuando la
 * invitación a participar es genérica.
 */
export function buildWeeklyPost(input: WeeklyPostInput): ForoPost {
  const firma = formalName({ teacherName: input.teacherName, teacherTitle: input.teacherTitle ?? "" });
  const tema = usable(input.sessionTitle) ?? `Semana ${input.weekNumber}`;
  const objetivo = usable(input.objective);
  const anterior = usable(input.previousTopic);

  const bloques: string[] = ["Estimadas y estimados estudiantes:"];

  bloques.push(`Durante la semana ${input.weekNumber} abordaremos ${tema}.`);

  if (objetivo) {
    bloques.push(["Resultado esperado de la sesión", oracion(objetivo)].join("\n"));
  }

  bloques.push(
    anterior
      ? `Para aprovechar la sesión, les recomiendo repasar previamente ${anterior} y revisar el material de esta semana antes del encuentro en directo.`
      : "Para aprovechar la sesión, les recomiendo revisar el material de esta semana antes del encuentro en directo."
  );

  bloques.push(
    "Si al revisarlo encuentran un punto que no termina de quedar claro, abran un hilo en este foro " +
      `indicando la semana y el aspecto concreto. Es preferible plantearlo antes de la sesión: así podemos ` +
      "trabajarlo en directo con el grupo."
  );

  bloques.push(`Atentamente,\n${firma}`);

  return {
    subject: `Semana ${input.weekNumber} · ${tema}`,
    body: bloques.join("\n\n"),
  };
}
