"use client";

import { useId, useRef, useState } from "react";
import type { WizardFile } from "../types/wizard";
import { DOCUMENT_ROLE_LABELS, type DocumentRole } from "../types/presentation";
import { formatBytes, MAX_FILES, MAX_FILE_SIZE_MB } from "../utils/validation";
import { Banner } from "./Banner";

interface DocumentUploadStepProps {
  files: WizardFile[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (localId: string) => void;
  uploadError: string | null;
  /** Si se omiten, no se muestra el selector de rol (p. ej. en Banco de minicasos, donde el
   * rol de documento no tiene ningún efecto todavía). */
  pendingRole?: DocumentRole;
  onPendingRoleChange?: (role: DocumentRole) => void;
}

const ROLE_HINTS: Record<DocumentRole, string> = {
  material: "El material general de la clase (temario, lecturas, apuntes).",
  "ideas-clave": "Se prioriza al sintetizar el contenido más relevante.",
  "excel-practica": "Datos reales para fundamentar el caso práctico con cifras (no marcadores).",
  "programacion-semanal": "Da contexto de qué clase es esta dentro del curso.",
};

export function DocumentUploadStep({
  files,
  onAddFiles,
  onRemoveFile,
  uploadError,
  pendingRole,
  onPendingRoleChange,
}: DocumentUploadStepProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const helpId = useId();
  const roleSelectId = useId();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    onAddFiles(Array.from(fileList));
  };

  return (
    <section className="panel" aria-labelledby="step1-heading">
      <h2 id="step1-heading">1. Carga de documentos</h2>
      <p className="field-hint">
        Arrastra tus archivos PDF, Word o Excel, o selecciónalos manualmente. Máximo {MAX_FILES} archivos,{" "}
        {MAX_FILE_SIZE_MB} MB cada uno.
      </p>

      {uploadError && (
        <Banner type="error" title="No se pudieron cargar los archivos">
          {uploadError}
        </Banner>
      )}

      {pendingRole && onPendingRoleChange && (
        <div className="field-group">
          <label htmlFor={roleSelectId} className="field-legend">
            Rol de los próximos archivos que cargues
          </label>
          <select
            id={roleSelectId}
            value={pendingRole}
            onChange={(e) => onPendingRoleChange(e.target.value as DocumentRole)}
          >
            {Object.entries(DOCUMENT_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="field-hint">{ROLE_HINTS[pendingRole]}</span>
        </div>
      )}

      <div
        className="dropzone"
        data-active={isDragActive}
        role="button"
        tabIndex={0}
        aria-describedby={helpId}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p>
          <strong>Arrastra y suelta</strong> tus archivos aquí, o haz clic para seleccionarlos.
        </p>
        <label htmlFor={inputId} className="visually-hidden">
          Seleccionar archivos PDF, Word o Excel
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span id={helpId} className="field-hint">
          Se admiten archivos .pdf, .docx y .xlsx
        </span>
      </div>

      {files.length > 0 && (
        <ul className="file-list" aria-label="Archivos cargados">
          {files.map((item) => (
            <li key={item.localId} className="file-item">
              <div className="file-meta">
                <div className="file-name">{item.file.name}</div>
                <div className="file-sub">
                  {formatBytes(item.file.size)}
                  {item.pageCount ? ` · ${item.pageCount} páginas` : ""}
                  {item.status === "uploading" && " · Analizando…"}
                  {item.role !== "material" && ` · ${DOCUMENT_ROLE_LABELS[item.role]}`}
                </div>
                {item.status === "valid" && item.hasSufficientText === false && (
                  <div className="banner banner-warning" style={{ marginTop: "0.4rem" }} role="status">
                    <div>
                      <strong>Texto insuficiente</strong>
                      <div>{item.warning}</div>
                    </div>
                  </div>
                )}
                {(item.status === "invalid" || item.clientError) && (
                  <div className="banner banner-error" style={{ marginTop: "0.4rem" }} role="alert">
                    <div>{item.clientError ?? item.errorMessage}</div>
                  </div>
                )}
              </div>
              <StatusBadge item={item} />
              <button
                type="button"
                className="btn btn-text"
                onClick={() => onRemoveFile(item.localId)}
                aria-label={`Eliminar ${item.file.name}`}
              >
                <span className="btn-label" data-label="Eliminar">
                  Eliminar
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({ item }: { item: WizardFile }) {
  if (item.status === "uploading") return <span className="badge badge-warn">Analizando</span>;
  if (item.status === "invalid" || item.clientError) return <span className="badge badge-error">Inválido</span>;
  if (item.status === "valid" && item.hasSufficientText === false) {
    return <span className="badge badge-warn">Sin texto suficiente</span>;
  }
  if (item.status === "valid") return <span className="badge badge-ok">Listo</span>;
  return <span className="badge badge-warn">Pendiente</span>;
}
