import {
  Component,
  inject,
  EventEmitter,
  Output,
  Input,
  SimpleChanges,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '@onyxdevtutorials/interview-prep-shared';
import { UserStatus } from '@onyxdevtutorials/interview-prep-shared';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatLabel } from '@angular/material/form-field';
import { MatError } from '@angular/material/form-field';
import { MyErrorStateMatcher } from '../../../shared/utils/error-state-matcher';

/** Error when invalid control is dirty, touched, or submitted. */

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatCardModule,
    MatSelectModule,
    MatLabel,
    MatError,
  ],
  templateUrl: './users-form.component.html',
  styleUrl: './users-form.component.scss',
})
export class UsersFormComponent {
  @Input() user: User | null = null;
  @Input() loading: boolean = false;
  @Output() formSubmit = new EventEmitter<Omit<User, 'id'>>();

  fb = inject(NonNullableFormBuilder);

  userForm = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    status: ['', Validators.required],
  });

  userStatuses = Object.values(UserStatus);

  matcher = new MyErrorStateMatcher();

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges called with changes: ', changes);
    if (this.user) {
      this.userForm.patchValue(this.user);
    }
  }

  onSubmit(): void {
    console.log(this.userForm.value);

    if (this.userForm.valid) {
      const formValue = this.userForm.value as Omit<User, 'id'>;
      this.formSubmit.emit(formValue);
    }
  }
}
