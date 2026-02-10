export type Centros = CentrosInterface[];

export interface CentrosInterface {
  _id?: string;  // MongoDB ObjectId
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  horario_apertura: string;
  horario_cierre: string;
  // Compatibilidad temporal con código admin
  id_centro?: number;
}
