import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrService } from '../../purchase-request/services/pr';
import { AuthService } from '../../../core/services/auth';
import { PurchaseRequest, PRStatus } from '../../../core/models';

@Component({
  selector: 'app-approval-queue',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './approval-queue.html',
  styleUrl: './approval-queue.scss'
})
export class ApprovalQueueComponent implements OnInit {
  private readonly prService = inject(PrService);
  private readonly authService = inject(AuthService);

  readonly pendingRequests = signal<PurchaseRequest[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.isLoading.set(true);
    
    // Load pending PRs using authorized endpoint
    this.prService.getAuthorized({ status: PRStatus.PENDING }).subscribe({
      next: (prs) => {
        this.pendingRequests.set(prs);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load pending requests:', error);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  filteredRequests(): PurchaseRequest[] {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.pendingRequests();
    
    return this.pendingRequests().filter(pr => 
      pr.item.toLowerCase().includes(search) ||
      pr.id.toLowerCase().includes(search) ||
      (pr.creator?.email || '').toLowerCase().includes(search)
    );
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  refreshData(): void {
    this.loadPendingRequests();
  }

  refresh(): void {
    this.refreshData();
  }
}
