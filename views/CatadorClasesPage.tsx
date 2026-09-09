"use client";

import { useEffect, useRef, useState } from "react";
import { Banner } from "../components/Banner";
import {
  createRubric,
  deleteRubric,
  getCatadorSettings,
  getReview,
  listReviews,
  listRubrics,
  runCatadorUpdate,
  updateCatadorSettings,
  uploadReviewVideo,
} from "../services/catadorApi";
import { getJob } from "../services/api";
import type {
  CatadorSettings,
  ClassReview,
  ClassReviewSummary,
  Rubric,
  RubricCriterion,
  UpdateRunResult,
} from "../lib/types/catador";

const STATUS_LABELS: Record<ClassReviewSummary["status"], string> = {
  pending: "En cola",
  processing: "Procesando",
  done: "Lista",
  error: "Error",
};

function emptyCriterion(): RubricCriterion {
  return { id: crypto.randomUUID(), label: "", description: "", maxScore: 10 };
}

/** Formulario de rúbrica: nueva o edición — reutiliza el mismo bloque de criterios dinámicos. */
function RubricForm({ onCreated }: { onCreated: (rubric: Rubric) => void }) {
  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState<RubricCriterion[]>([emptyCriterion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && criteria.every((c) => c.label.trim().length > 0);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const rubric = await createRubric(
        name.trim(),
        criteria.map((c) => ({ ...c, description: c.description.trim() || c.label.trim() }))
      );
      onCreated(rubric);
      setName("");
      setCriteria([emptyCriterion()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la rúbrica.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel" style={{ padding: "1rem" }}>
      <h3>Nueva rúbrica</h3>
      {error && <p className="field-hint">{error}</p>}
      <div className="field-group">
        <label htmlFor="rubric-name">Nombre</label>
        <input id="rubric-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Rúbrica de clase magistral" />
      </div>

      {criteria.map((c, i) => (
        <div key={c.id} className="panel" style={{ padding: "0.75rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                aria-label={`Criterio ${i + 1}`}
                placeholder="Nombre del criterio (ej. Claridad expositiva)"
                value={c.label}
                onChange={(e) =>
                  setCriteria((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
                style={{ marginBottom: "0.4rem" }}
              />
              <textarea
                aria-label={`Descripción del criterio ${i + 1}`}
                placeholder="Qué debe cumplir el video para este criterio"
                value={c.description}
                onChange={(e) =>
                  setCriteria((prev) => prev.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                }
                rows={2}
              />
            </div>
            <input
              type="number"
              aria-label={`Puntaje máximo del criterio ${i + 1}`}
              value={c.maxScore}
              min={1}
              max={100}
              onChange={(e) =>
                setCriteria((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, maxScore: Number(e.target.value) || 1 } : x))
                )
              }
              style={{ width: "5rem" }}
            />
            {criteria.length > 1 && (
              <button type="button" className="btn btn-ghost" onClick={() => setCriteria((prev) => prev.filter((_, j) => j !== i))}>
                <span className="btn-label">Quitar</span>
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="actions-row" style={{ marginTop: "0.6rem" }}>
        <button type="button" className="btn btn-secondary" onClick={() => setCriteria((prev) => [...prev, emptyCriterion()])}>
          <span className="btn-label">+ Añadir criterio</span>
        </button>
        <button type="button" className="btn btn-primary" disabled={!canSave || saving} onClick={save}>
          <span className="btn-label" data-label={saving ? "Guardando…" : "Crear rúbrica"}>
            {saving ? "Guardando…" : "Crear rúbrica"}
          </span>
        </button>
      </div>
    </div>
  );
}

function ReviewDetail({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<ClassReview | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReview(reviewId).then((r) => !cancelled && setReview(r));
    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  if (!review) return <p className="field-hint">Cargando…</p>;

  return (
    <div className="panel" style={{ padding: "0.85rem" }}>
      {review.simulated && (
        <Banner type="warning">
          Revisión simulada: no había una API key de Gemini configurada, así que los puntajes son marcadores de
          posición. Configúrala en Configuración → Inteligencia artificial para una evaluación real.
        </Banner>
      )}
      {review.transcriptSummary && <p>{review.transcriptSummary}</p>}
      <ul aria-label="Puntajes por criterio" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {review.scores.map((s) => (
          <li key={s.criterionId}>
            <div className="file-meta">
              <div className="file-name">{s.criterionId}</div>
              <div className="file-sub">{s.score} pts</div>
            </div>
            <p style={{ margin: "0.2rem 0 0" }}>{s.justification}</p>
          </li>
        ))}
      </ul>
      {review.overallNotes && (
        <p className="field-hint" style={{ marginTop: "0.5rem" }}>
          {review.overallNotes}
        </p>
      )}
    </div>
  );
}

function SettingsPanel({ onSaved }: { onSaved: () => void }) {
  const [settings, setSettings] = useState<CatadorSettings | null>(null);
  const [excelFolderPath, setExcelFolderPath] = useState("");
  const [powerBi, setPowerBi] = useState({ tenantId: "", clientId: "", clientSecret: "", workspaceId: "", datasetName: "", tableName: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCatadorSettings().then((s) => {
      setSettings(s);
      setExcelFolderPath(s.excelFolderPath);
      setPowerBi({
        tenantId: s.powerBi.tenantId,
        clientId: s.powerBi.clientId,
        clientSecret: "",
        workspaceId: s.powerBi.workspaceId,
        datasetName: s.powerBi.datasetName,
        tableName: s.powerBi.tableName,
      });
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateCatadorSettings({
        excelFolderPath,
        powerBi: {
          tenantId: powerBi.tenantId,
          clientId: powerBi.clientId,
          ...(powerBi.clientSecret.trim() ? { clientSecret: powerBi.clientSecret.trim() } : {}),
          workspaceId: powerBi.workspaceId,
          datasetName: powerBi.datasetName,
          tableName: powerBi.tableName,
        },
      });
      setSettings(updated);
      setPowerBi((prev) => ({ ...prev, clientSecret: "" }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="panel" style={{ padding: "1rem" }}>
      <h3>Exportación</h3>
      <div className="field-group">
        <label htmlFor="excel-folder">Carpeta del Excel (OneDrive/red)</label>
        <input
          id="excel-folder"
          type="text"
          value={excelFolderPath}
          onChange={(e) => setExcelFolderPath(e.target.value)}
          placeholder="Ruta de la carpeta compartida con las dos personas autorizadas"
        />
        <p className="field-hint">
          El control de acceso lo maneja esa carpeta compartida — la aplicación solo escribe ahí el archivo
          «catador-de-clases.xlsx» al pulsar «Actualizar».
        </p>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Power BI</h3>
      <p className="field-hint">
        Requiere un Azure App Registration con permisos sobre un workspace de Power BI Pro/Premium.
      </p>
      <div className="field-group">
        <label htmlFor="pbi-tenant">Tenant ID</label>
        <input id="pbi-tenant" type="text" value={powerBi.tenantId} onChange={(e) => setPowerBi((p) => ({ ...p, tenantId: e.target.value }))} />
      </div>
      <div className="field-group">
        <label htmlFor="pbi-client">Client ID</label>
        <input id="pbi-client" type="text" value={powerBi.clientId} onChange={(e) => setPowerBi((p) => ({ ...p, clientId: e.target.value }))} />
      </div>
      <div className="field-group">
        <label htmlFor="pbi-secret">
          Client secret {settings.powerBi.hasClientSecret && <span className="badge badge-ok">Guardado</span>}
        </label>
        <input
          id="pbi-secret"
          type="password"
          autoComplete="off"
          value={powerBi.clientSecret}
          onChange={(e) => setPowerBi((p) => ({ ...p, clientSecret: e.target.value }))}
          placeholder={settings.powerBi.hasClientSecret ? "Guardado — escribe uno nuevo para reemplazarlo" : "Client secret"}
        />
      </div>
      <div className="field-group">
        <label htmlFor="pbi-workspace">Workspace ID</label>
        <input id="pbi-workspace" type="text" value={powerBi.workspaceId} onChange={(e) => setPowerBi((p) => ({ ...p, workspaceId: e.target.value }))} />
      </div>
      <div className="field-group">
        <label htmlFor="pbi-dataset">Nombre del dataset</label>
        <input id="pbi-dataset" type="text" value={powerBi.datasetName} onChange={(e) => setPowerBi((p) => ({ ...p, datasetName: e.target.value }))} />
      </div>

      <div className="actions-row">
        <div />
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
          <span className="btn-label" data-label={saved ? "Guardado ✓" : "Guardar"}>
            {saved ? "Guardado ✓" : "Guardar"}
          </span>
        </button>
      </div>
    </div>
  );
}

export function CatadorClasesPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [reviews, setReviews] = useState<ClassReviewSummary[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateRunResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshReviews() {
    setReviews(await listReviews());
  }

  useEffect(() => {
    listRubrics().then((rs) => {
      setRubrics(rs);
      if (rs.length > 0) setSelectedRubricId((prev) => prev || rs[0].id);
    });
    refreshReviews();
  }, []);

  async function pollUntilDone(jobId: string) {
    for (;;) {
      const job = await getJob(jobId);
      if (job.status === "done" || job.status === "error") {
        await refreshReviews();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedRubricId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { jobId } = await uploadReviewVideo(selectedRubricId, file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshReviews();
      pollUntilDone(jobId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir el video.");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdate() {
    setUpdating(true);
    try {
      setUpdateResult(await runCatadorUpdate());
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteRubric(id: string) {
    await deleteRubric(id);
    setRubrics((prev) => prev.filter((r) => r.id !== id));
    if (selectedRubricId === id) setSelectedRubricId("");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="actions-row" style={{ marginTop: 0 }}>
          <div>
            <h1>Catador de clases</h1>
            <p>Sube un video de una sesión y revísalo automáticamente contra una rúbrica.</p>
          </div>
          <button type="button" className="btn btn-primary" disabled={updating} onClick={handleUpdate}>
            <span className="btn-label" data-label={updating ? "Actualizando…" : "Actualizar"}>
              {updating ? "Actualizando…" : "Actualizar"}
            </span>
          </button>
        </div>
      </header>

      {updateResult && (
        <Banner type={updateResult.excelError || updateResult.powerBiError ? "warning" : "info"}>
          {updateResult.excelPath && <p>Excel actualizado: {updateResult.excelPath}</p>}
          {updateResult.excelError && <p>Excel: {updateResult.excelError}</p>}
          {!updateResult.powerBiConfigured && <p>Power BI no está configurado — ábrelo en «Exportación» más abajo.</p>}
          {updateResult.powerBiConfigured && updateResult.powerBiPushed && <p>Dashboard de Power BI actualizado.</p>}
          {updateResult.powerBiError && <p>Power BI: {updateResult.powerBiError}</p>}
        </Banner>
      )}

      <section className="panel" aria-label="Rúbricas">
        <h2>Rúbricas</h2>
        {rubrics.length === 0 ? (
          <p className="field-hint">Crea una rúbrica abajo para poder subir el primer video.</p>
        ) : (
          <ul aria-label="Lista de rúbricas" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {rubrics.map((r) => (
              <li key={r.id} className="option-card" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem" }}>
                <div style={{ flex: 1 }}>
                  <h3>{r.name}</h3>
                  <p>{r.criteria.length} criterio(s)</p>
                </div>
                <button type="button" className="btn-text" style={{ color: "var(--color-danger)" }} onClick={() => handleDeleteRubric(r.id)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
        <RubricForm onCreated={(r) => setRubrics((prev) => [r, ...prev])} />
      </section>

      <section className="panel" aria-label="Subir video">
        <h2>Subir video</h2>
        {rubrics.length === 0 ? (
          <p className="field-hint">Necesitas al menos una rúbrica.</p>
        ) : (
          <>
            <div className="field-group">
              <label htmlFor="review-rubric">Rúbrica</label>
              <select id="review-rubric" value={selectedRubricId} onChange={(e) => setSelectedRubricId(e.target.value)}>
                {rubrics.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bullet-row">
              <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo" aria-label="Video de la clase" />
              <button type="button" className="btn btn-primary" disabled={uploading} onClick={handleUpload}>
                <span className="btn-label" data-label={uploading ? "Subiendo…" : "Subir y revisar"}>
                  {uploading ? "Subiendo…" : "Subir y revisar"}
                </span>
              </button>
            </div>
            {uploadError && <p className="field-hint">{uploadError}</p>}
          </>
        )}
      </section>

      <section className="panel" aria-label="Videos revisados">
        <h2>Videos revisados</h2>
        {reviews.length === 0 ? (
          <p className="field-hint">Todavía no hay videos subidos.</p>
        ) : (
          <ul aria-label="Lista de revisiones" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {reviews.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="option-card"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => setExpandedReviewId((prev) => (prev === r.id ? null : r.id))}
                >
                  <div className="file-meta">
                    <div className="file-name">{r.videoFileName}</div>
                    <div className="file-sub">
                      {r.rubricName} · {STATUS_LABELS[r.status]}
                      {r.overallScore !== null ? ` · ${r.overallScore}%` : ""}
                      {r.simulated ? " · simulado" : ""}
                    </div>
                  </div>
                </button>
                {expandedReviewId === r.id && <ReviewDetail reviewId={r.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-label="Exportación">
        <div className="actions-row" style={{ marginTop: 0 }}>
          <h2 style={{ margin: 0 }}>Exportación</h2>
          <button type="button" className="btn btn-secondary" onClick={() => setShowSettings((v) => !v)}>
            <span className="btn-label">{showSettings ? "Ocultar" : "Configurar Excel y Power BI"}</span>
          </button>
        </div>
        {showSettings && <SettingsPanel onSaved={() => {}} />}
      </section>
    </div>
  );
}
