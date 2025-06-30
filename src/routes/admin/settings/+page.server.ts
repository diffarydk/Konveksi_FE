import type { PageServerLoad } from './$types';
import type { AllSettings } from '$lib/stores/settings';

// Simulasi fetch data dari backend
// Dalam implementasi nyata, ini akan mengambil data dari API Django
async function fetchSettingsFromBackend(): Promise<AllSettings> {
  // TODO: Replace with actual API call to Django backend
  // const response = await fetch('/api/v1/settings/', {
  //   headers: {
  //     'Authorization': `Bearer ${cookies.get('auth_token')}`
  //   }
  // });
  // return response.json();
  
  // Default/mock data untuk development
  return {
    general: {
      siteName: 'Kaos Polos Berkualitas',
      logoUrl: '/images/logo.jpg',
      contactEmail: 'admin@kaospolos.com',
      defaultCurrency: 'IDR',
      maintenanceMode: false
    },
    api: {
      googleMapsApiKey: '',
      stripeApiKey: '',
      midtransApiKey: '',
      facebookPixelId: '',
      tiktokPixelId: ''
    },
    emailNotifications: {
      enableNewOrderNotifications: true,
      adminEmails: ['admin@kaospolos.com'],
      emailHeader: '<h2>Kaos Polos Berkualitas</h2><p>Kualitas Terbaik untuk Gaya Anda</p>',
      emailFooter: '<p>Terima kasih telah menggunakan layanan kami.</p><p>© 2024 Kaos Polos Berkualitas. All rights reserved.</p>'
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
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  try {
    // Load settings data dari backend
    const settings = await fetchSettingsFromBackend();
    
    // Get active tab dari URL parameter (default ke 'general')
    const activeTab = url.searchParams.get('tab') || 'general';
    
    // Validate tab
    const validTabs = ['general', 'api', 'emailNotifications', 'security', 'realTime'];
    const validatedTab = validTabs.includes(activeTab) ? activeTab : 'general';
    
    return {
      settings,
      activeTab: validatedTab,
      meta: {
        title: 'Pengaturan Sistem - Admin Panel',
        description: 'Kelola pengaturan sistem dan konfigurasi aplikasi'
      }
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    
    // Return minimal data on error
    return {
      settings: null,
      activeTab: 'general',
      error: 'Gagal memuat data pengaturan. Silakan coba lagi.',
      meta: {
        title: 'Error - Pengaturan Sistem',
        description: 'Terjadi kesalahan saat memuat pengaturan'
      }
    };
  }
}; 