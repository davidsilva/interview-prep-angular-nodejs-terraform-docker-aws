import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { switchMap, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Avoid insane circular dependency issues by not intercepting requests to get the API key
    if (req.url === `${environment.apiBaseUrl}/get-api-key`) {
      console.warn('Skipping API key interception for fetching API key.');
      return next.handle(req);
    }

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

