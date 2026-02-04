import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarios-service';
import { UsuariosInterface } from '../../interfaces/usuarios-interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cuenta-cliente-component',
  imports: [CommonModule],
  templateUrl: './cuenta-cliente-component.html',
  styleUrl: './cuenta-cliente-component.css',
})
export class CuentaClienteComponent implements OnInit {
  usuario: UsuariosInterface | null = null;
  puntos: number = 0;
  nivel: string = 'Cliente Nuevo';
  colorNivel: string = '#999';
  iconoNivel: string = 'bi-person';
  progresoBarra: number = 0;
  puntosParaSiguienteNivel: number = 20;
  siguienteNivel: string = 'Cliente Frecuente';

  constructor(
    public usuariosService: UsuariosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.usuariosService.getUsuarioLogueado();
    
    if (!this.usuario || this.usuario.rol !== 'cliente') {
      this.router.navigate(['/']);
      return;
    }

    // Cargar datos actualizados del usuario desde el backend
    this.usuariosService.getAllUsuarios().subscribe({
      next: usuarios => {
        const usuarioActualizado = usuarios.find(u => u.id_usuario === this.usuario?.id_usuario);
        if (usuarioActualizado) {
          this.usuario = usuarioActualizado;
          this.usuariosService.setUsuarioLogueado(usuarioActualizado);
          this.puntos = this.usuario.puntos || 0;
          this.nivel = this.usuariosService.obtenerNivel(this.puntos);
          this.colorNivel = this.usuariosService.obtenerColorNivel(this.puntos);
          this.iconoNivel = this.usuariosService.obtenerIconoNivel(this.puntos);
          this.calcularProgreso();
        }
      },
      error: () => {
        // Si hay error, usar los datos del localStorage
        this.puntos = this.usuario!.puntos || 0;
        this.nivel = this.usuariosService.obtenerNivel(this.puntos);
        this.colorNivel = this.usuariosService.obtenerColorNivel(this.puntos);
        this.iconoNivel = this.usuariosService.obtenerIconoNivel(this.puntos);
        this.calcularProgreso();
      }
    });
  }

  calcularProgreso(): void {
    if (this.puntos >= 100) {
      this.progresoBarra = 100;
      this.puntosParaSiguienteNivel = 0;
      this.siguienteNivel = 'Nivel Máximo';
    } else if (this.puntos >= 50) {
      this.progresoBarra = ((this.puntos - 50) / 50) * 100;
      this.puntosParaSiguienteNivel = 100 - this.puntos;
      this.siguienteNivel = 'Cliente Premium';
    } else if (this.puntos >= 20) {
      this.progresoBarra = ((this.puntos - 20) / 30) * 100;
      this.puntosParaSiguienteNivel = 50 - this.puntos;
      this.siguienteNivel = 'Cliente Habitual';
    } else {
      this.progresoBarra = (this.puntos / 20) * 100;
      this.puntosParaSiguienteNivel = 20 - this.puntos;
      this.siguienteNivel = 'Cliente Frecuente';
    }
  }

  obtenerDescripcionNivel(): string {
    switch(this.nivel) {
      case 'Cliente Premium':
        return '¡Eres nuestro cliente más valioso! Gracias por tu fidelidad.';
      case 'Cliente Habitual':
        return 'Tu confianza en nosotros es invaluable. ¡Sigue así!';
      case 'Cliente Frecuente':
        return 'Apreciamos mucho tu preferencia. ¡Gracias por volver!';
      default:
        return 'Bienvenido a nuestro programa de fidelización.';
    }
  }
}
