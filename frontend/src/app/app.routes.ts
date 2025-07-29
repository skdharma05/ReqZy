import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/reports/analytics',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'purchase-requests',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/purchase-request/pr-list/pr-list').then(m => m.PrListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('./features/purchase-request/pr-create/pr-create').then(m => m.PrCreateComponent),
            canActivate: [roleGuard('create_pr')]
          },
          {
            path: 'my',
            loadComponent: () => import('./features/purchase-request/pr-list/pr-list').then(m => m.PrListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/purchase-request/pr-detail/pr-detail').then(m => m.PrDetailComponent)
          }
        ]
      },
      {
        path: 'approvals',
        children: [
          {
            path: '',
            redirectTo: 'queue',
            pathMatch: 'full'
          },
          {
            path: 'queue',
            loadComponent: () => import('./features/approvals/approval-queue/approval-queue').then(m => m.ApprovalQueueComponent),
            canActivate: [roleGuard('approve_pr')]
          },
          {
            path: 'pending',
            loadComponent: () => import('./features/approvals/approval-queue/approval-queue').then(m => m.ApprovalQueueComponent),
            canActivate: [roleGuard('approve_pr')]
          },
          {
            path: 'approved',
            loadComponent: () => import('./features/approvals/approved-list/approved-list').then(m => m.ApprovedListComponent)
          },
          {
            path: 'rejected',
            loadComponent: () => import('./features/approvals/rejected-list/rejected-list').then(m => m.RejectedListComponent)
          }
        ]
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            redirectTo: 'analytics',
            pathMatch: 'full'
          },
          {
            path: 'analytics',
            loadComponent: () => import('./features/reports/analytics/analytics').then(m => m.AnalyticsComponent)
          },
          {
            path: 'export',
            loadComponent: () => import('./features/reports/export-reports/export-reports').then(m => m.ExportReportsComponent)
          }
        ]
      },
      {
        path: 'admin',
        canActivate: [roleGuard('admin_access')],
        children: [
          {
            path: '',
            redirectTo: 'users',
            pathMatch: 'full'
          },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagementComponent),
            canActivate: [roleGuard('manage_users')]
          },
          {
            path: 'departments',
            loadComponent: () => import('./features/admin/department-management/department-management').then(m => m.DepartmentManagementComponent),
            canActivate: [roleGuard('manage_departments')]
          },
          {
            path: 'categories',
            loadComponent: () => import('./features/admin/category-management/category-management').then(m => m.CategoryManagementComponent),
            canActivate: [roleGuard('manage_categories')]
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/reports/analytics'
  }
];
