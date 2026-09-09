import type { DocumentRole } from "./presentation";

export type UploadStatus = "pending" | "uploading" | "valid" | "invalid";

export interface WizardFile {
  localId: string;
  file: File;
  status: UploadStatus;
  documentId?: string;
  pageCount?: number;
  hasSufficientText?: boolean;
  warning?: string;
  errorMessage?: string;
  clientError?: string;
  role: DocumentRole;
}
