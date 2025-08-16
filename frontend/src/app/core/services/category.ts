import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  // Signals for reactive state management
  private readonly _categories = signal<Category[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  getAll(): Observable<Category[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Category[]>(`${this.apiUrl}`).pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        this._error.set(error.error?.message || 'Failed to fetch categories');
        this._loading.set(false);
        return of([]);
      })
    );
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  create(category: Omit<Category, '_id'>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  update(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Load categories and update local state
   */
  loadCategories(): void {
    this.getAll().subscribe(response => {
      this._loading.set(false);
      this._categories.set(response);
    });
  }


  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Initialize service - load categories
   */
  init(): void {
    this.loadCategories();
  }
}
