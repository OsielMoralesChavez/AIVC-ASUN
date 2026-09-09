import type { NextConfig } from "next";

/**
 * Versión de escaparate: se compila a HTML estático para publicarla en GitHub Pages.
 *
 * `output: "export"` es lo que hace posible publicarla sin servidor, y a la vez lo que obliga a
 * todo lo demás de esta copia: no admite rutas de API ni componentes de servidor dinámicos, por
 * eso `app/api/**` no existe aquí y el candado de sesión se resolvió del lado del cliente.
 *
 * `basePath` sale del entorno porque en GitHub Pages el sitio vive en `usuario.github.io/<repo>`
 * y no en la raíz del dominio: sin él, cada hoja de estilo y cada script se pedirían a una ruta
 * que no existe y la página saldría en blanco. El flujo de publicación lo rellena con el nombre
 * real del repositorio; en local queda vacío.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Sin servidor no hay optimizador de imágenes al vuelo: se sirven tal cual.
  images: { unoptimized: true },
  // GitHub Pages sirve `/ruta/index.html` cuando se pide `/ruta/`; con las barras finales las
  // rutas internas resuelven igual en Pages que en local.
  trailingSlash: true,
};

export default nextConfig;
