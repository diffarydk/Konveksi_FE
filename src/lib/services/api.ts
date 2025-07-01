// src/lib/services/api.ts
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';
import { refreshAccessToken, logout } from './auth';
import { ENV } from '$lib/config/environment';

// Use centralized environment configuration
const baseUrl = ENV.API_BASE_URL;

/**
 * Extract CSRF token from cookies for Django
 */
function getCsrfToken(): string | null {
  if (!browser) return null;
  
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));
    
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

/**
 * Build URL with query parameters
 */
function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params) return url;
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Safely join URL segments avoiding double slashes
 */
function joinUrlPath(base: string, path: string): string {
  const cleanBase = base.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.replace(/^\//, ''); // Remove leading slash
  return `${cleanBase}/${cleanPath}`;
}

// Add debounce for token refresh to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

async function getValidToken() {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken()
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Check if endpoint requires authentication
 */
function requiresAuth(url: string): boolean {
  const publicEndpoints = [
    '/auth/login/',
    '/auth/register/',
    '/track-order/',
    '/invoice/detail/',
    '/health/',
    '/'
  ];
  
  return !publicEndpoints.some(endpoint => url.startsWith(endpoint));
}

/**
 * Simple fetch wrapper untuk API calls with authentication
 */
async function apiFetch(
  url: string, 
  options: RequestInit = {},
  params?: Record<string, any>,
  forceToken?: string  // Added parameter for explicit token
): Promise<any> {
  const headers = new Headers(options.headers);
  
  // Set default content type
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  // Add ngrok header to bypass browser warning
  headers.set('ngrok-skip-browser-warning', 'true');
  
  // Add Authorization header for protected endpoints
  if (browser && requiresAuth(url)) {
    let accessToken = forceToken; // Use explicit token if provided
    
    if (!accessToken) {
      // Fallback to auth store
      const authState = get(auth);
      accessToken = authState.accessToken;
    }
    
    // Also check localStorage as backup
    if (!accessToken) {
      const token = localStorage.getItem('accessToken');
      accessToken = token ? token : undefined;
    }
    
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      console.log(`🔑 Added Authorization header for ${url} (token: ${accessToken.substring(0, 10)}...)`);
    } else {
      console.warn(`⚠️ No access token available for protected endpoint: ${url}`);
    }
  }
  
  // Add CSRF token for non-GET requests (Django requirement)
  const method = options.method || 'GET';
  if (method !== 'GET' && browser) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }
  
  // Build full URL using safe URL joining
  const fullUrl = buildUrl(joinUrlPath(baseUrl, url), params);
  
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Include cookies
  };
  
  try {
    console.log(`📡 API ${method}: ${fullUrl}`);
    
    const response = await fetch(fullUrl, fetchOptions);
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && browser && requiresAuth(url)) {
      console.log('🔄 401 detected, attempting token refresh...');
      
      try {
        // Try to refresh the token
        await getValidToken();
        
        // Update the Authorization header with new token
        const authState = get(auth);
        if (authState.accessToken) {
          headers.set('Authorization', `Bearer ${authState.accessToken}`);
          
          // Retry the request with new token
          const retryOptions: RequestInit = {
            ...options,
            headers,
            credentials: 'include'
          };
          
          console.log('🔄 Retrying request with new token...');
          const retryResponse = await fetch(fullUrl, retryOptions);
          
          if (retryResponse.ok) {
            console.log('✅ Retry successful after token refresh');
            const contentType = retryResponse.headers.get('content-type');
            
            if (retryResponse.status === 204) {
              return null;
            } else if (contentType && contentType.includes('application/json')) {
              return await retryResponse.json();
            } else {
              return await retryResponse.text();
            }
          }
          
          // If retry also fails, continue with original error handling
          console.log('❌ Retry also failed, proceeding with logout');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
      }
      
      // If token refresh fails or retry fails, logout user
      await logout();
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }
    
    // Handle other error responses
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.detail || errorData.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Handle successful responses
    const contentType = response.headers.get('content-type');
    
    if (response.status === 204) {
      return null; // No content
    } else if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
    
  } catch (error: any) {
    console.error(`❌ API Error ${method} ${url}:`, error.message);
    
    // Rethrow with better error message
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      		throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan di https://f808-180-254-65-209.ngrok-free.app');
    }
    
    throw error;
  }
}

export const api = {
  baseUrl,
  
  // Health check
  async healthCheck(): Promise<{status: string, message: string}> {
    try {
      await this.get('/');
      return { status: 'healthy', message: 'Backend connection successful' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  },
  
  // HTTP Methods
  async get(url: string, options: RequestInit = {}, params?: Record<string, any>): Promise<any> {
    return apiFetch(url, { ...options, method: 'GET' }, params);
  },
  
  async post(url: string, data: any, options: RequestInit = {}): Promise<any> {
    return apiFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async put(url: string, data: any, options: RequestInit = {}): Promise<any> {
    return apiFetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async patch(url: string, data: any, options: RequestInit = {}): Promise<any> {
    return apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  async delete(url: string, options: RequestInit = {}): Promise<any> {
    return apiFetch(url, {
      ...options,
      method: 'DELETE'
    });
  },
  
  // File upload (FormData)
  async uploadFile(url: string, formData: FormData, options: RequestInit = {}): Promise<any> {
    const headers = new Headers(options.headers);
    // Don't set Content-Type for FormData - browser will set it with boundary
    headers.delete('Content-Type');
    
    // Add CSRF token for file uploads
    if (browser) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers.set('X-CSRFToken', csrfToken);
      }
    }
    
    return apiFetch(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers
    });
  },
  
  // Debug function to test different endpoints
  async debugEndpoint(endpoint: string, method: string = 'GET', data?: any): Promise<{status: string, message: string, details?: any}> {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`🔍 Testing endpoint: ${method} ${fullUrl}`);
    
    try {
      const headers: any = { 
        'ngrok-skip-browser-warning': 'true'
      };
      
      if (data && method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }
      
      const options: RequestInit = {
        method,
        headers,
        credentials: 'include',
        signal: AbortSignal.timeout(10000)
      };
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(fullUrl, options);
      
      console.log(`📊 Response: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      return { 
        status: response.ok ? 'success' : 'error', 
        message: `${method} ${endpoint}: ${response.status} ${response.statusText}`,
        details: { 
          status: response.status, 
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        }
      };
    } catch (error: any) {
      console.error('❌ Debug endpoint error:', error);
      return { 
        status: 'error', 
        message: `${method} ${endpoint}: ${error.message}`,
        details: { errorType: error.name, error: error.message, fullUrl }
      };
    }
  }
};