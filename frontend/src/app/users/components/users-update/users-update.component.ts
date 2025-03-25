import { Component, inject, OnInit, input } from '@angular/core';
import { UsersFormComponent } from '../users-form/users-form.component';
import { UsersService } from '../../services/users.service';
import { User } from '@onyxdevtutorials/interview-prep-shared';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-users-update',
  standalone: true,
  imports: [UsersFormComponent],
  templateUrl: './users-update.component.html',
  styleUrl: './users-update.component.scss',
})
export class UsersUpdateComponent implements OnInit {
  usersService = inject(UsersService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  userId = input.required<string>();

  userData: User | null = null;
  loading = true;

  handleFormSubmit(formData: Omit<User, 'id'>): void {
    console.log(formData);
    if (this.userData) {
      const userToUpdate = { ...formData, version: this.userData.version } as User;
      this.usersService.updateUser(this.userId(), userToUpdate).subscribe({
        next: (user) => {
          console.log('User updated:', user);
          this.router.navigate(['/users']);
        },
        error: (error) => {
          const errorMessage = (error as Error).message;
          console.error('Error updating user:', error);
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
          });
        },
        complete: () => console.log('User update complete'),
      });
    }
  }

  ngOnInit(): void {
    this.usersService.getUser(this.userId()).subscribe({
      next: (user) => {
        console.log('users-update component User:', user);
        this.userData = user;
        this.loading = false;
      },
      error: (error) => {
        const errorMessage = (error as Error).message;
        console.error('Error getting user:', error);
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000
        });
        this.loading = false;
      },
      complete: () => console.log('User retrieval complete'),
    });
  }
}
