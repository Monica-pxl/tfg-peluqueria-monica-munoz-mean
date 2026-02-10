import { Component } from '@angular/core';
import { NotificacionesService } from '../../services/notificaciones-service';

@Component({
  selector: 'app-cuenta-usuario-notificaciones-component',
  imports: [],
  templateUrl: './cuenta-usuario-notificaciones-component.html',
  styleUrl: './cuenta-usuario-notificaciones-component.css',
  standalone: true
})
export class CuentaUsuarioNotificacionesComponent {

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
