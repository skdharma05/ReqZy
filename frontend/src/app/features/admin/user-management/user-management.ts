import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, UserFilters, CreateUserRequest, UpdateUserRequest } from '../../../core/services/user';
import { CategoryService } from '../../../core/services/category';
import { DepartmentService } from '../../../core/services/department';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../../core/models';

interface UserFormData {
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
  isSuperUser: boolean;
}

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly departmentService = inject(DepartmentService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Signals
  readonly users = this.userService.users;
  readonly isLoading = this.userService.isLoading;
  readonly totalUsers = this.userService.totalUsers;
  readonly currentPage = this.userService.currentPage;
  
  readonly departments = signal<any[]>([]);
  readonly isDepartmentsLoading = signal(false);
  
  readonly isModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedDepartmentFilter = signal('');
  readonly currentFilters = signal<UserFilters>({ page: 1, limit: 10 });

  // Mock roles - In a real app, you'd have a RoleService
  readonly roles = signal([
    { id: '1', name: 'Admin', permissions: ['manage_users', 'manage_departments', 'manage_categories'] },
    { id: '2', name: 'Manager', permissions: ['create_pr', 'approve_pr', 'view_pr'] },
    { id: '3', name: 'Employee', permissions: ['create_pr', 'view_pr'] }
  ]);

  // Form
  userForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roleId: ['', Validators.required],
    departmentId: ['', Validators.required],
    isSuperUser: [false]
  });

  // Computed values
  readonly filteredUsers = computed(() => {
    const users = this.users();
    const search = this.searchTerm().toLowerCase();
    const departmentFilter = this.selectedDepartmentFilter();

    return users.filter(user => {
      const matchesSearch = !search || 
        user.email.toLowerCase().includes(search) ||
        user.role?.name.toLowerCase().includes(search) ||
        user.department?.name.toLowerCase().includes(search);
      
      const matchesDepartment = !departmentFilter || user.departmentId === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
  });

  readonly paginationInfo = computed(() => {
    const total = this.totalUsers();
    const current = this.currentPage();
    const limit = this.currentFilters().limit || 10;
    
    return {
      total,
      current,
      limit,
      pages: Math.ceil(total / limit),
      start: (current - 1) * limit + 1,
      end: Math.min(current * limit, total)
    };
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadDepartments();
  }

  loadUsers(): void {
    this.userService.getUsers(this.currentFilters()).subscribe({
      error: (error) => {
        this.errorMessage.set('Failed to load users');
        console.error('Error loading users:', error);
      }
    });
  }

  loadDepartments(): void {
    this.isDepartmentsLoading.set(true);
    this.departmentService.getAll().subscribe({
      next: (departments) => {
        this.departments.set(departments);
        this.isDepartmentsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.isDepartmentsLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedUser.set(null);
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
    this.clearMessages();
  }

  openEditModal(user: User): void {
    this.isEditMode.set(true);
    this.selectedUser.set(user);
    
    this.userForm.patchValue({
      email: user.email,
      roleId: user.roleId,
      departmentId: user.departmentId,
      isSuperUser: user.isSuperUser || false
    });
    
    // Remove password requirement for edit
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.isModalOpen.set(true);
    this.clearMessages();
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.userForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting.set(true);
      this.clearMessages();

      const formData = this.userForm.value as UserFormData;

      if (this.isEditMode()) {
        this.updateUser(formData);
      } else {
        this.createUser(formData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createUser(formData: UserFormData): void {
    const userData: CreateUserRequest = {
      email: formData.email,
      password: formData.password,
      roleId: formData.roleId,
      departmentId: formData.departmentId,
      isSuperUser: formData.isSuperUser
    };

    this.userService.createUser(userData).subscribe({
      next: (response) => {
        this.successMessage.set('User created successfully');
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Failed to create user');
        this.isSubmitting.set(false);
      }
    });
  }

  private updateUser(formData: UserFormData): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    const userData: UpdateUserRequest = {
      email: formData.email,
      roleId: formData.roleId,
      departmentId: formData.departmentId,
      isSuperUser: formData.isSuperUser
    };

    this.userService.updateUser(selectedUser.id, userData).subscribe({
      next: (response) => {
        this.successMessage.set('User updated successfully');
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Failed to update user');
        this.isSubmitting.set(false);
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.email}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.successMessage.set('User deleted successfully');
        },
        error: (error) => {
          this.errorMessage.set(error.error?.error || 'Failed to delete user');
        }
      });
    }
  }

  resetPassword(user: User): void {
    const newPassword = prompt(`Enter new password for ${user.email}:`);
    if (newPassword && newPassword.length >= 6) {
      this.userService.resetUserPassword(user.id, { newPassword }).subscribe({
        next: () => {
          this.successMessage.set('Password reset successfully');
        },
        error: (error) => {
          this.errorMessage.set(error.error?.error || 'Failed to reset password');
        }
      });
    } else if (newPassword) {
      this.errorMessage.set('Password must be at least 6 characters long');
    }
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onDepartmentFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDepartmentFilter.set(target.value);
  }

  changePage(page: number): void {
    const filters = this.currentFilters();
    this.currentFilters.set({ ...filters, page });
    this.loadUsers();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getRoleName(roleId: string): string {
    const role = this.roles().find(r => r.id === roleId);
    return role?.name || 'Unknown';
  }

  getDepartmentName(departmentId: string): string {
    const department = this.departments().find((d: any) => d.id === departmentId);
    return department?.name || 'Unknown';
  }
}
