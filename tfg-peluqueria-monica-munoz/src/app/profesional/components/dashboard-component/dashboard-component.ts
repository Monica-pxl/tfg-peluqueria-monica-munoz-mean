import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { UsuariosInterface } from '../../../cliente/interfaces/usuarios-interface';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CitasService } from '../../../admin/services/citas-service';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { CentrosService } from '../../../cliente/services/centros-service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent implements OnInit {
  usuarioLogueado: UsuariosInterface | null = null;
  idProfesional: string | undefined = undefined;
  citasHoy: number = 0;
  citasPendientes: number = 0;
  citasCompletadas: number = 0;
  citasTotales: number = 0;
  proximaCita: any = null;
  usuarios: UsuariosInterface[] = [];
  citasConfirmadas: number = 0;
  

  constructor(
    private usuariosService: UsuariosService,
    private profesionalesService: ProfesionalesService,
    private citasService: CitasService,
    private serviciosService: ServiciosService,
    private centrosService: CentrosService
  ) {}

  ngOnInit() {
    this.usuarioLogueado = this.usuariosService.getUsuarioLogueado();

    if (this.usuarioLogueado) {
      // Primero obtener el id_profesional a partir del _id del usuario
      this.profesionalesService.getAllProfesionales().subscribe({
        next: profesionales => {
          // console.log('Todos los profesionales:', profesionales);
          // console.log('Usuario logueado:', this.usuarioLogueado);
          // Buscar profesional por el campo 'usuario' que debe coincidir con el _id del usuario logueado
          const profesional = profesionales.find(p => {
            // Si 'usuario' es un objeto poblado, comparar con usuario._id
            if (typeof p.usuario === 'object' && p.usuario !== null) {
              return p.usuario._id === this.usuarioLogueado?._id;
            }
            // Si 'usuario' es un string (ObjectId), compararlo directamente
            return p.usuario === this.usuarioLogueado?._id;
          });

          if (profesional) {
            this.idProfesional = profesional._id; // Usar _id
            // console.log('ID Profesional encontrado:', this.idProfesional);
            this.cargarDatos();
          } else {
            console.error('No se encontró profesional asociado a este usuario');
          }
        },
        error: (error) => {
          console.error('Error al cargar profesionales:', error);
        }
      });
    }
  }

  cargarDatos(): void {
    this.serviciosService.getAllServices().subscribe(() => {
      this.centrosService.getAllCentros().subscribe(() => {
        this.cargarEstadisticas();
      });
    });
  }

  cargarEstadisticas() {
    if (!this.idProfesional) return;

    this.citasService.getCitasPorProfesional(this.idProfesional).subscribe({
      next: (misCitas) => {
        // console.log('Mis citas (profesional ' + this.idProfesional + '):', misCitas);

        // Fecha de hoy
        const hoy = new Date().toISOString().split('T')[0];

        // Total de citas (SOLO confirmadas)
        this.citasConfirmadas = misCitas.filter(c => c.estado === 'confirmada').length;

        // Citas de hoy
        this.citasHoy = misCitas.filter(c => c.fecha === hoy).length;

        // Citas pendientes (solo estado "pendiente")
        this.citasPendientes = misCitas.filter(c =>
          c.estado === 'pendiente'
        ).length;

        // Citas completadas
        this.citasCompletadas = misCitas.filter(c => c.estado === 'realizada').length;

        // Próxima cita (la más cercana en el futuro)
        const citasFuturas = misCitas
          .filter(c => {
            const fechaCita = new Date(c.fecha + 'T' + c.hora);
            const ahora = new Date();
            return fechaCita >= ahora && c.estado !== 'cancelada';
          })
          .sort((a, b) => {
            const fechaA = new Date(a.fecha + 'T' + a.hora);
            const fechaB = new Date(b.fecha + 'T' + b.hora);
            return fechaA.getTime() - fechaB.getTime();
          });

        if (citasFuturas.length > 0) {
          const cita = citasFuturas[0];

          // Obtener el nombre del cliente
          let nombreCliente = 'Cliente';
          if (typeof cita.usuario === 'object' && cita.usuario !== null) {
            nombreCliente = cita.usuario.nombre;
          } else if (typeof cita.usuario === 'string') {
            const cliente = this.usuarios.find(u => u._id === cita.usuario);
            if (cliente) nombreCliente = cliente.nombre;
          }

          // Obtener el nombre del servicio
          let nombreServicio = 'Servicio';
          if (typeof cita.servicio === 'object' && cita.servicio !== null) {
            nombreServicio = cita.servicio.nombre;
          }

          // Obtener el nombre del centro
          let nombreCentro = 'Centro';
          if (typeof cita.centro === 'object' && cita.centro !== null) {
            nombreCentro = cita.centro.nombre;
          }

          this.proximaCita = {
            ...cita,
            nombreCliente: nombreCliente,
            servicio: nombreServicio,
            centro: nombreCentro
          };
        } else {
          this.proximaCita = null;
        }
        // console.log('Próxima cita:', this.proximaCita);
        // console.log('Estadísticas - Total:', this.citasTotales, 'Hoy:', this.citasHoy, 'Pendientes:', this.citasPendientes);
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
      }
    });
  }
}

