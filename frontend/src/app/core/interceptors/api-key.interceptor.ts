import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { switchMap, take } from 'rxjs/operators';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.authService.getApiKey().pipe(
        take(1),
        switchMap(apiKey => {
          if (apiKey !== null) {
              const cloned = req.clone({
                  headers: req.headers.set('x-api-key', apiKey)
              });
              return next.handle(cloned);
          } else {
            console.warn('No API key found, request will be sent without it.');
            return next.handle(req);
          }
        })
    );
  }
}

