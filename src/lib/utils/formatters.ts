// src/lib/utils/formatters.ts

/**
 * Format a number as currency (Indonesian Rupiah)
 * 
 * @param value - The number to format
 * @param prefix - The prefix to use (default: 'Rp')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, prefix: string = 'Rp'): string {
  const formatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return `${prefix} ${formatter.format(value)}`;
}

/**
 * Format a date string
 * 
 * @param dateString - The date string to format
 * @param format - The format to use (default: 'short')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid date
    }
    
    if (format === 'long') {
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('id-ID');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a number with thousand separators
 * 
 * @param value - The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Truncate text to a specified length
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 100, suffix: string = '...'): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + suffix;
}

/**
 * Format file size in human-readable format
 * 
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}