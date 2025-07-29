import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrService } from '../../purchase-request/services/pr';
import { ApprovalService } from '../../../core/services/approval';
import { AuthService } from '../../../core/services/auth';

interface AnalyticsData {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalValue: number;
  approvedValue: number;
  rejectedValue: number;
  pendingValue: number;
  averageApprovalTime: number;
  topDepartments: DepartmentStats[];
  monthlyTrends: MonthlyTrend[];
  categoryStats: CategoryStats[];
}

interface DepartmentStats {
  name: string;
  totalRequests: number;
  totalValue: number;
  approvalRate: number;
}

interface MonthlyTrend {
  month: string;
  requests: number;
  value: number;
  approvalRate: number;
}

interface CategoryStats {
  name: string;
  count: number;
  value: number;
}

@Component({
  selector: 'app-analytics',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class AnalyticsComponent implements OnInit {
  private readonly prService = inject(PrService);
  private readonly approvalService = inject(ApprovalService);
  private readonly authService = inject(AuthService);

  readonly isLoading = signal<boolean>(false);
  readonly selectedTimeRange = signal<string>('6months');
  readonly selectedDepartment = signal<string>('');
  readonly analytics = signal<AnalyticsData>({
    totalRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0,
    totalValue: 0,
    approvedValue: 0,
    rejectedValue: 0,
    pendingValue: 0,
    averageApprovalTime: 0,
    topDepartments: [],
    monthlyTrends: [],
    categoryStats: []
  });

  // Computed values for percentages
  readonly approvalRate = computed(() => {
    const data = this.analytics();
    return data.totalRequests > 0 ? 
      Math.round((data.approvedRequests / data.totalRequests) * 100) : 0;
  });

  readonly rejectionRate = computed(() => {
    const data = this.analytics();
    return data.totalRequests > 0 ? 
      Math.round((data.rejectedRequests / data.totalRequests) * 100) : 0;
  });

  readonly pendingRate = computed(() => {
    const data = this.analytics();
    return data.totalRequests > 0 ? 
      Math.round((data.pendingRequests / data.totalRequests) * 100) : 0;
  });

  readonly valueEfficiency = computed(() => {
    const data = this.analytics();
    return data.totalValue > 0 ? 
      Math.round((data.approvedValue / data.totalValue) * 100) : 0;
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Simulate loading analytics data
      // In a real app, this would make API calls to get aggregated data
      
      const emptyData: AnalyticsData = {
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: 0,
        totalValue: 0,
        approvedValue: 0,
        rejectedValue: 0,
        pendingValue: 0,
        averageApprovalTime: 0,
        topDepartments: [],
        monthlyTrends: [],
        categoryStats: []
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.analytics.set(emptyData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onTimeRangeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTimeRange.set(target.value);
    this.loadAnalytics();
  }

  onDepartmentChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDepartment.set(target.value);
    this.loadAnalytics();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  refreshData(): void {
    this.loadAnalytics();
  }

  exportData(): void {
    // In a real app, this would generate and download a report
    const data = this.analytics();
    const csvContent = this.generateCSVReport(data);
    this.downloadCSV(csvContent, 'analytics-report.csv');
  }

  private generateCSVReport(data: AnalyticsData): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Requests', data.totalRequests.toString()],
      ['Approved Requests', data.approvedRequests.toString()],
      ['Rejected Requests', data.rejectedRequests.toString()],
      ['Pending Requests', data.pendingRequests.toString()],
      ['Total Value', data.totalValue.toString()],
      ['Approved Value', data.approvedValue.toString()],
      ['Rejected Value', data.rejectedValue.toString()],
      ['Pending Value', data.pendingValue.toString()],
      ['Average Approval Time (days)', data.averageApprovalTime.toString()],
      ['Approval Rate (%)', this.approvalRate().toString()],
      ['Rejection Rate (%)', this.rejectionRate().toString()]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
