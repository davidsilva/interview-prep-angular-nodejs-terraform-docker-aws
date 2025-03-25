import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { MockUsersService } from '../../mocks/mock-users.service';
import { UsersService } from '../../services/users.service';
import { UsersUpdateComponent } from './users-update.component';
import { routes } from '../../../app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { User, UserStatus } from '@onyxdevtutorials/interview-prep-shared';
import { mockUsers } from '../../mocks/mock-users';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('UsersUpdateComponent', () => {
  let component: UsersUpdateComponent;
  let fixture: ComponentFixture<UsersUpdateComponent>;
  let mockUsersService: MockUsersService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersUpdateComponent, BrowserAnimationsModule, MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideRouter(routes),
        { provide: UsersService, useClass: MockUsersService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersUpdateComponent);

    // One method of setting the productId input. The other is the TestHost method.
    fixture.componentRef.setInput('userId', '1');

    component = fixture.componentInstance;
    mockUsersService = TestBed.inject(
      UsersService
    ) as unknown as MockUsersService;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject UsersService and MatSnackBar', () => {
    expect(component.usersService).toBeDefined();
    expect(component.snackBar).toBeDefined();
  });

  it('should call updateUser on UsersService when handleFormSubmit is called', () => {
    const formData = {
      first_name: 'Jerry',
      last_name: 'Doe',
      email: 'jerry.doe@xyz.com',
      status: UserStatus.ACTIVE,
    } as Omit<User, 'id'>;

    const mockUser = mockUsers[0];

    spyOn(mockUsersService, 'getUser').and.returnValue(of(mockUser));

    component.ngOnInit();
    expect(component.userData).toEqual(mockUser);

    spyOn(mockUsersService, 'updateUser').and.returnValue(of({
      ...formData,
      id: 1,
      version: 2,
    }));

    component.handleFormSubmit(formData);

    expect(mockUsersService.updateUser).toHaveBeenCalledWith('1', {
      ...formData,
      version: 1,
    });
  });

  it('should navigate to /users after successful update', () => {
    const formData = {
      first_name: 'Jerry',
      last_name: 'Doe',
      email: 'jerry.doe@xyz.com',
      status: UserStatus.ACTIVE,
    } as Omit<User, 'id'>;

    const mockUser = mockUsers[0];

    spyOn(mockUsersService, 'getUser').and.returnValue(of(mockUser));

    component.ngOnInit();
    expect(component.userData).toEqual(mockUser);

    spyOn(mockUsersService, 'updateUser').and.returnValue(
      of({
        ...formData,
        id: 1,
        version: 2,
      })
    );

    spyOn(router, 'navigate');

    component.handleFormSubmit(formData);

    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('should log an error and display error in MatSnackBar if updateUser fails', () => {
    const formData = {
      first_name: 'Jerry',
      last_name: 'Doe',
      email: 'jerry.doe@xyz.com',
      status: UserStatus.ACTIVE,
    } as Omit<User, 'id'>;

    const mockUser = mockUsers[0];

    spyOn(mockUsersService, 'getUser').and.returnValue(of(mockUser));

    component.ngOnInit();
    expect(component.userData).toEqual(mockUser);

    spyOn(mockUsersService, 'updateUser').and.returnValue(
      throwError(() => new Error('Simulated network error'))
    );
    spyOn(component.snackBar, 'open');
    spyOn(console, 'error');

    component.handleFormSubmit(formData);

    expect(console.error).toHaveBeenCalledWith(
      'Error updating user:',
      new Error('Simulated network error')
    );

    expect(component.snackBar.open).toHaveBeenCalledWith(
      'Simulated network error',
      'Close',
      { duration: 5000 }
    );
  });

  it('should set userData on init', () => {
    spyOn(mockUsersService, 'getUser').and.returnValue(of(mockUsers[0]));

    component.ngOnInit();

    expect(component.userData).toEqual(mockUsers[0]);
  });

  it('should log an error if getUser fails', () => {
    spyOn(mockUsersService, 'getUser').and.returnValue(
      throwError(() => new Error('Simulated network error'))
    );

    spyOn(component.snackBar, 'open');
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith(
      'Error getting user:',
      new Error('Simulated network error')
    );

    expect(component.snackBar.open).toHaveBeenCalledWith(
      'Simulated network error',
      'Close',
      { duration: 5000 }
    );
  });
});
