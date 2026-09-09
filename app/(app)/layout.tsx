"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "../../components/LoginForm";
import { fetchCurrentUser } from "../../services/authApi";

/**
 * Candado de la aplicación en la versión de escaparate.
 *
 * En la aplicación real este archivo es un componente de servidor que consulta la sesión en
 * SQLite y redirige. Aquí no hay servidor —la página es estática— así que el mismo papel lo hace
 * estado de cliente: se muestra la pantalla de acceso hasta que la API simulada devuelve un
 * usuario, y entonces se entra. El flujo que ve el visitante es el mismo; lo que cambia es quién
 * responde detrás.
 *
 * Las pantallas de instalación inicial y de cambio de contraseña no viajan en esta copia: no
 * tienen nada que enseñar sin un servidor con el que hablar.
 */
export default function AppGateLayout({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [comprobando, setComprobando] = useState(true);

  useEffect(() => {
    let vigente = true;
    // Entrar recarga la página (lo hace LoginForm), así que al volver se vuelve a preguntar quién
    // es: la marca la dejó el propio acceso en sessionStorage.
    const yaEntro = typeof window !== "undefined" && window.sessionStorage.getItem("demo.sesion") === "1";
    if (!yaEntro) {
      setComprobando(false);
      return;
    }
    fetchCurrentUser()
      .then(({ user }) => {
        if (vigente) setAutenticado(Boolean(user));
      })
      .catch(() => {
        if (vigente) setAutenticado(false);
      })
      .finally(() => {
        if (vigente) setComprobando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (comprobando) return null;
  if (!autenticado) return <LoginForm />;
  return <>{children}</>;
}
