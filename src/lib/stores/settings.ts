import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Tipe data untuk setiap kategori pengaturan
export interface GeneralSettings {
  siteName: string;
  logoUrl: string;
  contactEmail: string;
  defaultCurrency: 'IDR' | 'USD';
  maintenanceMode: boolean;
}

export interface ApiSettings {
  xenditApiKey: string;
  fonntteToken: string;
}

export interface EmailNotificationSettings {
  enableNewOrderNotifications: boolean;
  adminEmails: string[];
  emailHeader: string;
  emailFooter: string;
}

export interface SecuritySettings {
  requireTwoFactor: boolean;
  sessionDuration: number; // dalam jam
}

export interface RealTimeSettings {
  websocketConnected: boolean;
  pollingActive: boolean;
  fallbackMode: boolean;
  lastUpdate: string | null;
}

export interface AllSettings {
  general: GeneralSettings;
  api: ApiSettings;
  emailNotifications: EmailNotificationSettings;
  security: SecuritySettings;
  realTime: RealTimeSettings;
}

// State untuk UI
export interface SettingsUIState {
  activeTab: string;
  isLoading: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
}

// State untuk notifikasi
export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
  timeout?: number;
}

// Default values
const defaultSettings: AllSettings = {
  general: {
    siteName: 'Kaos Polos Berkualitas',
    logoUrl: '/images/logo.jpg',
    contactEmail: 'admin@kaospolos.com',
    defaultCurrency: 'IDR',
    maintenanceMode: false
  },
  api: {
    xenditApiKey: '',
    fonntteToken: ''
  },
  emailNotifications: {
    enableNewOrderNotifications: true,
    adminEmails: ['admin@kaospolos.com'],
    emailHeader: '<h2>Kaos Polos Berkualitas</h2>',
    emailFooter: '<p>Terima kasih telah menggunakan layanan kami.</p>'
  },
  security: {
    requireTwoFactor: false,
    sessionDuration: 8
  },
  realTime: {
    websocketConnected: false,
    pollingActive: false,
    fallbackMode: false,
    lastUpdate: null
  }
};

const defaultUIState: SettingsUIState = {
  activeTab: 'general',
  isLoading: false,
  hasChanges: false,
  isSaving: false,
  errors: {}
};

const defaultNotificationState: NotificationState = {
  type: 'info',
  message: '',
  visible: false
};

// Create settings store
function createSettingsStore() {
  const settings = writable<AllSettings>(defaultSettings);
  const originalSettings = writable<AllSettings>(defaultSettings);
  const uiState = writable<SettingsUIState>(defaultUIState);
  const notification = writable<NotificationState>(defaultNotificationState);

  // Derived store untuk mengecek perubahan
  const hasChanges = derived(
    [settings, originalSettings],
    ([$settings, $originalSettings]) => {
      return JSON.stringify($settings) !== JSON.stringify($originalSettings);
    }
  );

  return {
    // Subscriptions
    settings: { subscribe: settings.subscribe },
    originalSettings: { subscribe: originalSettings.subscribe },
    uiState: { subscribe: uiState.subscribe },
    notification: { subscribe: notification.subscribe },
    hasChanges: { subscribe: hasChanges.subscribe },

    // Actions
    loadSettings: (newSettings: AllSettings) => {
      settings.set(newSettings);
      originalSettings.set(newSettings);
      uiState.update(state => ({ ...state, isLoading: false }));
    },

    updateSettings: (category: keyof AllSettings, newData: Partial<any>) => {
      settings.update(current => ({
        ...current,
        [category]: { ...current[category], ...newData }
      }));
      
      // Update UI state untuk tracking perubahan
      uiState.update(state => ({ ...state, errors: {} }));
    },

    setActiveTab: (tab: string) => {
      uiState.update(state => ({ ...state, activeTab: tab }));
    },

    setLoading: (loading: boolean) => {
      uiState.update(state => ({ ...state, isLoading: loading }));
    },

    setSaving: (saving: boolean) => {
      uiState.update(state => ({ ...state, isSaving: saving }));
    },

    setErrors: (errors: Record<string, string>) => {
      uiState.update(state => ({ ...state, errors }));
    },

    clearErrors: () => {
      uiState.update(state => ({ ...state, errors: {} }));
    },

    resetChanges: () => {
      originalSettings.subscribe(original => {
        settings.set(original);
      })();
    },

    saveSuccess: (newSettings: AllSettings) => {
      settings.set(newSettings);
      originalSettings.set(newSettings);
      uiState.update(state => ({ 
        ...state, 
        isSaving: false, 
        errors: {} 
      }));
      
      // Show success notification
      showNotification('success', 'Pengaturan berhasil disimpan!');
    },

    saveError: (errors: Record<string, string>) => {
      uiState.update(state => ({ 
        ...state, 
        isSaving: false, 
        errors 
      }));
      
      // Show error notification
      showNotification('error', 'Gagal menyimpan pengaturan. Periksa kesalahan di bawah.');
    },

    // Notification actions
    showNotification: (type: NotificationState['type'], message: string, timeout = 5000) => {
      notification.set({ type, message, visible: true, timeout });
      
      if (timeout > 0) {
        setTimeout(() => {
          notification.update(state => ({ ...state, visible: false }));
        }, timeout);
      }
    },

    hideNotification: () => {
      notification.update(state => ({ ...state, visible: false }));
    },

    // Field validation
    validateField: (category: keyof AllSettings, field: string, value: any) => {
      const errors: Record<string, string> = {};
      
      // Validasi email
      if (field.includes('email') || field.includes('Email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors[`${category}.${field}`] = 'Format email tidak valid';
        }
      }
      
      // Validasi URL
      if (field.includes('Url') || field.includes('url')) {
        try {
          if (value && value.trim()) {
            new URL(value);
          }
        } catch {
          errors[`${category}.${field}`] = 'Format URL tidak valid';
        }
      }
      
      // Validasi required fields
      const requiredFields = ['siteName', 'contactEmail'];
      if (requiredFields.includes(field) && (!value || value.trim() === '')) {
        errors[`${category}.${field}`] = 'Field ini wajib diisi';
      }
      
      uiState.update(state => ({
        ...state,
        errors: { ...state.errors, ...errors }
      }));
      
      return Object.keys(errors).length === 0;
    }
  };
}

// Helper function for notifications
function showNotification(type: NotificationState['type'], message: string, timeout = 5000) {
  settingsStore.showNotification(type, message, timeout);
}

export const settingsStore = createSettingsStore();

// Export helper functions
export { showNotification };

// Utility functions untuk komponen
export function getTabIcon(tabId: string): string {
  const icons: Record<string, string> = {
    general: '⚙️',
    api: '🔑',
    emailNotifications: '📧',
    security: '🔒',
    realTime: '🔌'
  };
  return icons[tabId] || '📄';
}

export function getTabLabel(tabId: string): string {
  const labels: Record<string, string> = {
    general: 'Pengaturan Umum',
    api: 'Integrasi API',
    emailNotifications: 'Notifikasi Email',
    security: 'Keamanan',
    realTime: 'Real-time & Debug'
  };
  return labels[tabId] || 'Unknown';
} 