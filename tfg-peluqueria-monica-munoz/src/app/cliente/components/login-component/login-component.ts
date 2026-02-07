import { Component } from '@angular/core';
import { Route, Router, RouterLink } from "@angular/router";
import { Usuarios, UsuariosInterface } from '../../interfaces/usuarios-interface';
import { UsuariosService } from '../../services/usuarios-service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/services/alert-service';


@Component({
  selector: 'app-login-component',
  imports: [RouterLink, FormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
  standalone: true
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = false;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private alertService: AlertService
  ) {}

  iniciarSesion() {
    if (!this.email || !this.password) {
      this.alertService.warning('Por favor completa todos los campos');
      return;
    }

    this.cargando = true;

    this.usuariosService.login(this.email, this.password).subscribe({

      next: (response) => {
        this.cargando = false;
        const usuario = response.usuario;

        this.usuariosService.setUsuarioLogueado(usuario);

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
        const mensaje = error.error?.error || 'Error al iniciar sesión';
        this.alertService.error(mensaje);
        this.password = '';
      }
    });
  }
}
