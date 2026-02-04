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
          const usuarioActualizado = usuarios.find(u => u.id_usuario === this.usuarioLogueado?.id_usuario);
          if (usuarioActualizado) {
            this.usuariosService.setUsuarioLogueado(usuarioActualizado);
          }
        }
      });
    }

  }

  cargarCitas(): void {
    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
    this.citasUsuario = todasCitas[this.usuarioLogueado!.email] || [];
  }


  borrarCitasUsuario() {
    if (!this.usuarioLogueado) return;

    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
    delete todasCitas[this.usuarioLogueado.email];
    localStorage.setItem('citas', JSON.stringify(todasCitas));
    
    this.citasUsuario = []; 
  }

  async cancelarCita(cita: any): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      'Sí, cancelar',
      'No'
    );
    
    if (!confirmed) return;

    // Actualizar el estado de la cita a 'cancelada'
    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
    const citasUsuario = todasCitas[this.usuarioLogueado!.email];
    
    // Encontrar y actualizar la cita
    for (let i = 0; i < citasUsuario.length; i++) {
      if (
        citasUsuario[i].fecha === cita.fecha &&
        citasUsuario[i].hora === cita.hora &&
        citasUsuario[i].profesionalId === cita.profesionalId
      ) {
        citasUsuario[i].estado = 'cancelada';
        citasUsuario[i].canceladaPor = 'cliente';
        break;
      }
    }
    
    localStorage.setItem('citas', JSON.stringify(todasCitas));

    // Crear notificación para el cliente
    this.notificacionesService.crearNotificacion({
      idUsuario: Number(this.usuarioLogueado?.id_usuario),
      mensaje: `Has cancelado tu cita del ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}.`,
      fecha: new Date().toISOString()
    });

    // Notificar a los administradores
    this.usuariosService.getAllUsuarios().subscribe({
      next: usuarios => {
        usuarios.forEach(u => {
          if (u.rol === 'administrador') {
            this.notificacionesService.crearNotificacion({
              idUsuario: Number(u.id_usuario),
              mensaje: `<strong class="notif-user">${this.usuarioLogueado?.nombre}</strong> (${this.usuarioLogueado?.email}) ha cancelado su cita de <strong class="notif-entity">${cita.servicio}</strong> con <strong class="notif-entity">${cita.profesional}</strong> el ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}.`,
              fecha: new Date().toISOString()
            });
          }
        });
      }
    });

    // Notificar al profesional
    this.profesionalesService.getAllProfesionales().subscribe({
      next: profesionales => {
        const profesional = profesionales.find(p => p.id_profesional === cita.profesionalId);
        if (profesional && profesional.id_usuario) {
          this.notificacionesService.crearNotificacion({
            idUsuario: Number(profesional.id_usuario),
            mensaje: `<strong class="notif-user">${this.usuarioLogueado?.nombre}</strong> ha cancelado su cita de <strong class="notif-entity">${cita.servicio}</strong> contigo el ${this.formatearFechaLocal(cita.fecha)} a las ${cita.hora}.`,
            fecha: new Date().toISOString()
          });
        }
      }
    });
    
    // Recargar las citas del usuario (ahora mostrará el estado 'cancelada')
    this.cargarCitas();

    // Mostrar mensaje de éxito
    this.alertService.success('Cita cancelada exitosamente');

    console.log('Cita cancelada - estado actualizado a "cancelada"');
  }

  formatearFechaLocal(fechaIso: string): string {
    if (!fechaIso) return '';
    const parts = fechaIso.split('T')[0].split('-');
    if (parts.length < 3) return fechaIso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  puedeSerCancelada(cita: any): boolean {
    // Solo se puede cancelar si el estado es 'pendiente' (o si no tiene estado definido, asumimos pendiente)
    const estado = cita.estado || 'pendiente';
    return estado === 'pendiente';
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
