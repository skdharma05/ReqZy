import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Department } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/departments`;

  // Signals for reactive state management
  private readonly _departments = signal<Department[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly departments = this._departments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  getAll(): Observable<Department[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Department[]>(`${this.apiUrl}`).pipe(
      catchError(error => {
        console.error('Error fetching departments:', error);
        this._error.set(error.error?.message || 'Failed to fetch departments');
        this._loading.set(false);
        return of([]);
      })
    );
  }

  getById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`);
  }

  create(department: Omit<Department, '_id'>): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, department);
  }

  update(id: string, department: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, department);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Load departments and update local state
   */
  loadDepartments(): void {
    this.getAll().subscribe(response => {
      this._loading.set(false);
      this._departments.set(response);
    });
  }

  /**
   * Get active departments - since there's no isActive field, return all
   */
  getActiveDepartments(): Department[] {
    return this._departments();
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Initialize service - load departments
   */
  init(): void {
    this.loadDepartments();
  }
}
