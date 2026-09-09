"use client";

interface BannerProps {
  type: "error" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function Banner({ type, title, children, onRetry, onDismiss }: BannerProps) {
  const role = type === "error" ? "alert" : "status";
  return (
    <div className={`banner banner-${type}`} role={role} aria-live={type === "error" ? "assertive" : "polite"}>
      <div style={{ flex: 1 }}>
        {/* La clase es la que recibe el `display: block` del CSS. Antes la regla apuntaba a
            `.banner strong` y convertía en bloque también cualquier negrita del cuerpo, partiendo
            las frases en varias líneas. */}
        {title && <strong className="banner-title">{title}</strong>}
        <div>{children}</div>
        {onRetry && (
          <button type="button" className="btn btn-secondary" style={{ marginTop: "0.6rem" }} onClick={onRetry}>
            <span className="btn-label" data-label="Reintentar">
              Reintentar
            </span>
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="btn-text"
          aria-label="Cerrar aviso"
          onClick={onDismiss}
          style={{ fontSize: "1.1rem", lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </div>
  );
}
