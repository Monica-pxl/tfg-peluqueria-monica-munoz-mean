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
  idProfesional: number = 0;
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
      // Obtener el id_profesional a partir del id_usuario
      this.profesionalesService.getAllProfesionales().subscribe({
        next: profesionales => {
          const profesional = profesionales.find(p => p.id_usuario === Number(this.usuarioLogueado?.id_usuario));
          if (profesional) {
            this.idProfesional = profesional.id_profesional;
            this.cargarHorarios();
          } else {
            console.error('No se encontró el profesional');
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
        // Filtrar solo los horarios del profesional actual
        this.horariosDelProfesional = horarios.filter(h => h.id_profesional === this.idProfesional);
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
