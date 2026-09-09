# Imágenes del proyecto

Carpeta pública de assets estáticos (Next.js sirve todo lo que hay bajo `public/` desde la raíz
del sitio, sin pasar por el bundler). Coloca aquí los archivos reales — logotipos, fondos,
iconos sueltos — y referéncialos directo por su ruta, sin importarlos como módulo.

- `logos/` — logotipo(s) institucionales (ej. `logos/unir-logo.png`). El logo de UNIR usado hoy
  en `components/UnirLogo.tsx` es un placeholder en SVG dibujado a mano — en cuanto el archivo
  real esté en `logos/unir-logo.png` (o `.svg`), reemplaza ese componente por una etiqueta
  `<img src="/images/logos/unir-logo.png" alt="UNIR — La universidad en internet" />` (o
  `next/image`) que lo use tal cual, sin deformarlo ni recolorearlo.
- `backgrounds/` — imágenes de fondo (pantallas de login, separadores, portadas).
- `icons/` — iconos sueltos que no encajen como SVG inline en `components/icons.tsx` (fotos,
  íconos de marca de terceros, etc.). Para iconografía de interfaz normal, sigue usando
  `components/icons.tsx` (el set ya adoptado en todo el proyecto).

## Cómo referenciarlas

```tsx
// Cualquier archivo bajo public/images/... se sirve desde /images/...
<img src="/images/logos/unir-logo.png" alt="Descripción" />

// O con optimización automática de Next.js:
import Image from "next/image";
<Image src="/images/backgrounds/login-bg.jpg" alt="" fill />
```

```css
/* En CSS, misma ruta absoluta */
.auth-shell {
  background-image: url("/images/backgrounds/login-bg.jpg");
}
```

No importes estos archivos como módulos JS (`import logo from "./logo.png"`) — al vivir en
`public/`, siempre se referencian por ruta de texto, nunca por import.
