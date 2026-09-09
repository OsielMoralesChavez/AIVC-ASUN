"use client";

import { useState } from "react";
import { Banner } from "../components/Banner";
import {
  IconBookHelp,
  IconDashboard,
  IconPresentation,
  IconQuiz,
  IconSeal,
  IconSettings,
  IconSparkleSearch,
  IconTraining,
} from "../components/icons";
import type { ComponentType, SVGProps } from "react";

/**
 * Manual de usuario. Es documentación, no una pantalla de datos: todo el contenido es estático y
 * describe la aplicación tal como está construida hoy (secciones del sidebar, pasos reales de
 * cada asistente, nombres exactos de los botones). Si un flujo cambia, este archivo cambia con
 * él — por eso vive en el repositorio y no en un PDF aparte que se quedaría desactualizado.
 *
 * No se documenta ninguna función que no exista: las que están planeadas se listan al final,
 * marcadas como tales, en vez de describirse como si ya funcionaran.
 */

type SectionId =
  | "empezar"
  | "dashboard"
  | "entrenamiento"
  | "materias"
  | "modos"
  | "banco-foro"
  | "curso-sello"
  | "calificador"
  | "investigacion"
  | "configuracion"
  | "pendientes";

const SECTIONS: { id: SectionId; label: string; icon?: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: "empezar", label: "Por dónde empezar", icon: IconBookHelp },
  { id: "dashboard", label: "Dashboard", icon: IconDashboard },
  { id: "entrenamiento", label: "Entrenar tu voz", icon: IconTraining },
  { id: "materias", label: "Crear una materia", icon: IconPresentation },
  { id: "modos", label: "Todo el curso o una clase a la vez" },
  { id: "banco-foro", label: "Banco de preguntas y Foro" },
  { id: "curso-sello", label: "Curso sello", icon: IconSeal },
  { id: "calificador", label: "Calificador", icon: IconQuiz },
  { id: "investigacion", label: "Investigación asistida por IA", icon: IconSparkleSearch },
  { id: "configuracion", label: "Configuración", icon: IconSettings },
  { id: "pendientes", label: "Lo que todavía no existe" },
];

/**
 * Captura real de la aplicación. Las imágenes viven en `public/images/manual/` y se generaron
 * desde la app en funcionamiento, no son maquetas: si una pantalla cambia, hay que volver a
 * capturarla. `loading="lazy"` porque el manual es largo y casi ninguna se ve al abrirlo.
 */
function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="manual-shot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/manual/${src}.png`} alt={alt} loading="lazy" decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** Paso numerado de un procedimiento. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="manual-step">
      <span className="manual-step-number" aria-hidden>
        {String(n).padStart(2, "0")}
      </span>
      <div className="manual-step-body">
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </li>
  );
}

export function ManualPage({
  onOpenSection,
}: {
  /** Enlaces «llévame ahí» a la sección real que se está explicando. */
  onOpenSection?: (section: "dashboard" | "entrenamiento" | "materias" | "curso-sello" | "calificador" | "configuracion" | "investigacion") => void;
}) {
  const [active, setActive] = useState<SectionId>("empezar");

  const go = (id: SectionId) => {
    setActive(id);
    document.getElementById(`manual-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Botón «Ir a …» que solo aparece si el contenedor pasó el callback de navegación. */
  const GoTo = ({ to, label }: { to: Parameters<NonNullable<typeof onOpenSection>>[0]; label: string }) =>
    onOpenSection ? (
      <div className="actions-row">
        <div />
        <button type="button" className="btn btn-secondary" onClick={() => onOpenSection(to)}>
          <span className="btn-label" data-label={label}>
            {label}
          </span>
        </button>
      </div>
    ) : null;

  return (
    <div className="app-shell-wide manual">
      <header className="app-header">
        <h1>Manual de usuario</h1>
        <p>
          Cómo funciona el Generador Académico UNIR: qué hace cada sección, en qué orden conviene
          usarlas y qué decisiones tomas en el camino.
        </p>
      </header>

      <nav className="manual-toc" aria-label="Contenido del manual">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="manual-toc-item"
            data-active={active === s.id}
            onClick={() => go(s.id)}
          >
            {s.icon ? <s.icon aria-hidden /> : <span className="manual-toc-dot" aria-hidden />}
            <span>{s.label}</span>
          </button>
        ))}
      </nav>

      {/* ---------------------------------------------------------------- Por dónde empezar */}
      <section className="panel" id="manual-empezar" aria-labelledby="manual-empezar-h">
        <h2 id="manual-empezar-h">Por dónde empezar</h2>
        <p>
          La aplicación convierte los documentos que ya tienes —los PDF de cada tema, la
          programación semanal de la asignatura, el Excel de prácticas— en las presentaciones de
          todas las clases del curso, su banco de preguntas y los saludos del foro. Además califica
          los trabajos de tus alumnos contra una rúbrica y te ayuda a encontrar dónde investigar.
        </p>
        <p className="field-hint">
          El orden de abajo no es obligatorio, pero cada paso hace mejor al siguiente: si entrenas
          tu voz antes de generar clases, esas clases ya salen escritas con tu estilo.
        </p>
        <ol className="manual-steps">
          <Step n={1} title="Entrena tu voz">
            Una sola vez. La aplicación aprende cómo escribes para que las presentaciones y la
            retroalimentación del Calificador no suenen genéricas.
          </Step>
          <Step n={2} title="Crea la materia">
            Todo cuelga de una materia: sus clases, su banco de preguntas y su foro. Sin materia no
            se puede generar nada.
          </Step>
          <Step n={3} title="Genera las clases">
            Todo el curso de una vez a partir de la programación semanal, o una clase a la vez si
            prefieres decidir cada sesión por separado.
          </Step>
          <Step n={4} title="Genera el banco de preguntas y el foro">
            Ambos se construyen a partir de las clases ya generadas, así que van después.
          </Step>
          <Step n={5} title="Califica y consulta">
            El Calificador y la Investigación asistida son independientes: puedes usarlos en
            cualquier momento, sin haber generado ninguna clase.
          </Step>
        </ol>
        <Banner type="info" title="Dónde está cada cosa">
          En la barra lateral izquierda: <strong>Dashboard</strong>, <strong>Entrenamiento</strong>,{" "}
          <strong>Materias</strong>, <strong>Curso sello</strong> y <strong>Calificador</strong>. En la
          barra superior: <strong>Investigación asistida por IA</strong> y este manual. La{" "}
          <strong>Configuración</strong> está en el menú de tu cuenta, arriba a la derecha.
        </Banner>
        <Shot
          src="dashboard"
          alt="Pantalla de inicio de la aplicación: barra lateral con las cinco secciones, barra superior con las herramientas y el Dashboard con sus tarjetas y su gráfica."
          caption="La pantalla completa: barra lateral a la izquierda, herramientas y cuenta en la barra superior, y el contenido en el centro. Solo el centro se desplaza."
        />
      </section>

      {/* ------------------------------------------------------------------------ Dashboard */}
      <section className="panel" id="manual-dashboard" aria-labelledby="manual-dashboard-h">
        <h2 id="manual-dashboard-h">Dashboard — para qué sirve</h2>
        <p>
          Es la pantalla de inicio y responde una sola pregunta:{" "}
          <strong>¿cuánto llevas producido y dónde está?</strong> No se genera nada desde aquí; se
          consulta y se administra lo que ya existe.
        </p>

        <h3>Las cuatro tarjetas de arriba</h3>
        <ul className="data-summary">
          <li>
            <span className="label">Materias activas</span>
            <span>Cuántas materias tienes creadas ahora mismo.</span>
          </li>
          <li>
            <span className="label">Clases generadas</span>
            <span>El total de clases de todas tus materias.</span>
          </li>
          <li>
            <span className="label">Bancos de preguntas</span>
            <span>Cuántos bancos has generado.</span>
          </li>
          <li>
            <span className="label">Materia con más clases</span>
            <span>Cuál va más avanzada, y con cuántas clases.</span>
          </li>
        </ul>
        <p className="field-hint">
          Una clase cuenta <strong>una sola vez</strong> aunque tenga presentación, banco de
          preguntas y saludo de foro: los números cuentan clases, no archivos. Todos salen del
          servidor cada vez que entras, no de una copia guardada que pudiera quedarse vieja.
        </p>

        <h3>La gráfica</h3>
        <p>
          Una única gráfica: <strong>clases generadas por materia</strong>, una barra por materia.
          Las materias sin clases aparecen con cero en lugar de desaparecer, para que veas de un
          vistazo cuáles tienes empezadas y abandonadas.
        </p>

        <h3>Histórico de materias — las tres acciones</h3>
        <Shot
          src="dashboard-historico"
          alt="Parte inferior del Dashboard: la tarjeta «Histórico de materias» con una fila por materia y los botones Visualizar, Editar y Eliminar, y a la derecha la lista de «Actividad reciente»."
          caption="Cada materia del histórico trae sus tres acciones. A la derecha, las últimas clases generadas."
        />
        <ol className="manual-steps">
          <Step n={1} title="Visualizar">
            Abre la materia en modo lectura, sin riesgo de tocar nada. Cuatro pestañas: resumen,
            clases y presentaciones (con descarga del <code>.pptx</code> de cada una), banco de
            preguntas y archivos de origen.
          </Step>
          <Step n={2} title="Editar">
            Cambia el nombre de la materia. Si sales con cambios sin guardar, la aplicación te
            avisa antes de perderlos. El contenido de cada presentación se edita en{" "}
            <strong>Materias</strong>, no aquí, para no tener dos formularios sobre el mismo dato.
          </Step>
          <Step n={3} title="Eliminar">
            Pide confirmación y te dice <em>exactamente</em> cuántas clases, presentaciones, bancos
            y preguntas se van a borrar, consultándolo al servidor en ese momento. Es
            irreversible: no hay papelera.
          </Step>
        </ol>
        <p className="field-hint">
          Si tienes muchas materias aparece un buscador sobre la lista. A la derecha,{" "}
          <strong>Actividad reciente</strong> lista las últimas clases generadas.
        </p>
        <GoTo to="dashboard" label="Ir al Dashboard" />
      </section>

      {/* -------------------------------------------------------------------- Entrenamiento */}
      <section className="panel" id="manual-entrenamiento" aria-labelledby="manual-entrenamiento-h">
        <h2 id="manual-entrenamiento-h">Entrenar tu voz</h2>
        <p>
          Un <strong>perfil de voz</strong> es la descripción de cómo escribes tú. La aplicación lo
          usa al redactar las presentaciones y la retroalimentación del Calificador, para que el
          resultado suene a ti y no a un texto genérico.
        </p>

        <ol className="manual-steps">
          <Step n={1} title="Crea el perfil">
            En <strong>Entrenamiento</strong>, escribe un nombre (por ejemplo «Mi tono en clase») y
            pulsa <strong>+ Crear perfil</strong>. Puedes tener varios y elegir cuál se usa.
          </Step>
          <Step n={2} title="Enséñale tu estilo — dos caminos">
            <p style={{ margin: "0.4rem 0" }}>
              <strong>a) Con documentos tuyos.</strong> Sube PDF que ya hayas escrito
              (presentaciones, informes, apuntes) y pulsa <strong>Analizar tono de voz</strong>. Se
              analiza el estilo y <em>no se guardan los PDF originales</em>, solo las conclusiones.
              Es la opción más fiel si tienes material a mano.
            </p>
            <p style={{ margin: "0.4rem 0 0" }}>
              <strong>b) Con el cuestionario.</strong> Si no tienes documentos, responde las
              preguntas del formulario sobre cómo das clase y con eso se arma el perfil. Es más
              rápido y no necesita archivos. No hace falta responder las ocho preguntas: con cuatro,
              sobre todo las más largas, ya hay muestra suficiente.
            </p>
            <Shot
              src="entrenamiento-perfil"
              alt="Detalle de un perfil de voz: arriba la zona para soltar PDF de muestra con el botón «Analizar tono de voz»; debajo, separado por «— o —», el cuestionario con preguntas como «¿Te diriges a tus estudiantes de tú o de usted?»."
              caption="Los dos caminos, uno debajo del otro: analizar tus PDF, o responder el cuestionario. Basta con uno."
            />
          </Step>
          <Step n={3} title="Revisa y corrige lo que salió">
            El análisis rellena tres campos que <strong>puedes editar a mano</strong>:{" "}
            <em>Descripción del tono</em>, <em>Reglas de estilo</em> y{" "}
            <em>Vocabulario característico</em>. Léelos: es más rápido corregir una frase aquí que
            arreglar veinte presentaciones después.
          </Step>
          <Step n={4} title="Añade tus datos fijos">
            En <em>Datos que siempre quieres incluir</em> guardas pares de etiqueta y valor —
            titulación, línea de investigación, lo que se repita en cada curso. Se incorporan a las
            presentaciones sin que los vuelvas a teclear.
          </Step>
        </ol>

        <Banner type="info">
          El perfil que se usará en el Calificador se elige en{" "}
          <strong>Configuración → Calificador</strong>, en «Perfil de voz activo».
        </Banner>
        <GoTo to="entrenamiento" label="Ir a Entrenamiento" />
      </section>

      {/* -------------------------------------------------------------------------- Materia */}
      <section className="panel" id="manual-materias" aria-labelledby="manual-materias-h">
        <h2 id="manual-materias-h">Crear una materia</h2>
        <p>
          La materia es el contenedor de todo: sus clases, su banco de preguntas y su foro. Se crea
          vacía, con solo un nombre, y se va llenando.
        </p>
        <ol className="manual-steps">
          <Step n={1} title="Entra en Materias y créala">
            Escribe el nombre de la asignatura tal como quieras verla en el Dashboard y confirma.
            Queda seleccionada de inmediato.
            <Shot
              src="materias-lista"
              alt="Sección Materias: la tarjeta «Tus materias» con la materia Finanzas y su recuento de clases, y debajo el campo para escribir un nombre con el botón «+ Crear materia»."
              caption="Cada materia muestra cuántas clases y cuántos bancos tiene. Se entra pulsando sobre ella."
            />
          </Step>
          <Step n={2} title="Entra en su espacio de trabajo">
            Dentro verás tres pestañas: <strong>Presentaciones</strong>,{" "}
            <strong>Banco de preguntas</strong> y <strong>Foro</strong>. Las dos últimas están
            bloqueadas hasta que exista al menos una clase generada, porque se construyen a partir
            de ellas.
          </Step>
          <Step n={3} title="Elige cómo vas a generar las clases">
            La primera vez que entras a una materia vacía, la aplicación te pregunta si quieres
            generar <strong>todo el curso de una vez</strong> o <strong>una clase a la vez</strong>.
            Es la decisión más importante del flujo — se explica en la sección siguiente.
          </Step>
        </ol>
        <p className="field-hint">
          La pregunta solo aparece con la materia vacía. Después puedes cambiar de modo cuando
          quieras con el botón <strong>Generar todo el curso</strong> del encabezado.
        </p>
        <Shot
          src="materia-una-clase"
          alt="Espacio de trabajo de la materia Finanzas: las pestañas Presentaciones, Banco de preguntas y Foro, el botón «Generar todo el curso» arriba a la derecha, y el asistente de cinco pasos empezando por «Documentos»."
          caption="El espacio de trabajo de una materia: sus tres pestañas, el botón para cambiar al modo masivo y, debajo, el asistente de clase individual con sus cinco pasos."
        />
        <GoTo to="materias" label="Ir a Materias" />
      </section>

      {/* ------------------------------------------------------------- Modos de generación */}
      <section className="panel" id="manual-modos" aria-labelledby="manual-modos-h">
        <h2 id="manual-modos-h">Todo el curso de una vez, o una clase a la vez</h2>
        <p>
          Hacen lo mismo —generar presentaciones— pero parten de información distinta y sirven para
          momentos distintos.
        </p>

        <div className="manual-compare">
          <div className="manual-compare-col">
            <h3>Generar todo el curso de una vez</h3>
            <p className="field-hint">
              Cuando ya tienes la programación semanal de la asignatura y quieres el curso completo
              montado.
            </p>
            <p>
              <strong>Qué necesitas:</strong> el PDF de la programación semanal, los PDF de ideas
              clave de cada tema y, opcionalmente, el Excel de «Qué vamos a practicar».
            </p>
            <p>
              <strong>Cuatro pasos:</strong>
            </p>
            <ol className="manual-steps manual-steps-compact">
              <Step n={1} title="Documentos">
                Puedes soltarlo todo a la vez: el PDF de la programación y el Excel se reconocen
                solos por su nombre y extensión, y los PDF de tema se quedan con el rol seleccionado
                («Ideas clave» por defecto). Una lista de verificación te dice qué falta antes de
                dejarte seguir. Al pulsar <strong>Analizar programación</strong> se lee el documento
                y se detectan las semanas.
              </Step>
              <Step n={2} title="Revisión de la programación">
                La tabla que sale <strong>es editable a propósito</strong>. La detección automática
                lee un PDF, y un PDF puede venir mal maquetado: revisa semana por semana el tema, la
                modalidad de clase y la duración, y corrige lo que haga falta antes de generar.
              </Step>
              <Step n={3} title="Datos del curso">
                Nombre del curso, docente, actividades y fechas. Se piden{" "}
                <strong>una sola vez</strong> para todo el curso: esa es la ventaja principal de
                este modo frente al otro.
              </Step>
              <Step n={4} title="Generar y descargar">
                Se generan todas las clases en orden y encadenadas: la de solución resuelve la
                actividad anterior, el repaso sintetiza lo visto. Al terminar puedes descargarlas
                una a una o todas juntas.
              </Step>
            </ol>
            <p>
              <strong>Ventaja:</strong> el curso queda coherente de principio a fin y los datos se
              capturan una vez.
              <br />
              <strong>Coste:</strong> necesitas la programación semanal y el proceso tarda —son
              todas las clases seguidas.
            </p>
          </div>

          <div className="manual-compare-col">
            <h3>Generar una clase a la vez</h3>
            <p className="field-hint">
              Cuando aún no tienes la programación, cuando quieres probar, o cuando necesitas
              rehacer una sola sesión.
            </p>
            <p>
              <strong>Qué necesitas:</strong> los documentos de esa clase concreta. Nada más.
            </p>
            <p>
              <strong>Cinco pasos:</strong>
            </p>
            <ol className="manual-steps manual-steps-compact">
              <Step n={1} title="Documentos">
                Subes el material de esta sesión.
              </Step>
              <Step n={2} title="Configuración">
                Nivel académico, duración, número de semana y de tema, datos del docente.
              </Step>
              <Step n={3} title="Modalidad">
                Eliges qué tipo de clase es. Cada modalidad produce una estructura distinta de
                láminas.
              </Step>
              <Step n={4} title="Revisión">
                Revisas y corriges el contenido propuesto <strong>antes</strong> de que se arme el
                archivo.
              </Step>
              <Step n={5} title="Esquema y descarga">
                Se construye el <code>.pptx</code> y lo descargas.
              </Step>
            </ol>
            <p>
              <strong>Ventaja:</strong> control total sobre cada sesión y no depende de ningún
              documento de programación.
              <br />
              <strong>Coste:</strong> repites la configuración en cada clase, y el encadenado entre
              sesiones lo llevas tú.
            </p>
          </div>
        </div>

        <Shot
          src="curso-completo"
          alt="Asistente «Generar todo el curso» dentro de la materia Finanzas, con los cuatro pasos numerados: Documentos, Revisión de la programación, Datos del curso y Generar y descargar."
          caption="El modo masivo y sus cuatro pasos. Compáralo con los cinco del modo de una clase a la vez: aquí los datos del curso se piden una sola vez."
        />

        <h3>Las cinco modalidades de clase</h3>
        <ul className="data-summary">
          <li>
            <span className="label">Primera clase</span>
            <span>Presenta al docente, el curso, las actividades y los canales de contacto. Sin repaso previo.</span>
          </li>
          <li>
            <span className="label">Clase normal</span>
            <span>Sesión de contenido, con repaso de la clase anterior.</span>
          </li>
          <li>
            <span className="label">Clase + presentación de actividad</span>
            <span>Contenido y, al final, el enunciado de la actividad a entregar.</span>
          </li>
          <li>
            <span className="label">Clase + solución de actividad</span>
            <span>Contenido y la resolución de la actividad planteada antes.</span>
          </li>
          <li>
            <span className="label">Repaso general</span>
            <span>Sintetiza toda la materia: mapa conceptual, glosario, errores frecuentes y autoevaluación.</span>
          </li>
        </ul>
        <Banner type="warning" title="Los dos modos conviven">
          Elegir uno no cierra el otro. Puedes generar el curso completo y después rehacer una
          semana suelta con el modo de una clase a la vez, o al revés.
        </Banner>
      </section>

      {/* --------------------------------------------------------------- Banco y foro */}
      <section className="panel" id="manual-banco-foro" aria-labelledby="manual-banco-foro-h">
        <h2 id="manual-banco-foro-h">Banco de preguntas y Foro</h2>
        <p>
          Las dos pestañas están bloqueadas hasta que la materia tenga al menos una clase generada.
          No es un capricho: ambas se construyen a partir del contenido de esas clases, no de los
          documentos originales.
        </p>
        <h3>Banco de preguntas</h3>
        <p>
          Eliges con casillas qué clases usar como fuente —vienen todas marcadas— y se generan
          minicasos con sus preguntas a partir de las ideas clave de esas clases. Por eso las
          preguntas hablan de lo que realmente diste en clase y no de cualquier párrafo suelto del
          PDF original.
        </p>
        <h3>Foro</h3>
        <p>
          Arma el <strong>saludo de bienvenida</strong> con los datos de tu primera clase y un{" "}
          <strong>seguimiento semanal</strong>: un mensaje por semana con lo que verán los
          estudiantes, derivado de las clases ya generadas. Las semanas sin número asignado no
          aparecen.
        </p>
      </section>

      {/* ------------------------------------------------------------------- Curso sello */}
      <section className="panel" id="manual-curso-sello" aria-labelledby="manual-curso-sello-h">
        <h2 id="manual-curso-sello-h">Curso sello</h2>
        <p>
          Es <strong>exactamente</strong> la sección Materias, con las mismas herramientas de
          generación de clases y banco de preguntas, pero en su propio espacio para las materias
          del curso sello (Liderazgo personal y de servicio, Creatividad e innovación, Competencias
          en Sostenibilidad). Cualquier materia creada desde ahí queda etiquetada como curso sello y
          no se mezcla con tus asignaturas normales.
        </p>
        <GoTo to="curso-sello" label="Ir a Curso sello" />
      </section>

      {/* ------------------------------------------------------------------- Calificador */}
      <section className="panel" id="manual-calificador" aria-labelledby="manual-calificador-h">
        <h2 id="manual-calificador-h">Calificador</h2>
        <p>
          Califica trabajos de alumnos (<code>.docx</code>, <code>.pptx</code>, <code>.pdf</code>)
          contra una rúbrica y redacta la retroalimentación criterio por criterio, en tu estilo.
          Funciona con sus propias materias y sesiones, independientes de las materias de
          generación de clases.
        </p>

        <Shot
          src="calificador"
          alt="Pantalla del Calificador: pestañas Materias y Buscador, el panel «Se evaluará con» que resume perfil de voz, escala, exigencia y estado de la conexión con IA, y debajo la lista de materias con sus sesiones."
          caption="Antes de calificar nada, el panel «Se evaluará con» te dice qué ajustes se van a aplicar y dónde se cambia cada uno."
        />

        <ol className="manual-steps">
          <Step n={1} title="Crea la sesión (paso 1 de 3)">
            Una <em>sesión</em> es una entrega concreta: «Entrega 2 — Ensayo final». Eliges la
            materia (o creas una nueva ahí mismo), el nombre, el nivel académico y el tipo de
            trabajo.
          </Step>
          <Step n={2} title="Sube la rúbrica y las instrucciones (paso 2 de 3)">
            La rúbrica es el documento con los criterios de evaluación. Sin ella no se puede
            continuar: es la base de todo lo demás.
          </Step>
          <Step n={3} title="Aprueba la lógica de calificación (paso 3 de 3)">
            La IA lee la rúbrica, extrae sus criterios y propone cómo se van a puntuar.{" "}
            <strong>Tú la revisas y la apruebas antes de que se califique nada.</strong> Es el
            control clave del flujo: si la lógica está mal, todas las calificaciones lo estarán.
            Cambiar la rúbrica después invalida la lógica aprobada y hay que volver a aprobarla.
          </Step>
          <Step n={4} title="Sube las entregas e inicia la cola">
            Cargas los trabajos de los alumnos y pulsas <strong>Iniciar</strong>. Se procesan en
            cola, uno tras otro. Puedes seguir el avance sin quedarte esperando.
          </Step>
          <Step n={5} title="Revisa, reintenta y exporta">
            Abre cualquier evaluación para ver la calificación y el comentario por criterio. Si una
            salió mal, <strong>Reintentar</strong> la vuelve a procesar. Cuando estés conforme,{" "}
            <strong>Exportar sesión</strong> genera los archivos de resultados.
          </Step>
        </ol>

        <p className="field-hint">
          El botón <strong>Buscador</strong> del encabezado busca entre todas las evaluaciones ya
          hechas, de cualquier sesión.
        </p>
        <Banner type="info" title="Dónde se configura">
          El Calificador <strong>no</strong> tiene ajustes propios. La conexión con IA está en{" "}
          <strong>Configuración → Inteligencia artificial</strong>, los valores por defecto
          (escala, exigencia, tipo de trabajo) en <strong>Configuración → Calificador</strong>, y el
          perfil de voz en <strong>Entrenamiento</strong>. En cada sesión ves un resumen de qué se
          va a aplicar, con enlaces a donde se edita.
        </Banner>
        <GoTo to="calificador" label="Ir al Calificador" />
      </section>

      {/* ---------------------------------------------------------------- Investigación */}
      <section className="panel" id="manual-investigacion" aria-labelledby="manual-investigacion-h">
        <h2 id="manual-investigacion-h">Investigación asistida por IA</h2>
        <p>
          Está en la barra superior. Responde a <strong>dónde buscar</strong>, no a qué dice la
          bibliografía: no resume artículos ni inventa citas. Tiene dos bloques independientes.
        </p>

        <Shot
          src="investigacion"
          alt="Asistente de investigación: campos de tema y pregunta, selectores de tipo de fuente (artículos, libros, datos, noticias, patentes), idiomas, periodo desde/hasta y área de conocimiento."
          caption="El asistente. Solo el tema es obligatorio; el resto acota la recomendación."
        />

        <h3>1. El asistente</h3>
        <p>
          Describes tu tema y, si quieres, la pregunta de investigación, el área de conocimiento, los
          idiomas y el periodo (desde/hasta). Te devuelve dos cosas:
        </p>
        <ul className="data-summary">
          <li>
            <span className="label">Herramientas recomendadas</span>
            <span>Cuáles del catálogo encajan con tu búsqueda y por qué.</span>
          </li>
          <li>
            <span className="label">Cadenas de búsqueda</span>
            <span>Combinaciones de palabras clave listas para pegar en cada herramienta.</span>
          </li>
        </ul>
        <p className="field-hint">
          El asistente <strong>solo puede recomendar herramientas del catálogo</strong>: no puede
          inventarse un repositorio que no exista. Necesita la conexión con IA configurada; si no lo
          está, te avisa y te lleva a Configuración.
        </p>

        <h3>2. El catálogo</h3>
        <p>
          Un listado de herramientas de consulta gratuita, con la fecha en que se verificaron.
          Funciona <strong>siempre</strong>, con o sin IA configurada. Puedes filtrar por texto,
          categoría (artículos, datasets, libros, noticias, patentes…), tipo de acceso e idioma, y
          ordenar el resultado.
        </p>
        <p className="field-hint">
          El «tipo de acceso» te dice qué te vas a encontrar: acceso abierto, búsqueda gratuita pero
          con documentos de pago, o servicios que piden cuenta gratuita. Conviene mirarlo antes de
          entrar.
        </p>
        <GoTo to="investigacion" label="Ir a Investigación asistida" />
      </section>

      {/* ---------------------------------------------------------------- Configuración */}
      <section className="panel" id="manual-configuracion" aria-labelledby="manual-configuracion-h">
        <h2 id="manual-configuracion-h">Configuración</h2>
        <p>Se abre desde el menú de tu cuenta, arriba a la derecha. Cuatro pestañas:</p>
        <ul className="data-summary">
          <li>
            <span className="label">General</span>
            <span>Tu identidad docente y la institución.</span>
          </li>
          <li>
            <span className="label">Inteligencia artificial</span>
            <span>Proveedor, credenciales y modelo. Es la única conexión de toda la aplicación.</span>
          </li>
          <li>
            <span className="label">Calificador</span>
            <span>Valores por defecto de cada sesión nueva y perfil de voz activo.</span>
          </li>
          <li>
            <span className="label">Apariencia</span>
            <span>Modo claro/oscuro y paleta de color.</span>
          </li>
        </ul>

        <Shot
          src="configuracion-ia"
          alt="Pestaña «Inteligencia artificial» de Configuración: estado «Configurada», proveedor «local», modelo «Modelo local (en este equipo)» y el botón «Editar conexión»."
          caption="Una sola conexión para toda la aplicación. Desde «Editar conexión» eliges proveedor y modelo."
        />

        <h3>Los tres proveedores</h3>
        <ul className="data-summary">
          <li>
            <span className="label">Google Gemini</span>
            <span>API key gratuita en aistudio.google.com/apikey.</span>
          </li>
          <li>
            <span className="label">Anthropic Claude</span>
            <span>De pago, en console.anthropic.com.</span>
          </li>
          <li>
            <span className="label">Modelo local</span>
            <span>Sin API key: corre en tu propio equipo. A cambio es mucho más lento.</span>
          </li>
        </ul>
        <Banner type="warning" title="El modelo local es lento">
          No necesita credenciales, pero corre sobre el procesador de tu equipo: una sola llamada
          puede tardar minutos, y generar un curso completo puede superar el límite de tiempo de
          cada clase. Sirve para probar y para clases sueltas; para un curso entero conviene una
          API key de Gemini o Anthropic.
        </Banner>

        <Banner type="warning" title="Modo simulado">
          Sin credenciales de IA la aplicación <strong>no se bloquea</strong>: funciona en modo
          simulado. Genera presentaciones completas y con la estructura correcta, pero los campos
          que exigen conocimiento externo real —autores y años del marco teórico, cifras
          verificadas, enlaces de interés— salen marcados como <code>[PENDIENTE]</code> en vez de
          inventados. Es deliberado: preferimos un hueco visible a un dato falso. Al configurar la
          conexión, esos campos se completan de verdad.
        </Banner>
        <p className="field-hint">
          Los valores por defecto del Calificador solo afectan a las sesiones que crees a partir de
          ese momento; las que ya existen conservan los suyos.
        </p>
        <GoTo to="configuracion" label="Ir a Configuración" />
      </section>

      {/* ------------------------------------------------------------------- Pendientes */}
      <section className="panel" id="manual-pendientes" aria-labelledby="manual-pendientes-h">
        <h2 id="manual-pendientes-h">Lo que todavía no existe</h2>
        <p className="field-hint">
          Para que no pierdas tiempo buscándolo: esto está previsto pero aún no funciona.
        </p>
        <ul className="data-summary">
          <li>
            <span className="label">Gamificación</span>
            <span>
              <span className="badge badge-warn">Próximamente</span> Aparece en la barra superior sin
              función todavía.
            </span>
          </li>
          <li>
            <span className="label">Calendario académico</span>
            <span>No se guardan fechas de inicio/fin ni sesiones programadas por clase.</span>
          </li>
          <li>
            <span className="label">Búsqueda global</span>
            <span>Cada sección busca dentro de lo suyo; no hay un buscador único.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
