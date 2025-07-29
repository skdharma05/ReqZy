import { User } from './user.model';
import { PurchaseRequest } from './purchase-request.model';

export interface Approval {
  id: string;
  prId: string;
  status: ApprovalStatus;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  comments?: string;
  approverId: string;
  approver?: User;
  pr?: PurchaseRequest;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface ApprovalWorkflow {
  id: string;
  departmentId: string;
  name: string;
  rules: WorkflowRule[];
}

export interface WorkflowRule {
  id: string;
  workflowId: string;
  condition: string;
  action: string;
}

export interface CreateApprovalRequest {
  prId: string;
  status: ApprovalStatus;
  comments?: string;
}

export interface ApprovalHistoryItem {
  approval: Approval;
  timestamp: Date;
  action: string;
}
