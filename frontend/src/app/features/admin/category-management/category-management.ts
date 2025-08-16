import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../core/services/category';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-management.html',
  styleUrl: './category-management.scss'
})
export class CategoryManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly showCreateModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly selectedCategory = signal<Category | null>(null);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  readonly categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    rules: ['']
  });

  readonly filteredCategories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.errorMessage.set('Failed to load categories. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilter(): void {
    const search = this.searchTerm().toLowerCase();
    const filtered = this.categories().filter(cat =>
      cat.name.toLowerCase().includes(search)
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
      rules: ''
    });
    this.showCreateModal.set(true);
    this.clearMessages();
  }

  openEditModal(category: Category): void {
    this.selectedCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      rules: category.rules || ''
    });
    this.showEditModal.set(true);
    this.clearMessages();
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.selectedCategory.set(null);
    this.categoryForm.reset();
    this.clearMessages();
  }

  createCategory(): void {
    if (this.categoryForm.valid) {
      this.isLoading.set(true);
      const formValue = this.categoryForm.value;
      
      const categoryData = {
        name: formValue.name,
        rules: formValue.rules
      };

      this.categoryService.create(categoryData).subscribe({
        next: (newCategory) => {
          const current = this.categories();
          this.categories.set([...current, newCategory]);
          this.applyFilter();
          this.successMessage.set('Category created successfully!');
          this.closeModals();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to create category:', error);
          this.errorMessage.set('Failed to create category. Please try again.');
          this.isLoading.set(false);
        }
      });
    }
  }

  updateCategory(): void {
    if (this.categoryForm.valid && this.selectedCategory()) {
      this.isLoading.set(true);
      const formValue = this.categoryForm.value;
      const selectedId = this.selectedCategory()!._id || this.selectedCategory()!.id!;

      const updateData = {
        name: formValue.name,
        rules: formValue.rules
      };

      this.categoryService.update(selectedId, updateData).subscribe({
        next: (updatedCategory) => {
          const current = this.categories();
          const updated = current.map(cat => 
            (cat._id || cat.id) === selectedId ? updatedCategory : cat
          );
          
          this.categories.set(updated);
          this.applyFilter();
          this.successMessage.set('Category updated successfully!');
          this.closeModals();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to update category:', error);
          this.errorMessage.set('Failed to update category. Please try again.');
          this.isLoading.set(false);
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (confirm(`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`)) {
      this.categoryService.delete(category._id || category.id!).subscribe({
        next: () => {
          const current = this.categories();
          const filtered = current.filter(cat => (cat._id || cat.id) !== (category._id || category.id));
          this.categories.set(filtered);
          this.applyFilter();
          this.successMessage.set('Category deleted successfully!');
        },
        error: (error) => {
          console.error('Failed to delete category:', error);
          this.errorMessage.set('Failed to delete category. Please try again.');
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  getActiveCategoriesCount(): number {
    return this.categories().length;
  }

  getTotalBudgetLimit(): number {
    return 0; // Not applicable since budgetLimit is not in the backend model
  }

  getTotalRequests(): number {
    return 0; // Not applicable since requestCount is not in the backend model
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
