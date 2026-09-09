"use client";

import { useEffect, useState } from "react";
import { chooseDownloadDirectory, isElectron } from "@/services/httpClient";

/**
 * Campo para elegir la carpeta de datos.
 *
 * Dentro de Electron abre el explorador nativo mediante el puente de preload;
 * en el navegador (modo desarrollo) no existe forma de abrir un selector de
 * carpetas, así que se cae a escribir la ruta a mano. La detección se hace en
 * un efecto porque `window` no existe durante el render del servidor.
 */
export function DataFolderField({
  value,
  onChange,
  label = "Carpeta donde se guardarán tus datos",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [canBrowse, setCanBrowse] = useState(false);

  useEffect(() => {
    setCanBrowse(isElectron());
  }, []);

  async function browse() {
    const chosen = await chooseDownloadDirectory();
    if (chosen) onChange(chosen);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          placeholder="C:\Users\tu-usuario\Documents\Calificador"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500"
        />
        {canBrowse && (
          <button
            type="button"
            onClick={browse}
            className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Examinar…
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        Aquí vivirán la base de datos, los trabajos que subas y las rúbricas.
        Si la pones en una carpeta que ya respaldas (OneDrive, Drive o un disco
        institucional), tu historial queda respaldado solo.
      </p>
    </div>
  );
}
