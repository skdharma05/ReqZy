import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApprovalService, AuthService } from '../../../core/services';
import { PrService } from '../../purchase-request/services/pr';
import { PurchaseRequest, Approval, ApprovalStatus } from '../../../core/models';

interface ApprovalQueueItem {
  approval: Approval;
  pr: PurchaseRequest;
  daysPending: number;
  priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-approval-queue',
  template: `
    <div class="approval-queue">
      <!-- Loading state for now -->
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Approval Queue Component Loaded Successfully</p>
      </div>
    </div>
  `,
  styleUrls: ['./approval-queue.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class ApprovalQueueComponent implements OnInit {
  private readonly approvalService = inject(ApprovalService);
  private readonly authService = inject(AuthService);
  private readonly prService = inject(PrService);
  private readonly fb = inject(FormBuilder);

  // Signals for reactive state management
  private readonly _approvals = signal<ApprovalQueueItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedApprovals = signal<Set<string>>(new Set());
  private readonly _filterStatus = signal<ApprovalStatus | 'all'>('all');
  private readonly _searchTerm = signal('');
  private readonly _showBatchModal = signal(false);
  private readonly _processingBatch = signal(false);

  // Public readonly signals
  readonly approvals = this._approvals.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedApprovals = this._selectedApprovals.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly showBatchModal = this._showBatchModal.asReadonly();
  readonly processingBatch = this._processingBatch.asReadonly();

  // Computed properties
  readonly filteredApprovals = computed(() => {
    let filtered = this._approvals();
    
    // Filter by status
    if (this._filterStatus() !== 'all') {
      filtered = filtered.filter(item => item.approval.status === this._filterStatus());
    }
    
    // Filter by search term
    if (this._searchTerm()) {
      const search = this._searchTerm().toLowerCase();
      filtered = filtered.filter(item => 
        item.pr.item.toLowerCase().includes(search) ||
        item.pr.id.toLowerCase().includes(search) ||
        (item.pr.creator?.email || '').toLowerCase().includes(search)
      );
    }
    
    return filtered;
  });

  readonly statistics = computed(() => {
    const approvals = this._approvals();
    return {
      total: approvals.length,
      pending: approvals.filter(item => item.approval.status === ApprovalStatus.PENDING).length,
      highPriority: approvals.filter(item => item.priority === 'high').length,
      overdue: approvals.filter(item => item.daysPending > 7).length
    };
  });

  readonly selectedCount = computed(() => this._selectedApprovals().size);
  readonly canProcessBatch = computed(() => this.selectedCount() > 0);

  // Form for batch processing
  batchForm: FormGroup;

  constructor() {
    this.batchForm = this.fb.group({
      action: ['approve'],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.loadApprovals();
  }

  /**
   * Load approvals from the service
   */
  private loadApprovals(): void {
    this._loading.set(true);
    this._error.set(null);

    this.approvalService.getPendingApprovals().subscribe({
      next: (approvals: Approval[]) => {
        const approvalItems = approvals.map((approval: Approval) => this.createApprovalQueueItem(approval));
        this._approvals.set(approvalItems);
        this._loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading approvals:', error);
        this._error.set('Failed to load approvals. Please try again.');
        this._loading.set(false);
      }
    });
  }

  /**
   * Create approval queue item with additional metadata
   */
  private createApprovalQueueItem(approval: Approval): ApprovalQueueItem {
    const createdDate = new Date(approval.createdAt || Date.now());
    const daysPending = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (approval.pr?.totalValue && approval.pr.totalValue > 10000) {
      priority = 'high';
    } else if (daysPending > 7) {
      priority = 'high';
    } else if (daysPending > 3) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      approval,
      pr: approval.pr!,
      daysPending,
      priority
    };
  }

  /**
   * Handle individual approval
   */
  onApprove(approval: Approval, comments?: string): void {
    this._loading.set(true);
    
    this.approvalService.approveRequest(approval.prId, comments).subscribe({
      next: () => {
        this.loadApprovals();
        // Show success message
      },
      error: (error: any) => {
        console.error('Error approving request:', error);
        this._error.set('Failed to approve request. Please try again.');
        this._loading.set(false);
      }
    });
  }

  /**
   * Handle individual rejection
   */
  onReject(approval: Approval, comments: string): void {
    if (!comments.trim()) {
      this._error.set('Comments are required for rejection.');
      return;
    }

    this._loading.set(true);
    
    this.approvalService.rejectRequest(approval.prId, comments).subscribe({
      next: () => {
        this.loadApprovals();
        // Show success message
      },
      error: (error: any) => {
        console.error('Error rejecting request:', error);
        this._error.set('Failed to reject request. Please try again.');
        this._loading.set(false);
      }
    });
  }

  /**
   * Toggle approval selection
   */
  toggleApprovalSelection(approvalId: string): void {
    const selected = new Set(this._selectedApprovals());
    if (selected.has(approvalId)) {
      selected.delete(approvalId);
    } else {
      selected.add(approvalId);
    }
    this._selectedApprovals.set(selected);
  }

  /**
   * Select all visible approvals
   */
  selectAllApprovals(): void {
    const allIds = this.filteredApprovals().map(item => item.approval.id);
    this._selectedApprovals.set(new Set(allIds));
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this._selectedApprovals.set(new Set());
  }

  /**
   * Open batch processing modal
   */
  openBatchModal(): void {
    if (this.selectedCount() === 0) {
      this._error.set('Please select approvals to process.');
      return;
    }
    this._showBatchModal.set(true);
  }

  /**
   * Close batch processing modal
   */
  closeBatchModal(): void {
    this._showBatchModal.set(false);
    this.batchForm.reset({ action: 'approve', comments: '' });
  }

  /**
   * Process batch approvals/rejections
   */
  processBatchApprovals(): void {
    if (this.selectedCount() === 0) {
      this._error.set('No approvals selected.');
      return;
    }

    const formValue = this.batchForm.value;
    const action = formValue.action;
    const comments = formValue.comments;

    if (action === 'reject' && !comments?.trim()) {
      this._error.set('Comments are required for batch rejection.');
      return;
    }

    this._processingBatch.set(true);
    
    const selectedIds = Array.from(this._selectedApprovals());
    const selectedApprovals = this.filteredApprovals()
      .filter(item => selectedIds.includes(item.approval.id));

    if (action === 'approve') {
      this.approvalService.batchApprove(
        selectedApprovals.map(item => item.approval.prId), 
        comments
      ).subscribe({
        next: () => {
          this._processingBatch.set(false);
          this.closeBatchModal();
          this.clearSelection();
          this.loadApprovals();
          // Show success message
        },
        error: (error: any) => {
          console.error('Error processing batch:', error);
          this._error.set('Failed to process batch approvals. Please try again.');
          this._processingBatch.set(false);
        }
      });
    } else {
      this.approvalService.batchReject(
        selectedApprovals.map(item => item.approval.prId), 
        comments
      ).subscribe({
        next: () => {
          this._processingBatch.set(false);
          this.closeBatchModal();
          this.clearSelection();
          this.loadApprovals();
          // Show success message
        },
        error: (error: any) => {
          console.error('Error processing batch:', error);
          this._error.set('Failed to process batch approvals. Please try again.');
          this._processingBatch.set(false);
        }
      });
    }
  }

  /**
   * Update filter status
   */
  setFilterStatus(status: ApprovalStatus | 'all'): void {
    this._filterStatus.set(status);
    this.clearSelection();
  }

  /**
   * Update search term
   */
  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
    this.clearSelection();
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-medium';
    }
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: ApprovalStatus): string {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Refresh approvals
   */
  refresh(): void {
    this.loadApprovals();
  }
}
