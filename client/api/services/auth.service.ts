import { apiClient, setAccessToken, setRefreshToken, clearTokens } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfile,
  DecodedToken,
} from '../types/auth.types';
import { jwtDecode } from 'jwt-decode';

/**
 * Auth Service
 * Handles authentication operations
 */
export const authService = {
  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<UserProfile> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);

    const { accessToken, refreshToken, user } = response.data;

    // Store tokens
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    return user;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<string> => {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', data);
    const { accessToken } = response.data;
    setAccessToken(accessToken);
    return accessToken;
  },

  /**
   * Get current user profile from token
   */
  getProfile: (): UserProfile | null => {
    const token = localStorage.getItem('token');

    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        employeeId: decoded.employeeId,
        timezone: decoded.timezone,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        officeId: decoded.officeId,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },
};
