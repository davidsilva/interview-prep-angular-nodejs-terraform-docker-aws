import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RevokeTokenCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DecodedToken {
  sub: string; // User's unique identifier
  email?: string; // User's email address (optional)
  'cognito:groups'?: string[]; // Groups the user belongs to (optional)
  exp?: number; // Expiration time (optional)
  iat?: number; // Issued-at time (optional)
  auth_time?: number; // Authentication time (optional)
  [key: string]: any; // Allow additional claims
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isSignedInSubject = new BehaviorSubject<boolean>(false);
  private userGroupsSubject = new BehaviorSubject<string[]>([]);
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  private token: string | null = null;

  private client: CognitoIdentityProviderClient;

  constructor(private router: Router) {
    this.client = new CognitoIdentityProviderClient({
      region: 'us-east-1', // Replace with your AWS region
    });

    this.restoreSession();

    // Listen for navigation events.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.checkAndRefreshToken();
      }
    });
  }

  get isSignedIn$(): Observable<boolean> {
    return this.isSignedInSubject.asObservable();
  }
  get userGroups$(): Observable<string[]> {
    return this.userGroupsSubject.asObservable();
  }
  get isAdmin$(): Observable<boolean> {
    return this.isAdminSubject.asObservable();
  }

  get authToken(): string | null {
    return this.token;
  }

  async signUp(email: string, password: string): Promise<void> {
    const command = new SignUpCommand({
      ClientId: environment.cognitoClientId,
      Username: email,
      Password: password,
    });

    try {
      const response = await this.client.send(command);

      if (response && response.UserConfirmed) {
        console.log(
          'User successfully signed up and confirmed: ',
          response.UserSub
        );
        // Could redirect to home page.
      } else {
        console.log(
          'User signed up but needs confirmation: ',
          response.CodeDeliveryDetails
        );
        // Could redirect to sign-up confirmation page.
      }
    } catch (error) {
      console.error('Error signing up:', error);

      if (!(error instanceof Error)) {
        throw new Error('An unknown error occurred during sign up.');
      }

      // Handle specific exceptions.
      // Will set up error handler and UI for these.
      switch (error.name) {
        case 'UsernameExistsException':
          throw new Error('This username already exists. Try another.');
        case 'InvalidPasswordException':
          throw new Error('Password does not meet requirements.');
        default:
          throw error;
      }
    }
  }

  async confirmSignUp(
    email: string,
    confirmationCode: string,
    autoSignIn: boolean,
    password?: string
  ): Promise<void> {
    // Use ConfirmSignUpCommand
    const command = new ConfirmSignUpCommand({
      ClientId: environment.cognitoClientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    try {
      const response = await this.client.send(command);
      console.log('Confirmation successful:', response);

      if (autoSignIn && password) {
        // Automatically sign in after confirmation
        await this.signIn(email, password);
      }
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: environment.cognitoClientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    try {
      const response = await this.client.send(command);
      console.log('Sign in successful:', response);
      if (response && response.AuthenticationResult?.IdToken) {
        this.token = response.AuthenticationResult.IdToken;
        const refreshToken = response.AuthenticationResult.RefreshToken;

        localStorage.setItem('authToken', this.token);

        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      const command = new RevokeTokenCommand({
        Token: refreshToken,
        ClientId: environment.cognitoClientId,
      });

      try {
        await this.client.send(command);
        console.log('Refresh token revoked successfully.');
      } catch (error) {
        console.error('Error revoking token: ', error);
      }
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    this.token = null;
    this.isSignedInSubject.next(false);
    this.userGroupsSubject.next([]);
    this.isAdminSubject.next(false);
  }

  async refreshAuthToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token found. User must sign in again');
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: environment.cognitoClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    try {
      const response = await this.client.send(command);
      if (response.AuthenticationResult?.IdToken) {
        this.token = response.AuthenticationResult.IdToken;
        localStorage.setItem('authToken', this.token);
        console.log('Token refreshed successfully.');
      }
    } catch (error) {
      console.error('Error refreshing token: ', error);
      throw error;
    }
  }

  private scheduleTokenRefresh(decodedToken: DecodedToken): void {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (decodedToken.exp || 0) - currentTime;

    if (timeUntilExpiry > 0) {
      const refreshTime = (timeUntilExpiry - 300) * 1000; // Convert to milliseconds
      setTimeout(() => {
        this.refreshAuthToken().catch((error) => {
          console.error('Error refreshing token: ', error);
        });
      }, refreshTime);
    }
  }

  private async checkAndRefreshToken(): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000);
    const storedToken = this.token;

    if (storedToken) {
      const decodedToken = this.decodeToken(storedToken);

      if (decodedToken.exp && decodedToken.exp <= currentTime) {
        console.warn('Token expired during navigation. Refreshing...');
        try {
          await this.refreshAuthToken();
          console.log('Token refreshed successfully during navigation.');
        } catch (error) {
          console.error('Error refreshing token during navigation.');
        }
      }
    }
  }

  // Should be called whenever app loads
  private async restoreSession(): Promise<void> {
    const storedToken = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (storedToken) {
      try {
        this.token = storedToken;
        const decodedToken = this.decodeToken(storedToken);

        // Check if the token is expired.
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp > currentTime) {
          console.log('Token is valid: ', decodedToken);
          this.scheduleTokenRefresh(decodedToken);
          this.isSignedInSubject.next(true);
          this.userGroupsSubject.next(decodedToken['cognito:groups'] || []);
          this.isAdminSubject.next(
            decodedToken['cognito:groups']?.includes('Admin') || false
          );
          console.log('Session restored successfully: ', decodedToken);
          return;
        } else {
          console.warn('Token is expired, refreshing...', decodedToken);
          if (refreshToken) {
            try {
              await this.refreshAuthToken();
              console.log(
                'Token refreshed successfully during session restore.'
              );
              return;
            } catch (refreshError) {
              console.error(
                'Error refreshing token during session restore: ',
                refreshError
              );
            }
          }
        }
      } catch (error) {
        console.error('Error decoding token during session restore: ', error);
      }
    }

    // Clear session if no valid token or refreshToken exists.
    console.warn('No valid session found. Clearing session.');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    this.token = null;
    this.isSignedInSubject.next(false);
    this.userGroupsSubject.next([]);
    this.isAdminSubject.next(false);
  }

  public decodeToken(token: string): DecodedToken {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token');
    }
  }
}
