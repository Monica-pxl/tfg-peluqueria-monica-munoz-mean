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

  private apiUrl = 'https://hairgest-backend.vercel.app/api/notificaciones';

  // Subject para notificar cuando las notificaciones cambian
  private notificacionesActualizadas = new Subject<void>();
  public notificacionesActualizadas$ = this.notificacionesActualizadas.asObservable();

  constructor(
    private http: HttpClient,
    private usuariosService: UsuariosService
  ) {}

  // Obtener todas las notificaciones del usuario logueado (Observable)
  getNotificacionesObservable(): Observable<NotificacionInterface[]> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    // console.log('🔍 [Notificaciones] Usuario logueado:', usuario);

    // El backend ahora devuelve tanto _id como id_usuario
    const userId = (usuario as any)?._id || (usuario as any)?.id_usuario;

    if (!usuario || !userId) {
      console.error('❌ [Notificaciones] No hay usuario logueado o no tiene ID');
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const url = `${this.apiUrl}/usuario/${userId}`;
    // console.log('📡 [Notificaciones] Llamando a:', url);

    return this.http.get<NotificacionInterface[]>(url).pipe(
      tap(notificaciones => {
        // console.log('✅ [Notificaciones] Recibidas:', notificaciones.length, 'notificaciones');
      })
    );
  }

  // Obtener notificaciones no leídas del usuario logueado
  getNotificacionesNoLeidas(): Observable<NotificacionInterface[]> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    // console.log('🔍 [Notificaciones No Leídas] Usuario logueado:', usuario);

    // Intentar obtener el ID del usuario (puede ser _id o id_usuario)
    const userId = (usuario as any)?._id || (usuario as any)?.id_usuario;

    if (!usuario || !userId) {
      console.error('❌ [Notificaciones No Leídas] No hay usuario logueado o no tiene _id/id_usuario');
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const url = `${this.apiUrl}/usuario/${userId}/no-leidas`;
    // console.log('📡 [Notificaciones No Leídas] Llamando a:', url);

    return this.http.get<NotificacionInterface[]>(url).pipe(
      tap(notificaciones => {
        // console.log('✅ [Notificaciones No Leídas] Recibidas:', notificaciones.length, 'notificaciones');
      })
    );
  }

  // Contar notificaciones no leídas
  contarNoLeidas(): Observable<{ count: number }> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    // console.log('🔍 [Contar No Leídas] Usuario logueado:', usuario);

    // Intentar obtener el ID del usuario (puede ser _id o id_usuario)
    const userId = (usuario as any)?._id || (usuario as any)?.id_usuario;

    if (!usuario || !userId) {
      console.error('❌ [Contar No Leídas] No hay usuario logueado o no tiene _id/id_usuario');
      return new Observable(observer => {
        observer.next({ count: 0 });
        observer.complete();
      });
    }

    const url = `${this.apiUrl}/usuario/${userId}/contar-no-leidas`;
    // console.log('📡 [Contar No Leídas] Llamando a:', url);

    return this.http.get<{ count: number }>(url).pipe(
      tap(response => {
        // console.log('✅ [Contar No Leídas] Count:', response.count);
      })
    );
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
    const userId = (usuario as any)?._id || (usuario as any)?.id_usuario;

    if (!usuario || !userId) {
      return new Observable(observer => {
        observer.next({});
        observer.complete();
      });
    }
    return this.http.put(`${this.apiUrl}/usuario/${userId}/marcar-todas-leidas`, {}).pipe(
      tap(() => {
        // Emitir evento para actualizar el navbar
        this.notificacionesActualizadas.next();
      })
    );
  }

  // Para compatibilidad con código antiguo
  marcarNotificacionesComoLeidas(): void {
    this.marcarTodasComoLeidas().subscribe({
      next: () => { /* console.log('✅ Notificaciones marcadas como leídas') */ },
      error: (err) => { /* console.error('❌ Error al marcar notificaciones como leídas:', err) */ }
    });
  }

  // Eliminar una notificación específica
  eliminarNotificacion(idNotificacion: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idNotificacion}`);
  }

  // Eliminar todas las notificaciones del usuario (limpiar)
  limpiarNotificaciones(): Observable<any> {
    const usuario = this.usuariosService.getUsuarioLogueado();
    const userId = (usuario as any)?._id || (usuario as any)?.id_usuario;

    if (!usuario || !userId) {
      return new Observable(observer => {
        observer.next({});
        observer.complete();
      });
    }
    return this.http.delete(`${this.apiUrl}/usuario/${userId}`);
  }

  // Método para actualizar notificaciones (para compatibilidad, pero ahora no hace nada porque la API maneja todo)
  actualizarNotificaciones(notificaciones: any[]): void {
    console.warn('actualizarNotificaciones() está deprecated. La API maneja las actualizaciones automáticamente.');
  }
}
