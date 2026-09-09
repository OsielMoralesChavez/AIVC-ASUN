import type { Metadata } from "next";
import { DemoBoot } from "../components/DemoBoot";
import { withBasePath } from "../utils/basePath";
import localFont from "next/font/local";
import "./globals.css";

// `next/font` autohospeda las fuentes en el build (sin llamada a Google en tiempo de ejecución),
// necesario para que se vean bien también en la app empaquetada de Electron sin internet.
// Tipografía institucional UNIR (Proeduca Sans) — una sola familia para toda la app, títulos y
// cuerpo por igual (antes eran dos familias distintas, Inter/DM Sans).
const proeducaSans = localFont({
  variable: "--font-proeduca-family",
  display: "swap",
  src: [
    { path: "./fonts/ProeducaSans/ProeducaSans-ExtraLight.otf", weight: "200", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-ExtraLightItalic.otf", weight: "200", style: "italic" },
    { path: "./fonts/ProeducaSans/ProeducaSans-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-LightItalic.otf", weight: "300", style: "italic" },
    { path: "./fonts/ProeducaSans/ProeducaSans-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "./fonts/ProeducaSans/ProeducaSans-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-MediumItalic.otf", weight: "500", style: "italic" },
    { path: "./fonts/ProeducaSans/ProeducaSans-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-SemiBoldItalic.otf", weight: "600", style: "italic" },
    { path: "./fonts/ProeducaSans/ProeducaSans-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-BoldItalic.otf", weight: "700", style: "italic" },
    { path: "./fonts/ProeducaSans/ProeducaSans-ExtraBold.otf", weight: "800", style: "normal" },
    { path: "./fonts/ProeducaSans/ProeducaSans-ExtraBoldItalic.otf", weight: "800", style: "italic" },
  ],
});

export const metadata: Metadata = {
  // El nombre que ve el usuario en toda la aplicación (barra lateral, login) es "Asistente de
  // gestión académica"; "UNIR Academic Tool" era el nombre interno del proyecto y solo asomaba en
  // la pestaña y en la barra de título, contradiciendo a la propia interfaz.
  title: "Asistente de gestión académica",
  description: "Asistente de gestión académica: presentaciones, minicasos, entrenamiento de tono de voz y cursos de actualización.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={proeducaSans.variable}
      // El fondo de la pantalla de acceso vive en una hoja de estilos, y el CSS no puede conocer
      // el prefijo bajo el que se publica el sitio. Se inyecta aquí como variable: en GitHub
      // Pages vale "/<repo>/images/...", y en local el prefijo es vacío y queda igual que antes.
      style={{ "--imagen-fondo-auth": `url("${withBasePath("/images/backgrounds/fondo.webp")}")` } as React.CSSProperties}
    >
      <body>
        <DemoBoot />
        {children}
      </body>
    </html>
  );
}
