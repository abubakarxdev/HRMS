// Employee Types (Updated for new schema)
export interface Employee {
  id: string;
  employeeIdNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string | null;
  avatarUrl?: string | null;
  status: string;
  joiningDate: string;
  personalDetails?: Record<string, any> | null;
  bankDetails?: Record<string, any> | null;
  legalEntityId?: string | null;
  officeId?: string | null;
  managerId?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'FINANCE' | 'EMPLOYEE';
    timezone: string;
  };
  legalEntity?: {
    id: string;
    name: string;
  } | null;
  office?: {
    id: string;
    name: string;
  } | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;

  contracts?: {
    id: string;
    position: string;
    department?: string;
    type: string;
    startDate: string;
    isActive: boolean;
  }[];

  // Legacy fields (optional for compatibility)
  name?: string;
  position?: string;
  department?: string;
}

export interface CreateEmployeeRequest {
  // Employee fields
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  avatarUrl?: string;
  status?: string;
  joiningDate: string;
  personalDetails?: Record<string, any>;
  bankDetails?: Record<string, any>;
  legalEntityId?: string;
  officeId?: string;
  managerId?: string;
  employeeIdNumber?: string;

  // User fields
  email: string;
  password: string;
  role?: 'ADMIN' | 'HR' | 'FINANCE' | 'EMPLOYEE';
  timezone?: string;
}

export interface UpdateEmployeeRequest {
  // Employee fields
  firstName?: string;
  lastName?: string;
  workEmail?: string;
  personalEmail?: string;
  avatarUrl?: string;
  status?: string;
  joiningDate?: string;
  personalDetails?: Record<string, any>;
  bankDetails?: Record<string, any>;
  legalEntityId?: string;
  officeId?: string;
  managerId?: string;

  // User fields
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'HR' | 'FINANCE' | 'EMPLOYEE';
  timezone?: string;
}
