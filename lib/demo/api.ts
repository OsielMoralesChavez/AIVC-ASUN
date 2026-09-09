/**
 * API simulada de la versión de escaparate.
 *
 * En vez de tocar los ~90 sitios donde el front llama a la API, se sustituye `window.fetch` una
 * sola vez y se responde a todo lo que empiece por `/api/`. Es el único punto de contacto entre
 * el front y el backend, así que interceptarlo aquí deja el resto del código EXACTAMENTE igual
 * que en la aplicación real — que es justo lo que esta copia tiene que demostrar. Las llamadas a
 * cualquier otra URL (fuentes, imágenes, los propios archivos de Next) pasan sin tocarse.
 *
 * Todo lo que escribe —crear una asignatura, generar un curso, calificar— se rechaza con un
 * mensaje claro en vez de fingir que funcionó: una demo que promete lo que no hace es peor que
 * una que dice dónde termina.
 */
import {
  DEMO_BANCOS,
  DEMO_DASHBOARD,
  DEMO_DOCUMENTOS,
  DEMO_HERRAMIENTAS_INVESTIGACION,
  DEMO_INCIDENCIAS,
  DEMO_MATERIAS,
  DEMO_PERFILES_VOZ,
  DEMO_PRESENTACIONES,
  DEMO_USER,
} from "./dataset";

/** Mensaje único de todo lo que esta versión no puede hacer. */
export const SOLO_LECTURA =
  "Esta es la versión de escaparate: se publica como página estática, sin servidor ni base de " +
  "datos, así que no genera archivos ni guarda cambios. La aplicación completa hace todo esto " +
  "desde el escritorio.";

type Handler = (ctx: { url: URL; method: string; body: unknown; params: string[] }) => unknown;

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** Evento que escucha el aviso flotante (ver components/DemoBoot.tsx). */
export const EVENTO_BLOQUEADO = "demo:bloqueado";

function rechazo(status: number, code: string, message: string): Response {
  // Se avisa por evento además de devolver el error: varias pantallas descartan el mensaje del
  // servidor y muestran uno genérico suyo —o ninguno—, así que sin esto el visitante pulsaría
  // "Descargar" y no pasaría absolutamente nada, que es la peor respuesta posible.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_BLOQUEADO, { detail: message }));
  }
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const presentacionesDe = (materiaId: string | null) =>
  DEMO_PRESENTACIONES.filter((p) => !materiaId || p.materiaId === materiaId).map((p) => ({
    id: p.id,
    deckType: p.deckType,
    title: p.title,
    weekNumber: p.weekNumber,
    hasFile: p.hasFile,
    createdAt: p.createdAt,
  }));

/**
 * Tabla de rutas. La clave es el método más un patrón donde `*` casa con un segmento; el orden
 * importa solo para las rutas con comodín, que se prueban tras las exactas.
 */
const RUTAS: Record<string, Handler> = {
  // --- Sesión ---
  "GET /api/auth/me": () => ({ user: DEMO_USER }),
  "POST /api/auth/login": () => ({ user: DEMO_USER }),
  "POST /api/auth/logout": () => ({}),
  "POST /api/auth/profile": ({ body }) => ({ user: { ...DEMO_USER, ...(body as object) } }),
  "PUT /api/auth/profile": ({ body }) => ({ user: { ...DEMO_USER, ...(body as object) } }),

  // --- Dashboard y asignaturas ---
  "GET /api/dashboard/summary": () => DEMO_DASHBOARD,
  "GET /api/materias": () => ({ materias: DEMO_MATERIAS }),
  "GET /api/materias/*/counts": ({ params }) => {
    const materiaId = params[0];
    return {
      classes: DEMO_PRESENTACIONES.filter((p) => p.materiaId === materiaId).length,
      presentations: DEMO_PRESENTACIONES.filter((p) => p.materiaId === materiaId).length,
      questionBanks: DEMO_BANCOS.filter((b) => b.materiaId === materiaId).length,
      questions: DEMO_BANCOS.filter((b) => b.materiaId === materiaId).reduce((n, b) => n + b.questionCount, 0),
    };
  },
  "GET /api/materias/*/detail": ({ params }) => {
    const materiaId = params[0];
    const materia = DEMO_MATERIAS.find((m) => m.id === materiaId) ?? DEMO_MATERIAS[0];
    const clases = DEMO_PRESENTACIONES.filter((p) => p.materiaId === materia.id);
    const bancos = DEMO_BANCOS.filter((b) => b.materiaId === materia.id);
    return {
      materia: {
        id: materia.id,
        name: materia.name,
        category: materia.category,
        createdAt: materia.createdAt,
        updatedAt: materia.updatedAt,
      },
      counts: {
        classes: clases.length,
        presentations: clases.length,
        questionBanks: bancos.length,
        questions: bancos.reduce((n, b) => n + b.questionCount, 0),
      },
      classes: clases.map((c) => ({
        id: c.id,
        deckType: c.deckType,
        title: c.title,
        weekNumber: c.weekNumber,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      questionBanks: bancos,
      sourceDocuments: DEMO_DOCUMENTOS,
      missingData: {},
    };
  },
  "GET /api/materias/*/course-job": () => ({ job: null }),
  "GET /api/materias/*": ({ params }) => DEMO_MATERIAS.find((m) => m.id === params[0]) ?? DEMO_MATERIAS[0],

  // --- Presentaciones y bancos de preguntas ---
  "GET /api/presentations": ({ url }) => ({ presentations: presentacionesDe(url.searchParams.get("materiaId")) }),
  "GET /api/presentations/*": ({ params }) => {
    const p = DEMO_PRESENTACIONES.find((x) => x.id === params[0]) ?? DEMO_PRESENTACIONES[0];
    return { presentation: p, plan: null, content: null };
  },
  "GET /api/minicasos": ({ url }) => {
    const materiaId = url.searchParams.get("materiaId");
    return { banks: DEMO_BANCOS.filter((b) => !materiaId || b.materiaId === materiaId) };
  },
  "GET /api/minicasos/*": ({ params }) => ({ bank: DEMO_BANCOS.find((b) => b.id === params[0]) ?? DEMO_BANCOS[0] }),
  "GET /api/documents": () => ({ documents: DEMO_DOCUMENTOS }),
  "GET /api/jobs/*": () => ({ jobId: "demo", status: "done", progress: 100, message: "Completado." }),

  // --- Incidencias ---
  "GET /api/incidents": () => ({ incidents: DEMO_INCIDENCIAS }),
  "GET /api/incidents/summary": () => ({
    totals: {
      total: DEMO_INCIDENCIAS.length,
      open: DEMO_INCIDENCIAS.filter((i) => i.status === "abierta" || i.status === "en_progreso").length,
      resolved: DEMO_INCIDENCIAS.filter((i) => i.status === "resuelta" || i.status === "cerrada").length,
      criticalOpen: DEMO_INCIDENCIAS.filter((i) => i.severity === "critica" && i.status !== "cerrada").length,
    },
    byCategory: (["bug", "soporte", "contenido", "cuenta", "otro"] as const).map((category) => ({
      category,
      count: DEMO_INCIDENCIAS.filter((i) => i.category === category).length,
    })),
    byStatus: (["abierta", "en_progreso", "resuelta", "cerrada"] as const).map((status) => ({
      status,
      count: DEMO_INCIDENCIAS.filter((i) => i.status === status).length,
    })),
    recent: DEMO_INCIDENCIAS.slice(0, 5),
  }),

  // --- Entrenamiento de voz ---
  "GET /api/training/profiles": () => ({ profiles: DEMO_PERFILES_VOZ }),
  "GET /api/training/profiles/*": ({ params }) => ({
    profile: DEMO_PERFILES_VOZ.find((p) => p.id === params[0]) ?? DEMO_PERFILES_VOZ[0],
    entries: [],
  }),
  "GET /api/training/profiles/*/data": () => ({ entries: [] }),

  // --- Investigación ---
  "GET /api/research/tools": () => ({
    tools: DEMO_HERRAMIENTAS_INVESTIGACION,
    aiStatus: { configured: false, provider: "demo" },
  }),

  // --- Configuración ---
  "GET /api/settings": () => ({
    aiProvider: "gemini",
    hasAnthropicApiKey: false,
    hasGeminiApiKey: false,
    hasOpenaiApiKey: false,
    hasDeepseekApiKey: false,
    hasQwenApiKey: false,
    providerChain: [],
    attemptLadder: [],
    localModelFallback: true,
    geminiModel: "gemini-3.6-flash",
    geminiFallbackModels: ["gemini-2.5-flash", "gemini-flash-latest"],
    imageGenerationEnabled: false,
  }),
  "GET /api/settings/configuration": () => ({
    voiceProfile: {
      id: DEMO_PERFILES_VOZ[0].id,
      name: DEMO_PERFILES_VOZ[0].name,
      toneDescription: DEMO_PERFILES_VOZ[0].toneDescription,
      styleGuidelineCount: DEMO_PERFILES_VOZ[0].styleGuidelines.length,
    },
    grading: {
      teacherTitle: "Dr.",
      teacherName: DEMO_USER.displayName,
      defaultLevelId: "licenciatura",
      defaultSeverity: 3,
      defaultWorkType: "individual",
      defaultFilesPerSubmission: 1,
      geminiModel: "gemini-3.6-flash",
      geminiThrottleMs: 5000,
      activeVoiceProfileId: DEMO_PERFILES_VOZ[0].id,
      gradeScale: { min: 0, max: 10, passing: 6 },
      academicLevels: [
        { id: "licenciatura", label: "Licenciatura" },
        { id: "maestria", label: "Maestría" },
      ],
      feedbackLanguage: "es-MX",
    },
    aiStatus: {
      configured: false,
      provider: "demo",
      model: "Sin conexión (versión de escaparate)",
      simulated: true,
      presentationsSimulated: true,
      presentationWarning: SOLO_LECTURA,
    },
  }),
  "GET /api/ai/local-model": () => ({ downloaded: false }),
  "GET /api/setup": () => ({ completed: true }),

  // --- Calificador y Catador: listas vacías, para que se vean sus estados iniciales ---
  "GET /api/calificador/subjects": () => ({ subjects: [] }),
  "GET /api/calificador/sessions": () => ({ sessions: [] }),
  "GET /api/calificador/ajustes": () => ({ settings: {} }),
  "GET /api/calificador/buscar": () => ({ results: [] }),
  "GET /api/calificador/voice-profile": () => ({ profile: null }),
  "GET /api/catador/reviews": () => ({ reviews: [] }),
  "GET /api/catador/rubrics": () => ({ rubrics: [] }),
  "GET /api/catador/settings": () => ({ settings: {} }),
};

/**
 * Casa una ruta concreta con su patrón y extrae los segmentos comodín. Por ejemplo,
 * "/api/materias/mat-1/detail" casa con el patrón de detalle y devuelve ["mat-1"].
 */
function resolver(method: string, path: string): { handler: Handler; params: string[] } | null {
  const exacta = RUTAS[`${method} ${path}`];
  if (exacta) return { handler: exacta, params: [] };

  const partes = path.split("/");
  for (const clave of Object.keys(RUTAS)) {
    const [m, patron] = clave.split(" ");
    if (m !== method || !patron.includes("*")) continue;
    const trozos = patron.split("/");
    if (trozos.length !== partes.length) continue;
    const params: string[] = [];
    const casa = trozos.every((t, i) => {
      if (t === "*") {
        params.push(decodeURIComponent(partes[i]));
        return true;
      }
      return t === partes[i];
    });
    if (casa) return { handler: RUTAS[clave], params };
  }
  return null;
}

function responder(input: string, init?: RequestInit): Response {
  const url = new URL(input, window.location.origin);
  const method = (init?.method ?? "GET").toUpperCase();

  let body: unknown = null;
  if (typeof init?.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  const ruta = resolver(method, url.pathname);
  if (ruta) return ok(ruta.handler({ url, method, body, params: ruta.params }));

  // Descargas: no hay archivo que entregar, y devolver un .pptx corrupto sería peor que decirlo.
  if (url.pathname.includes("/download") || url.pathname.includes("/export")) {
    return rechazo(501, "DEMO_SIN_ARCHIVOS", SOLO_LECTURA);
  }

  // Cualquier escritura no contemplada.
  if (method !== "GET") return rechazo(501, "DEMO_SOLO_LECTURA", SOLO_LECTURA);

  // Una lectura que no cubrimos: se devuelve vacío para que la pantalla muestre su estado inicial
  // en vez de un error rojo.
  return ok({});
}

let instalada = false;

/** Sustituye `window.fetch` una sola vez. Idempotente: se puede llamar desde varios sitios. */
export function installDemoApi(): void {
  if (instalada || typeof window === "undefined") return;
  instalada = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const esApi = href.startsWith("/api/") || href.includes(`${window.location.origin}/api/`);
    if (!esApi) return originalFetch(input as RequestInfo, init);

    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    // Un respiro mínimo para que los estados de carga de la interfaz se vean, en vez de que todo
    // aparezca ya resuelto en el primer fotograma.
    await new Promise((r) => setTimeout(r, 120));
    return responder(href.replace(window.location.origin, ""), { ...init, method });
  };
}
