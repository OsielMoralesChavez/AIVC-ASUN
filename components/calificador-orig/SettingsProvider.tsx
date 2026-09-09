"use client";

import { createContext, useContext } from "react";
import type { PublicSettings } from "@/lib/config/settings";

/**
 * Pone la configuración pública (escala de calificación, niveles académicos,
 * defaults, identidad del docente) a disposición de todos los componentes de
 * cliente.
 *
 * Antes estos valores estaban fijos en el código de cada componente (la
 * escala 0-10, los niveles licenciatura/maestría). Ahora los define el
 * usuario en el asistente inicial, así que hay que distribuirlos: un
 * contexto en el layout evita tener que pasarlos como prop por cada página.
 *
 * Solo viaja lo que devuelve toPublicSettings(): las credenciales nunca
 * llegan al navegador.
 */
const SettingsContext = createContext<PublicSettings | null>(null);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: PublicSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Configuración pública dentro de un componente de cliente.
 * Lanza si se usa fuera del provider, porque significa que el componente
 * quedó colgado fuera del layout y pintaría con una escala equivocada —
 * mejor un error claro en desarrollo que calificaciones mal formateadas.
 */
export function useSettings(): PublicSettings {
  const settings = useContext(SettingsContext);
  if (!settings) {
    throw new Error(
      "useSettings() se usó fuera de <SettingsProvider>. Envuelve el componente en el layout de la aplicación."
    );
  }
  return settings;
}
