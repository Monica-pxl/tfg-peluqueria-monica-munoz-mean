import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiciosInterface } from '../interfaces/servicios-interface';


@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private urlServicios = 'http://localhost:3001/api/servicios'

  constructor(private http : HttpClient){}

  getAllServices(): Observable<ServiciosInterface[]>{
    return this.http.get<ServiciosInterface[]>(this.urlServicios)
  }

  crearServicio(servicio: ServiciosInterface): Observable<ServiciosInterface> {
    return this.http.post<ServiciosInterface>(this.urlServicios, servicio);
  }

  actualizarServicio(servicio: ServiciosInterface): Observable<ServiciosInterface> {
    return this.http.put<ServiciosInterface>(`${this.urlServicios}/${servicio.id_servicio}`, servicio);
  }

  borrarServicio(id: number): Observable<any> {
    return this.http.delete(`${this.urlServicios}/${id}`);
  }


  //Para pasar las paginas:
  getServicePages(page : string): Observable<ServiciosInterface[]>{
    return this.http.get<ServiciosInterface[]>(`data/${page}.json`)
  }
  
}
