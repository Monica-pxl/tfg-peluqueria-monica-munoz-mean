import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CitasInterface } from '../../cliente/interfaces/citas-interface';
import { UsuariosInterface } from '../../cliente/interfaces/usuarios-interface';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  constructor() {}

  getAllCitas(usuarios: UsuariosInterface[]): Observable<CitasInterface[]> {
    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
    const citasArray: CitasInterface[] = [];

    for (const email in todasCitas) {
      const usuario = usuarios.find(u => u.email === email);
      todasCitas[email].forEach((cita: any, index: number) => {
        citasArray.push({
          id_cita: index + 1,
          id_usuario: usuario?.id_usuario || 0,
          id_servicio: cita.id_servicio || 0,
          id_profesional: cita.profesionalId,
          id_centro: cita.id_centro,
          fecha: cita.fecha,
          hora: cita.hora,
          estado: cita.estado || 'pendiente',
          servicio: cita.servicio || '',
          centro: cita.centro || ''
        });
      });
    }

    return of(citasArray); 
  }


  actualizarCitaEstado(cita: CitasInterface): Observable<void> {
    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');
    let citaActualizada = false;

    for (const email in todasCitas) {
      const citasUsuario = todasCitas[email];
      for (let i = 0; i < citasUsuario.length; i++) {
        if (
          citasUsuario[i].fecha === cita.fecha &&
          citasUsuario[i].hora === cita.hora &&
          citasUsuario[i].profesionalId === cita.id_profesional
        ) {
          console.log('Actualizando estado de cita:', citasUsuario[i].estado, '->', cita.estado);
          citasUsuario[i].estado = cita.estado;
          citaActualizada = true;
          break;
        }
      }
      if (citaActualizada) break;
    }
    
    if (citaActualizada) {
      localStorage.setItem('citas', JSON.stringify(todasCitas));
      console.log('Estado guardado en localStorage:', todasCitas);
    } else {
      console.warn('No se encontró la cita para actualizar');
    }
    
    return of(void 0); 
  }
}
