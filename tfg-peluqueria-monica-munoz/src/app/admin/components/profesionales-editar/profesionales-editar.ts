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
  id_servicios: string[] = [];  // Cambiar a string[] para usar _id de MongoDB
  centroSeleccionado: string = '';  // Variable para el centro seleccionado

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

        // Asignar el centro seleccionado para el select
        this.centroSeleccionado = centroId || '';

        // Filtrar servicios solo del centro del profesional
        this.actualizarServiciosFiltrados();

        // Filtrar relaciones para este profesional
        const relsFiltradas = relaciones.filter(r => {
          if (typeof r.profesional === 'object' && r.profesional !== null) {
            return r.profesional._id === this.profesional._id;
          }
          return r.profesional === this.profesional._id;
        });

        // Extraer IDs de servicios como strings (_id de MongoDB)
        this.id_servicios = relsFiltradas
          .map(r => {
            if (typeof r.servicio === 'object' && r.servicio !== null) {
              return r.servicio._id;
            }
            return r.servicio as string;
          })
          .filter((id): id is string => !!id);

        console.log('Servicios del profesional:', this.id_servicios);

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
    if (!this.profesional._id) {
      this.alertService.error('Error: El profesional no tiene ID válido');
      return;
    }

    if (!this.profesional.nombre) {
      this.alertService.error('El nombre es obligatorio.');
      return;
    }

    // Solo nombre y apellidos son editables; el centro no se puede cambiar
    const datosActualizar = {
      nombre: this.profesional.nombre,
      apellidos: this.profesional.apellidos || ''
    };

    console.log('Actualizando profesional con datos:', datosActualizar);

    this.profesionalesService.actualizarProfesional(this.profesional._id, datosActualizar).subscribe({
      next: () => {
        console.log('Profesional actualizado, borrando relaciones anteriores...');

        // Borrar relaciones existentes usando el _id
        this.relService.borrarRelacionesPorProfesional(this.profesional._id).subscribe({
          next: () => {
            console.log('Relaciones anteriores eliminadas');

            // Si hay servicios seleccionados, crear las relaciones
            if (this.id_servicios.length > 0) {
              console.log('Creando nuevas relaciones para servicios:', this.id_servicios);

              const observables = this.id_servicios.map(id_serv => {
                const relacion = {
                  profesional: this.profesional._id,
                  servicio: id_serv
                };
                console.log('Creando relación:', relacion);
                return this.relService.crearRelacion(relacion);
              });

              forkJoin(observables).subscribe({
                next: () => {
                  this.alertService.success('Profesional actualizado exitosamente');
                  this.router.navigate(['/admin/profesionales'], { queryParams: { recargar: '1' } });
                },
                error: (err) => {
                  console.error('Error al asignar servicios:', err);
                  this.alertService.warning('Profesional actualizado, pero hubo un error al asignar los servicios');
                  this.router.navigate(['/admin/profesionales'], { queryParams: { recargar: '1' } });
                }
              });
            } else {
              // Si no hay servicios, simplemente confirmar la actualización
              this.alertService.success('Profesional actualizado exitosamente');
              this.router.navigate(['/admin/profesionales'], { queryParams: { recargar: '1' } });
            }
          },
          error: (err) => {
            console.error('Error al eliminar relaciones anteriores:', err);
            this.alertService.error('Error al actualizar las relaciones del profesional');
          }
        });
      },
      error: (err) => {
        console.error('Error al actualizar profesional:', err);
        this.alertService.error('Error al actualizar profesional');
      }
    });
  }

  onCentroChange(): void {
    console.log('Centro cambiado a:', this.centroSeleccionado);

    // Limpiar servicios seleccionados al cambiar de centro
    this.id_servicios = [];

    // Actualizar servicios filtrados para el nuevo centro
    this.actualizarServiciosFiltrados();
  }

  actualizarServiciosFiltrados(): void {
    // Filtrar servicios por el centro seleccionado
    this.serviciosFiltrados = this.servicios.filter(s => {
      const sCentroId = typeof s.centro === 'object' && s.centro !== null
        ? s.centro._id
        : s.centro;
      return sCentroId === this.centroSeleccionado;
    });

    console.log('Servicios filtrados para centro', this.centroSeleccionado, ':', this.serviciosFiltrados.length);
  }

  cancelar(): void {
    this.router.navigate(['/admin/profesionales']);
  }

}
