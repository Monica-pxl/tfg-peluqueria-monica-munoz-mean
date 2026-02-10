import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CitasInterface } from '../interfaces/citas-interface';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private urlCitas = 'http://localhost:3001/api/citas';

  constructor(private http: HttpClient) {}

  // Obtener todas las citas
  getAllCitas(): Observable<CitasInterface[]> {
    return this.http.get<CitasInterface[]>(this.urlCitas);
  }

  // Obtener cita por ID
  getCitaById(id: string): Observable<CitasInterface> {
    return this.http.get<CitasInterface>(`${this.urlCitas}/${id}`);
  }

  // Crear nueva cita
  crearCita(cita: {
    usuario: string;
    profesional: string;
    servicio: string;
    centro: string;
    fecha: string;
    hora: string;
  }): Observable<{ mensaje: string; cita: CitasInterface }> {
    return this.http.post<{ mensaje: string; cita: CitasInterface }>(this.urlCitas, cita);
  }

  // Actualizar cita
  actualizarCita(id: string, datos: Partial<CitasInterface>): Observable<{ mensaje: string; cita: CitasInterface }> {
    return this.http.put<{ mensaje: string; cita: CitasInterface }>(`${this.urlCitas}/${id}`, datos);
  }

  // Eliminar cita
  eliminarCita(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.urlCitas}/${id}`);
  }

  // Obtener citas por usuario
  getCitasPorUsuario(usuarioId: string): Observable<CitasInterface[]> {
    return this.http.get<CitasInterface[]>(`${this.urlCitas}/usuario/${usuarioId}`);
  }

  // Obtener citas por profesional
  getCitasPorProfesional(profesionalId: string): Observable<CitasInterface[]> {
    return this.http.get<CitasInterface[]>(`${this.urlCitas}/profesional/${profesionalId}`);
  }
}
