import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PrService } from '../../purchase-request/services/pr';
import { PurchaseRequest } from '../../../core/models';

interface DashboardStats {
  totalPrs: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  myRequests: number;
  changePercent?: number;
}

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: string;
  permission?: string;
}

interface RecentActivity {
  id: string;
  type: 'created' | 'approved' | 'rejected' | 'updated';
  title: string;
  subtitle: string;
  timestamp: Date;
  iconClass: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly prService = inject(PrService);

  readonly currentUser = this.authService.currentUser;
  readonly isLoading = signal(true);
  readonly stats = signal<DashboardStats>({
    totalPrs: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    myRequests: 0
  });
  readonly recentActivity = signal<RecentActivity[]>([]);

  readonly quickActions: QuickAction[] = [
    {
      label: 'Create New Request',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      path: '/purchase-requests/create',
      color: 'blue',
      permission: 'create_pr'
    },
    {
      label: 'View All Requests',
      icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      path: '/purchase-requests',
      color: 'green'
    },
    {
      label: 'Pending Approvals',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/approvals/queue',
      color: 'yellow',
      permission: 'approve_pr'
    },
    {
      label: 'Reports & Analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      path: '/reports/analytics',
      color: 'purple'
    }
  ];

  readonly welcomeMessage = computed(() => {
    const user = this.currentUser();
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18) greeting = 'Good evening';
    
    return `${greeting}, ${user?.email?.split('@')[0] || 'User'}!`;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading.set(true);
      
      // Fetch purchase requests from service
      this.prService.getAll().subscribe(prs => {
        const userId = this.currentUser()?.id;
        const totalPrs = prs.length;
        const pendingApproval = prs.filter(pr => pr.status === 'pending').length;
        const approved = prs.filter(pr => pr.status === 'approved').length;
        const rejected = prs.filter(pr => pr.status === 'rejected').length;
        const myRequests = prs.filter(pr => pr.createdBy === userId).length;

        this.stats.set({
          totalPrs,
          pendingApproval,
          approved,
          rejected,
          myRequests,
          // Remove hardcoded percentages
          changePercent: this.calculateChangePercent(totalPrs)
        });

        // Process recent activity from PR data
        this.processRecentActivity(prs);
        
        this.isLoading.set(false);
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.isLoading.set(false);
    }
  }

  // Calculate actual percentage change based on recent data
  private calculateChangePercent(currentTotal: number): number {
    // In a real app, you would compare with historical data
    // For now, return 0 to avoid misleading information
    return 0;
  }

  // Process PR data into recent activity items
  private processRecentActivity(prs: PurchaseRequest[]): void {
    // Sort by most recent first
    const sortedPrs = [...prs].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Take the 5 most recent activities
    const recentItems = sortedPrs.slice(0, 5).map(pr => {
      let type: 'created' | 'approved' | 'rejected' | 'updated';
      let iconClass: string;
      let title: string;
      let subtitle: string;
      
      // Determine activity type based on status and dates
      if (pr.status === 'approved') {
        type = 'approved';
        iconClass = 'green';
        title = `Purchase Request #${pr._id || pr.id} approved`;
        subtitle = `${pr.item} request has been approved`;
      } else if (pr.status === 'rejected') {
        type = 'rejected';
        iconClass = 'red';
        title = `Purchase Request #${pr._id || pr.id} rejected`;
        subtitle = `${pr.item} request has been rejected`;
      } else if (pr.status === 'pending') {
        if (new Date(pr.createdAt).getTime() === new Date(pr.updatedAt).getTime()) {
          type = 'created';
          iconClass = 'blue';
          title = 'New purchase request created';
          subtitle = pr.item;
        } else {
          type = 'updated';
          iconClass = 'yellow';
          title = `Purchase Request #${pr._id || pr.id} awaiting approval`;
          subtitle = `${pr.item} pending review`;
        }
      } else {
        type = 'updated';
        iconClass = 'purple';
        title = `Purchase Request #${pr._id || pr.id} updated`;
        subtitle = pr.item;
      }

      return {
        id: pr._id || pr.id || '',
        type,
        title,
        subtitle,
        timestamp: new Date(pr.updatedAt),
        iconClass
      };
    });

    this.recentActivity.set(recentItems);
  }

  // Format relative time for activity feed
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    // For older dates, show formatted date
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  hasPermission(permission?: string): boolean {
    if (!permission) return true;
    return this.authService.hasPermission(permission);
  }
}
