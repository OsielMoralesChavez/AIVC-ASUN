"use client";

import { AcademicConfigStep } from "./AcademicConfigStep";
import { Banner } from "./Banner";
import { DocumentUploadStep } from "./DocumentUploadStep";
import { PrimeraClaseFields } from "./PrimeraClaseFields";
import { ProgressStatus } from "./ProgressStatus";
import { ScheduleReviewTable } from "./ScheduleReviewTable";
import { StepIndicator, type WizardStepDef } from "./StepIndicator";
import { useScheduleBulkWizard } from "../hooks/useScheduleBulkWizard";
import { DECK_TYPE_LABELS, type UnirDeckType } from "../types/unir";

const STEPS: WizardStepDef[] = [
  { step: 1, label: "Documentos" },
  { step: 2, label: "Revisión de la programación" },
  { step: 3, label: "Datos del curso" },
  { step: 4, label: "Generar y descargar" },
];

interface ScheduleBulkWizardProps {
  materiaId: string;
  materiaName: string;
  onBack: () => void;
  onPresentationCreated?: () => void;
}

/** Asistente de 4 pasos para generar TODAS las presentaciones del curso de una vez, a partir de
 * la programación semanal — ver hooks/useScheduleBulkWizard.ts. */
export function ScheduleBulkWizard({ materiaId, materiaName, onBack, onPresentationCreated }: ScheduleBulkWizardProps) {
  const wizard = useScheduleBulkWizard(materiaId, materiaName, onPresentationCreated);

  const availableIdeasClaveDocuments = wizard.files
    .filter((f) => f.role === "ideas-clave" && f.documentId)
    .map((f) => ({ id: f.documentId as string, fileName: f.file.name }));

  const canLeaveStep1 = Boolean(wizard.scheduleDocumentId) && wizard.ideasClaveDocumentIds.length > 0;
  const missingDocumentWeeks = wizard.weeks.filter((w) => w.deckType !== "repaso" && w.temaDocumentIds.length === 0);
  const canLeaveStep2 = wizard.weeks.length > 0 && missingDocumentWeeks.length === 0;
  const canLeaveStep3 =
    wizard.configFields.academicLevel !== null && !wizard.durationError && wizard.configFields.institutionScope !== null;

  // El paso 2 (revisión) necesita todo el ancho disponible junto al sidebar para la tabla —
  // los demás pasos se quedan en el contenedor angosto centrado de siempre.
  const stepContainerClass = wizard.step === 2 ? "app-shell-wide" : "app-shell";

  const failedItems = (wizard.courseJob?.course?.items ?? []).filter((item) => item.state === "failed");

  return (
    <>
      <div className="app-shell" style={{ paddingBottom: 0 }}>
        <div className="actions-row" style={{ marginBottom: "0.5rem" }}>
          <button type="button" className="btn btn-text" onClick={onBack}>
            <span className="btn-label" data-label="← Volver">
              ← Volver
            </span>
          </button>
          <div />
        </div>

        <header className="app-header">
          <h1>Generar todo el curso</h1>
          <p>
            Carga la programación semanal, los PDFs de ideas clave por tema y, opcionalmente, el Excel de práctica.
            El sistema detecta automáticamente cuántas clases hay, de qué tipo es cada una y en qué orden generarlas.
          </p>
        </header>

        <StepIndicator steps={STEPS} currentStep={wizard.step} maxReachedStep={wizard.maxReachedStep} onNavigate={wizard.goToStep} />
      </div>

      <div className={stepContainerClass}>
      {wizard.step === 1 && (
        <>
          <p className="field-hint" style={{ marginTop: "-0.5rem" }}>
            Puedes soltar todos los archivos a la vez: el PDF de la programación semanal y el Excel se
            reconocen automáticamente por su nombre y extensión (no dependen del rol seleccionado abajo).
            Los PDFs de tema quedan con el rol seleccionado — «Ideas clave» por defecto.
          </p>
          <DocumentUploadStep
            files={wizard.files}
            onAddFiles={wizard.addFiles}
            onRemoveFile={wizard.removeFile}
            uploadError={wizard.uploadError}
            pendingRole={wizard.pendingRole}
            onPendingRoleChange={wizard.setPendingRole}
          />
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Checklist antes de continuar</h3>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              <li>
                Programación semanal (rol «Programación semanal»):{" "}
                {wizard.scheduleDocumentId ? "✅ cargada" : "⏳ falta cargarla"}
              </li>
              <li>
                PDFs de ideas clave (rol «Ideas clave»): {wizard.ideasClaveDocumentIds.length} cargado(s)
              </li>
              <li>
                Excel «Qué vamos a practicar» (rol «Excel de práctica», opcional):{" "}
                {wizard.practiceDocumentId ? "✅ cargado" : "no cargado"}
              </li>
            </ul>
          </div>

          {wizard.previewError && (
            <Banner type="error" title="No se pudo analizar la programación">
              {wizard.previewError}
            </Banner>
          )}

          <div className="actions-row">
            <div />
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canLeaveStep1 || wizard.previewBusy}
              onClick={wizard.runPreview}
            >
              <span className="btn-label" data-label={wizard.previewBusy ? "Analizando…" : "Analizar programación"}>
                {wizard.previewBusy ? "Analizando…" : "Analizar programación"}
              </span>
            </button>
          </div>
        </>
      )}

      {wizard.step === 2 && (
        <>
          <section className="panel" aria-labelledby="schedule-review-heading">
            <h2 id="schedule-review-heading">2. Revisión de la programación detectada</h2>
            <p className="field-hint">
              Se detectaron {wizard.weeks.length} semana(s). Corrige el tipo de clase, la duración o los
              documentos asociados si algo no coincide con la programación real antes de generar.
            </p>
            <ScheduleReviewTable
              weeks={wizard.weeks}
              onUpdateWeek={wizard.updateWeek}
              onRemoveWeek={wizard.removeWeek}
              availableDocuments={availableIdeasClaveDocuments}
            />
          </section>

          {missingDocumentWeeks.length > 0 && (
            <Banner type="warning" title="Faltan documentos por asignar">
              La(s) semana(s) {missingDocumentWeeks.map((w) => w.weekNumber).join(", ")} no tienen ningún PDF de
              ideas clave asociado. Marca al menos uno en la columna &ldquo;Documentos de ideas clave&rdquo; de la
              tabla antes de continuar.
            </Banner>
          )}

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
          <section className="panel" aria-labelledby="course-name-heading">
            <h2 id="course-name-heading">3. Datos del curso (se piden una sola vez)</h2>
            <div className="field-group">
              <label htmlFor="course-name">Nombre del curso</label>
              <input id="course-name" type="text" value={wizard.courseName} onChange={(e) => wizard.setCourseName(e.target.value)} />
            </div>
          </section>
          <AcademicConfigStep
            fields={wizard.configFields}
            durationError={wizard.durationError}
            onFieldChange={wizard.setConfigField}
            durationDisabled
          />
          <PrimeraClaseFields values={wizard.primeraClaseFields} onChange={wizard.setPrimeraClaseField} />
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

      {wizard.step === 4 && (
        <>
          <section className="panel" aria-labelledby="generate-heading">
            <h2 id="generate-heading">4. Generar el curso completo</h2>
            <p className="field-hint">
              Se generarán {wizard.weeks.length} presentaciones, en orden, cada una con su archivo .pptx listo para
              descargar.
            </p>

            {wizard.voiceProfiles.length > 0 && (
              <div className="field-group">
                <label>
                  <input
                    type="checkbox"
                    checked={wizard.useVoiceProfile}
                    onChange={(e) => wizard.setUseVoiceProfile(e.target.checked)}
                  />{" "}
                  Aplicar un perfil de tono de voz
                </label>
                {wizard.useVoiceProfile && (
                  <select value={wizard.voiceProfileId ?? ""} onChange={(e) => wizard.setVoiceProfileId(e.target.value)}>
                    {wizard.voiceProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {wizard.courseJob?.course?.simulated && (
              <Banner type="warning" title="Modo simulado">
                No hay un proveedor de IA en vivo configurado, así que el contenido de estas
                presentaciones es de relleno. El archivo .pptx sí se genera de verdad.
              </Banner>
            )}

            {wizard.courseJob?.course?.providerWarning && (
              <Banner type="warning" title="El proveedor de IA actual no permite generar el curso">
                {wizard.courseJob.course.providerWarning}
              </Banner>
            )}

            {wizard.generateError && (
              <Banner type="error" title="No se pudo generar el curso">
                {wizard.generateError}
              </Banner>
            )}
            {wizard.generateProgress && <ProgressStatus state={wizard.generateProgress} />}

            {failedItems.length > 0 && (
              <Banner type="warning" title={`${failedItems.length} presentación(es) necesitan reintentarse`}>
                <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.1rem" }}>
                  {failedItems.map((item) => (
                    <li key={item.weekNumber}>
                      Semana {item.weekNumber} — {item.title}
                      {item.error ? `: ${item.error}` : ""}
                    </li>
                  ))}
                </ul>
              </Banner>
            )}

            <div className="actions-row">
              <div />
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {failedItems.length > 0 && !wizard.generationActive && (
                  <button type="button" className="btn btn-secondary" onClick={wizard.retryFailed}>
                    <span className="btn-label" data-label="Reintentar las fallidas">
                      Reintentar las fallidas
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={wizard.generationActive || wizard.generateProgress?.busy}
                  onClick={() => wizard.runGenerate()}
                >
                  <span className="btn-label" data-label="Generar el curso completo">
                    Generar el curso completo
                  </span>
                </button>
              </div>
            </div>

            {wizard.results && (
              <>
                <p className="field-hint">
                  También se generó un banco de minicasos para esta materia (15 desde las presentaciones, 15
                  desde los documentos de ideas clave) — consúltalo en la pestaña «Banco de preguntas».
                </p>
                <div className="actions-row" style={{ marginBottom: "0.5rem" }}>
                  <div />
                  <button type="button" className="btn btn-secondary" onClick={wizard.downloadAllResults}>
                    <span className="btn-label" data-label="Descargar todas">
                      Descargar todas
                    </span>
                  </button>
                </div>
                <ul className="file-list" aria-label="Presentaciones generadas">
                  {wizard.weeks.map((week) => {
                    const presentationId = wizard.results?.[`semana-${week.weekNumber}`];
                    if (!presentationId) return null;
                    return (
                      <li key={week.weekNumber} className="file-item">
                        <div className="file-meta">
                          <div className="file-name">
                            Semana {week.weekNumber} — {week.sessionTitle}
                          </div>
                          <div className="file-sub">{DECK_TYPE_LABELS[week.deckType as UnirDeckType]}</div>
                        </div>
                        <span className="badge badge-ok">Listo</span>
                        <button
                          type="button"
                          className="btn btn-text"
                          onClick={() => wizard.downloadResult(week.weekNumber, week.sessionTitle, presentationId)}
                        >
                          <span className="btn-label" data-label="Descargar .pptx">
                            Descargar .pptx
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
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
      </div>
    </>
  );
}
