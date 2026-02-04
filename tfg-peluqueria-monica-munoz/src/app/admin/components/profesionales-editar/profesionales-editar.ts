import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { ProfesionalServicioService } from '../../../cliente/services/profesional-servicio-service';

import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';

import { forkJoin } from 'rxjs';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-profesionales-editar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesionales-editar.html',
  styleUrls: ['./profesionales-editar.css'],
})
export class ProfesionalesEditar implements OnInit {

  profesional!: ProfesionalesInterface;
  centros: CentrosInterface[] = [];
  servicios: ServiciosInterface[] = [];
  serviciosFiltrados: ServiciosInterface[] = [];
  id_servicios: number[] = [];

  cargando = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profesionalesService: ProfesionalesService,
    private centrosService: CentrosService,
    private serviciosService: ServiciosService,
    private relService: ProfesionalServicioService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      profesional: this.profesionalesService.getProfesionalById(id),
      centros: this.centrosService.getAllCentros(),
      servicios: this.serviciosService.getAllServices(),
      relaciones: this.relService.getAllProfesionalServicio()
    }).subscribe({

      next: ({ profesional, centros, servicios, relaciones }) => {

        this.profesional = profesional;
        this.centros = centros;
        this.servicios = servicios;
        
        // Filtrar servicios solo del centro del profesional
        this.serviciosFiltrados = servicios.filter(
          s => s.id_centro === profesional.id_centro
        );
        
        this.id_servicios = relaciones
          .filter(r => r.id_profesional === profesional.id_profesional)
          .map(r => r.id_servicio);

        this.cargando = false;
      },

      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  actualizarProfesional(): void {
    this.profesional.id_centro = Number(this.profesional.id_centro);

    this.profesionalesService.actualizarProfesional(this.profesional).subscribe({
      next: () => {
        // Borrar relaciones existentes
        this.relService.borrarRelacionesPorProfesional(this.profesional.id_profesional).subscribe(() => {

          // Si hay servicios seleccionados, crear las relaciones
          if (this.id_servicios.length > 0) {
            const observables = this.id_servicios.map(id_serv => {
              return this.relService.crearRelacion({
                id_profesional: this.profesional.id_profesional,
                id_servicio: id_serv
              });
            });

            forkJoin(observables).subscribe({
              next: () => {
                this.alertService.success('Profesional actualizado exitosamente');
                this.router.navigate(['/admin/profesionales'], { queryParams: { recargar: '1' } });
              },
              error: () => {
                this.alertService.warning('Profesional actualizado, pero hubo un error al asignar los servicios');
                this.router.navigate(['/admin/profesionales'], { queryParams: { recargar: '1' } });
              }
            });
          } else {
            // Si no hay servicios, simplemente confirmar la actualización
            this.alertService.success('Profesional actualizado exitosamente');
            this.router.navigate(['/admin/profesionales'], { queryParams: { recargar: '1' } });
          }
        });
      },
      error: () => this.alertService.error('Error al actualizar profesional')
    });
  }


  cancelar(): void {
    this.router.navigate(['/admin/profesionales']);
  }

}
