import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorariosInterface } from '../interfaces/horarios-interface';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {

  private url = 'http://localhost:3001/api/horarios';

  constructor(private http: HttpClient) {}

  getAllHorarios(): Observable<HorariosInterface[]> {
    return this.http.get<HorariosInterface[]>(this.url);
  }

  getHorarioById(id: string | number): Observable<HorariosInterface> {
    return this.http.get<HorariosInterface>(`${this.url}/${id}`);
  }

  createHorario(horario: Omit<HorariosInterface, '_id' | 'id_horario'>): Observable<any> {
    return this.http.post(this.url, horario);
  }

  updateHorario(id: string | number, horario: Partial<HorariosInterface>): Observable<any> {
    return this.http.put(`${this.url}/${id}`, horario);
  }

  deleteHorario(id: string | number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }

  deleteHorariosByProfesional(id_profesional: number): Observable<any> {
    return this.http.delete(`${this.url}/profesional/${id_profesional}`);
  }
}
