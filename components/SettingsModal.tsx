"use client";

import { useEffect, useState } from "react";
import {
  getAiConfig,
  setAiConfig,
  KEYED_PROVIDERS,
  type AiProvider,
  type KeyedProvider,
} from "../services/aiConfig";
import { getJob } from "../services/api";
import { getLocalModelStatus, requestLocalModelDownload, type LocalModelStatus } from "../services/localModel";
import { ProgressStatus, type ProgressState } from "./ProgressStatus";

interface SettingsModalProps {
  onClose: () => void;
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Google Gemini",
  deepseek: "DeepSeek",
  qwen: "Alibaba Qwen",
  openai: "OpenAI ChatGPT",
  anthropic: "Anthropic Claude",
  local: "Modelo local",
};

const PROVIDER_KEY_LINKS: Record<AiProvider, string> = {
  gemini: "Gratis en aistudio.google.com/apikey",
  deepseek: "platform.deepseek.com/api_keys",
  qwen: "bailian.console.alibabacloud.com",
  openai: "platform.openai.com/api-keys",
  anthropic: "console.anthropic.com",
  local: "Sin API key — corre en tu propio equipo",
};

const PROVIDERS: AiProvider[] = [...KEYED_PROVIDERS, "local"];

const SIN_CLAVES: Record<KeyedProvider, string> = {
  gemini: "",
  deepseek: "",
  qwen: "",
  openai: "",
  anthropic: "",
};

function formatMB(bytes?: number): string {
  if (!bytes) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

async function pollJob(jobId: string, onUpdate: (job: Awaited<ReturnType<typeof getJob>>) => void) {
  for (;;) {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "done" || job.status === "error") return job;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<AiProvider>("gemini");
  // Una entrada por proveedor: lo que el usuario escribe ahora. Vacío = no tocar la guardada.
  const [keys, setKeys] = useState<Record<KeyedProvider, string>>(SIN_CLAVES);
  const [hasKey, setHasKey] = useState<Record<KeyedProvider, boolean>>({ ...SIN_CLAVES } as unknown as Record<KeyedProvider, boolean>);
  const [chain, setChain] = useState<AiProvider[]>([]);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [localModelFallback, setLocalModelFallback] = useState(true);
  const [saved, setSaved] = useState(false);

  const [modelStatus, setModelStatus] = useState<LocalModelStatus | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ProgressState | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    getAiConfig()
      .then((existing) => {
        setProvider(existing.provider);
        setHasKey(existing.hasKey);
        setChain(existing.chain);
        setImageGenerationEnabled(existing.imageGenerationEnabled);
        setLocalModelFallback(existing.localModelFallback);
      })
      .catch(() => {
        // Si falla, se queda con los valores por defecto.
      });
    getLocalModelStatus()
      .then(setModelStatus)
      .catch(() => {
        // Si falla, se asume que no está descargado.
      });
  }, []);

  const handleSave = async () => {
    // Solo viajan las claves que se escribieron: una vacía significa «no la toques», no «bórrala».
    const escritas: Partial<Record<KeyedProvider, string>> = {};
    for (const p of KEYED_PROVIDERS) {
      const valor = keys[p].trim();
      if (valor.length > 0) escritas[p] = valor;
    }
    const updated = await setAiConfig({ provider, keys: escritas, imageGenerationEnabled, localModelFallback });
    setHasKey(updated.hasKey);
    setChain(updated.chain);
    setImageGenerationEnabled(updated.imageGenerationEnabled);
    setLocalModelFallback(updated.localModelFallback);
    setKeys(SIN_CLAVES);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  /** Borra la credencial de un proveedor concreto, no las de todos. */
  const handleClearProvider = async (p: KeyedProvider) => {
    const updated = await setAiConfig({ keys: { [p]: "" } });
    setHasKey(updated.hasKey);
    setChain(updated.chain);
    setKeys((prev) => ({ ...prev, [p]: "" }));
  };

  const handleDownloadModel = async () => {
    setDownloadError(null);
    setDownloadProgress({ status: "queued", progress: 0, message: "Solicitando la descarga…", busy: true });
    try {
      const { jobId } = await requestLocalModelDownload();
      const finalJob = await pollJob(jobId, (job) => {
        setDownloadProgress({
          status: job.status as ProgressState["status"],
          progress: job.progress,
          message: job.message,
          busy: true,
        });
      });
      if (finalJob.status === "error") {
        setDownloadError(finalJob.error ?? "No se pudo descargar el modelo. Intenta de nuevo.");
        setDownloadProgress(null);
        return;
      }
      setDownloadProgress({ status: "done", progress: 100, message: "Modelo listo.", busy: false });
      const status = await getLocalModelStatus();
      setModelStatus(status);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "No se pudo descargar el modelo.");
      setDownloadProgress(null);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-heading">Configuración de IA</h2>
        <p className="field-hint">
          Puedes usar tu propia API key gratuita, o un modelo local que corre en tu propio equipo sin necesidad de
          ninguna key, para generar contenido real a partir de tus documentos en vez del modo simulado por defecto.
        </p>

        <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
          <legend className="field-legend">Proveedor</legend>
          <div className="option-grid" role="radiogroup" aria-label="Proveedor de IA">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={provider === p}
                className="option-card"
                data-selected={provider === p}
                onClick={() => setProvider(p)}
              >
                <h3>{PROVIDER_LABELS[p]}</h3>
                <p>{PROVIDER_KEY_LINKS[p]}</p>
              </button>
            ))}
          </div>
        </fieldset>

        {provider === "local" ? (
          <div className="field-group">
            <span className="field-legend">Modelo local</span>
            <p className="field-hint">
              Se descarga una sola vez (~2 GB) y luego funciona sin conexión, sin costo y sin ninguna key — a cambio,
              genera contenido más lento y de menor calidad que Gemini o Claude.
            </p>
            {modelStatus?.downloaded ? (
              <p className="field-hint">
                <strong>Modelo listo</strong> ({formatMB(modelStatus.sizeBytes)} en disco).
              </p>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={handleDownloadModel} disabled={downloadProgress?.busy}>
                <span className="btn-label" data-label="Descargar modelo">
                  Descargar modelo
                </span>
              </button>
            )}
            {downloadError && <p className="field-hint">{downloadError}</p>}
            {downloadProgress && <ProgressStatus state={downloadProgress} />}
          </div>
        ) : (
          <div className="field-group">
            <span className="field-legend">Credenciales</span>
            <p className="field-hint">
              Puedes guardar varias. Si a una se le agota la cuota o el saldo a mitad de una
              generación, el sistema continúa con la siguiente sin interrumpir el trabajo.
            </p>
            {KEYED_PROVIDERS.map((p) => (
              <div key={p} style={{ marginBottom: "0.75rem" }}>
                <label htmlFor={`ai-key-${p}`}>
                  {PROVIDER_LABELS[p]}
                  {hasKey[p] && <span className="badge badge-ok" style={{ marginLeft: "0.5rem" }}>Guardada</span>}
                  {p === provider && <span className="badge" style={{ marginLeft: "0.4rem" }}>Preferido</span>}
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    id={`ai-key-${p}`}
                    type="password"
                    autoComplete="off"
                    style={{ flex: 1 }}
                    value={keys[p]}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [p]: e.target.value }))}
                    placeholder={hasKey[p] ? "Guardada — escribe una nueva para reemplazarla" : `Pega tu API key de ${PROVIDER_LABELS[p]}`}
                  />
                  {hasKey[p] && (
                    <button type="button" className="btn btn-ghost" onClick={() => handleClearProvider(p)}>
                      <span className="btn-label">Quitar</span>
                    </button>
                  )}
                </div>
                <p className="field-hint">{PROVIDER_KEY_LINKS[p]}</p>
              </div>
            ))}

            <div className="panel" style={{ padding: "0.75rem", marginTop: "0.5rem" }}>
              <strong>Orden de relevo</strong>
              <p className="field-hint" style={{ margin: "0.35rem 0 0" }}>
                {chain.length === 0
                  ? "Sin credenciales guardadas: se trabaja en modo simulado (instantáneo, sin costo)."
                  : chain.map((p) => PROVIDER_LABELS[p]).join("  →  ")}
              </p>
            </div>
          </div>
        )}

        {provider !== "local" && (
          <div className="field-group">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localModelFallback}
                onChange={(e) => setLocalModelFallback(e.target.checked)}
              />
              <span className="toggle-track" aria-hidden="true">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label-text">Usar el modelo local como último recurso</span>
            </label>
            <p className="field-hint">
              Entra en juego solo si ningún proveedor con credencial responde. Corre en el procesador de este equipo:
              cada llamada tarda varios minutos, así que no alcanza a terminar una presentación completa — para eso se
              usa el modo simulado, que es inmediato. Sigue siendo útil para trabajos cortos (enlaces, cifras,
              minicasos).
            </p>
          </div>
        )}

        <div className="field-group">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={imageGenerationEnabled}
              onChange={(e) => setImageGenerationEnabled(e.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label-text">Generar imágenes ilustrativas con IA</span>
          </label>
          <p className="field-hint">
            Añade una imagen real generada por IA en el caso práctico. Usa tu crédito de API y solo funciona con
            proveedor Gemini{provider !== "gemini" && " (cambia el proveedor arriba para activarla)"}.
          </p>
        </div>

        <div className="actions-row">
          <div />
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <span className="btn-label" data-label="Cerrar">
                Cerrar
              </span>
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              <span className="btn-label" data-label={saved ? "Guardado ✓" : "Guardar"}>
                {saved ? "Guardado ✓" : "Guardar"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
