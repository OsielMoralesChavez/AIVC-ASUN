export interface Materia {
  id: string;
  name: string;
  /** Etiqueta libre opcional (p. ej. "curso-sello") para agrupar materias en secciones del menú
   * aparte de "Materias" — null para una materia normal. */
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Versión ligera para listados — incluye conteos calculados por SQL en vez de hidratar las
 * presentaciones/bancos completos, igual que VoiceProfileSummary evita cargar los datos de
 * entrenamiento completos. */
export interface MateriaSummary extends Materia {
  presentationCount: number;
  minicasoBankCount: number;
}
