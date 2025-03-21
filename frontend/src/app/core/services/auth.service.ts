import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private apiKeySubject = new BehaviorSubject<string | null>(null);

    constructor(private http: HttpClient) {
        this.fetchApiKey();
    }

    public fetchApiKey(): void {
        this.http.get<{ apiKey: string }>('https://api.dev.interviewprep.onyxdevtutorials.com/v0/get-api-key').pipe(
            map(response => response.apiKey)
        ).subscribe(apiKey => {
            console.log('Fetched API Key:', apiKey);
            this.apiKeySubject.next(apiKey);
        });
    }

    getApiKey(): Observable<string | null> {
        return this.apiKeySubject.asObservable();
    }
}
