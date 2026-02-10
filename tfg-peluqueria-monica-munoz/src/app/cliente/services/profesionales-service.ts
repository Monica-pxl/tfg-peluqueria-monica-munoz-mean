import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfesionalesInterface } from '../interfaces/profesionales-interface';


@Injectable({
  providedIn: 'root'
})
export class ProfesionalesService {
  borrarProfesional(id_profesional: number | undefined): Observable<any> {
    return this.http.delete(`${this.url}/${id_profesional || 0}`);
  }

  private url = 'http://localhost:3001/api/profesionales';

  constructor(private http: HttpClient) {}

  getAllProfesionales(): Observable<ProfesionalesInterface[]> {
    return this.http.get<ProfesionalesInterface[]>(this.url);
  }

  getProfesionalById(id: number): Observable<ProfesionalesInterface> {
    return this.http.get<ProfesionalesInterface>(`${this.url}/${id}`);
  }

  actualizarProfesional(p: ProfesionalesInterface): Observable<any> {
    return this.http.put(`${this.url}/${p.id_profesional}`, p);
  }

  crearProfesional(profesional: any): Observable<any> {
    return this.http.post(this.url, profesional);
  }
}
