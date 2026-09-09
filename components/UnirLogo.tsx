/**
 * Logotipo institucional de UNIR (`public/images/logos/SVG/`, ver public/images/README.md).
 *
 * La marca trae variantes oficiales para cada tipo de fondo, así que se usa la que corresponde en
 * vez de recolorear o envolver el archivo: `UNIR_v_color.svg` (negro + azul) sobre superficies
 * claras y `UNIR_v_negativo.svg` (blanco) sobre superficies oscuras — sidebar, pantallas de
 * autenticación. Nunca se deforma ni se le aplican sombras propias.
 *
 * El tamaño lo decide siempre el CSS del lugar donde se usa (`.sidebar-logo img`,
 * `.auth-logo-row img`...), no un estilo en línea aquí.
 */
import { withBasePath } from "../utils/basePath";

interface UnirLogoProps {
  /** "on-dark" usa la variante negativa (blanca); "on-light" la de color. */
  variant?: "on-dark" | "on-light";
  className?: string;
}

const SOURCES = {
  "on-dark": "/images/logos/SVG/UNIR_v_negativo.svg",
  "on-light": "/images/logos/SVG/UNIR_v_color.svg",
} as const;

export function UnirLogo({ variant = "on-light", className }: UnirLogoProps) {
  return (
    <span className={className}>
      {/* `withBasePath` no es decorativo: publicado en GitHub Pages el sitio cuelga de
          /<repo>, y un `<img src="/...">` se pediría a la raíz del dominio. Next reescribe los
          enlaces y `next/image`, pero no el `src` de una etiqueta `img` normal. */}
      <img src={withBasePath(SOURCES[variant])} alt="UNIR — La universidad en internet" />
    </span>
  );
}
