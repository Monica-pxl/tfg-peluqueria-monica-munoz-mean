export type Profesionales = ProfesionalesInterface[];

export interface ProfesionalesInterface {
  _id?: string;  // MongoDB ObjectId
  usuario?: string | { _id: string; nombre: string; email: string; };  // Referencia a Usuario (puede estar poblado)
  nombre: string;
  apellidos: string;
  centro?: string | { _id: string; nombre: string; };  // Referencia a Centro (puede estar poblado)
  // Compatibilidad temporal con código admin
  id_profesional?: number;
  id_usuario?: number;
  id_centro?: number;
}
