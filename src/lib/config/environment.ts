import { browser } from '$app/environment';

export interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  NODE_ENV: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
}

/**
 * Get environment configuration with fallbacks
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Default development values
  const defaultConfig = {
    API_BASE_URL: 'http://localhost:8000/api/v1',
    WS_BASE_URL: 'ws://localhost:8000',
    APP_NAME: 'Konveksi Admin Panel',
    APP_VERSION: '1.0.0',
    NODE_ENV: 'development'
  };

  // Production values  
  const productionConfig = {
    API_BASE_URL: 'https://f808-180-254-65-209.ngrok-free.app/api/v1',
    WS_BASE_URL: 'wss://f808-180-254-65-209.ngrok-free.app',
    APP_NAME: 'Konveksi Admin Panel',
    APP_VERSION: '1.0.0',
    NODE_ENV: 'production'
  };

  let config: any = {};

  if (browser) {
    // Vercel/Netlify/Production environment
    const isProduction = import.meta.env.MODE === 'production' || 
                        import.meta.env.PROD === true ||
                        typeof window !== 'undefined';

    config = {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (isProduction ? productionConfig.API_BASE_URL : defaultConfig.API_BASE_URL),
      WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || (isProduction ? productionConfig.WS_BASE_URL : defaultConfig.WS_BASE_URL),
      APP_NAME: import.meta.env.VITE_APP_NAME || defaultConfig.APP_NAME,
      APP_VERSION: import.meta.env.VITE_APP_VERSION || defaultConfig.APP_VERSION,
      NODE_ENV: import.meta.env.NODE_ENV || (isProduction ? 'production' : 'development')
    };

    // Debug logging
    console.log('🔧 Environment Configuration:');
    console.log('  - Mode:', import.meta.env.MODE);
    console.log('  - Prod:', import.meta.env.PROD);
    console.log('  - SSR:', import.meta.env.SSR);
    console.log('  - API_BASE_URL:', config.API_BASE_URL);
    console.log('  - WS_BASE_URL:', config.WS_BASE_URL);
    console.log('  - NODE_ENV:', config.NODE_ENV);
    
    // Check if environment variables are set
    const envVars = ['VITE_API_BASE_URL', 'VITE_WS_BASE_URL', 'VITE_APP_NAME', 'VITE_APP_VERSION'];
    envVars.forEach(envVar => {
      const value = (import.meta.env as any)[envVar];
      if (!value) {
        console.warn(`⚠️ Environment variable ${envVar} is not set, using fallback`);
      } else {
        console.log(`✅ ${envVar}: ${value}`);
      }
    });
  } else {
    // Server-side rendering - use default config
    config = defaultConfig;
  }

  // Clean URLs (remove trailing slashes)
  config.API_BASE_URL = config.API_BASE_URL.replace(/\/$/, '');
  config.WS_BASE_URL = config.WS_BASE_URL.replace(/\/$/, '');

  const finalConfig: EnvironmentConfig = {
    ...config,
    IS_DEVELOPMENT: config.NODE_ENV === 'development',
    IS_PRODUCTION: config.NODE_ENV === 'production'
  };

  return finalConfig;
}

// Export the configuration
export const ENV = getEnvironmentConfig(); 