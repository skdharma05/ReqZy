import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Category {
  id: string;
  name: string;
  description: string;
  approvalRules: string;
  budgetLimit: number;
  isActive: boolean;
  createdAt: Date;
  requestCount: number;
}

@Component({
  selector: 'app-category-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-management.html',
  styleUrl: './category-management.scss'
})
export class CategoryManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly showCreateModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly selectedCategory = signal<Category | null>(null);

  readonly categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    approvalRules: ['', [Validators.required]],
    budgetLimit: [0, [Validators.required, Validators.min(0)]],
    isActive: [true]
  });

  readonly filteredCategories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    this.isLoading.set(true);
    try {
      // No categories available - would be loaded from API in real implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      this.categories.set([]);
      this.applyFilter();
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilter(): void {
    const search = this.searchTerm().toLowerCase();
    const filtered = this.categories().filter(cat =>
      cat.name.toLowerCase().includes(search) ||
      cat.description.toLowerCase().includes(search)
    );
    this.filteredCategories.set(filtered);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilter();
  }

  openCreateModal(): void {
    this.categoryForm.reset({
      name: '',
      description: '',
      approvalRules: '',
      budgetLimit: 0,
      isActive: true
    });
    this.showCreateModal.set(true);
  }

  openEditModal(category: Category): void {
    this.selectedCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      approvalRules: category.approvalRules,
      budgetLimit: category.budgetLimit,
      isActive: category.isActive
    });
    this.showEditModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.selectedCategory.set(null);
    this.categoryForm.reset();
  }

  async createCategory(): Promise<void> {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formValue.name,
        description: formValue.description,
        approvalRules: formValue.approvalRules,
        budgetLimit: formValue.budgetLimit,
        isActive: formValue.isActive,
        createdAt: new Date(),
        requestCount: 0
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      const current = this.categories();
      this.categories.set([...current, newCategory]);
      this.applyFilter();
      this.closeModals();
    }
  }

  async updateCategory(): Promise<void> {
    if (this.categoryForm.valid && this.selectedCategory()) {
      const formValue = this.categoryForm.value;
      const selectedId = this.selectedCategory()!.id;

      await new Promise(resolve => setTimeout(resolve, 500));
      const current = this.categories();
      const updated = current.map(cat => 
        cat.id === selectedId 
          ? { 
              ...cat, 
              name: formValue.name,
              description: formValue.description,
              approvalRules: formValue.approvalRules,
              budgetLimit: formValue.budgetLimit,
              isActive: formValue.isActive
            }
          : cat
      );
      
      this.categories.set(updated);
      this.applyFilter();
      this.closeModals();
    }
  }

  async toggleCategoryStatus(category: Category): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const current = this.categories();
    const updated = current.map(cat => 
      cat.id === category.id 
        ? { ...cat, isActive: !cat.isActive }
        : cat
    );
    
    this.categories.set(updated);
    this.applyFilter();
  }

  async deleteCategory(category: Category): Promise<void> {
    if (confirm(`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const current = this.categories();
      const filtered = current.filter(cat => cat.id !== category.id);
      this.categories.set(filtered);
      this.applyFilter();
    }
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
      day: 'numeric'
    }).format(date);
  }

  getActiveCategoriesCount(): number {
    return this.categories().filter(cat => cat.isActive).length;
  }

  getTotalBudgetLimit(): number {
    return this.categories()
      .filter(cat => cat.isActive)
      .reduce((total, cat) => total + cat.budgetLimit, 0);
  }

  getTotalRequests(): number {
    return this.categories()
      .reduce((total, cat) => total + cat.requestCount, 0);
  }
}
