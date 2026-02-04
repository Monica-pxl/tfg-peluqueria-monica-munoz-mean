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
  idProfesional: number = 0;
  citasHoy: number = 0;
  citasPendientes: number = 0;
  citasCompletadas: number = 0;
  citasTotales: number = 0;
  proximaCita: any = null;
  usuarios: UsuariosInterface[] = [];
  
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
      // Primero obtener el id_profesional a partir del id_usuario
      this.profesionalesService.getAllProfesionales().subscribe({
        next: profesionales => {
          const profesional = profesionales.find(p => p.id_usuario === Number(this.usuarioLogueado?.id_usuario));
          if (profesional) {
            this.idProfesional = profesional.id_profesional;
            console.log('ID Profesional encontrado:', this.idProfesional);
            this.cargarDatos();
          } else {
            console.error('No se encontró el profesional');
          }
        }
      });
    }
  }

  cargarDatos(): void {
    this.usuariosService.getAllUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.serviciosService.getAllServices().subscribe(servicios => {
          this.centrosService.getAllCentros().subscribe(centros => {
            this.cargarEstadisticas();
          });
        });
      },
      error: () => console.error('Error al cargar datos')
    });
  }

  cargarEstadisticas() {
    if (!this.idProfesional) return;

    // Cargar citas del profesional usando el servicio (igual que en mis-citas)
    this.citasService.getAllCitas(this.usuarios).subscribe({
      next: (todasLasCitas) => {
        console.log('Todas las citas:', todasLasCitas);
        // Filtrar citas del profesional actual
        const misCitas = todasLasCitas.filter(c => c.id_profesional === this.idProfesional);
        console.log('Mis citas (profesional ' + this.idProfesional + '):', misCitas);
        
        // Fecha de hoy
        const hoy = new Date().toISOString().split('T')[0];
        
        // Total de citas
        this.citasTotales = misCitas.length;
        
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
          const cliente = this.usuarios.find(u => u.id_usuario === cita.id_usuario);
          this.proximaCita = {
            ...cita,
            nombreCliente: cliente ? cliente.nombre : 'Cliente'
          };
        } else {
          this.proximaCita = null;
        }
        console.log('Próxima cita:', this.proximaCita);
        console.log('Estadísticas - Total:', this.citasTotales, 'Hoy:', this.citasHoy, 'Pendientes:', this.citasPendientes);
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
      }
    });
  }
}

