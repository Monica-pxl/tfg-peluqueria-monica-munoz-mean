export type Profesionales = ProfesionalesInterface[];

export interface ProfesionalesInterface {
  id_profesional: number;
  id_usuario?: number;
  nombre: string;
  apellidos: string;
  id_centro: number;
}
