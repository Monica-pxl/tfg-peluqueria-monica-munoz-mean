import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../../services/usuarios-service';
import { NotificacionesService } from '../../services/notificaciones-service';
import { ConfirmService } from '../../../shared/services/confirm-service';
import { AlertService } from '../../../shared/services/alert-service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-component',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {

  hayNotificacionesSinLeer = false;
  private notificacionesSubscription?: Subscription;
  private actualizacionSubscription?: Subscription;

  constructor(
    public usuariosService: UsuariosService,
    public notificacionesService: NotificacionesService,
    private router: Router,
    private confirmService: ConfirmService,
    private alertService: AlertService
  ){}

  ngOnInit(): void {
    // Verificar notificaciones al cargar
    this.verificarNotificaciones();

    // Verificar notificaciones cada 5 segundos (reducido de 30s para respuesta más rápida)
    this.notificacionesSubscription = interval(5000).subscribe(() => {
      if (this.usuariosService.comprobarLogueado()) {
        this.notificacionesService.contarNoLeidas().subscribe({
          next: (result) => {
            this.hayNotificacionesSinLeer = result.count > 0;
          },
          error: () => {
            this.hayNotificacionesSinLeer = false;
          }
        });
      } else {
        this.hayNotificacionesSinLeer = false;
      }
    });

    // Escuchar eventos de actualización de notificaciones
    this.actualizacionSubscription = this.notificacionesService.notificacionesActualizadas$.subscribe(() => {
      this.verificarNotificaciones();
    });
  }

  ngOnDestroy(): void {
    if (this.notificacionesSubscription) {
      this.notificacionesSubscription.unsubscribe();
    }
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  verificarNotificaciones(): void {
    // Solo verificar si hay usuario logueado
    if (!this.usuariosService.comprobarLogueado()) {
      this.hayNotificacionesSinLeer = false;
      return;
    }

    this.notificacionesService.contarNoLeidas().subscribe({
      next: (result) => {
        this.hayNotificacionesSinLeer = result.count > 0;
        console.log('🔔 Notificaciones sin leer:', result.count);
      },
      error: (err) => {
        console.error('Error al verificar notificaciones:', err);
        this.hayNotificacionesSinLeer = false;
      }
    });
  }

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
