export type Citas = CitasInterface[];

export interface CitasInterface {
  id_cita: number;
  id_usuario: number;
  id_servicio: number;
  id_profesional: number;
  id_centro: number;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';
  canceladaPor?: 'cliente' | 'admin' | 'profesional' | null;
  servicio?: string;
  centro?: string;
}
