"use client";
import { useCallback, useEffect, useState } from "react";
import type { ColorPalette, ThemeMode } from "../lib/types/auth";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "gp_theme_mode";
const PALETTE_STORAGE_KEY = "gp_color_palette";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function readStoredPalette(): ColorPalette {
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
  return stored === "corporate" ? "corporate" : "default";
}

function effectiveTheme(mode: ThemeMode): Theme {
  return mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
}

/**
 * Modo visual tri-estado (claro/oscuro/según el sistema) + paleta de color, aplicados como
 * `data-theme`/`data-palette` en `<html>` — el resto de `app/globals.css` ya sabe re-tematizarse
 * a partir de esos dos atributos (ver `html[data-theme="dark"]` y `.auth-shell` como precedentes
 * del mismo patrón). Este hook solo maneja la aplicación visual inmediata y una caché local para
 * evitar parpadeos; la fuente de verdad de qué prefiere cada cuenta vive en `users.theme_mode`/
 * `users.color_palette` (ver lib/db/userRepository.ts) — quien llama este hook (AppShell) es
 * responsable de sincronizar ambos lados.
 */
export function useTheme() {
  // Arranca en "light" tanto en servidor como en cliente (evita un mismatch de hidratación); el
  // modo real (guardado o preferencia del sistema) se aplica en un efecto tras montar.
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [palette, setPaletteState] = useState<ColorPalette>("default");

  useEffect(() => {
    setThemeModeState(readStoredThemeMode());
    setPaletteState(readStoredPalette());
  }, []);

  const theme = effectiveTheme(themeMode);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (themeMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => document.documentElement.dataset.theme = effectiveTheme("system");
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const setPalette = useCallback((next: ColorPalette) => {
    setPaletteState(next);
    localStorage.setItem(PALETTE_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(theme === "dark" ? "light" : "dark");
  }, [theme, setThemeMode]);

  return { theme, themeMode, setThemeMode, palette, setPalette, toggleTheme };
}
