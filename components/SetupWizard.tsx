"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "./Banner";
import { chooseDownloadDirectory, isElectron } from "../services/api";

interface Institution {
  name: string;
  gradeScale: { min: number; max: number; passingGrade: number };
  academicLevels: { id: string; label: string }[];
  feedbackLanguage: string;
}

interface SetupWizardProps {
  suggestedDataDir: string;
  institution: Institution;
  defaults: { geminiModel: string; geminiThrottleMs: number };
}

type KeyTestState = { status: "sin_probar" } | { status: "probando" } | { status: "ok" } | { status: "error"; message: string };

const STEPS = ["Antes de empezar", "Tus datos", "Conexión con la IA", "Dónde se guarda", "Listo"];

export function SetupWizard({ suggestedDataDir, institution, defaults }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [consentAccepted, setConsentAccepted] = useState(false);

  const [teacherTitle, setTeacherTitle] = useState("");
  const [teacherName, setTeacherName] = useState("");

  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState(defaults.geminiModel);
  const [geminiThrottleMs, setGeminiThrottleMs] = useState(defaults.geminiThrottleMs);
  const [geminiKeyTest, setGeminiKeyTest] = useState<KeyTestState>({ status: "sin_probar" });

  const [aiProvider, setAiProvider] = useState<"anthropic" | "gemini" | "local">("gemini");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [dataDir, setDataDir] = useState(suggestedDataDir);

  async function testGeminiKey() {
    if (!geminiApiKey.trim()) {
      setGeminiKeyTest({ status: "error", message: "Pega tu API key primero." });
      return;
    }
    setGeminiKeyTest({ status: "probando" });
    try {
      const res = await fetch("/api/setup/probar-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiApiKey, model: geminiModel }),
      });
      const data = await res.json();
      const result = data.data ?? data;
      if (result.ok) setGeminiKeyTest({ status: "ok" });
      else setGeminiKeyTest({ status: "error", message: result.error ?? "La key no funcionó." });
    } catch (err) {
      setGeminiKeyTest({ status: "error", message: err instanceof Error ? err.message : "No se pudo probar la key." });
    }
  }

  function blockingReason(): string | null {
    if (step === 0 && !consentAccepted) return "Marca la casilla de aceptación para continuar.";
    if (step === 1 && !teacherName.trim()) {
      return "Escribe tu nombre: aparece en los documentos que entregas a tus alumnos.";
    }
    if (step === 2) {
      // Las keys son opcionales: se puede terminar la instalación sin ninguna y añadirlas después
      // en Configuración. Solo se exige probar la de Gemini si el usuario escribió una, para que
      // no se guarde una clave mal copiada dándola por buena.
      if (geminiApiKey.trim() && geminiKeyTest.status !== "ok") {
        return "Escribiste una API key de Gemini: pruébala antes de continuar (botón «Probar conexión»), o bórrala para configurarla más tarde.";
      }
      if (aiProvider === "anthropic" && !anthropicApiKey.trim()) {
        return "Elegiste Anthropic para presentaciones/entrenamiento: pega tu API key de Anthropic o cambia el proveedor.";
      }
    }
    if (step === 3 && !dataDir.trim()) return "Indica la carpeta donde se guardarán tus datos.";
    return null;
  }

  function next() {
    const reason = blockingReason();
    if (reason) {
      setError(reason);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function pickDataDir() {
    if (!isElectron()) return;
    const chosen = await chooseDownloadDirectory();
    if (chosen) setDataDir(chosen);
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentAccepted,
          teacherTitle,
          teacherName,
          aiProvider,
          anthropicApiKey,
          geminiApiKey,
          geminiModel,
          geminiThrottleMs,
          dataDir,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error?.message ?? data.error ?? "No se pudo guardar la configuración.");
      }
      router.refresh();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  return (
    <div className="app-shell" style={{ maxWidth: "42rem" }}>
      <header className="app-header">
        <h1>Configuración inicial</h1>
        <p>Cinco pasos para dejar la aplicación lista. Solo se hace una vez.</p>
      </header>

      <nav aria-label="Progreso" className="bullet-row" style={{ flexWrap: "wrap", marginBottom: "1rem" }}>
        {STEPS.map((label, index) => (
          <span
            key={label}
            className="option-card"
            data-selected={index === step}
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}
          >
            {index < step ? "✓ " : `${index + 1}. `}
            {label}
          </span>
        ))}
      </nav>

      <section className="panel" aria-label="Paso actual">
        {step === 0 && <ConsentStep accepted={consentAccepted} onAcceptedChange={setConsentAccepted} institutionName={institution.name} />}

        {step === 1 && (
          <div className="field-group">
            <span className="field-legend">Tus datos</span>
            <p className="field-hint">Aparecen en los documentos de retroalimentación que entregas a tus alumnos.</p>
            <div className="bullet-row">
              <input
                aria-label="Título"
                placeholder="Mtro., Dra....(opcional)"
                value={teacherTitle}
                onChange={(e) => setTeacherTitle(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                aria-label="Tu nombre"
                placeholder="Nombre y apellidos"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                style={{ flex: 2 }}
              />
            </div>
            <p className="field-hint">
              Los documentos que entregues irán encabezados por <strong>{institution.name}</strong>.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="field-group">
            <span className="field-legend">Conexión con la IA</span>
            <p className="field-hint">
              <strong>Puedes dejar esto en blanco y terminar la instalación.</strong> Sin ninguna API key la
              aplicación funciona en modo simulado: genera clases completas y con la estructura correcta, pero
              los datos que exigen conocimiento externo real —autores del marco teórico, cifras verificadas,
              enlaces— salen marcados como <code>[PENDIENTE]</code> en vez de inventados. Las puedes añadir
              cuando quieras desde Configuración → Inteligencia artificial.
            </p>
            <p className="field-hint">
              El Calificador es el único que necesita obligatoriamente Google Gemini (gratis en{" "}
              <code>https://aistudio.google.com/apikey</code>); hasta que la configures, esa sección te lo dirá.
            </p>

            <label htmlFor="gemini-key">API key de Gemini (opcional)</label>
            <div className="bullet-row">
              <input
                id="gemini-key"
                type="password"
                autoComplete="off"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setGeminiKeyTest({ status: "sin_probar" });
                }}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary" onClick={testGeminiKey} disabled={geminiKeyTest.status === "probando"}>
                <span className="btn-label" data-label={geminiKeyTest.status === "probando" ? "Probando…" : "Probar conexión"}>
                  {geminiKeyTest.status === "probando" ? "Probando…" : "Probar conexión"}
                </span>
              </button>
            </div>
            {geminiKeyTest.status === "ok" && <p className="field-hint">✓ Conexión correcta.</p>}
            {geminiKeyTest.status === "error" && <p className="field-hint">{geminiKeyTest.message}</p>}
            <p className="field-hint">Se guarda cifrada en tu computadora. No se envía a ningún servidor propio.</p>

            <div className="field-group" style={{ marginTop: "1rem" }}>
              <span className="field-legend">Generación de presentaciones y entrenamiento de tono</span>
              <p className="field-hint">¿Qué proveedor de IA usamos para esa parte de la app?</p>
              <div className="option-grid" role="radiogroup" aria-label="Proveedor de IA">
                {(["gemini", "anthropic", "local"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={aiProvider === value}
                    className="option-card"
                    data-selected={aiProvider === value}
                    onClick={() => setAiProvider(value)}
                  >
                    <h3>{value === "gemini" ? "Gemini (misma key)" : value === "anthropic" ? "Anthropic" : "Modelo local"}</h3>
                  </button>
                ))}
              </div>
              {aiProvider === "anthropic" && (
                <input
                  aria-label="API key de Anthropic"
                  type="password"
                  autoComplete="off"
                  placeholder="API key de Anthropic"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            <button
              type="button"
              className="btn-text"
              style={{ marginTop: "0.75rem" }}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Ocultar opciones avanzadas" : "Opciones avanzadas"}
            </button>
            {showAdvanced && (
              <div className="field-group">
                <label htmlFor="gemini-model">Modelo de Gemini</label>
                <input
                  id="gemini-model"
                  value={geminiModel}
                  onChange={(e) => {
                    setGeminiModel(e.target.value);
                    setGeminiKeyTest({ status: "sin_probar" });
                  }}
                  spellCheck={false}
                />
                <p className="field-hint">
                  El default es un modelo Flash-Lite, el más económico. En la capa gratuita los modelos &quot;pro&quot;/&quot;flash&quot;
                  completos suelen requerir plan de pago.
                </p>
                <label htmlFor="gemini-throttle">Espera entre llamadas a Gemini (ms)</label>
                <input
                  id="gemini-throttle"
                  type="number"
                  min={0}
                  step={500}
                  value={geminiThrottleMs}
                  onChange={(e) => setGeminiThrottleMs(Number(e.target.value))}
                  style={{ width: "8rem" }}
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="field-group">
            <span className="field-legend">Dónde se guarda tu trabajo</span>
            <p className="field-hint">Todo vive en tu computadora, en la carpeta que elijas — materias, calificaciones, archivos generados.</p>
            <div className="bullet-row">
              <input aria-label="Carpeta de datos" value={dataDir} onChange={(e) => setDataDir(e.target.value)} style={{ flex: 1 }} />
              {isElectron() && (
                <button type="button" className="btn btn-secondary" onClick={pickDataDir}>
                  <span className="btn-label" data-label="Elegir carpeta…">
                    Elegir carpeta…
                  </span>
                </button>
              )}
            </div>
            <Banner type="warning">
              <strong>Respalda esta carpeta.</strong> Contiene tu historial completo de materias y calificaciones. La
              aplicación no guarda nada en la nube.
            </Banner>
          </div>
        )}

        {step === 4 && (
          <SummaryStep
            teacher={[teacherTitle, teacherName].filter(Boolean).join(" ")}
            dataDir={dataDir}
            model={geminiModel}
            aiProvider={aiProvider}
            institution={institution}
          />
        )}

        {error && (
          <Banner type="error" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        <div className="actions-row" style={{ marginTop: "1.25rem" }}>
          <button type="button" className="btn btn-secondary" onClick={back} disabled={step === 0 || saving}>
            <span className="btn-label" data-label="Atrás">
              Atrás
            </span>
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              <span className="btn-label" data-label="Continuar">
                Continuar
              </span>
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish} disabled={saving}>
              <span className="btn-label" data-label={saving ? "Guardando…" : "Empezar a usar la aplicación"}>
                {saving ? "Guardando…" : "Empezar a usar la aplicación"}
              </span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function ConsentStep({
  accepted,
  onAcceptedChange,
  institutionName,
}: {
  accepted: boolean;
  onAcceptedChange: (value: boolean) => void;
  institutionName: string;
}) {
  return (
    <div className="field-group">
      <span className="field-legend">Antes de empezar: cómo se tratan los datos</span>
      <p className="field-hint">Lee esto con calma. Es importante porque vas a procesar trabajos de tus alumnos.</p>

      <Banner type="info" title="Se queda en tu computadora">
        <ul>
          <li>La base de datos con materias, presentaciones, calificaciones, nombres y comentarios.</li>
          <li>Los archivos de los trabajos, rúbricas e instrucciones.</li>
          <li>Tus API keys, guardadas cifradas.</li>
          <li>Los documentos de retroalimentación que exportas a Word, PDF o Excel.</li>
        </ul>
        <p>La aplicación no tiene servidores propios. Funciona sin conexión salvo para llamar a la IA que elijas.</p>
      </Banner>

      <Banner type="warning" title="Sí sale de tu computadora">
        <p>
          Para calificar un trabajo, su <strong>contenido</strong> —texto e imágenes, incluido el nombre del alumno si
          aparece en la portada— se envía a la <strong>API de Google Gemini</strong> con tu propia API key. También se
          envían tus rúbricas, las instrucciones de la tarea y las muestras de tu estilo de escritura, si las cargas.
        </p>
        <p>
          El uso de esos datos queda sujeto a los términos de Google para la API de Gemini. Antes de procesar trabajos
          de alumnos, confirma que esto es compatible con la normativa de protección de datos de{" "}
          <strong>{institutionName}</strong> y con lo que tus alumnos consintieron.
        </p>
      </Banner>

      <label className="option-card" style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        <input type="checkbox" checked={accepted} onChange={(e) => onAcceptedChange(e.target.checked)} style={{ marginTop: "0.2rem" }} />
        <span>
          Entiendo que el contenido de los trabajos se envía a la API de Google Gemini para ser evaluado, y que soy
          responsable de verificar que este uso cumpla con la normativa de mi institución.
        </span>
      </label>
    </div>
  );
}

function SummaryStep({
  teacher,
  dataDir,
  model,
  aiProvider,
  institution,
}: {
  teacher: string;
  dataDir: string;
  model: string;
  aiProvider: string;
  institution: Institution;
}) {
  const rows: [string, string][] = [
    ["Docente", teacher || "—"],
    ["Modelo de Gemini (Calificador)", model],
    ["Proveedor para presentaciones/entrenamiento", aiProvider],
    ["Carpeta de datos", dataDir],
    ["Institución (Calificador)", institution.name],
    [
      "Escala de calificación",
      `${institution.gradeScale.min} a ${institution.gradeScale.max}, aprueba con ${institution.gradeScale.passingGrade}`,
    ],
    ["Niveles académicos", institution.academicLevels.map((l) => l.label).join(", ")],
  ];

  return (
    <div className="field-group">
      <span className="field-legend">Todo listo</span>
      <p className="field-hint">Revisa que esto sea correcto. Después puedes cambiar tus datos y tus API keys en Ajustes.</p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="bullet-row">
            <dt style={{ flex: 1, color: "var(--color-primary-dark)" }}>{label}</dt>
            <dd style={{ flex: 2, fontWeight: 600 }}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
