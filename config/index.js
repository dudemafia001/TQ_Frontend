// Configuration for the frontend application
// This file centralizes all environment-dependent configurations

const config = {
  // API Configuration
  api: {
    // Base URL for backend API
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001',
    
    // API endpoints
    endpoints: {
      // Authentication endpoints
      auth: {
        login: '/api/auth/login',
        signup: '/api/auth/signup',
        logout: '/api/auth/logout',
        profile: '/api/auth/profile'
      },
      
      // OTP endpoints
      otp: {
        generate: '/api/otp/generate',
        verify: '/api/otp/verify'
      },
      
      // Product endpoints
      products: '/api/products',
      
      // Order endpoints
      orders: {
        base: '/api/orders',
        user: '/api/orders/user'
      },
      
      // Payment endpoints
      payments: {
        createOrder: '/api/payments/create-order',
        verify: '/api/payments/verify',
        cash: '/api/payments/cash'
      },
      
      // Coupon endpoints
      coupons: {
        active: '/api/coupons/active',
        validate: '/api/coupons/validate'
      },
      
      // Admin endpoints
      admin: {
        login: '/api/admin/login',
        orders: '/api/admin/orders',
        analytics: '/api/admin/analytics'
      },
      
      // Contact endpoints
      contact: '/api/contact'
    }
  },

  // App Configuration
  app: {
    name: 'The Quisine',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },

  // External Services
  services: {
    // WhatsApp Configuration
    whatsapp: {
      number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917992132123',
      baseUrl: 'https://wa.me'
    },
    
    // Phone Configuration
    phone: {
      support: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '7992132123'
    }
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enablePushNotifications: process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
    maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Helper function to get WhatsApp URL
export const buildWhatsAppUrl = (message = '') => {
  const encodedMessage = encodeURIComponent(message);
  return `${config.services.whatsapp.baseUrl}/${config.services.whatsapp.number}?text=${encodedMessage}`;
};

export default config;