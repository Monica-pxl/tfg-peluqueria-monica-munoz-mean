import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../services/usuarios-service';
import { Router, RouterLink } from '@angular/router';
import { UsuariosInterface } from '../../interfaces/usuarios-interface';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../../admin/services/citas-service';
import { NotificacionesService } from '../../services/notificaciones-service';
import { ProfesionalesService } from '../../services/profesionales-service';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-mis-citas-component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-citas-component.html',
  styleUrl: './mis-citas-component.css',
})
export class MisCitasComponent implements OnInit{

  citasUsuario: any[] = [];

  usuarioLogueado: UsuariosInterface | null = null;
  mensaje: string = "";

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private citasService: CitasService,
    private notificacionesService: NotificacionesService,
    private profesionalesService: ProfesionalesService,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ){}


  ngOnInit(): void {

    this.usuarioLogueado = this.usuariosService.getUsuarioLogueado();

    if(!this.usuarioLogueado){
      this.mensaje = 'Debes iniciar sesión o registrarte para ver tus citas.'
      return;

    }else{
      this.cargarCitas();
      // Actualizar datos del usuario desde el backend para reflejar los puntos actualizados
      this.usuariosService.getAllUsuarios().subscribe({
        next: usuarios => {
          const usuarioActualizado = usuarios.find(u => u._id === this.usuarioLogueado?._id);
          if (usuarioActualizado) {
            this.usuariosService.setUsuarioLogueado(usuarioActualizado);
          }
        }
      });
    }

  }

  cargarCitas(): void {
    if (!this.usuarioLogueado?._id) return;

    // Cargar las citas desde MongoDB filtrando por el usuario logueado
    this.citasService.getAllCitasFromDB().subscribe({
      next: (citas: any[]) => {
        this.citasUsuario = citas
          .filter(cita => {
            // Filtrar por usuario logueado (puede ser string _id u objeto)
            const usuarioId = typeof cita.usuario === 'object' && cita.usuario?._id
              ? cita.usuario._id
              : cita.usuario;
            return usuarioId === this.usuarioLogueado?._id;
          })
          .map(cita => ({
            _id: cita._id,
            centro: typeof cita.centro === 'object' ? cita.centro.nombre : 'Desconocido',
            servicio: typeof cita.servicio === 'object' ? cita.servicio.nombre : 'Desconocido',
            profesional: typeof cita.profesional === 'object'
              ? `${cita.profesional.nombre} ${cita.profesional.apellidos || ''}`.trim()
              : 'Desconocido',
            fecha: cita.fecha,
            hora: cita.hora,
            estado: cita.estado || 'pendiente',
            precio: cita.precio || 0
          }));
      },
      error: () => {
        this.alertService.error('Error al cargar tus citas');
        this.citasUsuario = [];
      }
    });
  }


  borrarCitasUsuario() {
    // Esta función ya no es necesaria con MongoDB, pero la mantenemos vacía por compatibilidad
    console.log('borrarCitasUsuario no hace nada con MongoDB');
  }

  async cancelarCita(cita: any): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      'Sí, cancelar',
      'No'
    );

    if (!confirmed) return;

    if (!cita._id) {
      this.alertService.error('Error: La cita no tiene ID');
      return;
    }

    // Actualizar el estado de la cita a 'cancelada' en MongoDB
    this.citasService.actualizarCita(cita._id, {
      estado: 'cancelada',
      rolActualizador: 'cliente'
    }).subscribe({
      next: () => {
        // Las notificaciones se crean automáticamente en el backend
        this.cargarCitas();
        this.alertService.success('Cita cancelada exitosamente');
      },
      error: () => {
        this.alertService.error('Error al cancelar la cita');
      }
    });
  }

  formatearFechaLocal(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('T')[0].split('-');
    if (parts.length < 3) return fechaIso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Verificar si la cita ya pasó (fecha y hora)
  citaYaPaso(cita: any): boolean {
    const fechaHoraCita = new Date(`${cita.fecha}T${cita.hora}`);
    const ahora = new Date();
    return fechaHoraCita < ahora;
  }

  puedeSerCancelada(cita: any): boolean {
    // Solo se puede cancelar si el estado es 'pendiente' Y la cita NO ha pasado
    const estado = cita.estado || 'pendiente';
    return estado === 'pendiente' && !this.citaYaPaso(cita);
  }

  getEstadoClase(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'badge-pendiente';
      case 'confirmada': return 'badge-confirmada';
      case 'cancelada': return 'badge-cancelada';
      case 'realizada': return 'badge-realizada';
      default: return 'badge-pendiente';
    }
  }

}
