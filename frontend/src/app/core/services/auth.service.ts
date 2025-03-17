import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private apiKey: string | null = null;

    constructor(private http: HttpClient) {}

    fetchApiKey(): Observable<string> {
        return this.http.get<{ apiKey: string }>('/get-api-key').pipe(
            map(response => {
                this.apiKey = response.apiKey;
                return response.apiKey;
            })
        );
    }

    getApiKey(): string | null {
        return this.apiKey;
    }
}
