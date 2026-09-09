"use client";
import { MateriasPage } from "./MateriasPage";

/** Categoría reservada para las materias de "Curso sello" — cualquier materia nueva creada desde
 * esta página queda etiquetada así (ver hooks/useMaterias.ts). */
export const CURSO_SELLO_CATEGORY = "curso-sello";

export function CursoSelloPage() {
  return (
    <MateriasPage
      category={CURSO_SELLO_CATEGORY}
      title="Curso sello"
      description="Asignaturas del curso sello — mismas herramientas de generación de clases y banco de preguntas que 'Asignaturas', en su propio espacio."
      emptyHint="Todavía no hay asignaturas de curso sello. Crea una abajo para empezar."
    />
  );
}
