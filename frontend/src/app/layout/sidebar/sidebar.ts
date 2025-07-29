import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

interface NavigationItem {
  label: string;
  icon: string;
  path: string;
  permission?: string;
  badge?: number;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isCollapsed = signal(false);
  readonly expandedGroups = signal<Set<string>>(new Set());

  readonly navigationItems: NavigationItem[] = [
    {
      label: 'Purchase Requests',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      path: '/purchase-requests',
      badge: 5,
      children: [
        {
          label: 'All Requests',
          icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
          path: '/purchase-requests'
        },
        {
          label: 'Create New',
          icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
          path: '/purchase-requests/create',
          permission: 'create_pr'
        },
        {
          label: 'My Requests',
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
          path: '/purchase-requests/my'
        }
      ]
    },
    {
      label: 'Approvals',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/approvals',
      badge: 3,
      children: [
        {
          label: 'Pending Approvals',
          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          path: '/approvals/pending'
        },
        {
          label: 'Approved',
          icon: 'M5 13l4 4L19 7',
          path: '/approvals/approved'
        },
        {
          label: 'Rejected',
          icon: 'M6 18L18 6M6 6l12 12',
          path: '/approvals/rejected'
        }
      ]
    },
    {
      label: 'Reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      path: '/reports',
      children: [
        {
          label: 'Analytics',
          icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
          path: '/reports/analytics'
        },
        {
          label: 'Export Data',
          icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          path: '/reports/export'
        }
      ]
    },
    {
      label: 'Administration',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      path: '/admin',
      permission: 'admin_access',
      children: [
        {
          label: 'User Management',
          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
          path: '/admin/users',
          permission: 'manage_users'
        },
        {
          label: 'Departments',
          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
          path: '/admin/departments',
          permission: 'manage_departments'
        },
        {
          label: 'Categories',
          icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
          path: '/admin/categories',
          permission: 'manage_categories'
        }
      ]
    }
  ];

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
  }

  toggleGroup(groupLabel: string): void {
    const expanded = this.expandedGroups();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(groupLabel)) {
      newExpanded.delete(groupLabel);
    } else {
      newExpanded.add(groupLabel);
    }
    
    this.expandedGroups.set(newExpanded);
  }

  isGroupExpanded(groupLabel: string): boolean {
    return this.expandedGroups().has(groupLabel);
  }

  hasPermission(permission?: string): boolean {
    if (!permission) return true;
    return this.authService.hasPermission(permission);
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }
}
