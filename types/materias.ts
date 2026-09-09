export interface Materia {
  id: string;
  name: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MateriaSummary extends Materia {
  presentationCount: number;
  minicasoBankCount: number;
}
