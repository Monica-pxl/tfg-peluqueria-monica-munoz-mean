import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentrosService } from '../../../cliente/services/centros-service';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-centros-editar',
  imports: [CommonModule, FormsModule],
  templateUrl: './centros-editar.html',
  styleUrl: './centros-editar.css',
})
export class CentrosEditar implements OnInit {

  centro!: CentrosInterface;
  cargando = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private centrosService: CentrosService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = true;
      this.cargando = false;
      this.alertService.error('ID de centro inválido');
      this.router.navigate(['/admin/centros']);
      return;
    }

    this.centrosService.getCentroById(id).subscribe({
      next: (centro) => {
        this.centro = centro;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.alertService.error('Centro no encontrado');
        this.router.navigate(['/admin/centros']);
      }
    });
  }

  actualizarCentro(): void {
    if (!this.centro.nombre || !this.centro.direccion || !this.centro.telefono ||
        !this.centro.email || !this.centro.horario_apertura || !this.centro.horario_cierre) {
      this.alertService.warning('Por favor completa todos los campos');
      return;
    }

    // Validar formato de email
    if (!this.validarEmail(this.centro.email)) {
      this.alertService.error('El formato del email no es válido');
      return;
    }

    // Validar formato de teléfono (9 dígitos)
    if (!this.validarTelefono(this.centro.telefono)) {
      this.alertService.error('El teléfono debe tener exactamente 9 dígitos');
      return;
    }

    this.centrosService.actualizarCentro(this.centro).subscribe({
      next: () => {
        this.alertService.success('Centro actualizado exitosamente');
        this.router.navigate(['/admin/centros'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        const mensaje = err.error?.error || 'Error al actualizar el centro';
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
