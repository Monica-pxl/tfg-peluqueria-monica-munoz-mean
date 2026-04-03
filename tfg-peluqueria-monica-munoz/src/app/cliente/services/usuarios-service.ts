import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuariosInterface } from '../interfaces/usuarios-interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private apiUrl = 'https://hairgest-backend.vercel.app/api/usuarios';
  private loginUrl = 'https://hairgest-backend.vercel.app/api/login';
  private registroUrl = 'https://hairgest-backend.vercel.app/api/registro';

  private readonly platformId = inject(PLATFORM_ID);

  /** Signal reactivo con el usuario actualmente autenticado. Se inicializa
   *  leyendo localStorage al arrancar la app, por lo que el estado correcto
   *  está disponible desde el primer ciclo de renderizado.
   */
  readonly usuarioLogueado = signal<UsuariosInterface | null>(null);

  constructor(private http: HttpClient) {
    // Restaurar sesión desde localStorage al iniciar la aplicación (sólo en navegador)
    if (isPlatformBrowser(this.platformId)) {
      const guardado = localStorage.getItem('usuarioLogueado');
      if (guardado) {
        try {
          this.usuarioLogueado.set(JSON.parse(guardado));
        } catch {
          localStorage.removeItem('usuarioLogueado');
        }
      }
    }
  }

  getAllUsuarios(): Observable<UsuariosInterface[]> {
    return this.http.get<UsuariosInterface[]>(this.apiUrl);
  }

  getUsuarioById(id: string): Observable<UsuariosInterface> {
    return this.http.get<UsuariosInterface>(`${this.apiUrl}/${id}`);
  }

  // LOGIN - Usar el endpoint del backend que valida contraseña
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.loginUrl, { email, password });
  }

  // REGISTRO - Usar el endpoint del backend que hashea la contraseña
  registro(nombre: string, email: string, password: string, rol: string = 'cliente'): Observable<any> {
    return this.http.post<any>(this.registroUrl, { nombre, email, password, rol });
  }

  // Guardar usuario logueado
  setUsuarioLogueado(usuario: UsuariosInterface) {
    this.usuarioLogueado.set(usuario);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
    }
  }

  // Guardar token JWT
  setToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
  }

  // Obtener token JWT
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Obtener el usuario logueado (lee el signal — reactivo en templates)
  getUsuarioLogueado(): UsuariosInterface | null {
    return this.usuarioLogueado();
  }

  // Comprobar si hay un usuario logueado
  comprobarLogueado(): boolean {
    return this.usuarioLogueado() !== null;
  }

  // Cerrar sesión
  cerrarSesion() {
    this.usuarioLogueado.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogueado');
      localStorage.removeItem('token');
    }
  }

  // Actualizar usuario (solo rol y estado)
  actualizarUsuario(id: number | undefined, datos: { rol?: string; estado?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id || 0}`, datos);
  }

  // Actualizar usuario por _id de MongoDB
  actualizarUsuarioPorId(id: string, datos: { rol?: string; estado?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos);
  }

  // Eliminar usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Eliminar usuario por _id de MongoDB
  eliminarUsuarioPorId(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Actualizar puntos del usuario
  actualizarPuntos(id: number, puntos: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/puntos`, { puntos });
  }

  // Obtener nivel según puntos
  obtenerNivel(puntos: number = 0): string {
    if (puntos >= 100) return 'Cliente Premium';
    if (puntos >= 50) return 'Cliente Habitual';
    if (puntos >= 20) return 'Cliente Frecuente';
    return 'Cliente Nuevo';
  }

  // Obtener color del nivel
  obtenerColorNivel(puntos: number = 0): string {
    if (puntos >= 100) return '#ffd700'; // Dorado para premium
    if (puntos >= 50) return '#ff69b4'; // Rosa para habitual
    if (puntos >= 20) return '#ff89c4'; // Rosa claro para frecuente
    return '#999'; // Gris para nuevo
  }

  // Obtener icono del nivel
  obtenerIconoNivel(puntos: number = 0): string {
    if (puntos >= 100) return 'bi-gem';
    if (puntos >= 50) return 'bi-star-fill';
    if (puntos >= 20) return 'bi-heart-fill';
    return 'bi-person';
  }}
