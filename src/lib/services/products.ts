// src/lib/services/products.ts
import { api } from './api';
import type { Product } from '$lib/types/product';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Get products with pagination
 */
export async function getProducts(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Product>> {
  try {
    // Make the API call with error handling
    const response = await api.get('/produkpost/', {}, {
      page,
      page_size: pageSize
    });
    
    // Add basic validation that the response has expected shape
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format');
    }
    
    // Ensure results is always an array
    if (!Array.isArray(response.results)) {
      console.warn('API returned invalid results format, defaulting to empty array');
      response.results = [];
    }
    
    return {
      count: response.count || 0,
      next: response.next || null,
      previous: response.previous || null,
      results: response.results
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Return empty result set instead of throwing
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    };
  }
}

/**
 * Get all products (without pagination)
 * Kept for backward compatibility
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await getProducts(1, 1000); // Get a large number of products
    return response.results;
  } catch (error) {
    console.error('Error fetching all products:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product> {
  try {
    return await api.get(`/produkpost/${id}/`);
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    throw new Error('Failed to fetch product details');
  }
}

/**
 * Create new product
 */
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  try {
    return await api.post('/produkpost/', productData);
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
}

/**
 * Update existing product
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  try {
    return await api.put(`/produkpost/${id}/`, productData);
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error);
    throw new Error('Failed to update product');
  }
}

/**
 * Delete product
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await api.delete(`/produkpost/${id}/`);
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    throw new Error('Failed to delete product');
  }
}