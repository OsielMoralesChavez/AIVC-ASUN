"use client";

import { PresentationPreview } from "./PresentationPreview";
import type { VoiceProfileSummary } from "../types/training";
import { ACADEMIC_LEVEL_LABELS, type AcademicLevel } from "../types/presentation";
import { DECK_TYPE_LABELS, INSTITUTION_SCOPE_LABELS, type InstitutionScope, type UnirDeckContent, type UnirSessionType } from "../types/unir";
import type { WizardFile } from "../types/wizard";
import { ProgressStatus, type ProgressState } from "./ProgressStatus";

interface ReviewStepProps {
  files: WizardFile[];
  academicLevel: AcademicLevel;
  durationMinutes: number;
  institutionScope: InstitutionScope | null;
  sessionType: UnirSessionType;
  onGenerate: () => void;
  progress: ProgressState | null;
  voiceProfiles: VoiceProfileSummary[];
  useVoiceProfile: boolean;
  onUseVoiceProfileChange: (value: boolean) => void;
  voiceProfileId: string | null;
  onVoiceProfileIdChange: (id: string) => void;
  content: UnirDeckContent | null;
  onContinueToEditor: () => void;
}

export function ReviewStep({
  files,
  academicLevel,
  durationMinutes,
  institutionScope,
  sessionType,
  onGenerate,
  progress,
  voiceProfiles,
  useVoiceProfile,
  onUseVoiceProfileChange,
  voiceProfileId,
  onVoiceProfileIdChange,
  content,
  onContinueToEditor,
}: ReviewStepProps) {
  const usableFiles = files.filter((f) => f.status === "valid" && f.hasSufficientText);
  const previewableContent = content && content.type !== "repaso" ? content : null;

  return (
    <section className="panel" aria-labelledby="step4-heading">
      <h2 id="step4-heading">Revisión</h2>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">Documentos</div>
          <div className="value">{usableFiles.length}</div>
        </div>
        <div className="summary-item">
          <div className="label">Nivel</div>
          <div className="value">{ACADEMIC_LEVEL_LABELS[academicLevel]}</div>
        </div>
        <div className="summary-item">
          <div className="label">Duración</div>
          <div className="value">{durationMinutes} min</div>
        </div>
        <div className="summary-item">
          <div className="label">Sede</div>
          <div className="value">{institutionScope ? INSTITUTION_SCOPE_LABELS[institutionScope] : "—"}</div>
        </div>
        <div className="summary-item">
          <div className="label">Modalidad</div>
          <div className="value">{DECK_TYPE_LABELS[sessionType]}</div>
        </div>
      </div>

      <ul aria-label="Documentos que se usarán">
        {usableFiles.map((f) => (
          <li key={f.localId}>{f.file.name}</li>
        ))}
      </ul>

      {voiceProfiles.length > 0 && (
        <div className="field-group">
          <label className="toggle-switch">
            <input type="checkbox" checked={useVoiceProfile} onChange={(e) => onUseVoiceProfileChange(e.target.checked)} />
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label-text">Usar mi perfil de tono de voz</span>
          </label>
          {useVoiceProfile && (
            <select
              aria-label="Perfil de tono de voz a aplicar"
              value={voiceProfileId ?? ""}
              onChange={(e) => onVoiceProfileIdChange(e.target.value)}
              style={{ marginTop: "0.5rem" }}
            >
              {voiceProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <p className="field-hint">
            Entrenado en la sección &quot;Entrenamiento&quot;. En modo simulado el tono no se puede reescribir
            automáticamente; configura tu API key en Ajustes para activarlo.
          </p>
        </div>
      )}

      {progress && <ProgressStatus state={progress} />}

      <div className="actions-row">
        <div />
        <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={progress?.busy}>
          <span className="btn-label" data-label={previewableContent ? "Generar de nuevo" : "Generar esquema"}>
            {previewableContent ? "Generar de nuevo" : "Generar esquema"}
          </span>
        </button>
      </div>

      {content && (
        <div className="field-group" style={{ marginTop: "1.5rem" }}>
          {previewableContent ? (
            <>
              <span className="field-legend">Vista previa</span>
              <p className="field-hint">
                Así se vería tu presentación. Si quieres ajustar algo, continúa a la edición completa.
              </p>
              <PresentationPreview content={previewableContent} />
            </>
          ) : (
            <p className="field-hint">Esquema generado. Continúa a la edición completa para revisarlo.</p>
          )}
          <div className="actions-row">
            <div />
            <button type="button" className="btn btn-primary" onClick={onContinueToEditor}>
              <span className="btn-label" data-label="Continuar a edición">
                Continuar a edición
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
