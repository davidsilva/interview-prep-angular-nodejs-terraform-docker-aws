import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyResolver implements Resolve<void> {
    constructor(private authService: AuthService) {}
    
    resolve(): Observable<void> {
        return this.authService.fetchApiKey().pipe(
        map(() => void 0) // Resolve returns void after fetching the API key
        );
    }
}