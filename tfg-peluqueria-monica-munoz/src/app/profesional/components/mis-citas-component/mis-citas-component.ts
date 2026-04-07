import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasInterface } from '../../../cliente/interfaces/citas-interface';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CitasService } from '../../../admin/services/citas-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-mis-citas-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-citas-component.html',
  styleUrl: './mis-citas-component.css',
})
export class MisCitasComponent implements OnInit {

  citas: CitasInterface[] = [];
  citasFiltradas: CitasInterface[] = [];
  usuarios: UsuariosInterface[] = [];
  servicios: ServiciosInterface[] = [];
  centros: CentrosInterface[] = [];
  estados = ['pendiente', 'confirmada', 'cancelada', 'realizada'];
  busquedaTexto: string = '';
  idUsuario: number = 0;
  idProfesional: string | undefined = undefined;
  cargando = false;

  constructor(
    private citasService: CitasService,
    private usuariosService: UsuariosService,
    private serviciosService: ServiciosService,
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
    private notificacionesService: NotificacionesService,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    // Obtener el usuario logueado
    const usuarioLogueado = this.usuariosService.getUsuarioLogueado();

    if (!usuarioLogueado || !usuarioLogueado._id) {
      this.alertService.error('No se pudo obtener la información del usuario');
      return;
    }

    // Primero obtener el id_profesional a partir del _id del usuario
    this.cargando = true;
    this.profesionalesService.getAllProfesionales().subscribe({
      next: profesionales => {
        // console.log('Buscando profesional para usuario:', usuarioLogueado);
        // console.log('Profesionales disponibles:', profesionales);
        // Buscar profesional por el campo 'usuario' que debe coincidir con el _id del usuario logueado
        const profesional = profesionales.find(p => {
          // Si 'usuario' es un objeto poblado, comparar con usuario._id
          if (typeof p.usuario === 'object' && p.usuario !== null) {
            return p.usuario._id === usuarioLogueado._id;
          }
          // Si 'usuario' es un string (ObjectId), compararlo directamente
          return p.usuario === usuarioLogueado._id;
        });

        if (profesional) {
          this.idProfesional = profesional._id; // Usar _id en lugar de id_profesional
          // console.log('Profesional encontrado:', profesional);
          this.cargarDatos();
        } else {
          console.error('No se encontró profesional asociado a este usuario');
          this.alertService.error('No se encontró el profesional asociado a tu usuario');
        }
      },
      error: () => {
        this.cargando = false;
        this.alertService.error('Error al cargar datos del profesional');
      }
    });
  }

  cargarDatos(): void {
    this.serviciosService.getAllServices().subscribe(servicios => {
      this.servicios = servicios;
      this.centrosService.getAllCentros().subscribe(centros => {
        this.centros = centros;
        this.cargarCitas();
      });
    });
  }

  cargarCitas(): void {
    if (!this.idProfesional) return;
    this.citasService.getCitasPorProfesional(this.idProfesional).subscribe({
      next: (citas: CitasInterface[]) => {
        this.cargando = false;
        this.citas = citas.map(c => ({ ...c, estado: c.estado || 'pendiente' }));
        this.citasFiltradas = this.citas;
      },
      error: () => {
        this.cargando = false;
        this.alertService.error('Error al cargar citas');
      }
    });
  }

  aplicarFiltros(): void {
    this.citasFiltradas = this.citas.filter(cita => {
      const cumpleBusqueda = this.busquedaTexto === '' ||
        this.nombreUsuario(cita).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreServicio(cita).toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
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
    // (Esta lógica necesita adaptarse para MongoDB)

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

    // Si se marca como realizada, sumar puntos al cliente
    if (nuevoEstado === 'realizada' && estadoAnterior !== 'realizada') {
      cita.estado = 'realizada';

      if (!cita._id) {
        this.alertService.error('Error: La cita no tiene ID');
        cita.estado = estadoAnterior;
        return;
      }

      // Usar endpoint de marcar como realizada que suma puntos y crea notificaciones
      this.citasService.marcarCitaRealizada(cita._id, {
        rolMarcador: 'profesional',
        marcadoPor: this.usuariosService.getUsuarioLogueado()?._id
      }).subscribe({
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

    this.citasService.actualizarCita(cita._id, {
      estado: nuevoEstado as any,
      rolActualizador: 'profesional',
      actualizadoPor: this.usuariosService.getUsuarioLogueado()?._id
    }).subscribe({
      next: () => {
        // console.log('✅ Estado actualizado correctamente a:', nuevoEstado);
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
    const yaPaso = this.citaYaPaso(cita);

    // Si la cita ya está realizada, no se puede cambiar
    if (cita.estado === 'realizada') {
      return ['realizada'];
    }

    // Si la cita ya está cancelada, no se puede cambiar a ningún otro estado
    if (cita.estado === 'cancelada') {
      return ['cancelada'];
    }

    // Si la cita está confirmada
    if (cita.estado === 'confirmada') {
      if (yaPaso) {
        // Si ya pasó, SOLO puede marcarse como realizada (NO cancelar)
        return ['confirmada', 'realizada'];
      } else {
        // Si no ha pasado, puede cancelarse
        return ['confirmada', 'cancelada'];
      }
    }

    // Si la cita está pendiente
    if (yaPaso) {
      // Si ya pasó y sigue pendiente, NO se puede cambiar (se quedó sin gestionar)
      return ['pendiente'];
    } else {
      // Si no ha pasado, puede confirmarse o cancelarse
      return ['pendiente', 'confirmada', 'cancelada'];
    }
  }
}
