"use client";

import { useEffect, useState } from "react";
import { getAccessibleForeground } from "../lib/ui/contrast";

/**
 * Color de texto legible para la tarjeta destacada del dashboard.
 *
 * Lee `--color-primary` YA CALCULADO del documento (no el valor declarado), porque con las
 * paletas derivadas ese token puede venir de un `color-mix()` cuyo resultado solo conoce el
 * navegador. Se recalcula cuando cambian `data-palette` o `data-theme` mediante un
 * MutationObserver, así que al cambiar de paleta el texto se ajusta al instante sin recargar y
 * sin quedarse con el color de la paleta anterior.
 */
export function usePrimaryCardForeground(enabled?: boolean): string | null {
  const [foreground, setForeground] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    const recompute = () => {
      const background = getComputedStyle(root).getPropertyValue("--color-primary").trim();
      if (background) setForeground(getAccessibleForeground(background));
    };

    recompute();
    const observer = new MutationObserver(recompute);
    observer.observe(root, { attributes: true, attributeFilter: ["data-palette", "data-theme"] });
    return () => observer.disconnect();
  }, [enabled]);

  return foreground;
}
