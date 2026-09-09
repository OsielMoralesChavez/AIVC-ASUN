"use client";

import { useEffect, useState } from "react";
import { EVENTO_BLOQUEADO, installDemoApi } from "../lib/demo/api";

/**
 * Instala la API simulada antes de que se pinte nada. Va en el layout raíz para que también la
 * tenga la pantalla de acceso, no solo la aplicación.
 *
 * La instalación ocurre al importar el módulo —no en un efecto— porque un efecto correría
 * DESPUÉS del primer render, y las pantallas que piden datos al montarse ya habrían llamado al
 * `fetch` de verdad contra un servidor que en esta versión no existe.
 */
installDemoApi();

/** Aviso flotante para todo lo que esta versión no puede hacer. */
export function DemoBoot() {
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const alBloquear = (e: Event) => {
      setMensaje((e as CustomEvent<string>).detail);
      window.clearTimeout((alBloquear as unknown as { t?: number }).t);
      (alBloquear as unknown as { t?: number }).t = window.setTimeout(() => setMensaje(null), 9000);
    };
    window.addEventListener(EVENTO_BLOQUEADO, alBloquear);
    return () => window.removeEventListener(EVENTO_BLOQUEADO, alBloquear);
  }, []);

  if (!mensaje) return null;

  return (
    <div className="demo-aviso" role="status" aria-live="polite">
      <strong>Versión de escaparate</strong>
      <p>{mensaje}</p>
      <button type="button" onClick={() => setMensaje(null)} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
