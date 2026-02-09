export type Profesionales = ProfesionalesInterface[];

export interface ProfesionalesInterface {
  _id?: string;  // MongoDB ObjectId
  id_profesional: number;  // Mantener como requerido por compatibilidad
  id_usuario?: number;
  nombre: string;
  apellidos: string;
  id_centro: number;  // Mantener como requerido por compatibilidad
  centro?: string | { _id: string; nombre: string; };  // MongoDB: puede ser ObjectId o centro poblado
}
