/**
 * Datos de muestra de la versión de escaparate.
 *
 * Esta copia del proyecto no tiene backend: se publica como página estática, así que no hay
 * SQLite, ni rutas de API, ni generación real de archivos. Todo lo que se ve aquí sale de este
 * archivo, y está escrito para que cada pantalla se vea como se ve con un curso real cargado —
 * no con las listas vacías que daría un servidor que no responde.
 *
 * Ningún dato es de una persona real: el docente, los correos y las asignaturas son inventados.
 */

const HOY = new Date("2026-09-09T12:00:00.000Z");

/** Fecha ISO de hace `dias` días, para que el histórico no envejezca en pantalla. */
function hace(dias: number): string {
  return new Date(HOY.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export const DEMO_USER = {
  id: "demo-user",
  email: "docente@unir.net",
  displayName: "Docente de demostración",
  avatarDataUrl: null,
  mustChangePassword: false,
  themeMode: "system" as const,
  colorPalette: "default" as const,
  createdAt: hace(120),
  updatedAt: hace(2),
};

export const DEMO_MATERIAS: {
  id: string;
  name: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  presentationCount: number;
  minicasoBankCount: number;
}[] = [
  {
    id: "mat-finanzas",
    name: "Finanzas en un Entorno Digital",
    category: null,
    createdAt: hace(40),
    updatedAt: hace(1),
    presentationCount: 8,
    minicasoBankCount: 1,
  },
  {
    id: "mat-direccion",
    name: "Dirección Estratégica",
    category: null,
    createdAt: hace(28),
    updatedAt: hace(6),
    presentationCount: 5,
    minicasoBankCount: 1,
  },
  {
    id: "mat-costos",
    name: "Contabilidad de Costos",
    category: null,
    createdAt: hace(15),
    updatedAt: hace(9),
    presentationCount: 3,
    minicasoBankCount: 0,
  },
  // "Curso sello" es una vista aparte sobre la misma tabla: filtra por esta categoría exacta
  // (ver hooks/useMaterias.ts), así que sus asignaturas no aparecen en la lista general.
  {
    id: "sello-a",
    name: "Asignatura sello A — Pensamiento crítico",
    category: "curso-sello",
    createdAt: hace(50),
    updatedAt: hace(7),
    presentationCount: 0,
    minicasoBankCount: 0,
  },
  {
    id: "sello-b",
    name: "Asignatura sello B — Comunicación profesional",
    category: "curso-sello",
    createdAt: hace(50),
    updatedAt: hace(18),
    presentationCount: 0,
    minicasoBankCount: 0,
  },
];

/** Las ocho semanas del curso de Finanzas, con la misma mezcla de tipos que produce el flujo real. */
const SEMANAS_FINANZAS: { semana: number; titulo: string; tipo: string }[] = [
  { semana: 1, titulo: "Introducción a la dirección financiera", tipo: "primera-clase" },
  { semana: 2, titulo: "Introducción a los estados financieros", tipo: "actividad" },
  { semana: 3, titulo: "Gestión de activos y pasivos corrientes", tipo: "normal" },
  { semana: 4, titulo: "Coste y estructura de capital", tipo: "solucion" },
  { semana: 5, titulo: "Gestión del riesgo financiero y derivados", tipo: "actividad" },
  { semana: 6, titulo: "Finanzas internacionales y economía", tipo: "normal" },
  { semana: 7, titulo: "Implicaciones fintech en el sector financiero", tipo: "solucion" },
  { semana: 8, titulo: "Sesión de repaso", tipo: "repaso" },
];

const SEMANAS_DIRECCION: { semana: number; titulo: string; tipo: string }[] = [
  { semana: 1, titulo: "El proceso de dirección estratégica", tipo: "primera-clase" },
  { semana: 2, titulo: "Análisis del entorno competitivo", tipo: "normal" },
  { semana: 3, titulo: "Recursos y capacidades de la empresa", tipo: "actividad" },
  { semana: 4, titulo: "Estrategias de crecimiento", tipo: "normal" },
  { semana: 5, titulo: "Sesión de repaso", tipo: "repaso" },
];

const SEMANAS_COSTOS: { semana: number; titulo: string; tipo: string }[] = [
  { semana: 1, titulo: "Clasificación de los costos", tipo: "primera-clase" },
  { semana: 2, titulo: "Costeo por órdenes de producción", tipo: "normal" },
  { semana: 3, titulo: "Costeo basado en actividades", tipo: "actividad" },
];

function presentacionesDe(materiaId: string, semanas: typeof SEMANAS_FINANZAS, diasBase: number) {
  return semanas.map((s) => ({
    id: `pres-${materiaId}-${s.semana}`,
    materiaId,
    deckType: s.tipo,
    title: s.titulo,
    weekNumber: s.semana,
    hasFile: true,
    createdAt: hace(diasBase - s.semana),
    updatedAt: hace(diasBase - s.semana),
  }));
}

export const DEMO_PRESENTACIONES = [
  ...presentacionesDe("mat-finanzas", SEMANAS_FINANZAS, 30),
  ...presentacionesDe("mat-direccion", SEMANAS_DIRECCION, 20),
  ...presentacionesDe("mat-costos", SEMANAS_COSTOS, 12),
];

export const DEMO_DOCUMENTOS = [
  { id: "doc-1", fileName: "Tema 1. Dirección financiera.pdf", sourceKind: "pdf", role: "ideas-clave", pageCount: 24, createdAt: hace(40) },
  { id: "doc-2", fileName: "Tema 2. Estados financieros.pdf", sourceKind: "pdf", role: "ideas-clave", pageCount: 31, createdAt: hace(40) },
  { id: "doc-3", fileName: "Programación semanal.pdf", sourceKind: "pdf", role: "programacion-semanal", pageCount: 4, createdAt: hace(40) },
  { id: "doc-4", fileName: "Qué vamos a practicar.xlsx", sourceKind: "xlsx", role: "excel-practica", pageCount: 1, createdAt: hace(40) },
];

const MINICASOS = [
  {
    id: "mc-1",
    stem:
      "Una distribuidora mexicana cerró el trimestre con una razón circulante de 0.8 y un plazo medio de cobro de 74 días. " +
      "El director comercial propone ampliar el crédito a clientes para sostener las ventas.",
    question: "¿Qué efecto tendría la propuesta sobre la liquidez de la empresa?",
    options: [
      { key: "a", text: "La deterioraría: alarga la conversión de ventas en efectivo con una razón circulante ya por debajo de 1." },
      { key: "b", text: "La mejoraría, porque un mayor volumen de ventas aumenta el activo circulante." },
      { key: "c", text: "No la afectaría, ya que el crédito a clientes es una cuenta de resultados." },
      { key: "d", text: "La mejoraría solo si el plazo de pago a proveedores se mantiene constante." },
    ],
    correctKey: "a",
    bloomLevel: 4,
    feedback: "El problema no es el volumen sino el ciclo de conversión: con 74 días de cobro, más ventas a crédito amplían la brecha.",
    sourceReference: "Tema 3 · Gestión de activos y pasivos corrientes",
  },
  {
    id: "mc-2",
    stem:
      "Una empresa colombiana financia el 70 % de sus activos con deuda a tasa variable. El banco central anuncia un ciclo " +
      "de alzas de tasas para los próximos doce meses.",
    question: "¿Cuál es la exposición principal que debe cubrir la dirección financiera?",
    options: [
      { key: "a", text: "Riesgo cambiario, por la denominación de la deuda." },
      { key: "b", text: "Riesgo de tasa de interés, que encarece el servicio de una deuda ya elevada." },
      { key: "c", text: "Riesgo operativo, por la caída esperada de la demanda." },
      { key: "d", text: "Riesgo de liquidez, por el vencimiento de las obligaciones corrientes." },
    ],
    correctKey: "b",
    bloomLevel: 4,
    feedback: "Con 70 % de apalancamiento a tasa variable, cada punto de alza pega directo al resultado financiero.",
    sourceReference: "Tema 5 · Gestión del riesgo financiero y derivados",
  },
  {
    id: "mc-3",
    stem:
      "Una fintech peruana evalúa dos proyectos excluyentes: A con VAN de 1.2 millones y TIR de 18 %, B con VAN de 1.5 " +
      "millones y TIR de 15 %. El costo de capital de la empresa es 12 %.",
    question: "¿Qué proyecto debería elegir y por qué?",
    options: [
      { key: "a", text: "A, porque su TIR es mayor y supera el costo de capital por más margen." },
      { key: "b", text: "B, porque entre proyectos excluyentes manda el VAN: crea más valor absoluto." },
      { key: "c", text: "Ninguno, porque ambas TIR están por debajo del umbral de riesgo del sector." },
      { key: "d", text: "Ambos, repartiendo el presupuesto en proporción a su TIR." },
    ],
    correctKey: "b",
    bloomLevel: 5,
    feedback: "La TIR ordena mal proyectos excluyentes de distinta escala; el criterio correcto es el VAN.",
    sourceReference: "Tema 4 · Coste y estructura de capital",
  },
];

export const DEMO_BANCOS = [
  {
    id: "banco-finanzas",
    materiaId: "mat-finanzas",
    subjectName: "Finanzas en un Entorno Digital",
    academicLevel: "licenciatura",
    questionCount: 30,
    createdAt: hace(4),
    items: MINICASOS,
    sourcePresentationIds: DEMO_PRESENTACIONES.filter((p) => p.materiaId === "mat-finanzas").map((p) => p.id),
    warnings: [],
    assumptions: [],
  },
  {
    id: "banco-direccion",
    materiaId: "mat-direccion",
    subjectName: "Dirección Estratégica",
    academicLevel: "maestria",
    questionCount: 24,
    createdAt: hace(11),
    items: MINICASOS.slice(0, 2),
    sourcePresentationIds: DEMO_PRESENTACIONES.filter((p) => p.materiaId === "mat-direccion").map((p) => p.id),
    warnings: [],
    assumptions: [],
  },
];

export const DEMO_INCIDENCIAS = [
  {
    id: "inc-1",
    title: "La descarga del .pptx se interrumpe en archivos grandes",
    description: "Al descargar la presentación de la semana 4 el archivo llega incompleto cuando supera los 20 MB.",
    category: "bug" as const,
    severity: "alta" as const,
    status: "en_progreso" as const,
    reportedByEmail: "docente@unir.net",
    reportedByName: "Docente de demostración",
    createdAt: hace(3),
    updatedAt: hace(1),
  },
  {
    id: "inc-2",
    title: "Solicitud de acceso para docente invitado",
    description: "Se requiere una cuenta temporal para el profesor invitado del módulo de fintech.",
    category: "cuenta" as const,
    severity: "media" as const,
    status: "abierta" as const,
    reportedByEmail: "coordinacion@unir.net",
    reportedByName: "Coordinación académica",
    createdAt: hace(6),
    updatedAt: hace(6),
  },
  {
    id: "inc-3",
    title: "Corregir la bibliografía del tema 6",
    description: "Dos referencias del tema de finanzas internacionales apuntan a ediciones que ya no están vigentes.",
    category: "contenido" as const,
    severity: "baja" as const,
    status: "resuelta" as const,
    reportedByEmail: "docente@unir.net",
    reportedByName: "Docente de demostración",
    createdAt: hace(14),
    updatedAt: hace(8),
  },
  {
    id: "inc-4",
    title: "Caída del servicio de generación durante la noche",
    description: "Entre las 02:00 y las 04:00 ninguna generación llegó a completarse.",
    category: "soporte" as const,
    severity: "critica" as const,
    status: "cerrada" as const,
    reportedByEmail: "soporte@unir.net",
    reportedByName: "Mesa de servicio",
    createdAt: hace(21),
    updatedAt: hace(19),
  },
];

export const DEMO_PERFILES_VOZ = [
  {
    id: "voz-1",
    name: "Tono propio — Finanzas",
    toneDescription:
      "Cercano y directo, con ejemplos del contexto latinoamericano. Prefiere frases cortas y una cifra concreta " +
      "antes que una generalidad.",
    styleGuidelines: [
      "Abrir cada concepto con una pregunta antes de definirlo.",
      "Usar siempre un caso de una empresa de la región.",
      "Evitar anglicismos cuando exista un término en español.",
    ],
    entryCount: 12,
    createdAt: hace(35),
    updatedAt: hace(5),
  },
];

/** Solo las de la lista general: "Curso sello" es una vista aparte y sus asignaturas no salen ahí. */
const MATERIAS_PRINCIPALES = DEMO_MATERIAS.filter((m) => m.category === null);

export const DEMO_DASHBOARD = {
  totals: {
    subjects: MATERIAS_PRINCIPALES.length,
    generatedClasses: DEMO_PRESENTACIONES.length,
    presentations: DEMO_PRESENTACIONES.length,
    questionBanks: DEMO_BANCOS.length,
  },
  classesBySubject: MATERIAS_PRINCIPALES.map((m) => ({
    subjectId: m.id,
    subjectName: m.name,
    generatedClasses: DEMO_PRESENTACIONES.filter((p) => p.materiaId === m.id).length,
  })),
};

export const DEMO_HERRAMIENTAS_INVESTIGACION = [
  { id: "t-1", name: "Google Académico", category: "Buscadores académicos", description: "Literatura revisada por pares y conteo de citas.", url: "https://scholar.google.com" },
  { id: "t-2", name: "Dialnet", category: "Buscadores académicos", description: "Producción científica hispana, con muchos textos completos.", url: "https://dialnet.unirioja.es" },
  { id: "t-3", name: "Connected Papers", category: "Mapas de literatura", description: "Grafo de artículos relacionados a partir de uno de partida.", url: "https://www.connectedpapers.com" },
  { id: "t-4", name: "Zotero", category: "Gestores de referencias", description: "Captura, organiza y cita en APA 7 desde el navegador.", url: "https://www.zotero.org" },
];
