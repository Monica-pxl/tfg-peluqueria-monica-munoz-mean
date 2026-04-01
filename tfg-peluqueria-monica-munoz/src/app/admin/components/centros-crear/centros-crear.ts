import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CentrosService } from '../../../cliente/services/centros-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-centros-crear',
  imports: [CommonModule, FormsModule],
  templateUrl: './centros-crear.html',
  styleUrl: './centros-crear.css',
})
export class CentrosCrear {
  
  nombre = '';
  direccion = '';
  telefono = '';
  email = '';
  horario_apertura = '';
  horario_cierre = '';
  guardando = false;

  constructor(
    private centrosService: CentrosService,
    private router: Router,
    private alertService: AlertService
  ) {}

  crearCentro(): void {
    const nuevoCentro = {
      nombre: this.nombre,
      direccion: this.direccion,
      telefono: this.telefono,
      email: this.email,
      horario_apertura: this.horario_apertura,
      horario_cierre: this.horario_cierre
    };

    this.guardando = true;
    this.centrosService.crearCentro(nuevoCentro).subscribe({
      next: () => {
        this.guardando = false;
        this.alertService.success('Centro creado exitosamente');
        this.router.navigate(['/admin/centros'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        this.guardando = false;
        const mensaje = err.error?.error || 'Error al crear el centro';
        this.alertService.error(mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/centros']);
  }
}
