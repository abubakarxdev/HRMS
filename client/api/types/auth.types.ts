import { Role } from '../../types';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
  timezone: string;
  firstName?: string;
  lastName?: string;
  employeeIdNumber?: string;
  officeId?: string;
  legalEntityId?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface DecodedToken {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
  timezone: string;
  firstName?: string;
  lastName?: string;
  officeId?: string;
  iat: number;
  exp: number;
}
