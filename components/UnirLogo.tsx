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
      <img src={SOURCES[variant]} alt="UNIR — La universidad en internet" />
    </span>
  );
}
