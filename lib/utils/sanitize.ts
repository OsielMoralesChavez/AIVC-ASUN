export function sanitizeFileName(originalName: string): string {
  const base = originalName.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const cleaned = base
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "documento.pdf";
}

export function safeDownloadFileName(title: string, extension: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80);
  const safeBase = base.length > 0 ? base : "presentacion";
  return `${safeBase}.${extension}`;
}
