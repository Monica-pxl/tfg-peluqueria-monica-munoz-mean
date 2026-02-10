import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HorariosInterface, ProfesionalPoblado } from '../../../cliente/interfaces/horarios-interface';
import { HorariosService } from '../../../cliente/services/horarios-service';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { NotificacionesService } from '../../../cliente/services/notificaciones-service';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-horarios-component',
  standalone: true,
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
      const nombreProf = this.getNombreProfesional(horario).toLowerCase();
      const cumpleBusqueda = this.busquedaTexto === '' ||
        nombreProf.includes(this.busquedaTexto.toLowerCase()) ||
        this.formatearDias(horario.dias).toLowerCase().includes(this.busquedaTexto.toLowerCase());
      return cumpleBusqueda;
    });
  }

  getNombreProfesional(horario: HorariosInterface): string {
    // Si el profesional está poblado (objeto con nombre y apellidos)
    if (horario.profesional && typeof horario.profesional === 'object' && 'nombre' in horario.profesional) {
      const prof = horario.profesional as ProfesionalPoblado;
      return `${prof.nombre} ${prof.apellidos}`;
    }

    // Si profesional es un string (ObjectId), buscar en la lista
    if (typeof horario.profesional === 'string') {
      const profesional = this.profesionales.find(p => p._id === horario.profesional);
      return profesional ? `${profesional.nombre} ${profesional.apellidos}` : 'Desconocido';
    }

    return 'Desconocido';
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

  async eliminarHorario(horario: HorariosInterface): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Horario',
      '¿Estás seguro de que quieres eliminar este horario?',
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    const id = horario._id;
    if (!id) {
      this.alertService.error('Error: ID de horario no válido');
      return;
    }

    this.horariosService.deleteHorario(id).subscribe({
      next: () => {
        this.alertService.success('Horario eliminado exitosamente');

        // Crear notificación para el profesional
        // TODO: Implementar notificaciones para MongoDB
        // Por ahora solo eliminar el horario
        this.cargarDatos();
      },
      error: (err) => {
        this.alertService.error('Error al eliminar el horario: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  editarHorario(horario: HorariosInterface): void {
    const id = horario._id;
    if (!id) {
      this.alertService.error('Error: ID de horario no válido');
      return;
    }
    this.router.navigate(['/admin/horarios/editar', id]);
  }

  crearHorario(): void {
    this.router.navigate(['/admin/horarios/crear']);
  }
}

