import { z } from "zod";

/**
 * `.trim()` antes de `.min(1)`: sin él, un nombre de solo espacios («   ») pasaba la validación
 * y quedaba guardado como una materia sin nombre visible en el Dashboard. El formulario ya lo
 * impedía, pero la validación del backend es la que tiene que sostenerlo.
 */
const materiaName = z.string().trim().min(1).max(200);

export const createMateriaSchema = z.object({
  name: materiaName,
  category: z.string().trim().min(1).max(60).nullable().optional(),
});

export const updateMateriaSchema = z.object({
  name: materiaName,
});
