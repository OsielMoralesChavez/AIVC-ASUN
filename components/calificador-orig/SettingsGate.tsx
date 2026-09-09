"use client";

import { useEffect, useState } from "react";
import { SettingsProvider } from "./SettingsProvider";
import type { PublicSettings } from "@/lib/config/settings";

/**
 * Reemplazo cliente del `SettingsProvider` original: el Calificador de origen lo llenaba en el
 * layout del servidor (`getPublicSettings()`); aquí no hay layout propio del Calificador (todo
 * corre dentro de una sola página de cliente, ver views/CalificadorPage.tsx), así que se hace el
 * mismo fetch a /api/calificador/ajustes que ya usa el resto de la interfaz.
 */
export function SettingsGate({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calificador/ajustes")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          teacherTitle: data.settings.teacherTitle,
          teacherName: data.settings.teacherName,
          institutionName: data.institution.name,
          gradeScale: data.institution.gradeScale,
          academicLevels: data.institution.academicLevels,
          feedbackLanguage: data.institution.feedbackLanguage,
          defaultLevelId: data.settings.defaultLevelId,
          defaultSeverity: data.settings.defaultSeverity,
          defaultWorkType: data.settings.defaultWorkType,
          defaultFilesPerSubmission: data.settings.defaultFilesPerSubmission,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la configuración."));
  }, []);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!settings) return <p className="p-6 text-sm text-slate-500">Cargando…</p>;

  return <SettingsProvider settings={settings}>{children}</SettingsProvider>;
}
