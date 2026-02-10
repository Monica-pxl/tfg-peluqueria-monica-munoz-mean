import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CitasInterface } from '../../cliente/interfaces/citas-interface';
import { UsuariosInterface } from '../../cliente/interfaces/usuarios-interface';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  constructor() {}

  // TODO: Este servicio usa localStorage y está obsoleto
  // El componente de profesional ahora usa CitasService de admin que conecta con MongoDB

  getAllCitas(_usuarios: UsuariosInterface[]): Observable<CitasInterface[]> {
    // Método obsoleto - usar CitasService de admin en su lugar
    return of([]);
  }

  actualizarCitaEstado(_cita: CitasInterface): Observable<void> {
    // Método obsoleto - usar CitasService de admin en su lugar
    return of(void 0);
  }
}
