// Payment configuration
export const paymentConfig = {
  // Base URL for your application
  baseUrl: typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:5175',
  
  // Payment success redirect URL
  getSuccessUrl: (orderCode: string, invoiceCode: string) => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:5175';
    
    return `${baseUrl}/payment-success?order=${orderCode}&invoice=${invoiceCode}`;
  },
  
  // Payment failed redirect URL
  getFailureUrl: (orderCode: string, invoiceCode: string) => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:5175';
    
    return `${baseUrl}/payment-failed?order=${orderCode}&invoice=${invoiceCode}`;
  },
  
  // Payment pending redirect URL
  getPendingUrl: (orderCode: string, invoiceCode: string) => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:5175';
    
    return `${baseUrl}/tracking?code=${orderCode}`;
  }
};

export default paymentConfig; 