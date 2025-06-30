// src/lib/stores/auth.ts
import { writable } from 'svelte/store';
import type { User } from '$lib/types/user';

type AuthState = {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
};

// Initialize store with default values
export const auth = writable<AuthState>({
  isAuthenticated: false,
  accessToken: null,
  user: null
});