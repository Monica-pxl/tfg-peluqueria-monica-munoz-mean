import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HorariosInterface } from '../../../cliente/interfaces/horarios-interface';
import { HorariosService } from '../../../cliente/services/horarios-service';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-horarios-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios-component.html',
  styleUrl: './horarios-component.css',
})
export class HorariosComponent implements OnInit {

  horarios: HorariosInterface[] = [];
  horariosFiltrados: HorariosInterface[] = [];
  profesionales: ProfesionalesInterface[] = [];
  busquedaTexto: string = '';
  cargando = true;
  error = false;

  constructor(
    private horariosService: HorariosService,
    private profesionalesService: ProfesionalesService,
    private notificacionesService: NotificacionesService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.cargando = true;

    forkJoin({
      horarios: this.horariosService.getAllHorarios(),
      profesionales: this.profesionalesService.getAllProfesionales()
    }).subscribe({
      next: ({ horarios, profesionales }) => {
        this.horarios = horarios;
        this.profesionales = profesionales;
        this.horariosFiltrados = this.horarios;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.horariosFiltrados = this.horarios.filter(horario => {
      const nombreProf = this.getNombreProfesional(horario.id_profesional).toLowerCase();
      const cumpleBusqueda = this.busquedaTexto === '' ||
        nombreProf.includes(this.busquedaTexto.toLowerCase()) ||
        this.formatearDias(horario.dias).toLowerCase().includes(this.busquedaTexto.toLowerCase());
      return cumpleBusqueda;
    });
  }

  getNombreProfesional(id_profesional: number): string {
    const profesional = this.profesionales.find(p => p.id_profesional === id_profesional);
    return profesional ? `${profesional.nombre} ${profesional.apellidos}` : 'Desconocido';
  }

  formatearDias(dias: string[]): string {
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

  async eliminarHorario(id: number): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Horario',
      '¿Estás seguro de que quieres eliminar este horario?',
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (!confirmed) return;
    
    // Obtener el horario antes de eliminarlo para poder notificar al profesional
    const horarioAEliminar = this.horariosFiltrados.find(h => h.id_horario === id);
    
    this.horariosService.deleteHorario(id).subscribe({
      next: () => {
        this.alertService.success('Horario eliminado exitosamente');
        
        // Crear notificación para el profesional
        if (horarioAEliminar) {
          const profesional = this.profesionales.find(p => p.id_profesional === horarioAEliminar.id_profesional);
          if (profesional) {
            this.notificacionesService.crearNotificacion({
              idUsuario: profesional.id_usuario,
              titulo: 'Horario eliminado',
              mensaje: 'El administrador ha eliminado parte de tu horario de trabajo.'
            });
          }
        }
        
        this.cargarDatos();
      },
      error: (err) => {
        this.alertService.error('Error al eliminar el horario: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  editarHorario(id: number): void {
    this.router.navigate(['/admin/horarios/editar', id]);
  }

  crearHorario(): void {
    this.router.navigate(['/admin/horarios/crear']);
  }
}

