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
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = true;
      this.cargando = false;
      this.alertService.error('ID de profesional no válido');
      return;
    }

    forkJoin({
      profesionales: this.profesionalesService.getAllProfesionales(),
      centros: this.centrosService.getAllCentros(),
      servicios: this.serviciosService.getAllServices(),
      relaciones: this.relService.getAllProfesionalServicio()
    }).subscribe({

      next: ({ profesionales, centros, servicios, relaciones }) => {

        this.profesional = profesionales.find(p => p._id === id)!;

        if (!this.profesional) {
          this.error = true;
          this.cargando = false;
          this.alertService.error('Profesional no encontrado');
          return;
        }

        this.centros = centros;
        this.servicios = servicios;

        // Obtener el ID del centro (puede ser string _id o objeto)
        const centroId = typeof this.profesional.centro === 'object' && this.profesional.centro !== null
          ? this.profesional.centro._id
          : this.profesional.centro;

        // Filtrar servicios solo del centro del profesional
        this.serviciosFiltrados = servicios.filter(s => {
          const sCentroId = typeof s.centro === 'object' && s.centro !== null
            ? s.centro._id
            : s.centro;
          return sCentroId === centroId;
        });

        // Filtrar relaciones para este profesional
        const relsFiltradas = relaciones.filter(r => {
          if (typeof r.profesional === 'object' && r.profesional !== null) {
            return r.profesional._id === this.profesional._id;
          }
          return r.profesional === this.profesional._id;
        });

        // Extraer IDs de servicios (como números temporalmente)
        this.id_servicios = relsFiltradas
          .map(r => {
            if (typeof r.servicio === 'object' && r.servicio !== null) {
              return r.servicio._id;
            }
            return r.servicio as string;
          })
          .filter((id): id is string => !!id)
          .map(id => Number(id)); // Convertir temporalmente a número

        this.cargando = false;
      },

      error: () => {
        this.error = true;
        this.cargando = false;
        this.alertService.error('Error al cargar los datos');
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
