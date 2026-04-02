import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarios-service';
import { UsuariosInterface } from '../../interfaces/usuarios-interface';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-register-component',
  imports: [RouterLink, FormsModule, CommonModule],
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
  errorServidor = '';

  constructor(
    private router: Router, 
    private usuariosService: UsuariosService,
    private alertService: AlertService
  ) {}

  registro() {
    this.errorServidor = '';

    this.cargando = true;
    this.usuariosService.registro(this.nombre, this.email, this.password, this.rol).subscribe({
      
      next: (response) => {
        this.cargando = false;
        const usuario = response.usuario;

        this.usuariosService.setUsuarioLogueado(usuario);
        if (response.token) {
          this.usuariosService.setToken(response.token);
        }

        this.alertService.success('¡Registro exitoso! Bienvenido ' + usuario.nombre);
        this.router.navigate(['/home']);
      },

      error: (error) => {
        this.cargando = false;
        this.errorServidor = error.error?.error || 'Error al registrar usuario';
        this.password = '';
        this.repetirPassword = '';
      }
    });
  }
}
