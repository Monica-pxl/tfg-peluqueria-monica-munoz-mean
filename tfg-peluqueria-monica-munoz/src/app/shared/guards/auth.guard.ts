import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UsuariosService } from '../../cliente/services/usuarios-service';

export const authGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);
  
  const usuario = usuariosService.getUsuarioLogueado();
  
  if (!usuario) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }
  
  return true;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);
  
  const usuario = usuariosService.getUsuarioLogueado();
  
  if (!usuario) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }
  
  if (usuario.rol !== 'administrador') {
    router.navigate(['/acceso-denegado']);
    return false;
  }
  
  return true;
};

export const profesionalGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);
  
  const usuario = usuariosService.getUsuarioLogueado();
  
  if (!usuario) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }
  
  if (usuario.rol !== 'profesional') {
    router.navigate(['/acceso-denegado']);
    return false;
  }
  
  return true;
};

export const clienteGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);
  
  const usuario = usuariosService.getUsuarioLogueado();
  
  if (!usuario) {
    router.navigate(['/iniciar-sesion']);
    return false;
  }
  
  if (usuario.rol !== 'cliente') {
    router.navigate(['/acceso-denegado']);
    return false;
  }
  
  return true;
};
