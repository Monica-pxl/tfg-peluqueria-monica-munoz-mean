import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CitasInterface } from '../../cliente/interfaces/citas-interface';
import { UsuariosInterface } from '../../cliente/interfaces/usuarios-interface';
import { HttpClient } from '@angular/common/http';
import { NotificacionesService } from '../../cliente/services/notificaciones-service';
import { UsuariosService } from '../../cliente/services/usuarios-service';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  
  private apiUrl = 'http://localhost:3001/api/citas';

  constructor(
    private http: HttpClient,
    private notificacionesService: NotificacionesService,
    private usuariosService: UsuariosService
  ) {}

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
          canceladaPor: cita.canceladaPor || null,
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

    // Normalizar la fecha (eliminar la parte de la hora si existe)
    const fechaNormalizada = cita.fecha.split('T')[0];
    
    console.log('Buscando cita para actualizar:', {
      fecha: fechaNormalizada,
      hora: cita.hora,
      profesionalId: cita.id_profesional,
      nuevoEstado: cita.estado
    });

    for (const email in todasCitas) {
      const citasUsuario = todasCitas[email];
      for (let i = 0; i < citasUsuario.length; i++) {
        // Normalizar la fecha de la cita guardada también
        const fechaCitaGuardada = citasUsuario[i].fecha.split('T')[0];
        
        console.log(`Comparando con cita ${i} de ${email}:`, {
          fecha: fechaCitaGuardada,
          hora: citasUsuario[i].hora,
          profesionalId: citasUsuario[i].profesionalId,
          estadoActual: citasUsuario[i].estado
        });
        
        if (
          fechaCitaGuardada === fechaNormalizada &&
          citasUsuario[i].hora === cita.hora &&
          citasUsuario[i].profesionalId === cita.id_profesional
        ) {
          console.log('✓ Cita encontrada! Actualizando estado de:', citasUsuario[i].estado, '->', cita.estado);
          citasUsuario[i].estado = cita.estado;
          citasUsuario[i].canceladaPor = cita.canceladaPor || null;
          citaActualizada = true;
          break;
        }
      }
      if (citaActualizada) break;
    }
    
    if (citaActualizada) {
      localStorage.setItem('citas', JSON.stringify(todasCitas));
      console.log('✓ Estado guardado en localStorage');
    } else {
      console.error('✗ No se encontró la cita para actualizar. Todas las citas:', todasCitas);
    }
    
    return of(void 0); 
  }


  borrarCita(cita: CitasInterface): void {
    const todasCitas = JSON.parse(localStorage.getItem('citas') || '{}');

    for (const email in todasCitas) {
      const citasUsuario = todasCitas[email];
      const nuevasCitas = citasUsuario.filter((c: any) => 
        !(c.fecha === cita.fecha && c.hora === cita.hora && c.profesionalId === cita.id_profesional)
      );
      todasCitas[email] = nuevasCitas;
    }

    localStorage.setItem('citas', JSON.stringify(todasCitas));
  }

  // Marcar cita como realizada y sumar puntos automáticamente (solo admin y profesional)
  marcarCitaRealizada(idUsuario: number): Observable<any> {
    return this.http.post('http://localhost:3001/api/citas/marcar-realizada', { id_usuario: idUsuario });
  }

}
