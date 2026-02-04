import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { UsuariosInterface } from '../interfaces/usuarios-interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  
  private apiUrl = 'http://localhost:3001/api/usuarios'; 
  private loginUrl = 'http://localhost:3001/api/login';
  private registroUrl = 'http://localhost:3001/api/registro';
  usuarioLogueado: UsuariosInterface | null = null; 
  
  constructor(private http: HttpClient) {}
  
  getAllUsuarios(): Observable<UsuariosInterface[]> {
    return this.http.get<UsuariosInterface[]>(this.apiUrl);
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
    this.usuarioLogueado = usuario;
    // También guardar en localStorage para persistencia
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
  }

  //Obtener el usuario logueado:
  getUsuarioLogueado(): UsuariosInterface | null{
    // Si no está en memoria, intentar recuperar de localStorage
    if (!this.usuarioLogueado) {
      const usuarioGuardado = localStorage.getItem('usuarioLogueado');
      if (usuarioGuardado) {
        this.usuarioLogueado = JSON.parse(usuarioGuardado);
      }
    }
    return this.usuarioLogueado;
  }


  //Comprobar si hay un usuario logueado:
  comprobarLogueado(): boolean{
    return this.getUsuarioLogueado() !== null;
  }


  //Si el usuario está logueado, cerrar sesión:
  cerrarSesion(){
    this.usuarioLogueado = null;
    localStorage.removeItem('usuarioLogueado');
  }

  // Actualizar usuario (solo rol y estado)
  actualizarUsuario(id: number, datos: { rol?: string; estado?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos);
  }

  // Eliminar usuario
  eliminarUsuario(id: number): Observable<any> {
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