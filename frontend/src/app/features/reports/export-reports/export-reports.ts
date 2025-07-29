import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrService } from '../../purchase-request/services/pr';
import { ApprovalService } from '../../../core/services/approval';
import { AuthService } from '../../../core/services/auth';

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'excel' | 'pdf';
  icon: string;
}

interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  department: string;
  category: string;
  amountMin: number | null;
  amountMax: number | null;
}

@Component({
  selector: 'app-export-reports',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './export-reports.html',
  styleUrl: './export-reports.scss'
})
export class ExportReportsComponent implements OnInit {
  private readonly prService = inject(PrService);
  private readonly approvalService = inject(ApprovalService);
  private readonly authService = inject(AuthService);

  readonly isExporting = signal<boolean>(false);
  readonly exportProgress = signal<number>(0);
  readonly selectedTemplate = signal<string>('');
  readonly exportFormat = signal<'csv' | 'excel' | 'pdf'>('csv');
  
  readonly filters = signal<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    status: '',
    department: '',
    category: '',
    amountMin: null,
    amountMax: null
  });

  readonly exportTemplates: ExportTemplate[] = [
    {
      id: 'all_requests',
      name: 'All Purchase Requests',
      description: 'Export all purchase requests with complete details',
      format: 'excel',
      icon: 'fas fa-file-alt'
    },
    {
      id: 'approved_requests',
      name: 'Approved Requests',
      description: 'Export only approved purchase requests',
      format: 'excel',
      icon: 'fas fa-check-circle'
    },
    {
      id: 'pending_requests',
      name: 'Pending Requests',
      description: 'Export requests awaiting approval',
      format: 'excel',
      icon: 'fas fa-clock'
    },
    {
      id: 'rejected_requests',
      name: 'Rejected Requests',
      description: 'Export rejected requests with reasons',
      format: 'excel',
      icon: 'fas fa-times-circle'
    },
    {
      id: 'department_summary',
      name: 'Department Summary',
      description: 'Summary report by department with totals',
      format: 'pdf',
      icon: 'fas fa-building'
    },
    {
      id: 'monthly_report',
      name: 'Monthly Report',
      description: 'Comprehensive monthly purchase request report',
      format: 'pdf',
      icon: 'fas fa-calendar-alt'
    },
    {
      id: 'approval_timeline',
      name: 'Approval Timeline',
      description: 'Track approval processing times and bottlenecks',
      format: 'csv',
      icon: 'fas fa-stopwatch'
    },
    {
      id: 'budget_analysis',
      name: 'Budget Analysis',
      description: 'Financial analysis with spending patterns',
      format: 'excel',
      icon: 'fas fa-chart-pie'
    }
  ];

  readonly recentExports = signal<any[]>([]);

  ngOnInit(): void {
    this.initializeFilters();
    this.loadRecentExports();
  }

  private initializeFilters(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.filters.set({
      dateFrom: firstDayOfMonth.toISOString().split('T')[0],
      dateTo: lastDayOfMonth.toISOString().split('T')[0],
      status: '',
      department: '',
      category: '',
      amountMin: null,
      amountMax: null
    });
  }

  private loadRecentExports(): void {
    // No recent exports - would be loaded from API in real implementation
    this.recentExports.set([]);
  }

  selectTemplate(templateId: string): void {
    this.selectedTemplate.set(templateId);
    const template = this.exportTemplates.find(t => t.id === templateId);
    if (template) {
      this.exportFormat.set(template.format);
    }
  }

  updateFilter(field: keyof ExportFilters, value: any): void {
    const currentFilters = this.filters();
    this.filters.set({
      ...currentFilters,
      [field]: value
    });
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilter('status', target.value);
  }

  onDepartmentFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilter('department', target.value);
  }

  onCategoryFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilter('category', target.value);
  }

  onAmountMinChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateFilter('amountMin', target.value ? parseFloat(target.value) : null);
  }

  onAmountMaxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateFilter('amountMax', target.value ? parseFloat(target.value) : null);
  }

  async exportReport(): Promise<void> {
    if (!this.selectedTemplate()) {
      alert('Please select a report template');
      return;
    }

    this.isExporting.set(true);
    this.exportProgress.set(0);

    try {
      // Simulate export progress
      const progressSteps = [10, 25, 45, 65, 80, 95, 100];
      
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 300));
        this.exportProgress.set(step);
      }

      // Generate and download the report
      await this.generateReport();
      
      // Add to recent exports
      const newExport = {
        id: Date.now().toString(),
        name: this.getSelectedTemplate()?.name || 'Custom Report',
        format: this.exportFormat().toUpperCase(),
        size: '1.2 MB',
        exportedAt: new Date(),
        downloadUrl: '#'
      };

      this.recentExports.set([newExport, ...this.recentExports()]);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      this.isExporting.set(false);
      this.exportProgress.set(0);
    }
  }

  private async generateReport(): Promise<void> {
    const template = this.getSelectedTemplate();
    const filters = this.filters();
    const format = this.exportFormat();

    // In a real application, this would make API calls to generate the report
    const reportData = await this.fetchReportData(template?.id, filters);
    
    switch (format) {
      case 'csv':
        this.downloadCSV(reportData, `${template?.name}.csv`);
        break;
      case 'excel':
        this.downloadExcel(reportData, `${template?.name}.xlsx`);
        break;
      case 'pdf':
        this.downloadPDF(reportData, `${template?.name}.pdf`);
        break;
    }
  }

  private async fetchReportData(templateId?: string, filters?: ExportFilters): Promise<any[]> {
    // No data available - would fetch from API in real implementation
    return [];
  }

  private downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    this.downloadBlob(blob, filename);
  }

  private downloadExcel(data: any[], filename: string): void {
    // In a real app, you'd use a library like xlsx to generate Excel files
    const csvContent = this.generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    this.downloadBlob(blob, filename);
  }

  private downloadPDF(data: any[], filename: string): void {
    // In a real app, you'd use a library like jsPDF to generate PDF files
    const textContent = this.generateTextContent(data);
    const blob = new Blob([textContent], { type: 'application/pdf' });
    this.downloadBlob(blob, filename);
  }

  private generateCSVContent(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    return [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
  }

  private generateTextContent(data: any[]): string {
    return `Purchase Request Report\n\nGenerated: ${new Date().toLocaleDateString()}\n\n${JSON.stringify(data, null, 2)}`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getSelectedTemplate(): ExportTemplate | undefined {
    return this.exportTemplates.find(t => t.id === this.selectedTemplate());
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatFileSize(size: string): string {
    return size;
  }

  downloadRecentExport(exportItem: any): void {
    // In a real app, this would download the previously generated file
    alert(`Downloading ${exportItem.name}...`);
  }

  deleteRecentExport(exportId: string): void {
    const current = this.recentExports();
    this.recentExports.set(current.filter(exp => exp.id !== exportId));
  }

  clearFilters(): void {
    this.initializeFilters();
  }
}
