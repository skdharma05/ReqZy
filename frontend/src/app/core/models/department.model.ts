export interface Department {
  _id: string;
  name: string;
  description?: string;
  manager?: string;
  budget?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
