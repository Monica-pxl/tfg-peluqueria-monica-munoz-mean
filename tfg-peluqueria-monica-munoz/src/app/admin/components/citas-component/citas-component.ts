import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasInterface } from '../../../cliente/interfaces/citas-interface';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { CitasService } from '../../services/citas-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-citas-component',
  templateUrl: './citas-component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./citas-component.css']
})
export class CitasComponent implements OnInit {

  citas: CitasInterface[] = [];
  citasFiltradas: CitasInterface[] = [];
  usuarios: UsuariosInterface[] = [];
  servicios: ServiciosInterface[] = [];
  profesionales: ProfesionalesInterface[] = [];
  centros: CentrosInterface[] = [];
  estados = ['pendiente', 'confirmada', 'cancelada', 'realizada'];
  busquedaTexto: string = '';

  constructor(
    private citasService: CitasService,
    private usuariosService: UsuariosService,
    private serviciosService: ServiciosService,
    private profesionalesService: ProfesionalesService,
    private centrosService: CentrosService,
    private notificacionesService: NotificacionesService,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.usuariosService.getAllUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.serviciosService.getAllServices().subscribe(servicios => {
          this.servicios = servicios;
          this.profesionalesService.getAllProfesionales().subscribe(profesionales => {
            this.profesionales = profesionales;
            this.centrosService.getAllCentros().subscribe(centros => {
              this.centros = centros;
              this.cargarCitas();
            });
          });
        });
      },
      error: () => this.alertService.error('Error al cargar usuarios')
    });
  }

  cargarCitas(): void {
    this.citasService.getAllCitasFromDB().subscribe({
      next: (citas: CitasInterface[]) => {
        this.citas = citas.map(c => ({
          ...c,
          estado: c.estado || 'pendiente'
        }));
        this.citasFiltradas = this.citas;
      },
      error: () => this.alertService.error('Error al cargar citas')
    });
  }

  aplicarFiltros(): void {
    this.citasFiltradas = this.citas.filter(cita => {
      const cumpleBusqueda = this.busquedaTexto === '' ||
        this.nombreUsuario(cita).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreServicio(cita).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreProfesional(cita).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreCentro(cita).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        cita.fecha.includes(this.busquedaTexto) ||
        cita.hora.includes(this.busquedaTexto);
      return cumpleBusqueda;
    });
  }

  cambiarEstado(cita: CitasInterface, nuevoEstado: string): void {
    const estadoAnterior = cita.estado;

    // TODO: Adaptar validaciones para MongoDB
    // Validar si la cita fue cancelada por el cliente
    // if (cita.canceladaPor === 'cliente') {
    //   this.alertService.warning('No puedes cambiar el estado de una cita cancelada por el cliente');
    //   setTimeout(() => {
    //     cita.estado = estadoAnterior;
    //     this.cargarCitas();
    //   }, 0);
    //   return;
    // }

    // Validar que no se pueda marcar como realizada una cita ya realizada (usar estadoAnterior)
    if (nuevoEstado === 'realizada' && estadoAnterior === 'realizada') {
      this.alertService.warning('Esta cita ya fue marcada como realizada');
      // Revertir el select
      setTimeout(() => {
        cita.estado = estadoAnterior;
      }, 0);
      return;
    }

    // Validar que no se pueda marcar como realizada una cita que aún no ha pasado
    if (nuevoEstado === 'realizada' && !this.citaYaPaso(cita)) {
      this.alertService.warning('No puedes marcar como realizada una cita que aún no ha pasado');
      // Revertir el cambio en el select
      setTimeout(() => {
        cita.estado = estadoAnterior;
        this.cargarCitas();
      }, 0);
      return;
    }

    // Si se marca como realizada, actualizar estado
    if (nuevoEstado === 'realizada' && estadoAnterior !== 'realizada') {
      // Cambiar el estado temporalmente para actualizar el UI
      cita.estado = 'realizada';

      // TODO: Implementar lógica de puntos con MongoDB
      // Por ahora solo actualizar el estado
      if (!cita._id) {
        this.alertService.error('Error: La cita no tiene ID');
        cita.estado = estadoAnterior;
        return;
      }

      this.citasService.actualizarCita(cita._id, { estado: 'realizada' }).subscribe({
        next: () => {
          this.alertService.success('Cita marcada como realizada');
          this.cargarCitas();
        },
        error: () => {
          this.alertService.error('Error al marcar la cita como realizada');
          cita.estado = estadoAnterior;
        }
      });
      return;
    }

    // Para otros estados (pendiente, confirmada, cancelada)
    cita.estado = nuevoEstado as 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';

    if (!cita._id) {
      this.alertService.error('Error: La cita no tiene ID');
      cita.estado = estadoAnterior;
      return;
    }

    // Actualizar el estado en la base de datos
    this.citasService.actualizarCita(cita._id, { estado: nuevoEstado as any }).subscribe({
      next: () => {
        // TODO: Agregar notificaciones cuando se implemente completamente
        console.log('Estado actualizado correctamente a:', nuevoEstado);
        this.alertService.success('Estado de cita actualizado correctamente');
        this.cargarCitas();
      },
      error: () => {
        this.alertService.error('Error al actualizar el estado');
        cita.estado = estadoAnterior;
      }
    });
  }

  nombreUsuario(cita: CitasInterface): string {
    if (typeof cita.usuario === 'object' && cita.usuario !== null) {
      return cita.usuario.nombre || 'Desconocido';
    }
    return 'Desconocido';
  }

  nombreServicio(cita: CitasInterface): string {
    if (typeof cita.servicio === 'object' && cita.servicio !== null) {
      return cita.servicio.nombre || 'Desconocido';
    }
    return 'Desconocido';
  }

  nombreCentro(cita: CitasInterface): string {
    if (typeof cita.centro === 'object' && cita.centro !== null) {
      return cita.centro.nombre || 'Desconocido';
    }
    return 'Desconocido';
  }

  nombreProfesional(cita: CitasInterface): string {
    if (typeof cita.profesional === 'object' && cita.profesional !== null) {
      return `${cita.profesional.nombre} ${cita.profesional.apellidos || ''}`.trim();
    }
    return 'Desconocido';
  }

  formatearFechaLocal(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('T')[0].split('-');
    if (parts.length < 3) return fechaIso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Verificar si la cita ya pasó (fecha y hora)
  citaYaPaso(cita: CitasInterface): boolean {
    const fechaHoraCita = new Date(`${cita.fecha}T${cita.hora}`);
    const ahora = new Date();
    return fechaHoraCita < ahora;
  }

  // Obtener estados disponibles según el estado actual y si la cita ya pasó
  getEstadosDisponibles(cita: CitasInterface): string[] {
    // Si la cita ya está realizada, no se puede cambiar
    if (cita.estado === 'realizada') {
      return ['realizada'];
    }

    // Si la cita ya está cancelada, solo puede marcar como realizada o mantener cancelada
    if (cita.estado === 'cancelada') {
      if (this.citaYaPaso(cita)) {
        return ['cancelada', 'realizada'];
      } else {
        return ['cancelada'];
      }
    }

    // Si la cita está confirmada
    if (cita.estado === 'confirmada') {
      if (this.citaYaPaso(cita)) {
        // Si ya pasó, puede ir a cancelada o realizada (no a pendiente)
        return ['confirmada', 'cancelada', 'realizada'];
      } else {
        // Si no ha pasado, puede ir a cancelada (no a pendiente)
        return ['confirmada', 'cancelada'];
      }
    }

    // Si la cita está pendiente
    if (this.citaYaPaso(cita)) {
      return ['pendiente', 'confirmada', 'cancelada', 'realizada'];
    } else {
      return ['pendiente', 'confirmada', 'cancelada'];
    }
  }


  async borrarCita(cita: CitasInterface): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Cita',
      '¿Seguro que quieres eliminar esta cita? Esto la borrará completamente del sistema.',
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    if (!cita._id) {
      this.alertService.error('Error: La cita no tiene ID');
      return;
    }

    // Eliminar la cita de MongoDB
    this.citasService.eliminarCita(cita._id).subscribe({
      next: () => {
        this.alertService.success('Cita eliminada exitosamente');
        this.cargarCitas();
      },
      error: () => {
        this.alertService.error('Error al eliminar la cita');
      }
    });
  }

}
