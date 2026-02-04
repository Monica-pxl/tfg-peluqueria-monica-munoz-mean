import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuariosService } from '../../services/usuarios-service';

@Component({
  selector: 'app-footer-component',
  imports: [RouterLink],
  templateUrl: './footer-component.html',
  styleUrl: './footer-component.css',
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();

  constructor(public usuariosService: UsuariosService) {}

  rutasCliente: {nombre: string, ruta: string}[] = [
    { nombre: "Inicio", ruta: "/home"},
    { nombre: "Servicios", ruta: "/servicios"},
    { nombre: "Centros", ruta: "/centros"},
    { nombre: "Reservar Cita", ruta: "/reservar-cita"},
    { nombre: "Mis Citas", ruta: "/mis-citas"},
    { nombre: "Mi Cuenta", ruta: "/cuenta-cliente"},
    { nombre: "Notificaciones", ruta: "/notificaciones"}
  ];

  rutasAdmin: {nombre: string, ruta: string}[] = [
    { nombre: "Dashboard", ruta: "/admin/dashboard"},
    { nombre: "Gestión de Citas", ruta: "/admin/citas"},
    { nombre: "Centros", ruta: "/admin/centros"},
    { nombre: "Profesionales", ruta: "/admin/profesionales"},
    { nombre: "Servicios", ruta: "/admin/servicios"},
    { nombre: "Usuarios", ruta: "/admin/usuarios"},
    { nombre: "Notificaciones", ruta: "/admin/notificaciones"}
  ];

  rutasProfesional: {nombre: string, ruta: string}[] = [
    { nombre: "Dashboard", ruta: "/profesional/dashboard"},
    { nombre: "Mis Citas", ruta: "/profesional/mis-citas"},
    {nombre: "Mis Horarios", ruta: "/profesional/mis-horarios"},
    { nombre: "Notificaciones", ruta: "/profesional/notificaciones"}
  ];
}
