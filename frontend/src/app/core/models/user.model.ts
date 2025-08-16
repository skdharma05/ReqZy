import type {  Department } from "./department.model";
export interface User {
  id: string;
  email: string;
  roleId: string;
  departmentId: string;
  role?: Role;
  department?: Department;
  isSuperUser?: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

// export interface Department {
//   id: string;
//   _id?: string;
//   name: string;
//   description?: string;
//   manager?: string;
//   budget?: number;
//   isActive?: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
}
