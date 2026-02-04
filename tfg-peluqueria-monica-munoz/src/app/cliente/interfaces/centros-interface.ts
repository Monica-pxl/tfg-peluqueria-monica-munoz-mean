export type Centros = CentrosInterface[];

export interface CentrosInterface {
  id_centro: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  horario_apertura: string;
  horario_cierre: string;
}
