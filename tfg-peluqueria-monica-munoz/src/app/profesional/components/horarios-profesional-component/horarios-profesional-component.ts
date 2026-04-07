import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorariosService } from '../../../cliente/services/horarios-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { HorariosInterface } from '../../../cliente/interfaces/horarios-interface';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';

@Component({
  selector: 'app-horarios-profesional-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horarios-profesional-component.html',
  styleUrl: './horarios-profesional-component.css',
})
export class HorariosProfesionalComponent implements OnInit {
  usuarioLogueado: UsuariosInterface | null = null;
  idProfesional: string | undefined = undefined;
  horariosDelProfesional: HorariosInterface[] = [];
  cargando: boolean = true;

  constructor(
    private horariosService: HorariosService,
    private profesionalesService: ProfesionalesService,
    private usuariosService: UsuariosService
  ) {}

  ngOnInit(): void {
    this.usuarioLogueado = this.usuariosService.getUsuarioLogueado();

    if (this.usuarioLogueado) {
      // Obtener el id_profesional a partir del _id del usuario
      this.profesionalesService.getAllProfesionales().subscribe({
        next: profesionales => {
          // console.log('Todos los profesionales:', profesionales);
          // console.log('Usuario logueado:', this.usuarioLogueado);

          // Buscar profesional por el campo 'usuario' que debe coincidir con el _id del usuario logueado
          const profesional = profesionales.find(p => {
            // Si 'usuario' es un objeto poblado, comparar con usuario._id
            if (typeof p.usuario === 'object' && p.usuario !== null) {
              return p.usuario._id === this.usuarioLogueado?._id;
            }
            // Si 'usuario' es un string (ObjectId), compararlo directamente
            return p.usuario === this.usuarioLogueado?._id;
          });

          if (profesional) {
            this.idProfesional = profesional._id; // Usar _id
            this.cargarHorarios();
          } else {
            console.error('No se encontró profesional asociado a este usuario');
            this.cargando = false;
          }
        },
        error: error => {
          console.error('Error al cargar profesionales:', error);
          this.cargando = false;
        }
      });
    } else {
      this.cargando = false;
    }
  }

  cargarHorarios(): void {
    this.horariosService.getAllHorarios().subscribe({
      next: horarios => {
        // console.log('Todos los horarios:', horarios);
        // console.log('Filtrando por idProfesional:', this.idProfesional);

        // Filtrar solo los horarios del profesional actual
        this.horariosDelProfesional = horarios.filter(h => {
          // Si profesional está poblado
          if (typeof h.profesional === 'object' && h.profesional !== null) {
            return h.profesional._id === this.idProfesional;
          }
          // Si profesional es string (ObjectId)
          return h.profesional === this.idProfesional;
        });

        // console.log('Horarios filtrados:', this.horariosDelProfesional);
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar horarios:', error);
        this.cargando = false;
      }
    });
  }

  formatearDias(dias: string[]): string {
    if (!dias || dias.length === 0) return '';
    return dias.join(', ');
  }

  formatearFechasFestivas(horario: HorariosInterface): string {
    if (!horario.fechas_festivas || horario.fechas_festivas.length === 0) {
      return 'Ninguna';
    }
    return horario.fechas_festivas.map(f => {
      const [year, month, day] = f.split('-');
      return `${day}/${month}/${year}`;
    }).join(', ');
  }

  tieneFechasFestivas(horario: HorariosInterface): boolean {
    return !!horario.fechas_festivas && horario.fechas_festivas.length > 0;
  }

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }
}
