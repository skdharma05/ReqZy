import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  
  readonly currentUser = this.authService.currentUser;
  readonly isMenuOpen = signal(false);
  readonly isProfileDropdownOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const profileDropdown = target.closest('.profile-dropdown');
    
    if (!profileDropdown && this.isProfileDropdownOpen()) {
      this.isProfileDropdownOpen.set(false);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen.update(value => !value);
  }

  logout(): void {
    this.authService.logout();
    this.isProfileDropdownOpen.set(false);
  }

  closeDropdowns(): void {
    this.isProfileDropdownOpen.set(false);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }
}
