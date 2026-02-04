export type Usuarios = UsuariosInterface[];

export interface UsuariosInterface {
  id_usuario: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'cliente' | 'profesional' | 'administrador';
  estado?: 'activo' | 'inactivo';
  fecha_alta?: string;
  puntos?: number;
}
