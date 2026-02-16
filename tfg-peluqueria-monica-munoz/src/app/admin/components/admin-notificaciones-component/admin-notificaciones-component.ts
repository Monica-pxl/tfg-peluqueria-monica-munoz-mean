import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService, NotificacionInterface } from '../../../cliente/services/notificaciones-service';

@Component({
  selector: 'app-admin-notificaciones-component',
  templateUrl: './admin-notificaciones-component.html',
  styleUrls: ['./admin-notificaciones-component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminNotificacionesComponent {

  notificaciones: NotificacionInterface[] = [];

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    // Marcar como leídas al entrar a la página
    this.notificacionesService.marcarTodasComoLeidas().subscribe({
      next: () => {
        console.log('✅ Notificaciones marcadas como leídas');
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
        console.log('✅ Notificaciones admin cargadas:', this.notificaciones.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar notificaciones:', err);
        this.notificaciones = [];
      }
    });
  }

  limpiar() {
    this.notificacionesService.limpiarNotificaciones().subscribe({
      next: () => {
        console.log('✅ Notificaciones limpiadas');
        this.cargarNotificaciones();
      },
      error: (err) => {
        console.error('❌ Error al limpiar notificaciones:', err);
      }
    });
  }

  borrarNotificacion(notificacion: NotificacionInterface) {
    if (!notificacion._id) return;

    this.notificacionesService.eliminarNotificacion(notificacion._id).subscribe({
      next: () => {
        console.log('✅ Notificación eliminada');
        this.cargarNotificaciones();
      },
      error: (err) => {
        console.error('❌ Error al borrar notificación:', err);
      }
    });
  }
}
