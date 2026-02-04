import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';

@Component({
  selector: 'app-profesional-notificaciones-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profesional-notificaciones-component.html',
  styleUrl: './profesional-notificaciones-component.css',
})
export class ProfesionalNotificacionesComponent {

  notificaciones: any[] = [];

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    console.log('=== PROFESIONAL NOTIFICACIONES COMPONENT ngOnInit ===');
    const todasNotifs = localStorage.getItem('notificaciones');
    console.log('LocalStorage notificaciones RAW:', todasNotifs);
    if (todasNotifs) {
      const parsed = JSON.parse(todasNotifs);
      console.log('Notificaciones parseadas:', parsed);
      console.log('Total notificaciones en localStorage:', parsed.length);
      parsed.forEach((n: any, index: number) => {
        console.log(`Notificación ${index}:`, n);
      });
    }
    this.notificacionesService.marcarNotificacionesComoLeidas();
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.notificaciones = this.notificacionesService.getNotificaciones();
    console.log('Notificaciones cargadas en el componente:', this.notificaciones);
  }

  limpiar() {
    this.notificacionesService.limpiarNotificaciones();
    this.cargarNotificaciones();
  }

  borrarNotificacion(index: number) {
    this.notificaciones.splice(index, 1);
    this.notificacionesService.actualizarNotificaciones(this.notificaciones);
  }
}
