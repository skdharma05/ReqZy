import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Department {
  id: string;
  name: string;
  description: string;
  budget: number;
  headOfDepartment: string;
  employeeCount: number;
  createdAt: Date;
  isActive: boolean;
}

@Component({
  selector: 'app-department-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './department-management.html',
  styleUrl: './department-management.scss'
})
export class DepartmentManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly departments = signal<Department[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly showCreateModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly selectedDepartment = signal<Department | null>(null);

  readonly departmentForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    budget: [0, [Validators.required, Validators.min(0)]],
    headOfDepartment: ['', [Validators.required]],
    isActive: [true]
  });

  // Computed filtered departments
  readonly filteredDepartments = signal<Department[]>([]);

  ngOnInit(): void {
    this.loadDepartments();
  }

  async loadDepartments(): Promise<void> {
    this.isLoading.set(true);
    try {
      // No departments available - would be loaded from API in real implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.departments.set([]);
      this.applyFilter();
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilter(): void {
    const search = this.searchTerm().toLowerCase();
    const filtered = this.departments().filter(dept =>
      dept.name.toLowerCase().includes(search) ||
      dept.description.toLowerCase().includes(search) ||
      dept.headOfDepartment.toLowerCase().includes(search)
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
      name: '',
      description: '',
      budget: 0,
      headOfDepartment: '',
      isActive: true
    });
    this.showCreateModal.set(true);
  }

  openEditModal(department: Department): void {
    this.selectedDepartment.set(department);
    this.departmentForm.patchValue({
      name: department.name,
      description: department.description,
      budget: department.budget,
      headOfDepartment: department.headOfDepartment,
      isActive: department.isActive
    });
    this.showEditModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.selectedDepartment.set(null);
    this.departmentForm.reset();
  }

  async createDepartment(): Promise<void> {
    if (this.departmentForm.valid) {
      const formValue = this.departmentForm.value;
      const newDepartment: Department = {
        id: Date.now().toString(),
        name: formValue.name,
        description: formValue.description,
        budget: formValue.budget,
        headOfDepartment: formValue.headOfDepartment,
        employeeCount: 0,
        createdAt: new Date(),
        isActive: formValue.isActive
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const current = this.departments();
      this.departments.set([...current, newDepartment]);
      this.applyFilter();
      this.closeModals();
    }
  }

  async updateDepartment(): Promise<void> {
    if (this.departmentForm.valid && this.selectedDepartment()) {
      const formValue = this.departmentForm.value;
      const selectedId = this.selectedDepartment()!.id;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const current = this.departments();
      const updated = current.map(dept => 
        dept.id === selectedId 
          ? { 
              ...dept, 
              name: formValue.name,
              description: formValue.description,
              budget: formValue.budget,
              headOfDepartment: formValue.headOfDepartment,
              isActive: formValue.isActive
            }
          : dept
      );
      
      this.departments.set(updated);
      this.applyFilter();
      this.closeModals();
    }
  }

  async toggleDepartmentStatus(department: Department): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const current = this.departments();
    const updated = current.map(dept => 
      dept.id === department.id 
        ? { ...dept, isActive: !dept.isActive }
        : dept
    );
    
    this.departments.set(updated);
    this.applyFilter();
  }

  async deleteDepartment(department: Department): Promise<void> {
    if (confirm(`Are you sure you want to delete the ${department.name} department? This action cannot be undone.`)) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const current = this.departments();
      const filtered = current.filter(dept => dept.id !== department.id);
      this.departments.set(filtered);
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

  getActiveDepartmentsCount(): number {
    return this.departments().filter(dept => dept.isActive).length;
  }

  getTotalBudget(): number {
    return this.departments()
      .filter(dept => dept.isActive)
      .reduce((total, dept) => total + dept.budget, 0);
  }

  getTotalEmployees(): number {
    return this.departments()
      .filter(dept => dept.isActive)
      .reduce((total, dept) => total + dept.employeeCount, 0);
  }
}
