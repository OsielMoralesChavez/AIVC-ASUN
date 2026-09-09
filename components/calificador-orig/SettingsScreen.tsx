"use client";

import { useRef, useState } from "react";
import { ApiKeyField, type KeyTestState } from "@/components/calificador-orig/config/ApiKeyField";
import { DataFolderField } from "@/components/calificador-orig/config/DataFolderField";
import { ACTIVE_INSTITUTION } from "@/lib/config/institution";
import { resolveLanguage } from "@/lib/calificador/config/languages";

/**
 * Pantalla de Ajustes: los mismos datos del asistente inicial, editables.
 *
 * Reutiliza los campos del asistente (escala, niveles, API key, carpeta) para
 * que ambas pantallas no puedan divergir: una regla de validación nueva vale
 * automáticamente para las dos.
 *
 * A diferencia del asistente, aquí cada bloque se guarda por separado: el
 * usuario entra a cambiar una cosa concreta y no debería tener que recorrer
 * todos los pasos para lograrlo.
 *
 * Lo que NO aparece aquí: institución, escala de calificación, niveles
 * académicos e idioma del feedback. Los fija el perfil institucional (ver
 * lib/config/institution.ts) y se muestran como referencia, no como campos.
 */

const SEVERITY_LABELS = [
  "Muy flexible",
  "Flexible",
  "Balanceado",
  "Estricto",
  "Muy estricto",
];

interface InitialSettings {
  teacherTitle: string;
  teacherName: string;
  aiProvider: "anthropic" | "gemini" | "local";
  geminiModel: string;
  geminiThrottleMs: number;
  defaultLevelId: string;
  defaultSeverity: number;
  defaultWorkType: "individual" | "grupal";
  defaultFilesPerSubmission: number;
  anthropicApiKeyMasked: string;
  geminiApiKeyMasked: string;
  geminiApiKeyPaidMasked: string;
  consentAcceptedAt: string | null;
}

export function SettingsScreen({
  dataDir: initialDataDir,
  initial,
  onSaved,
}: {
  dataDir: string;
  initial: InitialSettings;
  /** Se llama tras guardar cambios, cambiar de carpeta o restaurar un respaldo — el contenedor
   * vuelve a pedir /api/calificador/ajustes para que el resto de la app (NewSessionWizard,
   * SessionView...) refleje los valores nuevos. */
  onSaved: () => void;
}) {
  const [teacherTitle, setTeacherTitle] = useState(initial.teacherTitle);
  const [teacherName, setTeacherName] = useState(initial.teacherName);
  const [aiProvider, setAiProvider] = useState(initial.aiProvider);
  const [anthropicApiKey, setAnthropicApiKey] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [apiKeyPaid, setApiKeyPaid] = useState("");
  const [clearPaidKey, setClearPaidKey] = useState(false);
  const [model, setModel] = useState(initial.geminiModel);
  const [throttleMs, setThrottleMs] = useState(initial.geminiThrottleMs);
  const [keyTest, setKeyTest] = useState<KeyTestState>({ status: "sin_probar" });
  const [paidKeyTest, setPaidKeyTest] = useState<KeyTestState>({
    status: "sin_probar",
  });

  const [defaultLevelId, setDefaultLevelId] = useState(initial.defaultLevelId);
  const [severity, setSeverity] = useState(initial.defaultSeverity);
  const [workType, setWorkType] = useState(initial.defaultWorkType);
  const [filesPerSubmission, setFilesPerSubmission] = useState(
    initial.defaultFilesPerSubmission
  );

  const [dataDir, setDataDir] = useState(initialDataDir);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/calificador/ajustes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherTitle,
          teacherName,
          aiProvider,
          ...(anthropicApiKey.trim() && { anthropicApiKey }),
          geminiApiKey: apiKey,
          geminiApiKeyPaid: apiKeyPaid,
          clearPaidKey,
          geminiModel: model,
          geminiThrottleMs: throttleMs,
          defaultLevelId,
          defaultSeverity: severity,
          defaultWorkType: workType,
          defaultFilesPerSubmission: filesPerSubmission,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudieron guardar los ajustes.");

      setNotice("Ajustes guardados.");
      setApiKey("");
      setApiKeyPaid("");
      setAnthropicApiKey("");
      setClearPaidKey(false);
      setKeyTest({ status: "sin_probar" });
      setPaidKeyTest({ status: "sin_probar" });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajustes</h1>
        <p className="text-sm text-slate-500">
          Todo lo que configuraste al principio, editable cuando quieras.
        </p>
      </div>

      {/* ---------- Identidad ---------- */}
      <Section
        title="Tus datos"
        description="Aparecen en los documentos de retroalimentación que entregas."
      >
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Field label="Título">
            <input
              value={teacherTitle}
              onChange={(event) => setTeacherTitle(event.target.value)}
              placeholder="Mtro."
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
            />
          </Field>
          <Field label="Tu nombre">
            <input
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
            />
          </Field>
        </div>
      </Section>

      {/* ---------- Gemini ---------- */}
      <Section
        title="Conexión con la IA"
        description="Deja los campos de API key vacíos para conservar las que ya tienes guardadas."
      >
        <ApiKeyField
          value={apiKey}
          onChange={setApiKey}
          model={model}
          testState={keyTest}
          onTestStateChange={setKeyTest}
          helpText={
            <>
              Key actual:{" "}
              <span className="font-mono">
                {initial.geminiApiKeyMasked || "(ninguna)"}
              </span>
              . Escribe una nueva solo si quieres reemplazarla.
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Modelo de Gemini">
            <input
              value={model}
              onChange={(event) => {
                setModel(event.target.value);
                setKeyTest({ status: "sin_probar" });
              }}
              spellCheck={false}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500"
            />
          </Field>
          <Field label="Espera entre llamadas (ms)">
            <input
              type="number"
              value={throttleMs}
              min={0}
              step={500}
              onChange={(event) => setThrottleMs(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
            />
          </Field>
        </div>

        <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-sm text-slate-600">
            Key de pago de respaldo{" "}
            <span className="text-slate-500">
              ({initial.geminiApiKeyPaidMasked ? "configurada" : "sin configurar"})
            </span>
          </summary>
          <div className="mt-3 space-y-2">
            <ApiKeyField
              label="API key de pago"
              optional
              value={apiKeyPaid}
              onChange={(value) => {
                setApiKeyPaid(value);
                if (value) setClearPaidKey(false);
              }}
              model={model}
              testState={paidKeyTest}
              onTestStateChange={setPaidKeyTest}
              helpText="Se usa solo si todos los modelos fallan con la key gratuita."
            />
            {initial.geminiApiKeyPaidMasked && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={clearPaidKey}
                  onChange={(event) => {
                    setClearPaidKey(event.target.checked);
                    if (event.target.checked) setApiKeyPaid("");
                  }}
                />
                Eliminar la key de pago guardada (dejar de usarla por completo)
              </label>
            )}
          </div>
        </details>
      </Section>

      {/* ---------- Proveedor de IA para presentaciones/entrenamiento ---------- */}
      <Section
        title="Generación de presentaciones y entrenamiento de tono"
        description="Proveedor de IA para el resto de la app (no el Calificador, que siempre usa Gemini)."
      >
        <div className="flex gap-2">
          {(["gemini", "anthropic", "local"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAiProvider(value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                aiProvider === value
                  ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {value === "gemini" ? "Gemini (misma key)" : value === "anthropic" ? "Anthropic" : "Modelo local"}
            </button>
          ))}
        </div>
        {aiProvider === "anthropic" && (
          <Field label={`API key de Anthropic (actual: ${initial.anthropicApiKeyMasked || "ninguna"})`}>
            <input
              type="password"
              autoComplete="off"
              placeholder="Escribe una nueva solo si quieres reemplazarla"
              value={anthropicApiKey}
              onChange={(event) => setAnthropicApiKey(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
            />
          </Field>
        )}
      </Section>

      {/* ---------- Dominio académico ---------- */}
      <Section
        title="Cómo calificas"
        description="Con qué criterios evalúa la aplicación y con qué valores arrancan las sesiones nuevas."
      >
        <InstitutionalPanel />

        <div className="rounded-lg border border-slate-200 px-3 py-3">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Valores por default de las sesiones nuevas
          </p>
          <Field label="Nivel académico">
            <select
              value={defaultLevelId}
              onChange={(event) => setDefaultLevelId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
            >
              {ACTIVE_INSTITUTION.academicLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Severidad: ${severity} — ${SEVERITY_LABELS[severity - 1]}`}>
            <input
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(event) => setSeverity(Number(event.target.value))}
              className="w-full"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipo de trabajo">
              <select
                value={workType}
                onChange={(event) =>
                  setWorkType(event.target.value as "individual" | "grupal")
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
              </select>
            </Field>
            <Field label="Archivos por entrega">
              <select
                value={filesPerSubmission}
                onChange={(event) =>
                  setFilesPerSubmission(Number(event.target.value))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
              >
                <option value={1}>1 archivo</option>
                <option value={2}>2 archivos</option>
                <option value={3}>3 archivos</option>
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {notice && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <DataSection
        dataDir={dataDir}
        onDataDirChange={setDataDir}
        consentAcceptedAt={initial.consentAcceptedAt}
        onSaved={onSaved}
      />
    </div>
  );
}

/**
 * Bloque de datos: dónde viven, cómo respaldarlos y cómo restaurarlos.
 *
 * Va aparte del botón "Guardar cambios" porque sus acciones son inmediatas y
 * de otra naturaleza: mover la carpeta o restaurar un respaldo no es editar
 * un campo, y mezclarlos invitaría a hacerlo sin querer.
 */
function DataSection({
  dataDir,
  onDataDirChange,
  consentAcceptedAt,
  onSaved,
}: {
  dataDir: string;
  onDataDirChange: (value: string) => void;
  consentAcceptedAt: string | null;
  onSaved: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applyDataDir() {
    if (
      !confirm(
        `La aplicación pasará a usar:\n\n${dataDir}\n\nEsto NO mueve tus archivos actuales. Si esa carpeta ya tiene datos de Calificador, se abrirán esos; si está vacía, empezarás de cero (tus datos actuales seguirán en su carpeta, intactos).\n\n¿Continuar?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/calificador/ajustes/carpeta-datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataDir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo cambiar la carpeta.");
      setMessage(
        data.hadDatabase
          ? "Listo. Se abrieron los datos que ya existían en esa carpeta. Si esa base venía de otra computadora, tendrás que capturar de nuevo tu API key: la clave de cifrado no viaja con la carpeta."
          : "Listo. La carpeta estaba vacía, así que se creó una base nueva y vacía. Tus datos anteriores siguen intactos en su carpeta original. Como esta base no tiene tu configuración, captura de nuevo tu nombre y tu API key aquí arriba antes de calificar."
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar la carpeta.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(file: File) {
    if (
      !confirm(
        `Vas a restaurar el respaldo "${file.name}".\n\nTus datos actuales NO se borran: se guardan en una carpeta con el sufijo "-datos-anteriores" junto a la actual.\n\nNota: tendrás que capturar de nuevo tu API key, porque los respaldos no incluyen la clave de cifrado.\n\n¿Continuar?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("archivo", file);
      const res = await fetch("/api/calificador/respaldo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo restaurar el respaldo.");
      setMessage(
        `Respaldo restaurado (${data.restoredFiles} archivos). Tus datos anteriores quedaron en: ${data.previousDataPath}`
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restaurar.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Section
      title="Archivos y respaldos"
      description="Dónde vive tu información, cómo respaldarla y cómo recuperarla."
    >
      <DataFolderField
        value={dataDir}
        onChange={onDataDirChange}
        label="Carpeta de datos"
      />
      <button
        type="button"
        onClick={applyDataDir}
        disabled={busy}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Usar esta carpeta
      </button>

      <div className="rounded-lg border border-slate-200 px-4 py-3">
        <p className="text-sm font-medium text-slate-700">Respaldo</p>
        <p className="mt-1 text-sm text-slate-500">
          Un archivo ZIP con tu base de datos y todos los archivos subidos.
          Guárdalo en otro disco o servicio: es tu única copia.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/api/calificador/respaldo"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
          >
            Descargar respaldo
          </a>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? "Trabajando…" : "Restaurar desde un respaldo…"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void restore(file);
            }}
          />
        </div>
      </div>

      {consentAcceptedAt && (
        <p className="text-xs text-slate-500">
          Aviso de tratamiento de datos aceptado el{" "}
          {new Date(consentAcceptedAt).toLocaleString("es-MX")}.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
    </Section>
  );
}

/**
 * Lo que define la institución y el profesor no puede cambiar. Se muestra
 * —en vez de omitirse— porque un profesor necesita saber contra qué escala
 * se está calificando; simplemente no es un campo editable.
 */
function InstitutionalPanel() {
  const { institutionName, gradeScale, academicLevels, feedbackLanguage } =
    ACTIVE_INSTITUTION;

  const rows: [string, string][] = [
    ["Institución", institutionName],
    [
      "Escala",
      `${gradeScale.min} a ${gradeScale.max}, aprueba con ${gradeScale.passingGrade}`,
    ],
    ["Niveles académicos", academicLevels.map((l) => l.label).join(", ")],
    ["Idioma del feedback", resolveLanguage(feedbackLanguage).label],
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 text-sm">
            <dt className="w-40 shrink-0 text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-xs text-slate-500">
        Definido por la institución, igual para todos los profesores. La escala
        no se puede cambiar a propósito: las calificaciones se guardan en sus
        unidades, así que cambiarla reinterpretaría todo tu historial.
      </p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
