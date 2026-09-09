"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCurrentUser, type PublicUser } from "../services/authApi";

/** El layout de servidor (`app/(app)/layout.tsx`) ya garantiza que siempre hay una sesión válida
 * para cualquier página dentro del grupo (app) — este hook solo trae los datos para mostrarlos
 * en el topbar/menú de usuario, no repite la protección de rutas. */
export function useCurrentUser() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: fetched } = await fetchCurrentUser();
      setUser(fetched);
    } catch {
      // El layout de servidor ya garantiza sesión válida en cualquier render real; un fallo
      // aquí solo puede venir de una red caída o del entorno de pruebas (sin fetch real) — en
      // ambos casos, degradar a "sin datos de usuario todavía" es preferible a una promesa sin
      // capturar que ensucie la consola/el runner de pruebas.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh, setUser };
}
