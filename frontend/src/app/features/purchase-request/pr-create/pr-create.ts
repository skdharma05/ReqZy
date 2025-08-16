import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrService } from '../services/pr';
import { AuthService } from '../../../core/services/auth';
import { CategoryService } from '../../../core/services/category';
import { DepartmentService } from '../../../core/services/department';
import { CreatePRRequest } from '../../../core/models';

@Component({
  selector: 'app-pr-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pr-create.html',
  styleUrl: './pr-create.scss'
})
export class PrCreateComponent implements OnInit {
  private readonly prService = inject(PrService);
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly departmentService = inject(DepartmentService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Signals for reactive state
  readonly categories = signal<any[]>([]);
  readonly departments = signal<any[]>([]);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly currentUser = this.authService.currentUser;

  // Form
  prForm: FormGroup = this.fb.group({
    item: ['', [Validators.required, Validators.minLength(3)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(0.01)]],
    categoryId: ['', Validators.required],
    departmentId: [''],
    description: ['']
  });

  ngOnInit(): void {
    this.loadFormData();
    this.setupFormCalculations();
    this.setDefaultDepartment();
  }

  private loadFormData(): void {
    // Load categories
    this.categoryService.getAll().subscribe({
      next: categories => {
        console.log('Loaded categories:', categories);
        this.categories.set(categories);
      },
      error: error => this.errorMessage.set('Failed to load categories')
    });

    // Load departments
    this.departmentService.getAll().subscribe({
      next: departments => {
        console.log('Loaded departments:', departments);
        this.departments.set(departments);
      },
      error: error => this.errorMessage.set('Failed to load departments')
    });
  }

  private setupFormCalculations(): void {
    // Auto-calculate total value when quantity or unit price changes
    this.prForm.get('quantity')?.valueChanges.subscribe(() => this.calculateTotal());
    this.prForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateTotal());
  }

  private setDefaultDepartment(): void {
    const user = this.currentUser();
    if (user?.departmentId) {
      this.prForm.patchValue({ departmentId: user.departmentId });
    }
  }

  private calculateTotal(): number {
    const quantity = this.prForm.get('quantity')?.value || 0;
    const unitPrice = this.prForm.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  onSubmit(): void {
    if (this.prForm.valid) {
      this.isSubmitting.set(true);
      this.errorMessage.set('');

      const formValue = this.prForm.value;
      console.log('Form values:', formValue);

      const prData: CreatePRRequest = {
        item: formValue.item,
        quantity: formValue.quantity,
        totalValue: this.calculateTotal(),
        categoryId: formValue.categoryId,
        departmentId: formValue.departmentId || this.currentUser()?.departmentId || ''
      };

      console.log('PR data being sent:', prData);
      console.log('Current user:', this.currentUser());
      console.log('Auth token exists:', !!localStorage.getItem('token'));

      this.prService.create(prData).subscribe({
        next: (createdPr) => {
          this.isSubmitting.set(false);
          console.log('Created PR response:', createdPr);
          // Navigate to the created PR detail page - handle both _id and id
          const prId = createdPr._id || createdPr.id;
          if (prId) {
            console.log('Navigating to PR:', prId);
            this.router.navigate(['/purchase-requests', prId]);
          } else {
            console.error('No ID found in created PR response:', createdPr);
            this.router.navigate(['/purchase-requests']);
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          console.error('Error creating PR:', error);
          this.errorMessage.set(error.error?.error || error.message || 'Failed to create purchase request');
        }
      });
    } else {
      console.log('Form is invalid:', this.prForm.errors);
      this.markFormGroupTouched();
    }
  }  onSaveAsDraft(): void {
    // Similar to submit but with draft status
    if (this.prForm.get('item')?.valid && this.prForm.get('categoryId')?.valid) {
      this.isSubmitting.set(true);
      // Implementation for saving as draft
      // This would require backend support for draft status
    }
  }

  onCancel(): void {
    this.router.navigate(['/purchase-requests']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.prForm.controls).forEach(key => {
      const control = this.prForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.prForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.prForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
    }
    return '';
  }

  getTotalValue(): number {
    return this.calculateTotal();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
