"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banner } from "../components/Banner";
import { SettingsModal } from "../components/SettingsModal";
import {
  getUserConfiguration,
  updateGradingSettings,
  type GradingSettingsPatch,
  type UserConfiguration,
} from "../services/configurationApi";
import { ApiError } from "../services/httpClient";

/**
 * Página global de Configuración — punto ÚNICO para ajustes de toda la app. Absorbe los que
 * antes vivían dentro del Calificador (identidad docente, defaults de calificación, modelo y
 * espera de Gemini), que ya escribían este mismo AppSettings desde un segundo formulario.
 *
 * La conexión con IA (proveedor y API keys) sigue siendo la implementación canónica que ya
 * funcionaba: se reutiliza `SettingsModal` tal cual en la pestaña de IA en vez de duplicar sus
 * campos aquí.
 */
type Tab = "general" | "ia" | "calificador" | "apariencia";

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: "general", label: "General", description: "Identidad docente e institución." },
  { id: "ia", label: "Inteligencia artificial", description: "Proveedor, credenciales y modelo." },
  { id: "calificador", label: "Calificador", description: "Valores por defecto de las evaluaciones." },
  { id: "apariencia", label: "Apariencia", description: "Modo visual y paleta." },
];

const SEVERITY_LABELS = ["Muy indulgente", "Indulgente", "Equilibrada", "Exigente", "Muy exigente"];

export function ConfiguracionPage({ onOpenAppearance }: { onOpenAppearance?: () => void }) {
  const [tab, setTab] = useState<Tab>("general");
  const [config, setConfig] = useState<UserConfiguration | null>(null);
  const [draft, setDraft] = useState<GradingSettingsPatch>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await getUserConfiguration());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Valor efectivo = lo guardado con el borrador encima, para que la vista siempre muestre lo
   * que se va a guardar y no una mezcla desincronizada. */
  const effective = useMemo(() => {
    if (!config) return null;
    return { ...config.grading, ...draft };
  }, [config, draft]);

  const dirty = Object.keys(draft).length > 0;

  const set = <K extends keyof GradingSettingsPatch>(key: K, value: GradingSettingsPatch[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  };

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Se relee la configuración completa desde el servidor tras guardar: si otra pestaña
      // cambió algo entretanto, la vista queda con el estado real y no con el borrador local.
      setConfig(await updateGradingSettings(draft));
      setDraft({});
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p className="field-hint">Cargando configuración…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Configuración</h1>
        <p>Ajustes de toda la aplicación, en un solo lugar.</p>
      </header>

      {error && (
        <Banner type="error" title="Error" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      {savedAt && !dirty && (
        <Banner type="info">Cambios guardados a las {savedAt}.</Banner>
      )}
      {dirty && <Banner type="warning">Tienes cambios sin guardar.</Banner>}

      <nav className="config-tabs" aria-label="Secciones de configuración">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="config-tab"
            data-active={tab === t.id}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "general" && effective && (
        <section className="panel" aria-labelledby="cfg-general">
          <h2 id="cfg-general">Identidad docente</h2>
          <p className="field-hint">Se usa en las presentaciones generadas y en los exportes del Calificador.</p>
          <div className="field-group">
            <label htmlFor="cfg-title">Título</label>
            <input
              id="cfg-title"
              type="text"
              value={effective.teacherTitle}
              onChange={(e) => set("teacherTitle", e.target.value)}
              placeholder="Mtro., Dra., Ing.…"
            />
          </div>
          <div className="field-group">
            <label htmlFor="cfg-name">Nombre</label>
            <input id="cfg-name" type="text" value={effective.teacherName} onChange={(e) => set("teacherName", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Institución</label>
            <input type="text" value={String(effective.feedbackLanguage ? "UNIR México" : "UNIR")} disabled readOnly />
            <span className="field-hint">Definida por el perfil institucional; no editable.</span>
          </div>
        </section>
      )}

      {tab === "ia" && config && (
        <section className="panel" aria-labelledby="cfg-ia">
          <h2 id="cfg-ia">Inteligencia artificial</h2>
          <p className="field-hint">
            Esta es la única conexión con IA de la aplicación. El Calificador, el generador de
            presentaciones y el entrenamiento la usan desde aquí — ninguno guarda credenciales
            propias.
          </p>
          <ul className="data-summary">
            <li>
              <span className="label">Estado</span>
              <span className={config.aiStatus.configured ? "badge badge-ok" : "badge badge-warn"}>
                {config.aiStatus.configured ? "Configurada" : "Sin configurar (modo simulado)"}
              </span>
            </li>
            <li>
              <span className="label">Proveedor</span>
              <span>{config.aiStatus.provider}</span>
            </li>
            <li>
              <span className="label">Modelo</span>
              <span>{config.aiStatus.model}</span>
            </li>
            <li>
              <span className="label">Presentaciones</span>
              <span className={config.aiStatus.presentationsSimulated ? "badge badge-warn" : "badge badge-ok"}>
                {config.aiStatus.presentationsSimulated ? "Modo simulado" : "Contenido real"}
              </span>
            </li>
          </ul>
          {config.aiStatus.presentationWarning && (
            <p className="field-hint">{config.aiStatus.presentationWarning}</p>
          )}
          <div className="actions-row">
            <div />
            <button type="button" className="btn btn-primary" onClick={() => setAiOpen(true)}>
              <span className="btn-label" data-label="Editar conexión">
                Editar conexión
              </span>
            </button>
          </div>
        </section>
      )}

      {tab === "calificador" && effective && config && (
        <section className="panel" aria-labelledby="cfg-cal">
          <h2 id="cfg-cal">Valores por defecto del Calificador</h2>
          <p className="field-hint">Se aplican a cada sesión de calificación nueva. Las ya creadas conservan los suyos.</p>

          <div className="field-group">
            <label htmlFor="cfg-voice">Perfil de voz activo</label>
            <select
              id="cfg-voice"
              value={effective.activeVoiceProfileId ?? ""}
              onChange={(e) => set("activeVoiceProfileId", e.target.value || null)}
            >
              <option value="">Sin perfil (evaluar sin notas de estilo)</option>
              {config.availableVoiceProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Los perfiles se crean y editan en <strong>Entrenamiento</strong>. El Calificador usa el que
              elijas aquí para redactar la retroalimentación con tu estilo.
            </span>
          </div>

          <div className="field-group">
            <label htmlFor="cfg-level">Nivel académico por defecto</label>
            <select id="cfg-level" value={effective.defaultLevelId} onChange={(e) => set("defaultLevelId", e.target.value)}>
              {config.grading.academicLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="cfg-sev">
              Nivel de exigencia: {effective.defaultSeverity} — {SEVERITY_LABELS[effective.defaultSeverity - 1]}
            </label>
            <input
              id="cfg-sev"
              type="range"
              min={1}
              max={5}
              step={1}
              value={effective.defaultSeverity}
              onChange={(e) => set("defaultSeverity", Number(e.target.value))}
            />
          </div>

          <div className="field-group">
            <label htmlFor="cfg-work">Tipo de trabajo por defecto</label>
            <select
              id="cfg-work"
              value={effective.defaultWorkType}
              onChange={(e) => set("defaultWorkType", e.target.value as "individual" | "grupal")}
            >
              <option value="individual">Individual</option>
              <option value="grupal">Grupal</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="cfg-files">Archivos por entrega</label>
            <input
              id="cfg-files"
              type="number"
              min={1}
              max={20}
              value={effective.defaultFilesPerSubmission}
              onChange={(e) => set("defaultFilesPerSubmission", Number(e.target.value))}
            />
          </div>

          <div className="field-group">
            <label htmlFor="cfg-model">Modelo de Gemini (Calificador)</label>
            <input id="cfg-model" type="text" value={effective.geminiModel} onChange={(e) => set("geminiModel", e.target.value)} />
          </div>

          <div className="field-group">
            <label htmlFor="cfg-throttle">Espera entre llamadas (ms)</label>
            <input
              id="cfg-throttle"
              type="number"
              min={0}
              max={60000}
              step={500}
              value={effective.geminiThrottleMs}
              onChange={(e) => set("geminiThrottleMs", Number(e.target.value))}
            />
          </div>
        </section>
      )}

      {tab === "apariencia" && (
        <section className="panel" aria-labelledby="cfg-look">
          <h2 id="cfg-look">Apariencia</h2>
          <p className="field-hint">
            El modo visual y la paleta se editan desde «Personalizar perfil», junto con tu nombre y
            avatar, para no tener dos sitios donde cambiar lo mismo.
          </p>
          <div className="actions-row">
            <div />
            <button type="button" className="btn btn-secondary" onClick={onOpenAppearance} disabled={!onOpenAppearance}>
              <span className="btn-label" data-label="Abrir Personalizar perfil">
                Abrir Personalizar perfil
              </span>
            </button>
          </div>
        </section>
      )}

      {(tab === "general" || tab === "calificador") && (
        <div className="actions-row">
          <button type="button" className="btn btn-text" onClick={() => void load()} disabled={saving}>
            <span className="btn-label" data-label="Restablecer">
              Restablecer
            </span>
          </button>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDraft({})} disabled={!dirty || saving}>
              <span className="btn-label" data-label="Cancelar">
                Cancelar
              </span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!dirty || saving}
              data-loading={saving || undefined}
            >
              <span className="btn-label" data-label="Guardar cambios">
                Guardar cambios
              </span>
            </button>
          </div>
        </div>
      )}

      {aiOpen && (
        <SettingsModal
          onClose={() => {
            setAiOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}
