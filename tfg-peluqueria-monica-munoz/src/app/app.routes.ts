import { Routes } from '@angular/router';
import { HomeComponent } from './cliente/components/home-component/home-component';
import { ServiciosComponent } from './cliente/components/servicios-component/servicios-component';
import { ReservarCitaComponent } from './cliente/components/reservar-cita-component/reservar-cita-component';
import { RegisterComponent } from './cliente/components/register-component/register-component';
import { LoginComponent } from './cliente/components/login-component/login-component';
import { MisCitasComponent } from './cliente/components/mis-citas-component/mis-citas-component';
import { CuentaUsuarioNotificacionesComponent } from './cliente/components/cuenta-usuario-notificaciones-component/cuenta-usuario-notificaciones-component';
import { CuentaClienteComponent } from './cliente/components/cuenta-cliente-component/cuenta-cliente-component';
import { AdminNotificacionesComponent } from './admin/components/admin-notificaciones-component/admin-notificaciones-component';
import { CitasComponent } from './admin/components/citas-component/citas-component';
import { ProfesionalesComponent } from './admin/components/profesionales-component/profesionales-component';
import { HorariosComponent } from './admin/components/horarios-component/horarios-component';
import { HorariosCrear } from './admin/components/horarios-crear/horarios-crear';
import { HorariosEditar } from './admin/components/horarios-editar/horarios-editar';
import { UsuariosComponent } from './admin/components/usuarios-component/usuarios-component';
import { DashboardComponent } from './admin/components/dashboard-component/dashboard-component';
import { ServiciosAdminComponent } from './admin/components/servicios-admin-component/servicios-admin-component';
import { ServiciosCrear } from './admin/components/servicios-crear/servicios-crear';
import { ServiciosEditar } from './admin/components/servicios-editar/servicios-editar';
import { ProfesionalesEditar } from './admin/components/profesionales-editar/profesionales-editar';
import { ProfesionalesCrear } from './admin/components/profesionales-crear/profesionales-crear';
import { CentrosComponent as CentrosAdminComponent } from './admin/components/centros-component/centros-component';
import { CentrosComponent as CentrosClienteComponent } from './cliente/components/centros-component/centros-component';
import { CentroDetallesComponent } from './cliente/components/centro-detalles-component/centro-detalles-component';
import { CentrosCrear } from './admin/components/centros-crear/centros-crear';
import { CentrosEditar } from './admin/components/centros-editar/centros-editar';
import { DashboardComponent as ProfesionalDashboardComponent } from './profesional/components/dashboard-component/dashboard-component';
import { MisCitasComponent as ProfesionalMisCitasComponent } from './profesional/components/mis-citas-component/mis-citas-component';
import { ProfesionalNotificacionesComponent } from './profesional/components/profesional-notificaciones-component/profesional-notificaciones-component';
import { PoliticaPrivacidadComponent } from './cliente/components/politica-privacidad-component/politica-privacidad-component';
import { TerminosCondicionesComponent } from './cliente/components/terminos-condiciones-component/terminos-condiciones-component';
import { CookiesComponent } from './cliente/components/cookies-component/cookies-component';
import { authGuard, adminGuard, profesionalGuard, clienteGuard } from './shared/guards/auth.guard';
import { NotFoundComponent } from './errores/not-found-component/not-found-component';
import { Error404Component } from './errores/error404-component/error404-component';
import { Error500Component } from './errores/error500-component/error500-component';
import { AccesoDenegadoComponent } from './errores/acceso-denegado-component/acceso-denegado-component';
import { HorariosProfesionalComponent } from './profesional/components/horarios-profesional-component/horarios-profesional-component';

export const routes: Routes = [
    // Rutas públicas
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'servicios', component: ServiciosComponent},
    {path: 'centros', component: CentrosClienteComponent},
    {path: 'centro-detalles/:id', component: CentroDetallesComponent},
    { path:  'iniciar-sesion', component: LoginComponent},
    { path: 'registrarse', component: RegisterComponent},
    {path: 'politica-privacidad', component: PoliticaPrivacidadComponent},
    {path: 'terminos-condiciones', component: TerminosCondicionesComponent},
    {path: 'cookies', component: CookiesComponent},
    
    // Rutas protegidas para usuarios autenticados
    { path: 'mis-citas', component: MisCitasComponent },
    { path: 'reservar-cita', component: ReservarCitaComponent },
    {path: 'notificaciones', component: CuentaUsuarioNotificacionesComponent, canActivate: [authGuard]},
    {path: 'cuenta-cliente', component: CuentaClienteComponent, canActivate: [clienteGuard]},
    
    // Rutas protegidas solo para ADMIN
    {path: 'admin/notificaciones', component: AdminNotificacionesComponent, canActivate: [adminGuard]},
    {path: 'admin/dashboard', component: DashboardComponent, canActivate: [adminGuard]},
    {path: 'admin/citas', component: CitasComponent, canActivate: [adminGuard]},
    {path: 'admin/servicios', component: ServiciosAdminComponent, canActivate: [adminGuard]},
    {path: 'admin/profesionales', component: ProfesionalesComponent, canActivate: [adminGuard]},
    {path: 'admin/profesionales/crear', component: ProfesionalesCrear, canActivate: [adminGuard]},
    {path: 'admin/profesionales/editar/:id', component: ProfesionalesEditar, canActivate: [adminGuard]},
    {path: 'admin/horarios', component: HorariosComponent, canActivate: [adminGuard]},
    {path: 'admin/horarios/crear', component: HorariosCrear, canActivate: [adminGuard]},
    {path: 'admin/horarios/editar/:id', component: HorariosEditar, canActivate: [adminGuard]},
    {path: 'admin/usuarios', component: UsuariosComponent, canActivate: [adminGuard]},
    { path: 'admin/servicios/crear', component: ServiciosCrear, canActivate: [adminGuard] },
    { path: 'admin/servicios/editar/:id', component: ServiciosEditar, canActivate: [adminGuard] },
    {path: 'admin/centros', component: CentrosAdminComponent, canActivate: [adminGuard]},
    {path: 'admin/centros/crear', component: CentrosCrear, canActivate: [adminGuard]},
    {path: 'admin/centros/editar/:id', component: CentrosEditar, canActivate: [adminGuard]},
    
    // Rutas protegidas solo para PROFESIONAL
    {path: 'profesional/dashboard', component: ProfesionalDashboardComponent, canActivate: [profesionalGuard]},
    {path: 'profesional/mis-citas', component: ProfesionalMisCitasComponent, canActivate: [profesionalGuard]},
    {path: 'profesional/notificaciones', component: ProfesionalNotificacionesComponent, canActivate: [profesionalGuard]},
    {path: 'profesional/mis-horarios', component: HorariosProfesionalComponent, canActivate: [profesionalGuard]},

    // Rutas de manejo de errores
    { path: 'error-404', component: Error404Component },
    { path: 'error-500', component: Error500Component },
    { path: 'acceso-denegado', component: AccesoDenegadoComponent },
    { path: '**', component: NotFoundComponent }  
];
