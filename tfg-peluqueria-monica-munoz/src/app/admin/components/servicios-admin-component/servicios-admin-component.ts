import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosInterface } from '../../../cliente/interfaces/servicios-interface';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ProfesionalServicioInterface } from '../../../cliente/interfaces/profesional-servicio-interface';
import { ProfesionalServicioService } from '../../../cliente/services/profesional-servicio-service';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { forkJoin } from 'rxjs';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-servicios-admin-component',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './servicios-admin-component.html',
  styleUrls: ['./servicios-admin-component.css']
})
export class ServiciosAdminComponent implements OnInit {

  servicios: ServiciosInterface[] = [];
  serviciosFiltrados: ServiciosInterface[] = [];
  centros: CentrosInterface[] = [];
  profesionalesServicios: ProfesionalServicioInterface[] = [];
  profesionales: ProfesionalesInterface[] = [];

  busquedaTexto: string = '';

  cargando = true;
  error = false;

  constructor(
    private serviciosService: ServiciosService,
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
    private profesionalServicioService: ProfesionalServicioService,
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
      servicios: this.serviciosService.getAllServices(),
      centros: this.centrosService.getAllCentros(),
      profesionales: this.profesionalesService.getAllProfesionales(),
      profesionalesServicios: this.profesionalServicioService.getAllProfesionalServicio()
    }).subscribe({
      next: ({ servicios, centros, profesionales, profesionalesServicios }) => {
        this.servicios = servicios;
        this.serviciosFiltrados = servicios;
        this.centros = centros;
        this.profesionales = profesionales;
        this.profesionalesServicios = profesionalesServicios;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.serviciosFiltrados = this.servicios.filter(servicio => {
      const cumpleBusqueda = this.busquedaTexto === '' ||
        servicio.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(this.busquedaTexto.toLowerCase());

      return cumpleBusqueda;
    });
  }

  nombreCentro(servicio: ServiciosInterface): string {
    // Si el centro está poblado (es un objeto)
    if (typeof servicio.centro === 'object' && servicio.centro !== null) {
      return servicio.centro.nombre || 'Sin centro';
    }
    // Si centro es un string (_id), buscar en el array de centros
    if (typeof servicio.centro === 'string') {
      const centro = this.centros.find(c => c._id === servicio.centro);
      return centro ? centro.nombre : 'Sin centro';
    }
    return 'Sin centro';
  }

  profesionalesDelServicio(servicio: ServiciosInterface): string {
    if (!servicio._id) return 'Sin profesionales';

    // Filtrar relaciones por el _id del servicio
    const rels = this.profesionalesServicios.filter(ps => {
      // Si servicio está poblado
      if (typeof ps.servicio === 'object' && ps.servicio !== null) {
        return ps.servicio._id === servicio._id;
      }
      // Si servicio es string (_id)
      return ps.servicio === servicio._id;
    });

    const nombres = rels.map(r => {
      // Si profesional está poblado
      if (typeof r.profesional === 'object' && r.profesional !== null) {
        return `${r.profesional.nombre} ${r.profesional.apellidos}`;
      }
      // Si profesional es string (_id), buscar en el array
      if (typeof r.profesional === 'string') {
        const prof = this.profesionales.find(p => p._id === r.profesional);
        return prof ? `${prof.nombre} ${prof.apellidos}` : '';
      }
      return '';
    }).filter(n => n !== '');

    return nombres.length > 0 ? nombres.join(', ') : 'Sin profesionales';
  }

  crearServicio(): void {
    this.router.navigate(['/admin/servicios/crear']);
  }

  editarServicio(servicio: ServiciosInterface): void {
    const nombre = prompt('Nombre del servicio', servicio.nombre);
    const descripcion = prompt('Descripción', servicio.descripcion);
    const duracion = Number(prompt('Duración en minutos', servicio.duracion.toString()));
    const precio = Number(prompt('Precio', servicio.precio.toString()));
    const id_centro = Number(prompt('ID del centro', (servicio.id_centro || 0).toString()));
    const imagen = prompt('URL de imagen', servicio.imagen);

    if (!nombre || !descripcion || !duracion || !precio || !id_centro) return;

    const actualizado: ServiciosInterface = {
      ...servicio,
      nombre,
      descripcion,
      duracion,
      precio,
      id_centro,
      imagen: imagen || ''
    };

    this.serviciosService.actualizarServicio(actualizado)
      .subscribe(() => this.cargarDatos());
  }

  async borrarServicio(servicio: ServiciosInterface): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Servicio',
      `¿Seguro que quieres borrar el servicio "${servicio.nombre}"? Esta acción eliminará también sus relaciones con profesionales.`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    const idServicio = servicio.id_servicio || servicio._id;
    if (!idServicio) {
      this.alertService.error('Error: El servicio no tiene ID válido');
      return;
    }

    this.serviciosService.borrarServicio(idServicio).subscribe({
      next: () => {
        this.alertService.success('Servicio eliminado exitosamente');
        this.cargarDatos();
      },
      error: () => this.alertService.error('Error al eliminar el servicio')
    });
  }
}
