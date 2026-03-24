import { Component, OnInit } from '@angular/core';
import { CentrosInterface } from '../../interfaces/centros-interface';
import { CentrosService } from '../../services/centros-service';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-centros-component',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './centros-component.html',
  styleUrl: './centros-component.css',
  standalone: true
})
export class CentrosComponent implements OnInit {

  centros: CentrosInterface[] = [];
  centrosFiltrados: CentrosInterface[] = [];
  centrosPagina: CentrosInterface[] = [];
  paginaActual: number = 1;
  cantidadPorPagina: number = 6;
  textoBusqueda: string = '';
  cargando = false;

  constructor(private APIcentros: CentrosService) {}

  ngOnInit(): void {
    // Scroll hacia arriba al cargar el componente
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);

    this.loadCentros();
  }

  loadCentros(): void {
    this.cargando = true;
    this.APIcentros.getAllCentros().subscribe({
      next: (data) => {
        this.cargando = false;
        this.centros = data;
        this.centrosFiltrados = data;
        this.actualizarPagina();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar los centros', err);
      }
    });
  }

  filtrarCentros(): void {
    if (!this.textoBusqueda.trim()) {
      this.centrosFiltrados = this.centros;
    } else {
      const busqueda = this.textoBusqueda.toLowerCase();
      this.centrosFiltrados = this.centros.filter(centro =>
        centro.nombre.toLowerCase().includes(busqueda) ||
        centro.direccion.toLowerCase().includes(busqueda) ||
        centro.telefono.toLowerCase().includes(busqueda)
      );
    }
    this.paginaActual = 1;
    this.actualizarPagina();
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.filtrarCentros();
  }

  actualizarPagina(): void {
    const inicio = (this.paginaActual - 1) * this.cantidadPorPagina;
    const fin = inicio + this.cantidadPorPagina;
    this.centrosPagina = this.centrosFiltrados.slice(inicio, fin);
  }

  CambiarPagina(accion: 'primera' | 'anterior' | 'siguiente' | 'ultima'): void {
    const totalPaginas = Math.ceil(this.centrosFiltrados.length / this.cantidadPorPagina);

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

    // Scroll hacia arriba con múltiples estrategias para mayor fiabilidad
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }
}
