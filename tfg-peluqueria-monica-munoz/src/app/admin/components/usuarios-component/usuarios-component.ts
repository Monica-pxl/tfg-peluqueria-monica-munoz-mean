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

    const datos = { rol: nuevoRol };

    this.usuariosService.actualizarUsuario(usuario.id_usuario, datos).subscribe({
      next: () => {
        usuario.rol = nuevoRol;
        this.alertService.success('Rol actualizado correctamente');
      },
      error: (error) => {
        event.target.value = usuario.rol;
        this.alertService.error('Error al actualizar rol: ' + (error.error?.error || 'Error desconocido'));
        console.error('Error:', error);
      }
    });
  }

  cambiarEstado(usuario: UsuariosInterface, event: any) {
    const nuevoEstado = event.target.value;

    const datos = { estado: nuevoEstado };

    this.usuariosService.actualizarUsuario(usuario.id_usuario, datos).subscribe({
      next: () => {
        usuario.estado = nuevoEstado;
        this.alertService.success('Estado actualizado correctamente');
      },
      error: (error) => {
        event.target.value = usuario.estado;
        this.alertService.error('Error al actualizar estado: ' + (error.error?.error || 'Error desconocido'));
        console.error('Error:', error);
      }
    });
  }

  async eliminarUsuario(usuario: UsuariosInterface): Promise<void> {
    // Validación: No puede eliminarse a sí mismo
    if (this.usuarioLogueado && usuario.id_usuario === this.usuarioLogueado.id_usuario) {
      this.alertService.warning('No puedes eliminarte a ti mismo');
      return;
    }

    const confirmacion = await this.confirmService.confirm(
      'Eliminar Usuario',
      `¿Estás seguro de que deseas eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer. Las citas históricas se mantendrán pero el usuario será eliminado completamente.`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmacion) return;

    // Verificar si tiene citas activas en localStorage
    try {
      const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
      let citasActivasCount = 0;

      // Si es profesional, obtener su id_profesional
      let idProfesional: number | null = null;
      if (usuario.rol === 'profesional') {
        this.http.get<any[]>('http://localhost:3001/api/profesionales').subscribe({
          next: (profesionales) => {
            const profesional = profesionales.find(p => Number(p.id_usuario) === Number(usuario.id_usuario));
            if (profesional) {
              idProfesional = Number(profesional.id_profesional);
            }

            // Verificar citas después de obtener el id_profesional
            this.verificarYEliminar(usuario, todasCitas, idProfesional);
          },
          error: (error) => {
            console.error('Error al obtener profesionales:', error);
            this.alertService.error('Error al verificar datos del profesional');
          }
        });
      } else {
        // Si no es profesional, verificar directamente
        this.verificarYEliminar(usuario, todasCitas, null);
      }
    } catch (error) {
      console.error('Error al verificar citas desde localStorage:', error);
      this.alertService.error('Error al verificar las citas del usuario');
    }
  }

  private verificarYEliminar(usuario: UsuariosInterface, todasCitas: any, idProfesional: number | null): void {
    let citasActivasCount = 0;

    // Buscar citas en localStorage
    for (const email in todasCitas) {
      const citasUsuario = todasCitas[email];
      if (Array.isArray(citasUsuario)) {
        const citasActivasUsuario = citasUsuario.filter(cita => {
          const estado = cita.estado ? cita.estado.toLowerCase() : '';
          const esActiva = estado === 'pendiente' || estado === 'confirmada';

          if (!esActiva) return false;

          // Verificar si es cita como cliente (por email)
          const esCitaComoCliente = email === usuario.email;

          // Verificar si es cita como profesional (por id_profesional)
          const esCitaComoProfesional = idProfesional !== null &&
            Number(cita.profesionalId) === Number(idProfesional);

          return esCitaComoCliente || esCitaComoProfesional;
        });
        citasActivasCount += citasActivasUsuario.length;
      }
    }

    if (citasActivasCount > 0) {
      const rolTexto = usuario.rol === 'profesional' ? 'profesional' : 'usuario';
      this.alertService.warning(`No se puede eliminar este ${rolTexto} porque tiene ${citasActivasCount} cita(s) activa(s) (pendiente/confirmada). Debe cancelarlas primero.`);
      return;
    }

    // Proceder con la eliminación
    const body = this.usuarioLogueado ? { id_admin: this.usuarioLogueado.id_usuario } : {};

    this.http.delete(`http://localhost:3001/api/usuarios/${usuario.id_usuario}`, { body }).subscribe({
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

