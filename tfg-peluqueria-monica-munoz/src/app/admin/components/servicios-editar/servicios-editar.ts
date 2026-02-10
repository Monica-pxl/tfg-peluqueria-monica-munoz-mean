import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { ProfesionalServicioService } from '../../../cliente/services/profesional-servicio-service';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { ProfesionalServicioInterface } from '../../../cliente/interfaces/profesional-servicio-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-servicios-editar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios-editar.html',
  styleUrls: ['./servicios-editar.css'],
})
export class ServiciosEditar implements OnInit{
  servicio!: ServiciosInterface;
  centros: CentrosInterface[] = [];
  profesionales: ProfesionalesInterface[] = [];
  profesionalesFiltrados: ProfesionalesInterface[] = [];
  id_profesionales: number[] = [];

  cargando = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviciosService: ServiciosService,
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
    private profesionalServicioService: ProfesionalServicioService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = true;
      this.cargando = false;
      this.alertService.error('ID de servicio no válido');
      return;
    }

    // cargar centros y profesionales
    this.centrosService.getAllCentros().subscribe({ next: c => this.centros = c });
    this.profesionalesService.getAllProfesionales().subscribe({
      next: p => {
        this.profesionales = p;
      }
    });

    // cargar servicio usando _id
    this.serviciosService.getAllServices().subscribe({
      next: servicios => {
        this.servicio = servicios.find(s => s._id === id)!;

        if (!this.servicio) {
          this.error = true;
          this.cargando = false;
          this.alertService.error('Servicio no encontrado');
          return;
        }

        // cargar relaciones actuales usando _id del servicio
        this.profesionalServicioService.getAllProfesionalServicio().subscribe(relaciones => {
          // Filtrar relaciones para este servicio
          const relsFiltradas = relaciones.filter(r => {
            // Si servicio está poblado
            if (typeof r.servicio === 'object' && r.servicio !== null) {
              return r.servicio._id === this.servicio._id;
            }
            // Si servicio es string (_id)
            return r.servicio === this.servicio._id;
          });

          // Extraer IDs de profesionales (como strings)
          this.id_profesionales = relsFiltradas
            .map(r => {
              if (typeof r.profesional === 'object' && r.profesional !== null) {
                return r.profesional._id;
              }
              return r.profesional as string;
            })
            .filter((id): id is string => !!id)
            .map(id => Number(id)); // Convertir a número temporalmente

          // Filtrar profesionales por el centro del servicio
          const centroId = typeof this.servicio.centro === 'object' && this.servicio.centro !== null
            ? this.servicio.centro._id
            : this.servicio.centro;

          this.profesionalesFiltrados = this.profesionales.filter(p => {
            const pCentroId = typeof p.centro === 'object' && p.centro !== null
              ? p.centro._id
              : p.centro;
            return pCentroId === centroId;
          });

          this.cargando = false;
        });
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.alertService.error('Error al cargar el servicio');
      }
    });
  }

  actualizarServicio(): void {
    // Validar URL de imagen si se proporciona (acepta URLs y rutas locales)
    if (this.servicio.imagen && !this.validarImagenURL(this.servicio.imagen)) {
      this.alertService.error('La imagen no es válida. Debe ser una URL (http/https) o una ruta local (/img/...)');
      return;
    }

    // Validar que duracion y precio sean positivos
    if (this.servicio.duracion < 1) {
      this.alertService.error('La duración debe ser al menos 1 minuto');
      return;
    }

    if (this.servicio.precio < 0.01) {
      this.alertService.error('El precio debe ser mayor a 0');
      return;
    }

    this.serviciosService.actualizarServicio(this.servicio).subscribe({
      next: () => {
        // eliminar relaciones antiguas
        this.profesionalServicioService.eliminarPorServicio(this.servicio.id_servicio).subscribe(() => {
          // crear nuevas relaciones
          this.id_profesionales.forEach(id_prof => {
            this.profesionalServicioService.crearRelacion({
              id_profesional: id_prof,
              id_servicio: this.servicio.id_servicio
            }).subscribe();
          });
          this.router.navigate(['/admin/servicios']);
        });
      },
      error: () => this.alertService.error('Error al actualizar el servicio')
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/servicios']);
  }

  onCentroChange(): void {
    // Filtrar profesionales por el centro seleccionado
    const centroId = typeof this.servicio.centro === 'object' && this.servicio.centro !== null
      ? this.servicio.centro._id
      : this.servicio.centro;

    if (centroId) {
      this.profesionalesFiltrados = this.profesionales.filter(p => {
        const pCentroId = typeof p.centro === 'object' && p.centro !== null
          ? p.centro._id
          : p.centro;
        return pCentroId === centroId;
      });
    } else {
      this.profesionalesFiltrados = [];
    }
    // Limpiar selección de profesionales cuando cambia el centro
    this.id_profesionales = [];
  }

  private validarImagenURL(url: string): boolean {
    // Acepta URLs completas (http/https) o rutas locales que empiecen con /
    const urlPattern = /^https?:\/\/.+/;
    const rutaLocalPattern = /^\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return urlPattern.test(url) || rutaLocalPattern.test(url);
  }
}
