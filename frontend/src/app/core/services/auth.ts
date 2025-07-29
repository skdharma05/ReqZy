import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import { TokenService } from './token';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  // Signal-based state management
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    if (this.tokenService.hasToken() && !this.tokenService.isTokenExpired()) {
      const decoded = this.tokenService.decodeToken();
      if (decoded) {
        this.currentUserSignal.set({
          id: decoded.id,
          email: decoded.email,
          roleId: decoded.roleId,
          departmentId: decoded.departmentId
        });
      }
    }
  }

  login(credentials: LoginRequest): Observable<{ token: string }> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<{ token: string }>(`${environment.apiUrl}/user/login`, credentials).pipe(
      tap(response => {
        this.tokenService.setToken(response.token);
        this.loadUserFromToken();
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  private loadUserFromToken(): void {
    const decoded = this.tokenService.decodeToken();
    if (decoded) {
      this.currentUserSignal.set({
        id: decoded.id,
        email: decoded.email,
        roleId: decoded.roleId,
        departmentId: decoded.departmentId
      });
    }
  }

  register(userData: RegisterRequest): Observable<{ message: string }> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<{ message: string }>(`${environment.apiUrl}/user/register`, userData)
      .pipe(
        tap(() => {
          this.isLoadingSignal.set(false);
        }),
        catchError(error => {
          this.isLoadingSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.roleId === 'admin') return true;
    
    // Check role-based permissions
    switch (permission) {
      case 'create_pr':
        return ['admin', 'requester', 'approver'].includes(user.roleId);
      case 'view_pr':
        return ['admin', 'requester', 'approver'].includes(user.roleId);
      case 'approve_pr':
        return ['admin', 'approver'].includes(user.roleId);
      case 'manage_users':
        return user.roleId === 'admin';
      case 'manage_departments':
        return user.roleId === 'admin';
      case 'manage_categories':
        return user.roleId === 'admin';
      case 'admin_access':
        return user.roleId === 'admin';
      default:
        return false;
    }
  }

  // Check if user has specific role
  hasRole(roleName: string): boolean {
    const user = this.currentUserSignal();
    return user?.role?.name === roleName;
  }
}
