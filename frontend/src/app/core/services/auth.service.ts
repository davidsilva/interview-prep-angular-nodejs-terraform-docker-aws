import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private apiKeySubject = new BehaviorSubject<string | null>(null);
    private httpClient: HttpClient;

    constructor(private injector: Injector) {
        // Lazy inject HttpClient to avoid circular dependency
        this.httpClient = this.injector.get(HttpClient);
        this.fetchApiKey().subscribe();
    }

    public fetchApiKey(): Observable<string | null> {
        if (environment.isLocal) {
            const localApiKey = 'local-api-key';
            console.log('Using local API key:', localApiKey);
            this.apiKeySubject.next(localApiKey);
            return of(localApiKey);
        } else {
            return this.httpClient.get<{ apiKey: string }>(`${environment.apiBaseUrl}/get-api-key`).pipe(
                map(response => response.apiKey),
                tap(apiKey => {
                    console.log('API Key fetched in tap:', apiKey);
                    this.apiKeySubject.next(apiKey ?? null);
                }),
                catchError(error => {
                    console.error('Error fetching API key:', error);
                    this.apiKeySubject.next(null);
                    return of(null);
                })
            );
        }
    }

    getApiKey(): Observable<string | null> {
        return this.apiKeySubject.asObservable();
    }
}
