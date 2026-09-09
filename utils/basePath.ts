/**
 * Prefijo bajo el que se sirve la página. En GitHub Pages un repositorio se publica en
 * `usuario.github.io/<repo>`, así que una ruta absoluta como "/" saldría del sitio. El flujo de
 * publicación lo rellena con el nombre real del repositorio (ver .github/workflows/pages.yml);
 * en local queda vacío y todo funciona en la raíz.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(ruta: string): string {
  return `${BASE_PATH}${ruta}`;
}
