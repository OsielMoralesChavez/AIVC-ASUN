"use client";

import { useState } from "react";

export type KeyTestState =
  | { status: "sin_probar" }
  | { status: "probando" }
  | { status: "ok"; model: string }
  | { status: "error"; error: string };

/**
 * Campo de la API key de Gemini con botón de "Probar conexión".
 *
 * La prueba es el corazón de la buena experiencia aquí: una API key mal
 * pegada es el error más común y, sin esta comprobación, el usuario no se
 * enteraría hasta que fallara la primera calificación (después de haber
 * subido rúbrica, instrucciones y 40 trabajos).
 *
 * Lo usan el asistente inicial y la pantalla de Ajustes.
 */
export function ApiKeyField({
  value,
  onChange,
  model,
  testState,
  onTestStateChange,
  label = "API key de Google Gemini",
  optional = false,
  helpText,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Modelo con el que se hace la prueba. */
  model: string;
  testState: KeyTestState;
  onTestStateChange: (state: KeyTestState) => void;
  label?: string;
  optional?: boolean;
  helpText?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  async function handleTest() {
    onTestStateChange({ status: "probando" });
    try {
      const res = await fetch("/api/setup/probar-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: value, model }),
      });
      const data = await res.json();
      if (data.ok) {
        onTestStateChange({ status: "ok", model: data.model });
      } else {
        onTestStateChange({
          status: "error",
          error: data.error ?? "La API key no funcionó.",
        });
      }
    } catch {
      onTestStateChange({
        status: "error",
        error:
          "No se pudo contactar a la aplicación para hacer la prueba. Revisa que siga abierta e intenta de nuevo.",
      });
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-slate-500">(opcional)</span>
        )}
      </label>
      <div className="flex gap-2">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            // Cualquier cambio invalida la prueba anterior: el resultado
            // "ok" ya no corresponde a lo que está escrito.
            onTestStateChange({ status: "sin_probar" });
          }}
          placeholder="AIza…"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Ocultar la API key" : "Mostrar la API key"}
          aria-pressed={visible}
          title={visible ? "Ocultar" : "Mostrar"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          {visible ? "🙈" : "👁"}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={!value.trim() || testState.status === "probando"}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:opacity-40"
        >
          {testState.status === "probando" ? "Probando…" : "Probar conexión"}
        </button>
      </div>

      {helpText && <p className="mt-1.5 text-xs text-slate-500">{helpText}</p>}

      {testState.status === "ok" && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ✓ La conexión funciona. Respondió el modelo{" "}
          <strong>{testState.model}</strong>.
        </p>
      )}
      {testState.status === "error" && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {testState.error}
        </p>
      )}
    </div>
  );
}
