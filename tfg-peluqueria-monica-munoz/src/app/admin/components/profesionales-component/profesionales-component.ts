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
        this.profesionales = res.profesionales.map(p => ({
          ...p,
          id_profesional: Number(p.id_profesional),
          id_centro: Number(p.id_centro)
        }));
        this.centros = res.centros.map(c => ({
          ...c,
          id_centro: Number(c.id_centro)
        }));
        this.servicios = res.servicios.map(s => ({
          ...s,
          id_servicio: Number(s.id_servicio)
        }));
        this.rels = res.rels.map(r => ({
          id_profesional: Number(r.id_profesional),
          id_servicio: Number(r.id_servicio)
        }));
        this.profesionalesFiltrados = this.profesionales;
        this.cargando = false;
      },
      error: () => this.error = true
    });
  }

  aplicarFiltros(): void {
    this.profesionalesFiltrados = this.profesionales.filter(prof => {
      const cumpleBusqueda = this.busquedaTexto === '' ||
        prof.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        prof.apellidos.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        this.nombreCentro(prof.id_centro).toLowerCase().includes(this.busquedaTexto.toLowerCase());
      return cumpleBusqueda;
    });
  }


  nombreCentro(id_centro: number): string {
    const centro = this.centros.find(c => c.id_centro === id_centro);
    return centro ? centro.nombre : 'Desconocido';
  }



  serviciosDelProfesional(id_prof: number): string {
    const relaciones = this.rels.filter(r => r.id_profesional === id_prof);
    const nombres = relaciones.map(rel => {
      const s = this.servicios.find(serv => serv.id_servicio === rel.id_servicio);
      return s ? s.nombre : "";
    }).filter(n => n !== "");
    return nombres.join(", ");
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
