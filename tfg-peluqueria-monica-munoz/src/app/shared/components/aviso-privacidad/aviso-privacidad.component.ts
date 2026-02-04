import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aviso-privacidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aviso-privacidad.component.html',
  styleUrl: './aviso-privacidad.component.css',
})
export class AvisoPrivacidadComponent implements OnInit {
  mostrarAviso: boolean = true; // Forzar a true para testing

  ngOnInit(): void {
    // Verificar si el usuario ya aceptó el aviso
    const avisoAceptado = localStorage.getItem('avisoPrivacidadAceptado');
    console.log('Aviso privacidad - localStorage:', avisoAceptado);
    if (!avisoAceptado) {
      console.log('Mostrando aviso de privacidad');
      // Mostrar el aviso inmediatamente
      this.mostrarAviso = true;
    } else {
      console.log('Aviso ya aceptado, no se muestra');
      this.mostrarAviso = false;
    }
  }

  aceptarAviso(): void {
    localStorage.setItem('avisoPrivacidadAceptado', 'true');
    this.mostrarAviso = false;
  }
}
