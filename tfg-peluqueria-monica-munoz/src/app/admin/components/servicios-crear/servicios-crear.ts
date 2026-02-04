import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { ProfesionalServicioService } from '../../../cliente/services/profesional-servicio-service';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { ProfesionalServicioInterface } from '../../../cliente/interfaces/profesional-servicio-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-servicios-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios-crear.html',
  styleUrls: ['./servicios-crear.css'],
})
export class ServiciosCrear implements OnInit{
  nombre = '';
  descripcion = '';
  duracion!: number;
  precio!: number;
  id_centro!: number;
  imagen = '';
  id_profesionales: number[] = [];

  centros: CentrosInterface[] = [];
  profesionales: ProfesionalesInterface[] = [];
  profesionalesFiltrados: ProfesionalesInterface[] = [];

  cargando = true;
  error = false;  guardando = false; // Protección contra doble clic
  constructor(
    private serviciosService: ServiciosService,
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
    private profesionalServicioService: ProfesionalServicioService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Forzar limpieza de profesionales al iniciar
    this.id_profesionales = [];
    
    this.cargando = true;
    forkJoin({
      centros: this.centrosService.getAllCentros(),
      profesionales: this.profesionalesService.getAllProfesionales()
    }).subscribe({
      next: ({ centros, profesionales }) => {
        this.centros = centros;
        this.profesionales = profesionales;
        // Asegurar que id_profesionales esté vacío
        this.id_profesionales = [];
        this.profesionalesFiltrados = [];
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  crearServicio(): void {
  // Protección contra doble clic
  if (this.guardando) {
    console.log('⚠️ Ya se está guardando, ignorando clic duplicado');
    return;
  }

  if (!this.nombre || !this.descripcion || !this.duracion || !this.precio || !this.id_centro) return;

  // Validar URL de imagen si se proporciona (acepta URLs y rutas locales)
  if (this.imagen && !this.validarImagenURL(this.imagen)) {
    this.alertService.error('La imagen no es válida. Debe ser una URL (http/https) o una ruta local (/img/...)');
    return;
  }

  // Validar que duracion y precio sean positivos
  if (this.duracion < 1) {
    this.alertService.error('La duración debe ser al menos 1 minuto');
    return;
  }

  if (this.precio < 0.01) {
    this.alertService.error('El precio debe ser mayor a 0');
    return;
  }

  this.guardando = true; // Bloquear botón
  console.log('=== CREAR SERVICIO ===');
  console.log('Profesionales seleccionados (raw):', this.id_profesionales);
  
  // Eliminar duplicados del array de profesionales
  const profesionalesUnicos = [...new Set(this.id_profesionales.map(id => Number(id)))];
  console.log('Profesionales únicos después de filtrar:', profesionalesUnicos);
  console.log('Tipo de id_profesionales:', typeof this.id_profesionales);
  console.log('Es array?', Array.isArray(this.id_profesionales));

  const nuevo: ServiciosInterface = {
    id_servicio: 0, // El backend asignará el ID consecutivo
    nombre: this.nombre,
    descripcion: this.descripcion,
    duracion: this.duracion,
    precio: this.precio,
    id_centro: Number(this.id_centro),
    imagen: this.imagen
  };

  this.serviciosService.crearServicio(nuevo).subscribe({
    next: (servicioCreado) => {
      console.log('Servicio creado con ID:', servicioCreado.id_servicio);
      
      if (profesionalesUnicos.length === 0) {
        console.log('No hay profesionales seleccionados, redirigiendo...');
        this.alertService.success('Servicio creado exitosamente');
        this.guardando = false;
        this.router.navigate(['/admin/servicios']);
        return;
      }

      console.log('Creando relaciones para profesionales únicos:', profesionalesUnicos);

      const observables = profesionalesUnicos.map(id_prof => {
        const relacion: ProfesionalServicioInterface = {
          id_profesional: Number(id_prof),
          id_servicio: servicioCreado.id_servicio
        };
        console.log('Creando relación:', relacion);
        return this.profesionalServicioService.crearRelacion(relacion);
      });

      forkJoin(observables).subscribe({
        next: () => {
          console.log('Todas las relaciones creadas exitosamente');
          this.alertService.success('Servicio creado exitosamente');
          this.guardando = false;
          this.router.navigate(['/admin/servicios'], { queryParams: { recargar: true } });
        },
        error: (err) => {
          console.error('Error al asignar profesionales:', err);
          this.alertService.error('Error al asignar profesionales al servicio');
          this.guardando = false;
        }
      });
    },
    error: () => {
      this.alertService.error('Error al crear el servicio');
      this.guardando = false;
    }
  });
}

  cancelar(): void {
    this.router.navigate(['/admin/servicios']);
  }

  onCentroChange(): void {
    console.log('=== CAMBIO DE CENTRO ===');
    console.log('Centro seleccionado:', this.id_centro);
    
    // Limpiar selección de profesionales
    this.id_profesionales = [];
    
    // Filtrar profesionales por el centro seleccionado
    if (this.id_centro) {
      this.profesionalesFiltrados = this.profesionales.filter(
        p => p.id_centro === Number(this.id_centro)
      );
      console.log('Profesionales filtrados:', this.profesionalesFiltrados);
    } else {
      this.profesionalesFiltrados = [];
    }
  }

  onProfesionalesChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions);
    
    // Extraer valores seleccionados y eliminar duplicados
    this.id_profesionales = [...new Set(
      selectedOptions.map(option => Number(option.value))
    )];
    
    console.log('✅ Profesionales seleccionados:', this.id_profesionales);
  }

  private validarImagenURL(url: string): boolean {
    // Acepta URLs completas (http/https) o rutas locales que empiecen con /
    const urlPattern = /^https?:\/\/.+/;
    const rutaLocalPattern = /^\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return urlPattern.test(url) || rutaLocalPattern.test(url);
  }

}
