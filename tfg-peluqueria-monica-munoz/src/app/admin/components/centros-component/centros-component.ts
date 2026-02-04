import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { CentrosService } from '../../../cliente/services/centros-service';
import { ProfesionalesInterface } from '../../../cliente/interfaces/profesionales-interface';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../../shared/services/alert-service';
import { ConfirmService } from '../../../shared/services/confirm-service';

@Component({
  selector: 'app-centros-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './centros-component.html',
  styleUrl: './centros-component.css',
})
export class CentrosComponent implements OnInit {

  centros: CentrosInterface[] = [];
  centrosFiltrados: CentrosInterface[] = [];
  profesionales: ProfesionalesInterface[] = [];
  busquedaTexto: string = '';
  cargando = true;
  error = false;

  constructor(
    private centrosService: CentrosService,
    private profesionalesService: ProfesionalesService,
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
      centros: this.centrosService.getAllCentros(),
      profesionales: this.profesionalesService.getAllProfesionales()
    }).subscribe({
      next: ({ centros, profesionales }) => {
        this.centros = centros;
        this.centrosFiltrados = centros;
        this.profesionales = profesionales;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.centrosFiltrados = this.centros.filter(centro => {
      const cumpleBusqueda = this.busquedaTexto === '' || 
        centro.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        centro.direccion.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
        centro.email.toLowerCase().includes(this.busquedaTexto.toLowerCase());
      
      return cumpleBusqueda;
    });
  }

  profesionalesDelCentro(id_centro: number): string {
    const profs = this.profesionales.filter(p => Number(p.id_centro) === Number(id_centro));
    const nombres = profs.map(p => `${p.nombre} ${p.apellidos}`);
    return nombres.length > 0 ? nombres.join(', ') : 'Sin profesionales';
  }

  cantidadProfesionales(id_centro: number): number {
    return this.profesionales.filter(p => Number(p.id_centro) === Number(id_centro)).length;
  }

  crearCentro(): void {
    this.router.navigate(['/admin/centros/crear']);
  }

  editarCentro(id_centro: number): void {
    this.router.navigate(['/admin/centros/editar', id_centro]);
  }

  async borrarCentro(centro: CentrosInterface): Promise<void> {
    const cantidad = this.cantidadProfesionales(centro.id_centro);

    if (cantidad > 0) {
      this.alertService.warning(`No se puede eliminar el centro "${centro.nombre}" porque tiene ${cantidad} profesional(es) asignado(s).\n\nPrimero debes reasignar o eliminar los profesionales.`);
      return;
    }

    const confirmed = await this.confirmService.confirm(
      'Eliminar Centro',
      `¿Seguro que quieres eliminar el centro "${centro.nombre}"?`,
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (!confirmed) return;

    this.centrosService.borrarCentro(centro.id_centro).subscribe({
      next: () => {
        this.alertService.success('Centro eliminado exitosamente');
        this.cargarDatos();
      },
      error: (err) => {
        const mensaje = err.error?.error || 'Error al eliminar el centro';
        this.alertService.error(mensaje);
      }
    });
  }
}
