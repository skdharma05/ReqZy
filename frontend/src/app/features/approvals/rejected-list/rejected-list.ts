import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '../../../core/services/approval';
import { PrService } from '../../purchase-request/services/pr';
import { AuthService } from '../../../core/services/auth';
import { ApprovalStatus } from '../../../core/models';

interface RejectedRequest {
  id: string;
  item: string;
  quantity: number;
  amount: number;
  status: string;
  rejectedAt: Date;
  rejectedBy: string;
  requester: string;
  department: string;
  rejectionReason: string;
}

@Component({
  selector: 'app-rejected-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rejected-list.html',
  styleUrl: './rejected-list.scss'
})
export class RejectedListComponent implements OnInit {
  private readonly approvalService = inject(ApprovalService);
  private readonly prService = inject(PrService);
  private readonly authService = inject(AuthService);

  readonly rejectedRequests = signal<RejectedRequest[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly pageSize = 10;

  // Filters
  readonly selectedDepartment = signal<string>('');
  readonly selectedDateRange = signal<string>('');
  readonly sortBy = signal<string>('rejectedAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  ngOnInit(): void {
    this.loadRejectedRequests();
  }

  async loadRejectedRequests(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Get all rejected approvals
      this.approvalService.getAllApprovals({ status: ApprovalStatus.REJECTED }).subscribe({
        next: async (approvals) => {
          const rejectedRequests: RejectedRequest[] = [];
          
          for (const approval of approvals) {
            try {
              // Get PR details for each rejected item
              this.prService.getById(approval.prId).subscribe({
                next: (pr) => {
                  if (pr) {
                    rejectedRequests.push({
                      id: pr.id,
                      item: pr.item,
                      quantity: pr.quantity,
                      amount: pr.totalValue,
                      status: pr.status,
                      rejectedAt: approval.approvedAt ? new Date(approval.approvedAt) : new Date(),
                      rejectedBy: approval.approver?.email || 'Unknown',
                      requester: pr.creator?.email || 'Unknown',
                      department: pr.department?.name || 'Unknown',
                      rejectionReason: approval.comments || 'No reason provided'
                    });
                  }
                },
                error: (error) => {
                  console.warn('Failed to load PR details for rejection:', error);
                }
              });
            } catch (error) {
              console.warn('Failed to process rejection:', error);
            }
          }

          // Wait a bit for all subscriptions to complete, then apply filters
          setTimeout(() => {
            this.rejectedRequests.set(this.applyFiltersAndSort(rejectedRequests));
          }, 1000);
        },
        error: (error) => {
          console.error('Failed to load rejected requests:', error);
        }
      });
    } catch (error) {
      console.error('Failed to load rejected requests:', error);
    } finally {
      setTimeout(() => {
        this.isLoading.set(false);
      }, 1000);
    }
  }

  private applyFiltersAndSort(requests: RejectedRequest[]): RejectedRequest[] {
    let filtered = [...requests];

    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(req => 
        req.item.toLowerCase().includes(search) ||
        req.requester.toLowerCase().includes(search) ||
        req.department.toLowerCase().includes(search) ||
        req.rejectionReason.toLowerCase().includes(search)
      );
    }

    // Apply department filter
    const dept = this.selectedDepartment();
    if (dept) {
      filtered = filtered.filter(req => req.department === dept);
    }

    // Apply date range filter
    const dateRange = this.selectedDateRange();
    if (dateRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(req => req.rejectedAt >= startDate);
    }

    // Apply sorting
    const sortBy = this.sortBy();
    const order = this.sortOrder();
    
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'item':
          aVal = a.item.toLowerCase();
          bVal = b.item.toLowerCase();
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'rejectedAt':
        default:
          aVal = a.rejectedAt.getTime();
          bVal = b.rejectedAt.getTime();
      }
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilters();
  }

  onDepartmentChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDepartment.set(target.value);
    this.applyFilters();
  }

  onDateRangeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDateRange.set(target.value);
    this.applyFilters();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value);
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    this.applyFilters();
  }

  private applyFilters(): void {
    const original = this.rejectedRequests();
    this.rejectedRequests.set(this.applyFiltersAndSort(original));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  refreshData(): void {
    this.loadRejectedRequests();
  }

  getTotalRejectedAmount(): number {
    return this.rejectedRequests().reduce((total, request) => total + request.amount, 0);
  }
}
