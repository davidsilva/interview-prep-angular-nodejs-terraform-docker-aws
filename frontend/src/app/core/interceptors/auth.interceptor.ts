import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = authService.authToken;

  if (token) {
    const decodedToken = authService.decodeToken(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decodedToken.exp && decodedToken.exp <= currentTime) {
      // Token is expired.
      return from(authService.refreshAuthToken()).pipe(
        switchMap(() => {
          const newToken = authService.authToken;
          const clonedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          return next(clonedReq);
        })
      );
    }

    // Token is valid.
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedReq);
  }

  // No token found, proceed without authorization header.
  // This might be the case for public APIs or unauthenticated requests.
  return next(req);
};
