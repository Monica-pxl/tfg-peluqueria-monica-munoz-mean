export type Citas = CitasInterface[];

export interface CitasInterface {
  _id?: string;  // MongoDB ObjectId
  usuario: string | { _id: string; nombre: string; email: string; };  // Referencia a Usuario (puede estar poblado)
  profesional: string | { _id: string; nombre: string; apellidos: string; };  // Referencia a Profesional (puede estar poblado)
  servicio: string | { _id: string; nombre: string; precio: number; duracion: number; };  // Referencia a Servicio (puede estar poblado)
  centro: string | { _id: string; nombre: string; };  // Referencia a Centro (puede estar poblado)
  fecha: string;
  hora: string;
  precio: number;  // Precio del servicio al momento de reservar
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';
  createdAt?: string;
  updatedAt?: string;
  // Compatibilidad temporal con código admin
  id_cita?: number;
  id_usuario?: number;
  id_profesional?: number;
  id_servicio?: number;
  id_centro?: number;
  canceladaPor?: 'cliente' | 'admin' | 'profesional' | null;
}
