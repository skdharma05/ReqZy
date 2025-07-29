import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models';
import { environment } from '../../../environments/environment';

export interface CreateUserRequest {
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
  isSuperUser?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  roleId?: string;
  departmentId?: string;
  isSuperUser?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  departmentId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  // Signal-based state management
  private readonly usersSignal = signal<User[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly totalUsersSignal = signal<number>(0);
  private readonly currentPageSignal = signal<number>(1);

  // Public readonly signals
  readonly users = this.usersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly totalUsers = this.totalUsersSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();

  // Legacy methods for backward compatibility
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  update(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // New enhanced methods with signal-based state management

  // Get all users with filtering and pagination
  getUsers(filters: UserFilters = {}): Observable<UsersResponse> {
    this.isLoadingSignal.set(true);

    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.roleId) params = params.set('roleId', filters.roleId);
    if (filters.departmentId) params = params.set('departmentId', filters.departmentId);

    return this.http.get<UsersResponse>(`${this.apiUrl}/users`, { params }).pipe(
      tap(response => {
        this.usersSignal.set(response.users);
        this.totalUsersSignal.set(response.pagination.total);
        this.currentPageSignal.set(response.pagination.page);
        this.isLoadingSignal.set(false);
      })
    );
  }

  // Get user by ID (enhanced)
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  // Create new user
  createUser(userData: CreateUserRequest): Observable<{ message: string; user: User }> {
    this.isLoadingSignal.set(true);
    
    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/users`, userData).pipe(
      tap(response => {
        // Add the new user to the current list
        this.usersSignal.update(users => [response.user, ...users]);
        this.totalUsersSignal.update(total => total + 1);
        this.isLoadingSignal.set(false);
      })
    );
  }

  // Update user (enhanced)
  updateUser(id: string, userData: UpdateUserRequest): Observable<{ message: string; user: User }> {
    this.isLoadingSignal.set(true);
    
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${id}`, userData).pipe(
      tap(response => {
        // Update the user in the current list
        this.usersSignal.update(users => 
          users.map(user => user.id === id ? response.user : user)
        );
        this.isLoadingSignal.set(false);
      })
    );
  }

  // Delete user (enhanced)
  deleteUser(id: string): Observable<{ message: string }> {
    this.isLoadingSignal.set(true);
    
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`).pipe(
      tap(() => {
        // Remove the user from the current list
        this.usersSignal.update(users => users.filter(user => user.id !== id));
        this.totalUsersSignal.update(total => Math.max(0, total - 1));
        this.isLoadingSignal.set(false);
      })
    );
  }

  // Reset user password
  resetUserPassword(id: string, passwordData: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/${id}/reset-password`, passwordData);
  }

  // Refresh users list
  refreshUsers(filters: UserFilters = {}): void {
    this.getUsers(filters).subscribe();
  }

  // Clear users state
  clearUsers(): void {
    this.usersSignal.set([]);
    this.totalUsersSignal.set(0);
    this.currentPageSignal.set(1);
    this.isLoadingSignal.set(false);
  }
}
