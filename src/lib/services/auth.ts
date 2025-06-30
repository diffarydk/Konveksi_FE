// src/lib/services/auth.ts - Improved version with WebSocket initialization
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';
import type { User } from '$lib/types/user';
import { api } from './api';

interface LoginResponse {
  user: User;
  access: string;
}

interface RefreshResponse {
  access: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${api.baseUrl}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw { status: response.status, data: error };
    }

    const data = await response.json();
    
    // Store access token and user data (refresh token is in HTTP-only cookie)
    if (browser) {
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Update auth store
    auth.set({
      isAuthenticated: true,
      user: data.user,
      accessToken: data.access
    });
    
    // Initialize real-time connections after login
    await initializeRealtimeConnections();
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function refreshAccessToken(): Promise<{access: string}> {
  try {
    const response = await fetch(`${api.baseUrl}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include', // Important for cookies
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }
    
    const data = await response.json();
    
    auth.update(state => ({
      ...state,
      accessToken: data.access
    }));
    
    if (browser) {
      localStorage.setItem('accessToken', data.access);
    }
    
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${api.baseUrl}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Reset auth store
    auth.set({
      isAuthenticated: false,
      user: null,
      accessToken: null
    });
    
    // Clear local storage
    if (browser) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }
}

/**
 * Initialize WebSocket connections after authentication is confirmed
 * Using dynamic import to avoid circular dependency
 */
async function initializeRealtimeConnections(): Promise<void> {
  try {
    console.log('🔌 initializeRealtimeConnections: Starting...');
    
    // Get current auth state to access token
    const authState = get(auth);
    
    console.log('🔍 initializeRealtimeConnections: Auth state check:');
    console.log('  - authState exists:', !!authState);
    console.log('  - isAuthenticated:', authState?.isAuthenticated);
    console.log('  - user exists:', !!authState?.user);
    console.log('  - user.username:', authState?.user?.username);
    console.log('  - accessToken exists:', !!authState?.accessToken);
    
    if (!authState || !authState.isAuthenticated) {
      console.log('❌ initializeRealtimeConnections: Criteria not met, skipping WebSocket connection');
      console.log('  - Missing authState:', !authState);
      console.log('  - Not authenticated:', !authState?.isAuthenticated);
      return;
    }
    
    if (!authState.accessToken) {
      console.warn('⚠️ initializeRealtimeConnections: No access token available for WebSocket connection');
      return;
    }
    
    // Dynamic import to avoid circular dependency with ordersStore
    console.log('📦 initializeRealtimeConnections: Loading ordersStore...');
    const { ordersStore } = await import('$lib/stores/ordersStore');
    
    console.log('✅ initializeRealtimeConnections: All checks passed!');
    console.log('🔑 Auth successful, attempting to connect WebSocket with JWT token...');
    console.log('🔌 Triggering real-time connections after auth success...');
    await ordersStore.initRealtimeConnection();
    
  } catch (error) {
    console.error('❌ initializeRealtimeConnections: Failed to initialize real-time connections:', error);
    // Don't throw - app should continue to work without WebSocket
  }
}

export async function initAuth(): Promise<boolean> {
  if (!browser) return false;
  
  const accessToken = localStorage.getItem('accessToken');
  const userJson = localStorage.getItem('user');
  
  console.log('🔄 initAuth: Starting authentication restoration...');
  console.log('🔑 Token available:', !!accessToken);
  console.log('👤 User data available:', !!userJson);
  
  if (!accessToken || !userJson) {
    console.log('❌ initAuth: No stored credentials found');
    return false;
  }
  
  try {
    const user = JSON.parse(userJson);
    
    console.log('👤 initAuth: Restoring user:', user.username);
    
    // Set auth state from localStorage
    auth.set({
      isAuthenticated: true,
      user,
      accessToken
    });
    
    console.log('✅ initAuth: Auth state updated in store');
    
    // Validate token - use explicit Authorization header to avoid race condition
    try {
      console.log('🔍 initAuth: Validating token with explicit header...');
      
      // Manual fetch with explicit Authorization header (bypasses api.ts race condition)
      const response = await fetch(`${api.baseUrl}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Explicit token
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const profileData = await response.json();
        console.log('✅ initAuth: Token validation successful');
        console.log('👤 initAuth: Profile confirmed:', profileData.username);
        
        // Initialize real-time connections after auth confirmation
        await initializeRealtimeConnections();
        
        return true; // Authentication successful
      } else {
        throw new Error(`Token validation failed: ${response.status}`);
      }
      
    } catch (error: any) {
      console.log('❌ initAuth: Token validation failed:', error.message);
      
      // Only attempt refresh if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔄 initAuth: Attempting token refresh...');
        
        try {
          const refreshResult = await refreshAccessToken();
          console.log('✅ initAuth: Token refreshed successfully');
          
          // Update auth state with new token
          auth.update(state => ({
            ...state,
            accessToken: refreshResult.access
          }));
          
          // Initialize real-time connections after token refresh
          await initializeRealtimeConnections();
          
          return true; // Refresh successful
        } catch (refreshError) {
          console.error('❌ initAuth: Token refresh failed:', refreshError);
          // Clear invalid authentication
          await logout();
          return false;
        }
      }
      
      // For non-auth errors, maintain authenticated state but log warning
      console.log('⚠️ initAuth: Non-auth error during validation, maintaining auth state');
      
      // Still try to initialize real-time connections
      try {
        await initializeRealtimeConnections();
      } catch (rtError) {
        console.warn('⚠️ initAuth: Real-time connection failed:', rtError);
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ initAuth: Error parsing user data:', error);
    await logout();
    return false;
  }
}