import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfesionalServicioInterface } from '../interfaces/profesional-servicio-interface';

@Injectable({
  providedIn: 'root'
})
export class ProfesionalServicioService {

  borrarRelacionesPorProfesional(id_profesional: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/profesional/${id_profesional}`);
  }

  private apiUrl = 'http://localhost:3001/api/profesional_servicio'; 

  constructor(private http: HttpClient) {}

  getAllProfesionalServicio(): Observable<ProfesionalServicioInterface[]> {
    return this.http.get<ProfesionalServicioInterface[]>(this.apiUrl);
  }

  crearRelacion(relacion: ProfesionalServicioInterface): Observable<ProfesionalServicioInterface> {
    return this.http.post<ProfesionalServicioInterface>(this.apiUrl, relacion);
  }

  eliminarPorServicio(id_servicio: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/servicio/${id_servicio}`);
  }

}

