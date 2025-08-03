import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PrService } from '../services/pr';
import { AuthService } from '../../../core/services/auth';
import { PurchaseRequest, PRStatus } from '../../../core/models';

@Component({
  selector: 'app-pr-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './pr-detail.html',
  styleUrl: './pr-detail.scss'
})
export class PrDetailComponent implements OnInit {
  private readonly prService = inject(PrService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pr = signal<PurchaseRequest | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly currentUser = this.authService.currentUser;

  readonly PRStatus = PRStatus; // For template use

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const prId = params['id'];
      if (prId) {
        this.loadPrDetail(prId);
      } else {
        this.error.set('No PR ID provided');
        this.isLoading.set(false);
      }
    });
  }

  private loadPrDetail(prId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.prService.getById(prId).subscribe({
      next: (pr) => {
        if (pr) {
          this.pr.set(pr);
        } else {
          this.error.set('Purchase request not found');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading PR details:', error);
        this.error.set('Failed to load purchase request details');
        this.isLoading.set(false);
      }
    });
  }

  canEdit(): boolean {
    const pr = this.pr();
    const user = this.currentUser();
    return !!(pr && user && pr.createdBy === user.id && pr.status === PRStatus.DRAFT);
  }

  canApprove(): boolean {
    const pr = this.pr();
    const user = this.currentUser();
    return !!(pr && user && pr.status === PRStatus.PENDING && this.authService.hasPermission('approve_pr'));
  }

  onEdit(): void {
    const pr = this.pr();
    if (pr) {
      this.router.navigate(['/purchase-requests', pr.id, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/purchase-requests']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  calculateUnitPrice(): number {
    const pr = this.pr();
    if (pr && pr.quantity > 0) {
      return pr.totalValue / pr.quantity;
    }
    return 0;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: PRStatus): string {
    switch (status) {
      case PRStatus.DRAFT: return 'status-draft';
      case PRStatus.PENDING: return 'status-pending';
      case PRStatus.APPROVED: return 'status-approved';
      case PRStatus.REJECTED: return 'status-rejected';
      default: return '';
    }
  }
}
