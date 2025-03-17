import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './core/components/nav/nav.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'interview-prep';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.fetchApiKey().subscribe({
      next: apiKey => console.log(`Fetched API key: ${apiKey}`),
      error: error => console.error(`Failed to fetch API key: ${error}`),
    });
  }
}
