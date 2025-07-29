import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Approval, ApprovalStatus, CreateApprovalRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/approval`;

  // Signals for reactive state management
  private readonly _approvals = signal<Approval[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly approvals = this._approvals.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Get pending approvals for current user
   */
  getPendingApprovals(): Observable<Approval[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<{
      success: boolean;
      data: Approval[];
      message?: string;
    }>(`${this.apiUrl}/pending`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching pending approvals:', error);
        this._error.set(error.error?.message || 'Failed to fetch pending approvals');
        this._loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get all approvals with filtering
   */
  getAllApprovals(filters?: {
    status?: ApprovalStatus;
    departmentId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Observable<Approval[]> {
    this._loading.set(true);
    this._error.set(null);

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return this.http.get<{
      success: boolean;
      data: Approval[];
      message?: string;
    }>(`${this.apiUrl}?${params.toString()}`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching approvals:', error);
        this._error.set(error.error?.message || 'Failed to fetch approvals');
        this._loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get approval by ID
   */
  getApprovalById(id: string): Observable<Approval | null> {
    return this.http.get<{
      success: boolean;
      data: Approval;
      message?: string;
    }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Error fetching approval:', error);
        return of(null);
      })
    );
  }

  /**
   * Approve a purchase request
   */
  approveRequest(prId: string, comments?: string): Observable<Approval> {
    this._loading.set(true);
    this._error.set(null);

    const payload = {
      status: ApprovalStatus.APPROVED,
      comments: comments || ''
    };

    return this.http.post<{
      success: boolean;
      data: Approval;
      message?: string;
    }>(`${this.apiUrl}/${prId}/approve`, payload).pipe(
      map(response => {
        this._loading.set(false);
        return response.data;
      }),
      catchError(error => {
        console.error('Error approving request:', error);
        this._error.set(error.error?.message || 'Failed to approve request');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Reject a purchase request
   */
  rejectRequest(prId: string, comments: string): Observable<Approval> {
    this._loading.set(true);
    this._error.set(null);

    const payload = {
      status: ApprovalStatus.REJECTED,
      comments
    };

    return this.http.post<{
      success: boolean;
      data: Approval;
      message?: string;
    }>(`${this.apiUrl}/${prId}/reject`, payload).pipe(
      map(response => {
        this._loading.set(false);
        return response.data;
      }),
      catchError(error => {
        console.error('Error rejecting request:', error);
        this._error.set(error.error?.message || 'Failed to reject request');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Create new approval
   */
  createApproval(approvalData: CreateApprovalRequest): Observable<Approval> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<{
      success: boolean;
      data: Approval;
      message?: string;
    }>(`${this.apiUrl}`, approvalData).pipe(
      map(response => {
        this._loading.set(false);
        return response.data;
      }),
      catchError(error => {
        console.error('Error creating approval:', error);
        this._error.set(error.error?.message || 'Failed to create approval');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Update approval
   */
  updateApproval(id: string, updates: Partial<Approval>): Observable<Approval> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<{
      success: boolean;
      data: Approval;
      message?: string;
    }>(`${this.apiUrl}/${id}`, updates).pipe(
      map(response => {
        this._loading.set(false);
        return response.data;
      }),
      catchError(error => {
        console.error('Error updating approval:', error);
        this._error.set(error.error?.message || 'Failed to update approval');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Get approval history for a PR
   */
  getApprovalHistory(prId: string): Observable<Approval[]> {
    return this.http.get<{
      success: boolean;
      data: Approval[];
      message?: string;
    }>(`${this.apiUrl}/history/${prId}`).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching approval history:', error);
        return of([]);
      })
    );
  }

  /**
   * Batch approve multiple requests
   */
  batchApprove(prIds: string[], comments?: string): Observable<Approval[]> {
    this._loading.set(true);
    this._error.set(null);

    const payload = {
      prIds,
      status: ApprovalStatus.APPROVED,
      comments: comments || ''
    };

    return this.http.post<{
      success: boolean;
      data: Approval[];
      message?: string;
    }>(`${this.apiUrl}/batch/approve`, payload).pipe(
      map(response => {
        this._loading.set(false);
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error batch approving:', error);
        this._error.set(error.error?.message || 'Failed to batch approve requests');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Batch reject multiple requests
   */
  batchReject(prIds: string[], comments: string): Observable<Approval[]> {
    this._loading.set(true);
    this._error.set(null);

    const payload = {
      prIds,
      status: ApprovalStatus.REJECTED,
      comments
    };

    return this.http.post<{
      success: boolean;
      data: Approval[];
      message?: string;
    }>(`${this.apiUrl}/batch/reject`, payload).pipe(
      map(response => {
        this._loading.set(false);
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error batch rejecting:', error);
        this._error.set(error.error?.message || 'Failed to batch reject requests');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Load approvals and update local state
   */
  loadApprovals(filters?: any): void {
    this.getAllApprovals(filters).subscribe(approvals => {
      this._approvals.set(approvals);
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
}
