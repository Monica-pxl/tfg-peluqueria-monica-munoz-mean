import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiciosService } from '../../../cliente/services/servicios-service';
import { UsuariosService } from '../../../cliente/services/usuarios-service';
import { CitasService } from '../../../admin/services/citas-service';
import { ProfesionalesService } from '../../../cliente/services/profesionales-service';
import { CentrosService } from '../../../cliente/services/centros-service';

@Component({
  selector: 'app-dashboard-component',
  imports: [RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent implements OnInit {
  totalCitas: number = 0;
  totalClientes: number = 0;
  totalProfesionales: number = 0;
  totalServicios: number = 0;
  totalCentros: number = 0;

  constructor(
    private serviciosService: ServiciosService,
    private usuariosService: UsuariosService,
    private citasService: CitasService,
    private profesionalesService: ProfesionalesService,
    private centrosService: CentrosService
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    // Cargar total de servicios
    this.serviciosService.getAllServices().subscribe(
      (servicios) => {
        this.totalServicios = servicios.length;
      }
    );

    // Cargar total de clientes (usuarios con rol 'cliente')
    this.usuariosService.getAllUsuarios().subscribe(
      (usuarios) => {
        this.totalClientes = usuarios.filter(u => u.rol === 'cliente').length;
      }
    );
    

    // Total de citas
     this.citasService.getAllCitas([]).subscribe(
      (citas) => {
        this.totalCitas = citas.length;
      }
    );


    // Cargar total de profesionales
    this.profesionalesService.getAllProfesionales().subscribe(
      (profesionales) => {
        this.totalProfesionales = profesionales.length;
      }
    );

    // Cargar total de centros
    this.centrosService.getAllCentros().subscribe(
      (centros) => {
        this.totalCentros = centros.length;
      }
    );
  }
}
