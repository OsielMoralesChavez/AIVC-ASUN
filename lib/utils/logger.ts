type LogMeta = Record<string, unknown>;

function redact(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return meta;
  const redacted: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("key") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("password") ||
      lowerKey.includes("text") ||
      lowerKey.includes("content")
    ) {
      redacted[key] = "[redacted]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(`[info] ${message}`, redact(meta) ?? "");
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(`[warn] ${message}`, redact(meta) ?? "");
  },
  error(message: string, meta?: LogMeta) {
    console.error(`[error] ${message}`, redact(meta) ?? "");
  },
};
