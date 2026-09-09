"use client";
import { useRef, useState } from "react";
import { Banner } from "../components/Banner";
import { StringListEditor, TextAreaField, TextField } from "../components/editors/SharedEditors";
import { ProgressStatus } from "../components/ProgressStatus";
import { VOICE_QUESTIONS, VoiceQuestionnaire } from "../components/VoiceQuestionnaire";
import { useTraining } from "../hooks/useTraining";

export function TrainingPage() {
  const training = useTraining();
  const [newProfileName, setNewProfileName] = useState("");
  const [newEntryLabel, setNewEntryLabel] = useState("");
  const [newEntryValue, setNewEntryValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = training.selectedProfile;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Entrenamiento</h1>
        <p>Crea un perfil de tono de voz a partir de tus documentos y guarda los datos que siempre quieres incluir.</p>
      </header>

      {training.error && (
        <Banner type="error" title="Ocurrió un error" onDismiss={() => training.setError(null)}>
          {training.error}
        </Banner>
      )}

      <section className="panel" aria-label="Perfiles de tono de voz">
        <h2>Perfiles</h2>
        <ul aria-label="Lista de perfiles" style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {training.profiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="option-card"
                data-selected={training.selectedProfileId === p.id}
                style={{ width: "100%" }}
                onClick={() => training.setSelectedProfileId(p.id)}
              >
                <h3>{p.name}</h3>
                <p>{p.dataEntryCount} dato(s) guardados{p.toneDescription ? " · tono analizado" : " · sin analizar todavía"}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="bullet-row" style={{ marginTop: "0.75rem" }}>
          <input
            type="text"
            aria-label="Nombre del nuevo perfil"
            placeholder="Nombre del nuevo perfil (ej. Mi tono en clase)"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={newProfileName.trim().length === 0}
            onClick={() => {
              training.createProfile(newProfileName.trim());
              setNewProfileName("");
            }}
          >
            <span className="btn-label" data-label="+ Crear perfil">
              + Crear perfil
            </span>
          </button>
        </div>
      </section>

      {profile && (
        <section className="panel" aria-label="Detalle del perfil seleccionado">
          <div className="actions-row" style={{ marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>{profile.name}</h2>
            <button type="button" className="btn btn-danger" onClick={() => training.removeProfile(profile.id)}>
              <span className="btn-label" data-label="Eliminar perfil">
                Eliminar perfil
              </span>
            </button>
          </div>

          <TextField id="profile-name" label="Nombre del perfil" value={profile.name} onChange={(v) => training.updateProfileMeta({ name: v })} />

          <div className="field-group">
            <span className="field-legend">Analizar tono de voz a partir de documentos de muestra</span>
            <p className="field-hint">
              Sube presentaciones, informes o apuntes que ya hayas escrito. Se analiza el estilo (no se guardan los PDF originales).
            </p>
            <div className="dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
              <p>
                {pendingFiles.length > 0
                  ? `${pendingFiles.length} archivo(s) listo(s) para analizar`
                  : "Haz clic para seleccionar uno o varios PDF de muestra"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: "0.6rem" }}
              disabled={pendingFiles.length === 0 || training.analyzeProgress?.busy}
              onClick={async () => {
                await training.analyzeDocuments(pendingFiles);
                setPendingFiles([]);
              }}
            >
              <span className="btn-label" data-label="Analizar tono de voz">
                Analizar tono de voz
              </span>
            </button>
            {profile.sourceDocumentNames.length > 0 && (
              <p className="field-hint">Analizado con: {profile.sourceDocumentNames.join(", ")}</p>
            )}
          </div>

          <div className="field-group">
            <span className="field-legend">— o —</span>
          </div>

          <VoiceQuestionnaire
            busy={Boolean(training.analyzeProgress?.busy)}
            onSubmit={(answers) => training.analyzeQuestionnaire(answers, VOICE_QUESTIONS)}
          />

          {training.analyzeProgress && <ProgressStatus state={training.analyzeProgress} />}

          <TextAreaField
            id="tone-description"
            label="Descripción del tono"
            value={profile.toneDescription}
            onChange={(v) => training.updateProfileMeta({ toneDescription: v })}
            rows={3}
          />

          <StringListEditor
            label="Reglas de estilo"
            items={profile.styleGuidelines}
            onChange={(styleGuidelines) => training.updateProfileMeta({ styleGuidelines })}
          />

          <StringListEditor
            label="Vocabulario característico"
            items={profile.vocabularyNotes}
            onChange={(vocabularyNotes) => training.updateProfileMeta({ vocabularyNotes })}
          />

          <div className="field-group">
            <span className="field-legend">Datos que siempre quieres incluir en tus presentaciones</span>
            {profile.standardData.map((entry) => (
              <div key={entry.id} className="bullet-row">
                <input
                  type="text"
                  aria-label="Etiqueta del dato"
                  value={entry.label}
                  onChange={(e) => training.editDataEntry(entry.id, { label: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  aria-label="Valor del dato"
                  value={entry.value}
                  onChange={(e) => training.editDataEntry(entry.id, { value: e.target.value })}
                  style={{ flex: 2 }}
                />
                <button type="button" className="btn btn-text" onClick={() => training.removeDataEntry(entry.id)}>
                  ×
                </button>
              </div>
            ))}
            <div className="bullet-row">
              <input
                type="text"
                aria-label="Nueva etiqueta"
                placeholder="Etiqueta (ej. Correo institucional)"
                value={newEntryLabel}
                onChange={(e) => setNewEntryLabel(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                aria-label="Nuevo valor"
                placeholder="Valor"
                value={newEntryValue}
                onChange={(e) => setNewEntryValue(e.target.value)}
                style={{ flex: 2 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={newEntryLabel.trim().length === 0 || newEntryValue.trim().length === 0}
                onClick={() => {
                  training.addDataEntry(newEntryLabel.trim(), newEntryValue.trim());
                  setNewEntryLabel("");
                  setNewEntryValue("");
                }}
              >
                <span className="btn-label" data-label="+ Agregar">
                  + Agregar
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {!profile && training.profiles.length === 0 && (
        <p className="field-hint">Todavía no tienes perfiles. Crea uno arriba para empezar a entrenar tu tono de voz.</p>
      )}
    </div>
  );
}
