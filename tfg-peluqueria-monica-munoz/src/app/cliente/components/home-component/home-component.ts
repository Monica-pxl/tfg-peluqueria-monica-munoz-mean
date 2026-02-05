import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { OnInit } from "@angular/core";
import { ServiciosInterface } from "../../interfaces/servicios-interface";
import { CentrosInterface } from "../../interfaces/centros-interface";
import { ServiciosService } from "../../services/servicios-service";
import { CentrosService } from "../../services/centros-service";

@Component({
  selector: 'app-home-component',
  imports: [RouterLink, CommonModule],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css'],
  standalone: true
})
export class HomeComponent implements OnInit {

    servicios: ServiciosInterface[] = [];
    centros: CentrosInterface[] = [];
    centrosVisibles: CentrosInterface[] = [];
    currentPage: number = 0;
    itemsPerPage: number = 3;
    Math = Math;

    constructor(
      private APIservicios: ServiciosService,
      private APIcentros: CentrosService
    ) {}


    ngOnInit(): void {
      this.loadServicios();
      this.loadCentros();
    }


    loadServicios(): void {
      this.APIservicios.getAllServices().subscribe({
        next: (data) => {
          // Ordenar servicios por id_servicio de forma ascendente
          this.servicios = data.sort((a, b) => a.id_servicio - b.id_servicio);
          console.log('Servicios cargados en home:', this.servicios);
        },
        error: (err) => {
          console.error('Error al cargar los servicios', err)
        },
        complete: () => {
          console.log('Servicios cargados correctamente');
        }
      });
    }

    loadCentros(): void {
      this.APIcentros.getAllCentros().subscribe({
        next: (data) => {
          this.centros = data;
          this.updateCentrosVisibles();
        },
        error: (err) => {
          console.error('Error al cargar los centros', err)
        },
        complete: () => {
          console.log('Centros cargados correctamente');
        }
      });
    }

    updateCentrosVisibles(): void {
      const start = this.currentPage * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.centrosVisibles = this.centros.slice(start, end);
    }

    nextPage(): void {
      const maxPage = Math.ceil(this.centros.length / this.itemsPerPage) - 1;
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.updateCentrosVisibles();
      }
    }

    prevPage(): void {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.updateCentrosVisibles();
      }
    }

    canGoNext(): boolean {
      const maxPage = Math.ceil(this.centros.length / this.itemsPerPage) - 1;
      return this.currentPage < maxPage;
    }

    canGoPrev(): boolean {
      return this.currentPage > 0;
    }
}
