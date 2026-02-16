import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UsuariosService } from './usuarios-service';

export interface NotificacionInterface {
  _id?: string;
  usuario: string;
  rolDestino: 'cliente' | 'profesional' | 'administrador';
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: 'info' | 'exito' | 'advertencia' | 'error';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private apiUrl = 'http://localhost:3001/api/notificaciones';

  // Subject para notificar cuando las notificaciones cambian
  private notificacionesActualizadas = new Subject<void>();
  public notificacionesActualizadas$ = this.notificacionesActualizadas.asObservable();

  constructor(
    private http: HttpClient,
    private usuariosService: UsuariosService
  ) {}

  // Crear nueva notificación
  crearNotificacion(notificacion: Partial<NotificacionInterface>): Observable<any> {
    return this.http.post(this.apiUrl, notificacion);
  }

  // Obtener todas las notificaciones del usuario logueado (retorna array para compatibilidad)
  getNotificaciones(): NotificacionInterface[] {
    // Este método debe ser actualizado en los componentes para usar la versión Observable
    console.warn('getNotificaciones() síncrono está deprecated. Usa getNotificacionesObservable()');
    return [];
  }

  // Obtener todas las notificaciones del usuario logueado (Observable)
  getNotificacionesObservable(): Observable<NotificacionInterface[]> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario || !usuario._id) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    return this.http.get<NotificacionInterface[]>(`${this.apiUrl}/usuario/${usuario._id}`);
  }

  // Obtener notificaciones no leídas del usuario logueado
  getNotificacionesNoLeidas(): Observable<NotificacionInterface[]> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario || !usuario._id) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    return this.http.get<NotificacionInterface[]>(`${this.apiUrl}/usuario/${usuario._id}/no-leidas`);
  }

  // Contar notificaciones no leídas
  contarNoLeidas(): Observable<{ count: number }> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario || !usuario._id) {
      return new Observable(observer => {
        observer.next({ count: 0 });
        observer.complete();
      });
    }
    return this.http.get<{ count: number }>(`${this.apiUrl}/usuario/${usuario._id}/contar-no-leidas`);
  }

  // Verificar si hay notificaciones sin leer (síncrono para compatibilidad con templates)
  // Se debe usar con | async en el template
  hayNotificacionesSinLeer(): Observable<boolean> {
    return new Observable(observer => {
      this.contarNoLeidas().subscribe({
        next: (result) => {
          observer.next(result.count > 0);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  // Marcar una notificación como leída
  marcarComoLeida(idNotificacion: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idNotificacion}/marcar-leida`, {});
  }

  // Marcar todas las notificaciones del usuario como leídas
  marcarTodasComoLeidas(): Observable<any> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario || !usuario._id) {
      return new Observable(observer => {
        observer.next({});
        observer.complete();
      });
    }
    return this.http.put(`${this.apiUrl}/usuario/${usuario._id}/marcar-todas-leidas`, {}).pipe(
      tap(() => {
        // Emitir evento para actualizar el navbar
        this.notificacionesActualizadas.next();
      })
    );
  }

  // Para compatibilidad con código antiguo
  marcarNotificacionesComoLeidas(): void {
    this.marcarTodasComoLeidas().subscribe({
      next: () => console.log('✅ Notificaciones marcadas como leídas'),
      error: (err) => console.error('❌ Error al marcar notificaciones como leídas:', err)
    });
  }

  // Eliminar una notificación específica
  eliminarNotificacion(idNotificacion: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idNotificacion}`);
  }

  // Eliminar todas las notificaciones del usuario (limpiar)
  limpiarNotificaciones(): Observable<any> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario || !usuario._id) {
      return new Observable(observer => {
        observer.next({});
        observer.complete();
      });
    }
    return this.http.delete(`${this.apiUrl}/usuario/${usuario._id}`);
  }

  // Método para actualizar notificaciones (para compatibilidad, pero ahora no hace nada porque la API maneja todo)
  actualizarNotificaciones(notificaciones: any[]): void {
    console.warn('actualizarNotificaciones() está deprecated. La API maneja las actualizaciones automáticamente.');
  }
}
