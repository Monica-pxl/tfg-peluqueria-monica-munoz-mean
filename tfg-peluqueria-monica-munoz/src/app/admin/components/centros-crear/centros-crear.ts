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

  constructor(
    private centrosService: CentrosService,
    private router: Router,
    private alertService: AlertService
  ) {}

  crearCentro(): void {
    if (!this.nombre || !this.direccion || !this.telefono || !this.email || 
        !this.horario_apertura || !this.horario_cierre) {
      this.alertService.warning('Por favor completa todos los campos');
      return;
    }

    // Validar formato de email
    if (!this.validarEmail(this.email)) {
      this.alertService.error('El formato del email no es válido');
      return;
    }

    // Validar formato de teléfono (9 dígitos)
    if (!this.validarTelefono(this.telefono)) {
      this.alertService.error('El teléfono debe tener exactamente 9 dígitos');
      return;
    }

    const nuevoCentro = {
      nombre: this.nombre,
      direccion: this.direccion,
      telefono: this.telefono,
      email: this.email,
      horario_apertura: this.horario_apertura,
      horario_cierre: this.horario_cierre
    };

    this.centrosService.crearCentro(nuevoCentro).subscribe({
      next: () => {
        this.alertService.success('Centro creado exitosamente');
        this.router.navigate(['/admin/centros'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        const mensaje = err.error?.error || 'Error al crear el centro';
        this.alertService.error(mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/centros']);
  }

  private validarEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  private validarTelefono(telefono: string): boolean {
    const pattern = /^[0-9]{9}$/;
    return pattern.test(telefono);
  }
}
