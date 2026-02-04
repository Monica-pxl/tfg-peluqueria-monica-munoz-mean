import { Component } from '@angular/core';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';

@Component({
  selector: 'app-admin-notificaciones-component',
  templateUrl: './admin-notificaciones-component.html',
  styleUrls: ['./admin-notificaciones-component.css']
})
export class AdminNotificacionesComponent {

  notificaciones: any[] = [];

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    this.notificacionesService.marcarNotificacionesComoLeidas();
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.notificaciones = this.notificacionesService.getNotificaciones();
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
