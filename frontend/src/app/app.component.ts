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
export class AppComponent implements OnInit {
  title = 'interview-prep';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    console.log('AppComponent initialized');
    this.authService.getApiKey().subscribe(apiKey => {
      console.log('API Key:', apiKey);
    });
  }
}
