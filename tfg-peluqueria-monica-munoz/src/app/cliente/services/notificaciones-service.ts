import { Injectable } from '@angular/core';
import { UsuariosService } from './usuarios-service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private storageKey = 'notificaciones';

  constructor(private usuariosService: UsuariosService) {}

  crearNotificacion(notificacion: any) {
    console.log('=== crearNotificacion llamada ===');
    console.log('Notificación recibida:', notificacion);
    const todas = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    console.log('Notificaciones existentes:', todas);
    const n = { ...notificacion, leida: false };

    // Normalizar fecha a formato DD/MM/YYYY HH:MM (sin milisegundos)
    n.fecha = this.formatFecha(new Date());

    todas.push(n);
    console.log('Guardando notificación:', n);
    console.log('Total de notificaciones después de agregar:', todas.length);
    localStorage.setItem(this.storageKey, JSON.stringify(todas));
    console.log('Notificación guardada en localStorage');
  }

  private pad(n: number) { return n < 10 ? '0' + n : '' + n; }

  private formatFecha(d: Date): string {
    const dia = this.pad(d.getDate());
    const mes = this.pad(d.getMonth() + 1);
    const año = d.getFullYear();
    const hora = this.pad(d.getHours());
    const min = this.pad(d.getMinutes());
    return `${dia}/${mes}/${año} ${hora}:${min}`;
  }

  getNotificaciones() {
    console.log('=== getNotificaciones llamada ===');
    const todas: any[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    console.log('Total de notificaciones en localStorage:', todas.length);
    
    // Debug: mostrar todas las notificaciones con sus tipos
    todas.forEach((n, i) => {
      console.log(`Notificación ${i}: idUsuario = ${n.idUsuario} (tipo: ${typeof n.idUsuario})`);
    });
    
    const usuario = this.usuariosService.getUsuarioLogueado();
    console.log('Usuario logueado:', usuario);
    console.log('Usuario logueado id_usuario:', usuario?.id_usuario, '(tipo:', typeof usuario?.id_usuario, ')');

    if (!usuario) {
      console.log('No hay usuario logueado');
      return [];
    }

    // IMPORTANTE: Convertir ambos a Number para evitar problemas de tipo
    const notificacionesUsuario = todas.filter((n: any) => Number(n.idUsuario) === Number(usuario.id_usuario));
    console.log('Notificaciones del usuario (id ' + usuario.id_usuario + '):', notificacionesUsuario.length);
    console.log('Notificaciones filtradas:', notificacionesUsuario);
    
    // Ordenar de más reciente a más antigua (invertir el orden)
    return notificacionesUsuario.reverse();
  }


 limpiarNotificaciones() {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario) return;

    const todas: any[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const restantes = todas.filter((n: any) => Number(n.idUsuario) !== Number(usuario.id_usuario));

    localStorage.setItem(this.storageKey, JSON.stringify(restantes));
  }

  actualizarNotificaciones(notificaciones: any[]) {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario) return;

    const todas: any[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const deOtros = todas.filter((n: any) => Number(n.idUsuario) !== Number(usuario.id_usuario));
    const actualizadas = [...deOtros, ...notificaciones];

    localStorage.setItem(this.storageKey, JSON.stringify(actualizadas));
  }

  hayNotificacionesSinLeer(): boolean {
    const nots = this.getNotificaciones();
    return nots.some(n => n.leida === false || n.leida === undefined);
  }

  marcarNotificacionesComoLeidas(): void {
    const usuario = this.usuariosService.getUsuarioLogueado();
    if (!usuario) return;

    const todas: any[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    let modificado = false;
    for (const n of todas) {
      if (Number(n.idUsuario) === Number(usuario.id_usuario) && !n.leida) {
        n.leida = true;
        modificado = true;
      }
    }

    if (modificado) {
      localStorage.setItem(this.storageKey, JSON.stringify(todas));
    }
  }
}
