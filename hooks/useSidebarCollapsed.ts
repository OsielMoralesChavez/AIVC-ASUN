"use client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gp_sidebar_collapsed";

export function useSidebarCollapsed() {
  // Arranca igual en servidor y cliente (evita un mismatch de hidratación); el valor real
  // guardado se aplica en un efecto, después del primer render.
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return { collapsed, toggleCollapsed };
}
