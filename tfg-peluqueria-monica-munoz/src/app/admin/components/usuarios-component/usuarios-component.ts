import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-usuarios-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-component.html',
  styleUrl: './usuarios-component.css',
})
export class UsuariosComponent implements OnInit {
  usuarios: UsuariosInterface[] = [];
  usuariosFiltrados: UsuariosInterface[] = [];
  usuarioLogueado: UsuariosInterface | null = null;

  filtroRol: string = 'todos';
  filtroEstado: string = 'todos';
  busquedaTexto: string = '';

  constructor(
    private usuariosService: UsuariosService,
    private http: HttpClient,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit() {
    this.usuarioLogueado = this.usuariosService.getUsuarioLogueado();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.getAllUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data.map(u => ({
          ...u,
          estado: u.estado || 'activo',
          fecha_alta: u.fecha_alta || new Date().toISOString().split('T')[0]
        }));
        this.aplicarFiltros();
      },
      error: (error) => console.error('Error al cargar usuarios:', error)
    });
  }

  aplicarFiltros() {
    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const cumpleFiltroRol = this.filtroRol === 'todos' || usuario.rol === this.filtroRol;
      const cumpleFiltroEstado = this.filtroEstado === 'todos' || usuario.estado === this.filtroEstado;
      const cumpleBusqueda = this.busquedaTexto === '' ||
        usuario.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        usuario.email.toLowerCase().includes(this.busquedaTexto.toLowerCase());

      return cumpleFiltroRol && cumpleFiltroEstado && cumpleBusqueda;
    });
  }

  async cambiarRol(usuario: UsuariosInterface, event: any): Promise<void> {
    const nuevoRol = event.target.value;

    // Determinar la variante según el rol al que se cambia
    let variant: 'professional' | 'admin' | 'client' = 'client';
    if (nuevoRol === 'profesional') {
      variant = 'professional';
    } else if (nuevoRol === 'administrador') {
      variant = 'admin';
    } else {
      variant = 'client';
    }

    const confirmacion = await this.confirmService.confirm(
      'Cambiar Rol',
      `¿Cambiar el rol de "${usuario.nombre}" a "${nuevoRol}"?`,
      'Sí, cambiar',
      'Cancelar',
      variant
    );

    if (!confirmacion) {
      // Revertir el select
      event.target.value = usuario.rol;
      return;
    }

    if (!usuario._id) {
      this.alertService.error('Error: El usuario no tiene ID válido');
      event.target.value = usuario.rol;
      return;
    }

    const datos = { rol: nuevoRol };

    this.usuariosService.actualizarUsuarioPorId(usuario._id, datos).subscribe({
      next: () => {
        usuario.rol = nuevoRol;
        this.alertService.success('Rol actualizado correctamente');
      },
      error: (error: any) => {
        event.target.value = usuario.rol;
        this.alertService.error('Error al actualizar rol: ' + (error.error?.error || 'Error desconocido'));
        console.error('Error:', error);
      }
    });
  }

  cambiarEstado(usuario: UsuariosInterface, event: any) {
    const nuevoEstado = event.target.value;

    if (!usuario._id) {
      this.alertService.error('Error: El usuario no tiene ID válido');
      event.target.value = usuario.estado;
      return;
    }

    const datos = { estado: nuevoEstado };

    this.usuariosService.actualizarUsuarioPorId(usuario._id, datos).subscribe({
      next: () => {
        usuario.estado = nuevoEstado;
        this.alertService.success('Estado actualizado correctamente');
      },
      error: (error: any) => {
        event.target.value = usuario.estado;
        this.alertService.error('Error al actualizar estado: ' + (error.error?.error || 'Error desconocido'));
        console.error('Error:', error);
      }
    });
  }

  async eliminarUsuario(usuario: UsuariosInterface): Promise<void> {
    // Validación: No puede eliminarse a sí mismo
    if (this.usuarioLogueado && usuario._id === this.usuarioLogueado._id) {
      this.alertService.warning('No puedes eliminarte a ti mismo');
      return;
    }

    if (!usuario._id) {
      this.alertService.error('Error: El usuario no tiene ID válido');
      return;
    }

    const confirmacion = await this.confirmService.confirm(
      'Eliminar Usuario',
      `¿Estás seguro de que deseas eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmacion) return;

    // Eliminar directamente desde MongoDB - las validaciones de citas activas se hacen en el backend
    this.http.delete(`http://localhost:3001/api/usuarios/${usuario._id}`).subscribe({
      next: () => {
        this.alertService.success('Usuario eliminado correctamente');
        this.cargarUsuarios();
      },
      error: (error) => {
        this.alertService.error('Error al eliminar usuario: ' + (error.error?.error || 'Error desconocido'));
        console.error('Error al eliminar usuario:', error);
      }
    });
  }

  getRolClass(rol: string): string {
    switch(rol) {
      case 'administrador': return 'select-admin';
      case 'profesional': return 'select-profesional';
      case 'cliente': return 'select-cliente';
      default: return '';
    }
  }

  getEstadoClass(estado: string | undefined): string {
    return estado === 'activo' ? 'select-activo' : 'select-inactivo';
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';

    try {
      const date = new Date(fecha);

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return 'N/A';

      // Formatear como DD/MM/YYYY
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const anio = date.getFullYear();

      return `${dia}/${mes}/${anio}`;
    } catch (error) {
      return 'N/A';
    }
  }
}

