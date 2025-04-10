// (window as any).global = window;

import { TestBed } from '@angular/core/testing';
import { Router, NavigationStart } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService, DecodedToken } from './auth.service';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RevokeTokenCommand,
  SignUpCommand,
  SignUpCommandInput,
  SignUpCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
// import * as jwtDecodeModule from 'jwt-decode';
import {
  mockLocalStorage,
  unmockLocalStorage,
} from '../../testing/local-storage-mock';
import { mockClient } from 'aws-sdk-client-mock';
import { environment } from '../../../environments/environment';

fdescribe('AuthService', () => {
  let service: AuthService;
  const cognitoMock = mockClient(CognitoIdentityProviderClient);

  beforeEach(() => {
    mockLocalStorage();

    cognitoMock.reset();

    TestBed.configureTestingModule({
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    unmockLocalStorage();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // describe('SignUp()', () => {
  //   it('should call CognitoIdentityProviderClient with SignUpCommand and succeed', async () => {
  //     cognitoMock.on(SignUpCommand).resolves({
  //       $metadata: {
  //         httpStatusCode: 200,
  //       },
  //       UserConfirmed: true,
  //       CodeDeliveryDetails: {
  //         Destination: 'test@example.com',
  //         DeliveryMedium: 'EMAIL',
  //         AttributeName: 'email',
  //       },
  //       UserSub: 'mockUserSub',
  //     });

  //     await service.signUp('test@example.com', 'password123');

  //     const calls = cognitoMock.calls();

  //     expect(calls.length).toBe(1);

  //     // const commandInput = calls[0].args[0] as SignUpCommandInput;

  //     // expect(calls[0].args[0]).toEqual({
  //     //   ClientId: environment.cognitoClientId,
  //     //   Username: 'test@example.com',
  //     //   Password: 'password123',
  //     // });
  //   });
  // });

  // describe('confirmSignUp()', () => {});

  // describe('SignIn()', () => {});

  // describe('signOut()', () => {});

  // describe('refreshAuthToken()', () => {});

  // describe('restoreSession()', () => {});

  // describe('decodeToken()', () => {});
});
