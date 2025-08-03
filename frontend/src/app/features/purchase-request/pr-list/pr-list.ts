import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PrService, PRFilter } from '../services/pr';
import { AuthService } from '../../../core/services/auth';
import { CategoryService } from '../../../core/services/category';
import { DepartmentService } from '../../../core/services/department';
import { UserService } from '../../../core/services/user';
import { PurchaseRequest, PRStatus, Category, Department } from '../../../core/models';

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-pr-list',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './pr-list.html',
  styleUrl: './pr-list.scss'
})
export class PrListComponent implements OnInit {
  private readonly prService = inject(PrService);
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly departmentService = inject(DepartmentService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals for reactive state
  readonly isLoading = this.prService.isLoading;
  readonly currentUser = this.authService.currentUser;
  readonly isMyRequestsView = signal<boolean>(false);
  
  // Local state signals
  readonly categories = signal<Category[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly users = signal<any[]>([]);
  readonly showAdvancedFilters = signal<boolean>(false);
  
  // Filter state signals
  readonly filterStatus = signal<PRStatus | 'all'>('all');
  readonly searchTerm = signal<string>('');
  readonly sortBy = signal<SortOption>({ field: 'createdAt', direction: 'desc' });

  // Basic filter controls
  readonly statusFilter = new FormControl<PRStatus | 'all'>('all');
  readonly searchControl = new FormControl<string>('');
  readonly sortByControl = new FormControl<string>('createdAt-desc');

  // Advanced filter controls
  readonly departmentFilter = new FormControl<string>('all');
  readonly categoryFilter = new FormControl<string>('all');
  readonly createdByFilter = new FormControl<string>('all');
  readonly minValueControl = new FormControl<number | null>(null);
  readonly maxValueControl = new FormControl<number | null>(null);
  readonly dateFromControl = new FormControl<string>('');
  readonly dateToControl = new FormControl<string>('');

  // Computed active filters count
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.statusFilter.value !== 'all') count++;
    if (this.searchControl.value) count++;
    if (this.departmentFilter.value !== 'all') count++;
    if (this.categoryFilter.value !== 'all') count++;
    if (this.createdByFilter.value !== 'all') count++;
    if (this.minValueControl.value !== null) count++;
    if (this.maxValueControl.value !== null) count++;
    if (this.dateFromControl.value) count++;
    if (this.dateToControl.value) count++;
    return count;
  });

  // Computed filtered and sorted PRs
  readonly filteredPrs = computed(() => {
    let prs = this.prService.prs();
    
    // Apply filters
    prs = this.applyAllFilters(prs);
    
    // Apply sorting
    prs = this.applySorting(prs);
    
    return prs;
  });

  // Computed statistics
  readonly stats = computed(() => {
    const prs = this.prService.prs();
    return {
      total: prs.length,
      pending: prs.filter(pr => pr.status === PRStatus.PENDING).length,
      approved: prs.filter(pr => pr.status === PRStatus.APPROVED).length,
      rejected: prs.filter(pr => pr.status === PRStatus.REJECTED).length,
      draft: prs.filter(pr => pr.status === PRStatus.DRAFT).length
    };
  });

  readonly PRStatus = PRStatus; // For template use

  ngOnInit(): void {
    // Check if this is the "my requests" view by listening to route changes
    this.route.url.subscribe(urlSegments => {
      const isMyView = urlSegments.some(segment => segment.path === 'my');
      this.isMyRequestsView.set(isMyView);
      this.loadInitialData();
    });
    
    this.setupFilterListeners();
  }

  private loadInitialData(): void {
    // Load PRs - filter by current user if this is "my requests" view
    if (this.isMyRequestsView()) {
      const currentUserId = this.currentUser()?.id;
      if (currentUserId) {
        this.prService.getAuthorized({ createdBy: currentUserId }).subscribe();
      }
    } else {
      this.prService.getAuthorized().subscribe();
    }
    
    // Load reference data for filter options
    this.categoryService.getAll().subscribe(categories => {
      this.categories.set(categories);
    });
    
    this.departmentService.getAll().subscribe(departments => {
      this.departments.set(departments);
    });

    // Load users for created by filter (if user has permission)
    // For now, load users for all authenticated users
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: (error) => {
        console.warn('Could not load users for filter:', error);
        // Continue without user filter options
      }
    });
  }

  private setupFilterListeners(): void {
    // Basic filters
    this.statusFilter.valueChanges.subscribe(value => {
      this.filterStatus.set(value || 'all');
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchTerm.set(value || '');
    });

    this.sortByControl.valueChanges.subscribe(value => {
      if (value) {
        const [field, direction] = value.split('-') as [string, 'asc' | 'desc'];
        this.sortBy.set({ field, direction });
      }
    });
  }

  private applyAllFilters(prs: PurchaseRequest[]): PurchaseRequest[] {
    return prs.filter(pr => {
      // Status filter
      if (this.statusFilter.value !== 'all' && pr.status !== this.statusFilter.value) {
        return false;
      }

      // Search filter
      const search = this.searchControl.value?.toLowerCase();
      if (search && !this.matchesSearch(pr, search)) {
        return false;
      }

      // Department filter
      if (this.departmentFilter.value !== 'all' && pr.departmentId !== this.departmentFilter.value) {
        return false;
      }

      // Category filter
      if (this.categoryFilter.value !== 'all' && pr.categoryId !== this.categoryFilter.value) {
        return false;
      }

      // Created by filter
      const createdByValue = this.createdByFilter.value;
      if (createdByValue !== 'all') {
        if (createdByValue === 'me' && pr.createdBy !== this.currentUser()?.id) {
          return false;
        } else if (createdByValue !== 'me' && pr.createdBy !== createdByValue) {
          return false;
        }
      }

      // Value range filters
      const minValue = this.minValueControl.value;
      const maxValue = this.maxValueControl.value;
      if (minValue !== null && pr.totalValue < minValue) {
        return false;
      }
      if (maxValue !== null && pr.totalValue > maxValue) {
        return false;
      }

      // Date range filters
      const dateFrom = this.dateFromControl.value;
      const dateTo = this.dateToControl.value;
      const prDate = new Date(pr.createdAt);
      
      if (dateFrom && prDate < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && prDate > new Date(dateTo + 'T23:59:59')) {
        return false;
      }

      return true;
    });
  }

  private matchesSearch(pr: PurchaseRequest, search: string): boolean {
    return (
      pr.item.toLowerCase().includes(search) ||
      pr.id.toLowerCase().includes(search)
    );
  }

  private applySorting(prs: PurchaseRequest[]): PurchaseRequest[] {
    const sort = this.sortBy();
    
    return [...prs].sort((a, b) => {
      let valueA: any = a[sort.field as keyof PurchaseRequest];
      let valueB: any = b[sort.field as keyof PurchaseRequest];

      // Handle different data types
      if (sort.field === 'createdAt' || sort.field === 'updatedAt') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      } else if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let comparison = 0;
      if (valueA > valueB) comparison = 1;
      if (valueA < valueB) comparison = -1;

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Filter actions
  toggleFilters(): void {
    this.showAdvancedFilters.update(show => !show);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  applyFilters(): void {
    // Filters are applied automatically through computed signals
    // This method can be used for any additional logic if needed
    console.log('Filters applied');
  }

  clearAllFilters(): void {
    this.statusFilter.setValue('all');
    this.searchControl.setValue('');
    this.departmentFilter.setValue('all');
    this.categoryFilter.setValue('all');
    this.createdByFilter.setValue('all');
    this.minValueControl.setValue(null);
    this.maxValueControl.setValue(null);
    this.dateFromControl.setValue('');
    this.dateToControl.setValue('');
    this.sortByControl.setValue('createdAt-desc');
  }

  // Navigation methods
  navigateToCreate(): void {
    this.router.navigate(['/purchase-requests/create']);
  }

  navigateToDetail(pr: PurchaseRequest): void {
    this.router.navigate(['/purchase-requests', pr.id]);
  }

  // Utility methods for template
  getStatusClass(status: PRStatus): string {
    switch (status) {
      case PRStatus.DRAFT: return 'status-draft';
      case PRStatus.PENDING: return 'status-pending';
      case PRStatus.APPROVED: return 'status-approved';
      case PRStatus.REJECTED: return 'status-rejected';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Actions
  canEdit(pr: PurchaseRequest): boolean {
    const user = this.currentUser();
    return !!(user && pr.createdBy === user.id && pr.status === PRStatus.DRAFT);
  }

  onEdit(pr: PurchaseRequest, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/purchase-requests', pr.id, 'edit']);
  }

  onRefresh(): void {
    this.prService.refresh();
  }
}
