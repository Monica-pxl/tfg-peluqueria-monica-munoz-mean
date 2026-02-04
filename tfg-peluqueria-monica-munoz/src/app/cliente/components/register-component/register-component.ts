import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { Router } from '@angular/router';
import { UsuariosService } from '../../services/usuarios-service';
import { UsuariosInterface } from '../../interfaces/usuarios-interface';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-register-component',
  imports: [RouterLink, FormsModule],
  templateUrl: './register-component.html',
  styleUrls: ['./register-component.css'],
})
export class RegisterComponent {

  nombre = '';
  email = '';
  password = '';
  repetirPassword = '';
  rol = 'cliente';
  cargando = false;

  constructor(
    private router: Router, 
    private usuariosService: UsuariosService,
    private alertService: AlertService
  ) {}

  registro() {
    if (this.password !== this.repetirPassword) {
      this.alertService.warning('Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.alertService.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!this.nombre || !this.email || !this.password) {
      this.alertService.warning('Por favor, completa todos los campos');
      return;
    }

    // Validar formato de email
    if (!this.validarEmail(this.email)) {
      this.alertService.error('El formato del email no es válido');
      return;
    }

    this.cargando = true;
    this.usuariosService.registro(this.nombre, this.email, this.password, this.rol).subscribe({
      
      next: (response) => {
        this.cargando = false;
        const usuario = response.usuario;

        this.usuariosService.setUsuarioLogueado(usuario);

        this.alertService.success('¡Registro exitoso! Bienvenido ' + usuario.nombre);
        this.router.navigate(['/home']);
      },

      error: (error) => {
        this.cargando = false;
        const mensaje = error.error?.error || 'Error al registrarse';
        this.alertService.error(mensaje);
        this.password = '';
        this.repetirPassword = '';
      }
    });
  }

  private validarEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }
}
