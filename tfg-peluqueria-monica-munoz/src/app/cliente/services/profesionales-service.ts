import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfesionalesInterface } from '../interfaces/profesionales-interface';


@Injectable({
  providedIn: 'root'
})
export class ProfesionalesService {
  private url = 'https://hairgest-backend.vercel.app/api/profesionales';

  constructor(private http: HttpClient) {}

  getAllProfesionales(): Observable<ProfesionalesInterface[]> {
    return this.http.get<ProfesionalesInterface[]>(this.url);
  }

  getProfesionalById(id: number): Observable<ProfesionalesInterface> {
    return this.http.get<ProfesionalesInterface>(`${this.url}/${id}`);
  }

  crearProfesional(profesional: any): Observable<any> {
    return this.http.post(this.url, profesional);
  }

  actualizarProfesional(id: string | number | undefined, datos: Partial<ProfesionalesInterface>): Observable<any> {
    return this.http.put(`${this.url}/${id}`, datos);
  }


  borrarProfesional(id_profesional: string | number | undefined): Observable<any> {
    const id = id_profesional || '';
    return this.http.delete(`${this.url}/${id}`);
  }
}
