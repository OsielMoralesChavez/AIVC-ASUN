# Asistente de gestión académica — versión de escaparate

Copia de solo interfaz del **Asistente de gestión académica**, pensada para publicarse como
página estática (GitHub Pages) y poder enseñar el producto sin instalar nada.

La aplicación completa es de escritorio (Electron + Next.js + SQLite): genera presentaciones
`.pptx` de un curso entero a partir de los PDF de los temas, arma bancos de preguntas, califica
trabajos contra una rúbrica y lleva el registro de incidencias. Nada de eso puede correr en una
página estática, así que **esta copia enseña la interfaz, no el motor**.

## Qué se puede ver, y qué no

| Sí | No |
|---|---|
| Todas las pantallas, con datos de muestra | Generar presentaciones o descargarlas |
| El acceso, la navegación y los cambios de tema | Calificar trabajos o analizar videos |
| Tablas, gráficas, estados vacíos y formularios | Guardar cambios: no hay base de datos |
| El diseño responsive y el modo oscuro | Conectar un proveedor de IA |

Cualquier acción que escriba responde con un aviso explicando que es la versión de escaparate,
en vez de fingir que funcionó.

## Cómo entrar

Cualquier correo `@unir.net` y cualquier contraseña sirven — por ejemplo `docente@unir.net` con
`demo1234`. No hay cuentas reales: el acceso solo desbloquea la interfaz.

## Cómo está hecha

La regla al construirla fue **no tocar el código de las pantallas**: lo que se ve aquí es
exactamente el mismo front que la aplicación real. Todo el desacople vive en dos sitios:

- **`lib/demo/api.ts`** sustituye `window.fetch` una sola vez y responde a lo que empiece por
  `/api/`. Como ese es el único punto por el que el front habla con el backend, interceptarlo ahí
  deja intactos los ~90 sitios que llaman a la API.
- **`lib/demo/dataset.ts`** contiene los datos de muestra: un docente ficticio, tres asignaturas,
  dieciséis clases, dos bancos de preguntas y cuatro incidencias. Ningún dato corresponde a una
  persona real.

Respecto a la aplicación completa se quitaron las 76 rutas de API, el empaquetado de Electron, el
binario nativo de SQLite, la generación de PowerPoint y las pruebas. De `lib/` solo quedaron los
módulos que el front necesita para compilar; los que exponían tipos desde el servidor
(`lib/calificador/db`, `lib/config/settings`) se redujeron a esos tipos, que el front siempre
importa con `import type` y desaparecen al compilar.

El candado de sesión, que en la aplicación real es un componente de servidor que consulta SQLite,
aquí es estado de cliente en `app/(app)/layout.tsx`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # exportación estática en out/
```

Para revisar la exportación tal como se publicará:

```bash
npx serve out
```

## Publicación

`.github/workflows/pages.yml` construye y publica en cada `push` a `main`. El prefijo de rutas se
toma del nombre real del repositorio (`NEXT_PUBLIC_BASE_PATH`), así que funciona sin tocar nada
aunque el repositorio se renombre.

Para activarlo, en el repositorio: **Settings → Pages → Source: GitHub Actions**.
