import { ImplicitReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ServiciosInterface } from '../../interfaces/servicios-interface';
import { ServiciosService } from '../../services/servicios-service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-servicios-component',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './servicios-component.html',
  styleUrl: './servicios-component.css',
})

export class ServiciosComponent implements OnInit {

  servicios: ServiciosInterface[] = []; 
  serviciosFiltrados: ServiciosInterface[] = [];
  serviciosPagina: ServiciosInterface[] = []; 
  paginaActual: number = 1;
  cantidadPorPagina: number = 9;
  textoBusqueda: string = '';

  constructor(private APIservicios: ServiciosService) {}

  ngOnInit(): void {
    this.loadServicios();
  }



  loadServicios(): void {
    this.APIservicios.getAllServices().subscribe({
      next: (data) => {
        this.servicios = data;
        this.serviciosFiltrados = data;
        this.actualizarPagina(); 
      },
      error: (err) => console.error('Error al cargar los servicios', err)
    });
  }

  filtrarServicios(): void {
    if (!this.textoBusqueda.trim()) {
      this.serviciosFiltrados = this.servicios;
    } else {
      const busqueda = this.textoBusqueda.toLowerCase();
      this.serviciosFiltrados = this.servicios.filter(servicio => 
        servicio.nombre.toLowerCase().includes(busqueda) ||
        servicio.descripcion.toLowerCase().includes(busqueda)
      );
    }
    this.paginaActual = 1;
    this.actualizarPagina();
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.filtrarServicios();
  }


  actualizarPagina(): void {
    const inicio = (this.paginaActual - 1) * this.cantidadPorPagina;
    const fin = inicio + this.cantidadPorPagina;
    this.serviciosPagina = this.serviciosFiltrados.slice(inicio, fin);
  }


  CambiarPagina(accion: 'primera' | 'anterior' | 'siguiente' | 'ultima'): void {
    const totalPaginas = Math.ceil(this.serviciosFiltrados.length / this.cantidadPorPagina);

    switch(accion) {
      case 'primera':
        this.paginaActual = 1;
        break;
      case 'anterior':
        if (this.paginaActual > 1) this.paginaActual--;
        break;
      case 'siguiente':
        if (this.paginaActual < totalPaginas) this.paginaActual++;
        break;
      case 'ultima':
        this.paginaActual = totalPaginas;
        break;
    }

    this.actualizarPagina();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

