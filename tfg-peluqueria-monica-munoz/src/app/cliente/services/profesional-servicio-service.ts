import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfesionalServicioInterface } from '../interfaces/profesional-servicio-interface';

@Injectable({
  providedIn: 'root'
})
export class ProfesionalServicioService {

  borrarRelacionesPorProfesional(id_profesional: string | number | undefined): Observable<any> {
    const id = id_profesional || '';
    return this.http.delete(`${this.apiUrl}/profesional/${id}`);
  }

  private apiUrl = 'https://hairgest-backend.vercel.app/api/profesional_servicio';

  constructor(private http: HttpClient) {}

  getAllProfesionalServicio(): Observable<ProfesionalServicioInterface[]> {
    return this.http.get<ProfesionalServicioInterface[]>(this.apiUrl);
  }

  crearRelacion(relacion: ProfesionalServicioInterface): Observable<ProfesionalServicioInterface> {
    return this.http.post<ProfesionalServicioInterface>(this.apiUrl, relacion);
  }

  eliminarPorServicio(id_servicio: string | number | undefined): Observable<any> {
    const id = id_servicio || '';
    return this.http.delete(`${this.apiUrl}/servicio/${id}`);
  }

}

