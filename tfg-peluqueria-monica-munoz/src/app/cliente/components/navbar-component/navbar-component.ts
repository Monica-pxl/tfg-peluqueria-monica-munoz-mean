import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UsuariosService } from '../../services/usuarios-service';
import { NotificacionesService } from '../../services/notificaciones-service';
import { ConfirmService } from '../../../shared/services/confirm-service';
import { AlertService } from '../../../shared/services/alert-service';

@Component({
  selector: 'app-navbar-component',
  imports: [RouterLink],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css',
})
export class NavbarComponent {

  constructor(
    public usuariosService: UsuariosService,
    public notificacionesService: NotificacionesService, 
    private router: Router,
    private confirmService: ConfirmService,
    private alertService: AlertService
  ){}

  rutasNavbar: {nombre: string, ruta: string} [] = [
    { nombre: "Inicio", ruta: "/"},
    { nombre: "Servicios", ruta: "/servicios"},
    {nombre: "Centros", ruta: "/centros"},
    { nombre: "Mis Citas", ruta: "/mis-citas"},
    { nombre: "Reservar Cita", ruta: "/reservar-cita"}
  ];

  rutasSinUsuario: {nombre: string, ruta: string}[] = [
    { nombre: "Iniciar Sesion", ruta: "/iniciar-sesion"},
  ];

  // Rutas principales del admin (fuera del dropdown)
  rutasAdminPrincipales: {nombre: string, ruta: string} [] = [
    {nombre: "Dashboard", ruta: "/admin/dashboard"},
    {nombre: "Citas", ruta: "/admin/citas"}
  ]

  // Rutas de gestión del admin (dentro del dropdown)
  rutasAdminGestion: {nombre: string, ruta: string} [] = [
    {nombre: "Servicios", ruta: "/admin/servicios"},
    {nombre: "Profesionales", ruta: "/admin/profesionales"},
    {nombre: "Centros", ruta: "/admin/centros"},
    {nombre: "Horarios", ruta: "/admin/horarios"},
    {nombre: "Usuarios", ruta: "/admin/usuarios"}
  ]

  rutasProfesionalNavbar: {nombre: string, ruta: string} [] = [
    {nombre: "Dashboard", ruta: "/profesional/dashboard"},
    {nombre: "Mis Citas", ruta: "/profesional/mis-citas"},
    {nombre: "Mis Horarios", ruta: "/profesional/mis-horarios"}
  ]


  async cerrarSesion(){
    const confirmed = await this.confirmService.confirm(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      'Sí, cerrar sesión',
      'Cancelar',
      'info'
    );
    
    if (!confirmed) return;
    
    const nombreUsuario = this.usuariosService.getUsuarioLogueado()?.nombre || 'Usuario';
    this.usuariosService.cerrarSesion();
    this.alertService.success(`¡Hasta pronto, ${nombreUsuario}!`);
    this.router.navigate(['/']);
  }
}
