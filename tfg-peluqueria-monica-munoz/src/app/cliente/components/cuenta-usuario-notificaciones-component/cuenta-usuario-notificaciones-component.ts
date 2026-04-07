import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService, NotificacionInterface } from '../../services/notificaciones-service';

@Component({
  selector: 'app-cuenta-usuario-notificaciones-component',
  imports: [CommonModule],
  templateUrl: './cuenta-usuario-notificaciones-component.html',
  styleUrl: './cuenta-usuario-notificaciones-component.css',
  standalone: true
})
export class CuentaUsuarioNotificacionesComponent {

  notificaciones: NotificacionInterface[] = [];

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    // Marcar como leídas al entrar a la página
    this.notificacionesService.marcarTodasComoLeidas().subscribe({
      next: () => {
        // console.log('✅ Notificaciones marcadas como leídas');
        this.cargarNotificaciones();
      },
      error: (err) => {
        console.error('Error al marcar como leídas:', err);
        this.cargarNotificaciones();
      }
    });
  }

  cargarNotificaciones() {
    this.notificacionesService.getNotificacionesObservable().subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones;
      },
      error: (err) => {
        console.error('Error al cargar notificaciones:', err);
        this.notificaciones = [];
      }
    });
  }

  limpiar() {
    this.notificacionesService.limpiarNotificaciones().subscribe({
      next: () => {
        this.cargarNotificaciones();
      },
      error: (err) => {
        console.error('Error al limpiar notificaciones:', err);
      }
    });
  }

  borrarNotificacion(notificacion: NotificacionInterface) {
    if (!notificacion._id) return;

    this.notificacionesService.eliminarNotificacion(notificacion._id).subscribe({
      next: () => {
        this.cargarNotificaciones();
      },
      error: (err) => {
        console.error('Error al borrar notificación:', err);
      }
    });
  }
}
