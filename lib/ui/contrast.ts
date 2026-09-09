/**
 * Contraste WCAG. Se usa para elegir el color de texto de la tarjeta destacada del dashboard
 * SEGÚN el color real de la paleta activa — no se asume que el blanco siempre funciona: sobre el
 * dorado de la paleta corporativa, por ejemplo, el blanco no llega a 4.5:1 y hay que usar el
 * tono oscuro.
 */

const WHITE = "#FFFFFF";
const DARK = "#0B1F3A";

function parseColor(input: string): [number, number, number] | null {
  const value = input.trim();

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  }

  const rgb = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  // `color(srgb r g b)` — es lo que devuelve getComputedStyle para valores calculados con
  // color-mix(), así que hay que aceptarlo o el cálculo fallaría justo en las paletas derivadas.
  const srgb = value.match(/^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];

  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Relación de contraste WCAG entre dos colores. Devuelve 1 si alguno no se puede interpretar. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 1;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Color de texto legible sobre `background`. Se comprueban AMBOS candidatos y se elige el de
 * mayor contraste, en vez de asumir que el blanco cumple.
 */
export function getAccessibleForeground(background: string): string {
  const withWhite = contrastRatio(background, WHITE);
  const withDark = contrastRatio(background, DARK);
  return withWhite >= withDark ? WHITE : DARK;
}

export { WHITE as FOREGROUND_LIGHT, DARK as FOREGROUND_DARK };
