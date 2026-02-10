export type Usuarios = UsuariosInterface[];

export interface UsuariosInterface {
  _id?: string;  // MongoDB ObjectId
  nombre: string;
  email: string;
  password?: string;
  rol: 'cliente' | 'profesional' | 'administrador';
  estado?: 'activo' | 'inactivo';
  fecha_alta?: string;
  puntos?: number;
  // Compatibilidad temporal con código admin
  id_usuario?: number;
}
