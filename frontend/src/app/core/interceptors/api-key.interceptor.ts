import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const apiKey = this.authService.getApiKey();
    console.log('API Key from interceptor:', apiKey);
    if (apiKey) {
        const cloned = req.clone({
            headers: req.headers.set('x-api-key', apiKey)
        });
        return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }
}

