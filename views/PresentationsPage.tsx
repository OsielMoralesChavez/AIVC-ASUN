"use client";
import { useEffect, useState } from "react";
import { AcademicConfigStep } from "../components/AcademicConfigStep";
import { useBackgroundJobs } from "../components/BackgroundJobsProvider";
import { Banner } from "../components/Banner";
import { DocumentUploadStep } from "../components/DocumentUploadStep";
import { NormalLikeEditor } from "../components/editors/NormalLikeEditor";
import { PrimeraClaseEditor } from "../components/editors/PrimeraClaseEditor";
import { RepasoEditor } from "../components/editors/RepasoEditor";
import { PrimeraClaseFields } from "../components/PrimeraClaseFields";
import { ReviewStep } from "../components/ReviewStep";
import { SessionTypeStep } from "../components/SessionTypeStep";
import { StepIndicator, type WizardStepDef } from "../components/StepIndicator";
import { usePresentationWizard } from "../hooks/usePresentationWizard";
import { DECK_TYPE_LABELS } from "../types/unir";

const STEPS: WizardStepDef[] = [
  { step: 1, label: "Documentos" },
  { step: 2, label: "Configuración" },
  { step: 3, label: "Modalidad" },
  { step: 4, label: "Revisión" },
  { step: 5, label: "Esquema y descarga" },
];

interface PresentationsPageProps {
  materiaId: string;
  onPresentationCreated?: () => void;
}

export function PresentationsPage({ materiaId, onPresentationCreated }: PresentationsPageProps) {
  const wizard = usePresentationWizard(materiaId, onPresentationCreated);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  /**
   * Cuando una generación en segundo plano termina mientras el docente YA está en esta pantalla,
   * la lista de presentaciones no se enteraría: solo se refresca al montar y tras las acciones de
   * la propia página. Aquí se vuelve a pedir en cuanto el rastreador cierra un trabajo.
   */
  const backgroundJobs = useBackgroundJobs();
  const finishedCount = backgroundJobs
    ? backgroundJobs.jobs.filter((j) => j.status === "done" || j.status === "error").length
    : 0;
  const refreshList = wizard.refreshSessionPresentations;
  useEffect(() => {
    if (finishedCount > 0) void refreshList();
  }, [finishedCount, refreshList]);

  const usableFileCount = wizard.files.filter((f) => f.status === "valid" && f.hasSufficientText).length;

  const canLeaveStep1 = usableFileCount > 0;
  const canLeaveStep2 =
    wizard.configFields.academicLevel !== null && !wizard.durationError && wizard.configFields.institutionScope !== null;
  const canLeaveStep3 = wizard.sessionType !== null;

  const hasNonRepasoDecks = wizard.sessionPresentations.some((p) => p.deckType !== "repaso");

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Sistema de presentaciones</h1>
        <p>Convierte tus documentos PDF en una presentación PowerPoint con identidad visual UNIR.</p>
      </header>

      {/* Presentaciones ya generadas en esta asignatura. Va FUERA del paso 5 a propósito: con la
          generación en segundo plano, el docente puede irse a otra sección y volver, y entonces el
          asistente remonta en el paso 1 — antes, sus presentaciones seguían guardadas pero no
          había ningún camino en la interfaz para abrirlas ni descargarlas. */}
      {wizard.sessionPresentations.length > 0 && wizard.step !== 5 && (
        <section className="panel" aria-labelledby="generadas-heading">
          <h2 id="generadas-heading">Presentaciones de esta asignatura</h2>
          <p className="field-hint">
            Ya generadas y guardadas. Ábrelas para revisarlas, editarlas o generar su archivo.
          </p>
          <ul className="materia-rows" aria-label="Presentaciones generadas">
            {wizard.sessionPresentations.map((p) => (
              <li key={p.id} className="materia-row">
                <div className="materia-row-main">
                  <strong>{p.title}</strong>
                  <span className="field-hint">
                    {DECK_TYPE_LABELS[p.deckType]} · {new Date(p.createdAt).toLocaleDateString()}
                    {p.hasFile ? "" : " · sin archivo todavía"}
                  </span>
                </div>
                <div className="materia-row-actions">
                  <button type="button" className="btn btn-text materia-action" onClick={() => void wizard.openPresentation(p.id)}>
                    <span className="materia-action-text">Abrir</span>
                  </button>
                  {p.hasFile && (
                    <button
                      type="button"
                      className="btn btn-text materia-action"
                      onClick={() => void wizard.downloadBulkItem(p.id, p.title)}
                    >
                      <span className="materia-action-text">Descargar</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <StepIndicator
        steps={STEPS}
        currentStep={wizard.step}
        maxReachedStep={wizard.maxReachedStep}
        onNavigate={wizard.goToStep}
      />

      {wizard.step === 1 && (
        <>
          <DocumentUploadStep
            files={wizard.files}
            onAddFiles={wizard.addFiles}
            onRemoveFile={wizard.removeFile}
            uploadError={wizard.uploadError}
            pendingRole={wizard.pendingRole}
            onPendingRoleChange={wizard.setPendingRole}
          />
          <div className="actions-row">
            <div />
            <button type="button" className="btn btn-primary" disabled={!canLeaveStep1} onClick={() => wizard.advanceTo(2)}>
              <span className="btn-label" data-label="Siguiente">
                Siguiente
              </span>
            </button>
          </div>
        </>
      )}

      {wizard.step === 2 && (
        <>
          <AcademicConfigStep fields={wizard.configFields} durationError={wizard.durationError} onFieldChange={wizard.setConfigField} />
          <div className="actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => wizard.goToStep(1)}>
              <span className="btn-label" data-label="Anterior">
                Anterior
              </span>
            </button>
            <button type="button" className="btn btn-primary" disabled={!canLeaveStep2} onClick={() => wizard.advanceTo(3)}>
              <span className="btn-label" data-label="Siguiente">
                Siguiente
              </span>
            </button>
          </div>
        </>
      )}

      {wizard.step === 3 && (
        <>
          <SessionTypeStep
            sessionType={wizard.sessionType}
            onChange={wizard.setSessionType}
            bulkProgress={wizard.bulkProgress}
            bulkError={wizard.bulkError}
            bulkResults={wizard.bulkResults}
            onGenerateBulk={wizard.generateBulk}
            onDownloadBulkItem={wizard.downloadBulkItem}
          />
          {wizard.sessionType === "primera-clase" && (
            <PrimeraClaseFields values={wizard.primeraClaseFields} onChange={wizard.setPrimeraClaseField} />
          )}
          <div className="actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => wizard.goToStep(2)}>
              <span className="btn-label" data-label="Anterior">
                Anterior
              </span>
            </button>
            <button type="button" className="btn btn-primary" disabled={!canLeaveStep3} onClick={() => wizard.advanceTo(4)}>
              <span className="btn-label" data-label="Siguiente">
                Siguiente
              </span>
            </button>
          </div>
        </>
      )}

      {wizard.step === 4 && wizard.configFields.academicLevel && wizard.sessionType && (
        <>
          {wizard.schemaError && (
            <Banner type="error" title="No se pudo generar el esquema" onRetry={wizard.generateSchema}>
              {wizard.schemaError}
            </Banner>
          )}
          <ReviewStep
            files={wizard.files}
            academicLevel={wizard.configFields.academicLevel}
            durationMinutes={wizard.configFields.durationMinutes}
            institutionScope={wizard.configFields.institutionScope}
            sessionType={wizard.sessionType}
            onGenerate={wizard.generateSchema}
            progress={wizard.schemaProgress}
            voiceProfiles={wizard.voiceProfiles}
            useVoiceProfile={wizard.useVoiceProfile}
            onUseVoiceProfileChange={wizard.setUseVoiceProfile}
            voiceProfileId={wizard.voiceProfileId}
            onVoiceProfileIdChange={wizard.setVoiceProfileId}
            content={wizard.content}
            onContinueToEditor={() => wizard.advanceTo(5)}
          />
          <div className="actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => wizard.goToStep(3)}>
              <span className="btn-label" data-label="Anterior">
                Anterior
              </span>
            </button>
            <div />
          </div>
        </>
      )}

      {wizard.step === 5 && wizard.content && (
        <>
          {wizard.sessionPresentations.length > 0 && (
            <section className="panel" aria-label="Presentaciones generadas en esta sesión">
              <h2>Presentaciones de esta sesión</h2>
              <ul aria-label="Lista de presentaciones generadas">
                {wizard.sessionPresentations.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="btn btn-text" onClick={() => wizard.loadPresentation(p.id)}>
                      {DECK_TYPE_LABELS[p.deckType]} — {p.title}
                    </button>
                  </li>
                ))}
              </ul>
              {hasNonRepasoDecks && (
                <div className="actions-row">
                  <button type="button" className="btn btn-secondary" onClick={wizard.generateRepaso} disabled={wizard.schemaProgress?.busy}>
                    <span className="btn-label" data-label="Generar repaso general">
                      Generar repaso general
                    </span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={wizard.generateTopicMap} disabled={wizard.topicMapBusy}>
                    <span
                      className="btn-label"
                      data-label={wizard.topicMapBusy ? "Generando mapa de temas…" : "Descargar mapa de temas (HTML)"}
                    >
                      {wizard.topicMapBusy ? "Generando mapa de temas…" : "Descargar mapa de temas (HTML)"}
                    </span>
                  </button>
                </div>
              )}
              {wizard.topicMapError && (
                <Banner type="error" title="No se pudo generar el mapa de temas" onRetry={wizard.generateTopicMap}>
                  {wizard.topicMapError}
                </Banner>
              )}
            </section>
          )}

          {wizard.pptxError && (
            <Banner type="error" title="No se pudo generar el PowerPoint" onRetry={wizard.generatePptx}>
              {wizard.pptxError}
            </Banner>
          )}

          {wizard.content.type === "primera-clase" && (
            <PrimeraClaseEditor
              content={wizard.content}
              onChange={wizard.savePlan}
              onGeneratePptx={wizard.generatePptx}
              onDownload={wizard.download}
              generateProgress={wizard.pptxProgress}
              downloadReady={wizard.downloadReady}
            />
          )}
          {(wizard.content.type === "normal" || wizard.content.type === "actividad" || wizard.content.type === "solucion") && (
            <NormalLikeEditor
              content={wizard.content}
              onChange={wizard.savePlan}
              onGeneratePptx={wizard.generatePptx}
              onDownload={wizard.download}
              generateProgress={wizard.pptxProgress}
              downloadReady={wizard.downloadReady}
            />
          )}
          {wizard.content.type === "repaso" && (
            <RepasoEditor
              content={wizard.content}
              onChange={wizard.savePlan}
              onGeneratePptx={wizard.generatePptx}
              onDownload={wizard.download}
              generateProgress={wizard.pptxProgress}
              downloadReady={wizard.downloadReady}
            />
          )}

          <div className="actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => wizard.goToStep(4)}>
              <span className="btn-label" data-label="Anterior">
                Anterior
              </span>
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
              <span className="btn-label" data-label="Empezar una nueva presentación">
                Empezar una nueva presentación
              </span>
            </button>
          </div>
        </>
      )}

      {showResetConfirm && (
        <div className="panel" role="alertdialog" aria-labelledby="reset-heading">
          <h2 id="reset-heading">¿Descartar esta presentación?</h2>
          <p>Se eliminarán los documentos cargados y los esquemas generados en esta sesión. Esta acción no se puede deshacer.</p>
          <div className="actions-row">
            <button type="button" className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>
              <span className="btn-label" data-label="Cancelar">
                Cancelar
              </span>
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setShowResetConfirm(false);
                wizard.resetAll();
              }}
            >
              <span className="btn-label" data-label="Sí, descartar">
                Sí, descartar
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
