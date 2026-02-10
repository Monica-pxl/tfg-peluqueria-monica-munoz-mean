import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ProfesionalServicioInterface } from '../../../cliente/interfaces/profesional-servicio-interface';
import { ProfesionalServicioService } from '../../../cliente/services/profesional-servicio-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { CentrosService } from '../../../cliente/services/centros-service';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';


@Component({
  selector: 'app-profesionales-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profesionales-component.html',
  styleUrl: './profesionales-component.css',
  standalone: true
})
export class ProfesionalesComponent implements OnInit {

  profesionales: ProfesionalesInterface[] = [];
  profesionalesFiltrados: ProfesionalesInterface[] = [];
  centros: CentrosInterface[] = [];
  servicios: ServiciosInterface[] = [];
  rels: ProfesionalServicioInterface[] = [];
  busquedaTexto: string = '';

  cargando = true;
  error = false;

  constructor(
    private profesionalesService: ProfesionalesService,
    private centrosService: CentrosService,
    private serviciosService: ServiciosService,
    private relService: ProfesionalServicioService,
    private router: Router,
    private alertService: AlertService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      profesionales: this.profesionalesService.getAllProfesionales(),
      centros: this.centrosService.getAllCentros(),
      servicios: this.serviciosService.getAllServices(),
      rels: this.relService.getAllProfesionalServicio()
    }).subscribe({
      next: (res) => {
        this.profesionales = res.profesionales;
        this.centros = res.centros;
        this.servicios = res.servicios;
        this.rels = res.rels;
        this.profesionalesFiltrados = this.profesionales;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.profesionalesFiltrados = this.profesionales.filter(prof => {
      const cumpleBusqueda = this.busquedaTexto === '' ||
        prof.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        prof.apellidos.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreCentro(prof).toLowerCase().includes(this.busquedaTexto.toLowerCase());
      return cumpleBusqueda;
    });
  }


  nombreCentro(profesional: ProfesionalesInterface): string {
    // Si centro está poblado (es un objeto)
    if (typeof profesional.centro === 'object' && profesional.centro !== null) {
      return profesional.centro.nombre || 'Sin centro';
    }
    // Si centro es string (_id), buscar en el array
    if (typeof profesional.centro === 'string') {
      const centro = this.centros.find(c => c._id === profesional.centro);
      return centro ? centro.nombre : 'Sin centro';
    }
    return 'Sin centro';
  }



  serviciosDelProfesional(profesional: ProfesionalesInterface): string {
    if (!profesional._id) return 'Sin servicios';

    // Filtrar relaciones por el _id del profesional
    const relaciones = this.rels.filter(r => {
      // Si profesional está poblado
      if (typeof r.profesional === 'object' && r.profesional !== null) {
        return r.profesional._id === profesional._id;
      }
      // Si profesional es string (_id)
      return r.profesional === profesional._id;
    });

    const nombres = relaciones.map(rel => {
      // Si servicio está poblado
      if (typeof rel.servicio === 'object' && rel.servicio !== null) {
        return rel.servicio.nombre;
      }
      // Si servicio es string (_id), buscar en el array
      if (typeof rel.servicio === 'string') {
        const s = this.servicios.find(serv => serv._id === rel.servicio);
        return s ? s.nombre : '';
      }
      return '';
    }).filter(n => n !== '');

    return nombres.length > 0 ? nombres.join(', ') : 'Sin servicios';
  }


  async borrarProfesional(p: ProfesionalesInterface): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Profesional',
      `¿Seguro que deseas eliminar al profesional ${p.nombre} ${p.apellidos}? Esto eliminará también sus relaciones con servicios.`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    this.relService.borrarRelacionesPorProfesional(p.id_profesional).subscribe({
      next: () => {
        this.profesionalesService.borrarProfesional(p.id_profesional).subscribe({
          next: () => {
            this.alertService.success('Profesional eliminado exitosamente');
            this.cargarDatos();
          },
          error: () => this.alertService.error('Error al eliminar el profesional')
        });
      },
      error: () => this.alertService.error('Error al eliminar las relaciones del profesional')
    });
  }

  crearProfesional(): void {
    this.router.navigate(['/admin/profesionales/crear']);
  }

}
