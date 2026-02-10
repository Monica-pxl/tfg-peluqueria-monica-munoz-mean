import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CitasInterface } from '../../cliente/interfaces/citas-interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  private apiUrl = 'http://localhost:3001/api/citas';

  constructor(
    private http: HttpClient
  ) {}

  // Método para usar con MongoDB
  getAllCitasFromDB(): Observable<CitasInterface[]> {
    return this.http.get<CitasInterface[]>(this.apiUrl);
  }

  // Método para actualizar cita en MongoDB
  actualizarCita(id: string, datos: Partial<CitasInterface>): Observable<{ mensaje: string; cita: CitasInterface }> {
    return this.http.put<{ mensaje: string; cita: CitasInterface }>(`${this.apiUrl}/${id}`, datos);
  }

  // Método para eliminar cita en MongoDB
  eliminarCita(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }

  // Métodos de compatibilidad para código admin (redirigen a MongoDB)
  getAllCitas(_usuarios: any[]): Observable<CitasInterface[]> {
    return this.getAllCitasFromDB();
  }

  actualizarCitaEstado(cita: CitasInterface): Observable<void> {
    if (cita._id) {
      return new Observable(observer => {
        this.actualizarCita(cita._id!, { estado: cita.estado }).subscribe({
          next: () => {
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      });
    }
    return new Observable(observer => observer.complete());
  }
}

