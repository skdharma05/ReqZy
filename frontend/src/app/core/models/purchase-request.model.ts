import { User  } from './user.model';
import { Department } from './department.model';
import { Category } from './category.model';

export interface PurchaseRequest {
  _id?: string;  // MongoDB ObjectId
  id?: string;   // Serialized ID
  createdBy: string;
  item: string;
  quantity: number;
  status: PRStatus;
  departmentId: string;
  totalValue: number;
  approvalWorkflowId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  department?: Department;
  creator?: User;
}

export enum PRStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// export interface Category {
//   id: string;
//   name: string;
//   rules?: any;
// }

export interface CreatePRRequest {
  item: string;
  quantity: number;
  departmentId: string;
  totalValue: number;
  categoryId: string;
}

export interface UpdatePRRequest {
  item?: string;
  quantity?: number;
  totalValue?: number;
  categoryId?: string;
}

// Re-export types from user.model.ts for convenience
export type { User  } from './user.model';
