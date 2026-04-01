import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentrosService } from '../../../cliente/services/centros-service';
import { HorariosService } from '../../../cliente/services/horarios-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CentrosInterface } from '../../../cliente/interfaces/centros-interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';
import { forkJoin } from 'rxjs';

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
  guardando = false;
  horarioOriginalApertura = '';
  horarioOriginalCierre = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private centrosService: CentrosService,
    private horariosService: HorariosService,
    private profesionalesService: ProfesionalesService,
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
        this.horarioOriginalApertura = centro.horario_apertura || '';
        this.horarioOriginalCierre = centro.horario_cierre || '';
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
    const horarioCambiado =
      this.centro.horario_apertura !== this.horarioOriginalApertura ||
      this.centro.horario_cierre !== this.horarioOriginalCierre;

    if (horarioCambiado) {
      // Verificar que ningún horario de profesional quede fuera del nuevo rango
      forkJoin([
        this.profesionalesService.getAllProfesionales(),
        this.horariosService.getAllHorarios()
      ]).subscribe({
        next: ([profesionales, horarios]) => {
          const centroId = this.centro._id;
          const profIds = profesionales
            .filter(p => {
              const cId = typeof p.centro === 'object' && p.centro !== null ? (p.centro as any)._id : p.centro;
              return cId === centroId;
            })
            .map(p => p._id);

          const conflictos = horarios.filter(h => {
            const profId = typeof h.profesional === 'object' && h.profesional !== null ? (h.profesional as any)._id : h.profesional;
            return profIds.includes(profId) &&
              (h.hora_inicio! < this.centro.horario_apertura! || h.hora_fin! > this.centro.horario_cierre!);
          });

          if (conflictos.length > 0) {
            this.alertService.error(
              `No se puede actualizar el horario del centro porque ${conflictos.length} horario(s) de profesionales quedarían fuera del nuevo rango. Ajusta primero los horarios de los profesionales afectados.`
            );
            return;
          }

          this.enviarActualizacion();
        },
        error: () => {
          // Si no se pueden cargar, dejar que el backend valide
          this.enviarActualizacion();
        }
      });
    } else {
      this.enviarActualizacion();
    }
  }

  private enviarActualizacion(): void {
    this.guardando = true;
    this.centrosService.actualizarCentro(this.centro).subscribe({
      next: () => {
        this.guardando = false;
        this.alertService.success('Centro actualizado exitosamente');
        this.router.navigate(['/admin/centros'], { queryParams: { recargar: true } });
      },
      error: (err) => {
        this.guardando = false;
        const mensaje = err.error?.error || 'Error al actualizar el centro';
        this.alertService.error(mensaje);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/centros']);
  }
}
