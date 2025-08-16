import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DepartmentService } from '../../../core/services/department';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-department-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './department-management.html',
  styleUrl: './department-management.scss'
})
export class DepartmentManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly departmentService = inject(DepartmentService);

  readonly departments = signal<Department[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly showCreateModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly selectedDepartment = signal<Department | null>(null);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  readonly departmentForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  // Computed filtered departments
  readonly filteredDepartments = signal<Department[]>([]);

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.departmentService.getAll().subscribe({
      next: (departments) => {
        this.departments.set(departments);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
        this.errorMessage.set('Failed to load departments. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilter(): void {
    const search = this.searchTerm().toLowerCase();
    const filtered = this.departments().filter(dept =>
      dept.name.toLowerCase().includes(search)
    );
    this.filteredDepartments.set(filtered);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilter();
  }

  openCreateModal(): void {
    this.departmentForm.reset({
      name: ''
    });
    this.showCreateModal.set(true);
    this.clearMessages();
  }

  openEditModal(department: Department): void {
    this.selectedDepartment.set(department);
    this.departmentForm.patchValue({
      name: department.name
    });
    this.showEditModal.set(true);
    this.clearMessages();
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.selectedDepartment.set(null);
    this.departmentForm.reset();
    this.clearMessages();
  }

  createDepartment(): void {
    if (this.departmentForm.valid) {
      this.isLoading.set(true);
      const formValue = this.departmentForm.value;
      
      const departmentData = {
        name: formValue.name
      };

      this.departmentService.create(departmentData).subscribe({
        next: (newDepartment) => {
          const current = this.departments();
          this.departments.set([...current, newDepartment]);
          this.applyFilter();
          this.successMessage.set('Department created successfully!');
          this.closeModals();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to create department:', error);
          this.errorMessage.set('Failed to create department. Please try again.');
          this.isLoading.set(false);
        }
      });
    }
  }

  updateDepartment(): void {
    if (this.departmentForm.valid && this.selectedDepartment()) {
      this.isLoading.set(true);
      const formValue = this.departmentForm.value;
      const selected = this.selectedDepartment()!;
      
      if (!(selected._id || selected.id)) {
        this.errorMessage.set('Invalid department selected');
        this.isLoading.set(false);
        return;
      }

      const updateData = {
        name: formValue.name
      };

      this.departmentService.update(selected._id || selected.id!, updateData).subscribe({
        next: (updatedDepartment) => {
          const current = this.departments();
          const updated = current.map(dept => 
            (dept._id || dept.id) === (selected._id || selected.id) ? updatedDepartment : dept
          );
          
          this.departments.set(updated);
          this.applyFilter();
          this.successMessage.set('Department updated successfully!');
          this.closeModals();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to update department:', error);
          this.errorMessage.set('Failed to update department. Please try again.');
          this.isLoading.set(false);
        }
      });
    }
  }

  deleteDepartment(department: Department): void {
    if (confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) {
      this.departmentService.delete(department._id || department.id!).subscribe({
        next: () => {
          const current = this.departments();
          const filtered = current.filter(dept => (dept._id || dept.id) !== (department._id || department.id));
          this.departments.set(filtered);
          this.applyFilter();
          this.successMessage.set('Department deleted successfully!');
        },
        error: (error) => {
          console.error('Failed to delete department:', error);
          this.errorMessage.set('Failed to delete department. Please try again.');
        }
      });
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0.00';
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

  getActiveDepartmentsCount(): number {
    return this.departments().length;
  }

  getTotalBudget(): number {
    return 0; // No budget field in simplified model
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
