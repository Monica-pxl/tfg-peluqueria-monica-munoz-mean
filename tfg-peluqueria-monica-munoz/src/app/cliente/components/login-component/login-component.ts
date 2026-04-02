import { Component } from '@angular/core';
import { Route, Router, RouterLink } from "@angular/router";
import { Usuarios, UsuariosInterface } from '../../interfaces/usuarios-interface';
import { UsuariosService } from '../../services/usuarios-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../shared/services/alert-service';


@Component({
  selector: 'app-login-component',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
  standalone: true
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = false;
  errorServidor = '';

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private alertService: AlertService
  ) {}

  iniciarSesion() {
    this.errorServidor = '';

    this.cargando = true;

    this.usuariosService.login(this.email, this.password).subscribe({

      next: (response) => {
        this.cargando = false;
        const usuario = response.usuario;

        this.usuariosService.setUsuarioLogueado(usuario);
        if (response.token) {
          this.usuariosService.setToken(response.token);
        }

        this.alertService.success('¡Bienvenido ' + usuario.nombre + '!');

        if(usuario.rol == 'administrador'){
          this.router.navigate(['/admin/dashboard']);
        } else if(usuario.rol == 'profesional'){
          this.router.navigate(['/profesional/dashboard']);
        } else {
          this.router.navigate(['/home']);
        }

      },

      error: (error) => {
        this.cargando = false;
        this.errorServidor = error.error?.error || 'Error en el servidor';
        this.password = '';
      }
    });
  }
}
