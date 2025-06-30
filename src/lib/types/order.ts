// src/lib/types/order.ts

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  total_price: string;
  payment_type: 'dp' | 'full';
  dp_percent?: string;
  design?: string;
  contact_information: string;
  notification_channel: 'whatsapp' | 'email' | 'both';
  design_notes?: string;
  paid_amount: string;
  is_fully_paid: boolean;
  status_order: 'menunggu_link' | 'link_dibuat' | 'dp_dibayar' | 'pengerjaan_selesai' | 'menunggu_pelunasan' | 'lunas' | 'dibatalkan';
  production_status: 'menunggu' | 'diproses' | 'selesai' | 'dikirim' | 'dibatalkan';
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  customer_name: string;
  product_name: string;
  quantity: number;
  total_price: string;
  payment_type: 'dp' | 'full';
  dp_percent?: number;
  design?: File;
  contact_information: string;
  notification_channel?: 'whatsapp' | 'email' | 'both';
  design_notes?: string;
  paid_amount: string;
  is_fully_paid: boolean;
}

export interface Invoice {
  id: string;
  invoice_code: string;
  order: string;
  payment_type: 'dp' | 'full' | 'pelunasan';
  dp_percent?: string;
  invoice_amount: string;
  invoice_status: 'belum dibayar' | 'sudah dibayar' | 'kadaluarsa' | 'dibatalkan';
  payment_url?: string;
  xendit_invoice_id?: string;
  notification_channel: 'whatsapp' | 'email' | 'both';
  blast_notification: boolean;
  invoice_created_at: string;
  invoice_expired_at?: string;
  invoice_paid_at?: string;
}

export interface Payment {
  id: string;
  invoice: string;
  payment_method: string;
  amount: string;
  payment_time: string;
  contact_info: string;
  notes?: string;
}

export interface OrderWithInvoices {
  order: Order;
  invoices: Invoice[];
  payments: Payment[];
  summary: {
    total_price: number;
    total_paid: number;
    remaining: number;
    is_fully_paid: boolean;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    invoice: Invoice;
  };
  payment_url?: string;
}

// Order status constants
export const ORDER_STATUS = {
  MENUNGGU_LINK: 'menunggu_link',
  LINK_DIBUAT: 'link_dibuat', 
  DP_DIBAYAR: 'dp_dibayar',
  MENUNGGU_PELUNASAN: 'menunggu_pelunasan',
  LUNAS: 'lunas',
  DIBATALKAN: 'dibatalkan'
} as const;

export const PRODUCTION_STATUS = {
  MENUNGGU: 'menunggu',
  DIPROSES: 'diproses',
  SELESAI: 'selesai'
} as const;

export const PAYMENT_TYPE = {
  DP: 'dp',
  FULL: 'full',
  PELUNASAN: 'pelunasan'
} as const;

export const INVOICE_STATUS = {
  BELUM_DIBAYAR: 'belum dibayar',
  SUDAH_DIBAYAR: 'sudah dibayar',
  KADALUARSA: 'kadaluarsa',
  DIBATALKAN: 'dibatalkan'
} as const;