import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useToast } from '@/contexts/ToastContext';

export interface RequestError extends Error {
  status?: number;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: RequestError | undefined;
}

class ApiClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(baseURL: string = 'https://spotiapi-khaki.vercel.app/api') {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds timeout
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      let response;
      
      switch (method) {
        case 'GET':
          response = await this.axiosInstance.get<T>(url, config);
          break;
        case 'POST':
          response = await this.axiosInstance.post<T>(url, data, config);
          break;
        case 'PUT':
          response = await this.axiosInstance.put<T>(url, data, config);
          break;
        case 'DELETE':
          response = await this.axiosInstance.delete<T>(url, config);
          break;
      }

      return { data: response.data };
    } catch (error: any) {
      console.error(`API Error (${method} ${url}):`, error);
      
      const status = error?.response?.status;
      const details = error?.response?.data;
      
      // For 404 errors on playlist endpoints, return null instead of throwing
      if (status === 404 && url.includes('/playlists/')) {
        return { data: null as T };
      }

      return {
        error: {
          message: `Failed to ${method.toLowerCase()} ${url}`,
          status,
          details,
          name: 'API_ERROR',
        },
      };
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}

// Create singleton instance
export const apiClient = new ApiClient(); 