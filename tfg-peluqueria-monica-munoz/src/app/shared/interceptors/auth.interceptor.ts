import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { UsuariosService } from '../../cliente/services/usuarios-service';
import { AlertService } from '../services/alert-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const usuariosService = inject(UsuariosService);
  const alertService = inject(AlertService);
  const router = inject(Router);
  const token = usuariosService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        usuariosService.cerrarSesion();
        alertService.warning('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        router.navigate(['/iniciar-sesion']);
      }
      return throwError(() => error);
    })
  );
};
