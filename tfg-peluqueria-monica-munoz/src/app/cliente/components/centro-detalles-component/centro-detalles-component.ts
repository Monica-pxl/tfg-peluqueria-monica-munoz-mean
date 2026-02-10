import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CentrosInterface } from '../../interfaces/centros-interface';
import { ProfesionalesInterface } from '../../interfaces/profesionales-interface';
import { ServiciosInterface } from '../../interfaces/servicios-interface';
import { ProfesionalServicioInterface } from '../../interfaces/profesional-servicio-interface';
import { HorariosInterface } from '../../interfaces/horarios-interface';
import { CentrosService } from '../../services/centros-service';
import { ProfesionalesService } from '../../services/profesionales-service';
import { ServiciosService } from '../../services/servicios-service';
import { ProfesionalServicioService } from '../../services/profesional-servicio-service';
import { HorariosService } from '../../services/horarios-service';
import { forkJoin } from 'rxjs';

interface ProfesionalConServicios {
  profesional: ProfesionalesInterface;
  servicios: ServiciosInterface[];
  horarios: HorariosInterface[];
}

@Component({
  selector: 'app-centro-detalles-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './centro-detalles-component.html',
  styleUrl: './centro-detalles-component.css',
  standalone: true
})
export class CentroDetallesComponent implements OnInit {

  centro: CentrosInterface | null = null;
  profesionalesConServicios: ProfesionalConServicios[] = [];
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
    private serviciosService: ServiciosService,
    private profesionalServicioService: ProfesionalServicioService,
    private horariosService: HorariosService
  ) {}

  ngOnInit(): void {
    const idCentro = this.route.snapshot.paramMap.get('id');
    if (idCentro) {
      this.cargarDetallesCentro(idCentro);
    }
  }

  cargarDetallesCentro(idCentro: string): void {
    forkJoin({
      centros: this.centrosService.getAllCentros(),
      profesionales: this.profesionalesService.getAllProfesionales(),
      servicios: this.serviciosService.getAllServices(),
      relaciones: this.profesionalServicioService.getAllProfesionalServicio(),
      horarios: this.horariosService.getAllHorarios()
    }).subscribe({
      next: (data) => {
        // Encontrar el centro
        this.centro = data.centros.find(c => c._id === idCentro) || null;

        // Filtrar profesionales del centro
        const profesionalesCentro = data.profesionales.filter(p => {
          // Si centro está poblado, comparar _id
          if (typeof p.centro === 'object' && p.centro !== null) {
            return p.centro._id === idCentro;
          }
          // Si centro es string (ObjectId), comparar directamente
          return p.centro === idCentro;
        });

        // Para cada profesional, obtener sus servicios y horarios
        this.profesionalesConServicios = profesionalesCentro.map(profesional => {
          // Obtener IDs de servicios del profesional
          const idsServicios = data.relaciones
            .filter(r => {
              // Si profesional está poblado, comparar _id
              if (typeof r.profesional === 'object' && r.profesional !== null) {
                return r.profesional._id === profesional._id;
              }
              // Si profesional es string (ObjectId), comparar directamente
              return r.profesional === profesional._id;
            })
            .map(r => {
              // Obtener el _id del servicio
              if (typeof r.servicio === 'object' && r.servicio !== null) {
                return r.servicio._id;
              }
              return r.servicio;
            });

          // Obtener los servicios completos
          const servicios = data.servicios.filter(s => idsServicios.includes(s._id || ''));

          // Obtener los horarios del profesional
          const horarios = data.horarios.filter(h => {
            // Si profesional está poblado, comparar _id
            if (typeof h.profesional === 'object' && h.profesional !== null) {
              return h.profesional._id === profesional._id;
            }
            // Si profesional es string (ObjectId), comparar directamente
            return h.profesional === profesional._id;
          });

          return {
            profesional,
            servicios,
            horarios
          };
        });

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar los detalles del centro', err);
        this.cargando = false;
      }
    });
  }
}
