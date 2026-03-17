import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UsuariosService } from '../../cliente/services/usuarios-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const usuariosService = inject(UsuariosService);
  const token = usuariosService.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
