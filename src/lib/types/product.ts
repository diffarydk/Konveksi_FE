// src/lib/types/product.ts

export interface Product {
  id: string;
  nama: string;
  deskripsi?: string;
  harga: number;
  stok?: number;
  kategori?: string;
  // Add more fields as needed based on your API
}