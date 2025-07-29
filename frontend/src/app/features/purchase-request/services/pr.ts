import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PurchaseRequest, CreatePRRequest, UpdatePRRequest, PRStatus } from '../../../core/models';
import { environment } from '../../../../environments/environment';

export interface PRFilter {
  status?: PRStatus;
  departmentId?: string;
  categoryId?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PrService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  // Signal for reactive state management
  private readonly prsSignal = signal<PurchaseRequest[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly prs = this.prsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Create PR
  create(prData: CreatePRRequest): Observable<PurchaseRequest> {
    this.isLoadingSignal.set(true);
    return this.http.post<PurchaseRequest>(`${this.apiUrl}/pr`, prData)
      .pipe(
        tap(newPr => {
          this.prsSignal.update(prs => [newPr, ...prs]);
          this.isLoadingSignal.set(false);
        })
      );
  }

  // Get PR by ID
  getById(id: string): Observable<PurchaseRequest> {
    return this.http.get<PurchaseRequest>(`${this.apiUrl}/pr/${id}`);
  }

  // Get PRs by user
  getByUser(userId: string): Observable<PurchaseRequest[]> {
    this.isLoadingSignal.set(true);
    return this.http.get<PurchaseRequest[]>(`${this.apiUrl}/pr/user/${userId}`)
      .pipe(
        tap(prs => {
          this.prsSignal.set(prs);
          this.isLoadingSignal.set(false);
        })
      );
  }

  // Get PRs by department
  getByDepartment(departmentId: string): Observable<PurchaseRequest[]> {
    this.isLoadingSignal.set(true);
    return this.http.get<PurchaseRequest[]>(`${this.apiUrl}/pr/department/${departmentId}`)
      .pipe(
        tap(prs => {
          this.prsSignal.set(prs);
          this.isLoadingSignal.set(false);
        })
      );
  }

  // Get all PRs with optional filters
  getAll(filters?: PRFilter): Observable<PurchaseRequest[]> {
    this.isLoadingSignal.set(true);
    
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PurchaseRequest[]>(`${this.apiUrl}/pr`, { params })
      .pipe(
        tap(prs => {
          this.prsSignal.set(prs);
          this.isLoadingSignal.set(false);
        })
      );
  }

  // Update PR
  update(id: string, updates: UpdatePRRequest): Observable<PurchaseRequest> {
    this.isLoadingSignal.set(true);
    return this.http.put<PurchaseRequest>(`${this.apiUrl}/pr/${id}`, updates)
      .pipe(
        tap(updatedPr => {
          this.prsSignal.update(prs => 
            prs.map(pr => pr.id === id ? updatedPr : pr)
          );
          this.isLoadingSignal.set(false);
        })
      );
  }

  // Change PR status
  changeStatus(id: string, status: PRStatus, comments?: string): Observable<PurchaseRequest> {
    this.isLoadingSignal.set(true);
    const payload = { status, comments };
    return this.http.patch<PurchaseRequest>(`${this.apiUrl}/pr/${id}/status`, payload)
      .pipe(
        tap(updatedPr => {
          this.prsSignal.update(prs => 
            prs.map(pr => pr.id === id ? updatedPr : pr)
          );
          this.isLoadingSignal.set(false);
        })
      );
  }

  // Delete PR (if allowed)
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pr/${id}`)
      .pipe(
        tap(() => {
          this.prsSignal.update(prs => prs.filter(pr => pr.id !== id));
        })
      );
  }

  // Helper method to refresh PRs list
  refresh(): void {
    this.getAll().subscribe();
  }
}
