import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthErrorHandlerService {
  constructor() {}

  handleError(error: Error): Observable<never> {
    let errorMessage = 'An unknown authentication error occurred.';

    switch (error.name) {
      case 'UsernameExistsException':
        errorMessage =
          'The username already exists. Please choose a different username.';
        break;
      case 'InvalidPasswordException':
        errorMessage = 'The password does not meet the required criteria.';
        break;
      default:
        errorMessage = `An error occurred: ${error.message}`;
        break;
    }

    console.error('Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return throwError(() => new Error(errorMessage));
  }
}
