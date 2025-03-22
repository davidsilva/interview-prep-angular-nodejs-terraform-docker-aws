import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { mockUsers } from '../mocks/mock-users';
import { UsersService } from './users.service';
import { AuthService } from '../../core/services/auth.service';
import { User, UserStatus } from '@onyxdevtutorials/interview-prep-shared';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

const apiBaseUrl = environment.apiBaseUrl;
const usersPath = `${apiBaseUrl}/users`;

describe('UsersService', () => {
  let service: UsersService;
  let httpTestingController: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['fetchApiKey', 'getApiKey']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UsersService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(UsersService);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Mock the fetchApiKey method to return a dummy API key
    authService.fetchApiKey.and.returnValue(of(null));
    authService.getApiKey.and.returnValue(of('fake-api-key'));
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch users', () => {
    service.getUsers().subscribe((users) => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpTestingController.expectOne(usersPath);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should fetch a user', () => {
    service.getUser('1').subscribe((user) => {
      expect(user).toEqual(mockUsers[0]);
    });

    const req = httpTestingController.expectOne(
      `${usersPath}/1`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers[0]);
  });

  it('should update a user', () => {
    const updatedUser = {
      ...mockUsers[0],
      first_name: 'Johnathan',
    };

    service.updateUser('1', updatedUser).subscribe((user) => {
      expect(user).toEqual(updatedUser);
    });

    const req = httpTestingController.expectOne(
      `${usersPath}/1`
    );
    expect(req.request.method).toBe('PUT');
    req.flush(updatedUser);
  });

  it('should create a user', () => {
    const fixedDate = new Date('2024-10-01T00:00:00.000Z');

    const newUser: Omit<User, 'id'> = {
      first_name: 'Jerry',
      last_name: 'Doe',
      email: 'jerry.doe@xyz.com',
      status: UserStatus.ACTIVE,
      created_at: fixedDate,
      updated_at: fixedDate,
    };

    service.createUser(newUser).subscribe((user) => {
      expect(user).toEqual({
        ...newUser,
        id: 3,
        created_at: fixedDate,
        updated_at: fixedDate,
      });
    });

    const req = httpTestingController.expectOne(usersPath);
    expect(req.request.method).toBe('POST');
    req.flush({
      ...newUser,
      id: 3,
    });
  });
});
