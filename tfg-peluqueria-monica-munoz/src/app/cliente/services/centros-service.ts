import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CentrosInterface } from '../interfaces/centros-interface';

@Injectable({
  providedIn: 'root'
})
export class CentrosService {
  private url = 'http://localhost:3001/api/centros';

  constructor(private http: HttpClient) {}

  getAllCentros(): Observable<CentrosInterface[]> {
    return this.http.get<CentrosInterface[]>(this.url);
  }

  getCentroById(id: number): Observable<CentrosInterface> {
    return this.http.get<CentrosInterface>(`${this.url}/${id}`);
  }

  crearCentro(centro: Omit<CentrosInterface, 'id_centro'>): Observable<any> {
    return this.http.post(this.url, centro);
  }

  actualizarCentro(centro: CentrosInterface): Observable<any> {
    return this.http.put(`${this.url}/${centro.id_centro}`, centro);
  }

  borrarCentro(id: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
