import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { api } from '$lib/services/api';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();

    // Extract form data
    const customer_name = formData.get('customer_name')?.toString();
    const product_name = formData.get('product_name')?.toString();
    const quantity = formData.get('quantity')?.toString();
    const total_price_numeric = formData.get('total_price_numeric')?.toString();
    const payment_type = formData.get('payment_type')?.toString();
    const dp_percent = formData.get('dp_percent')?.toString();
    const contact_information = formData.get('contact_information')?.toString();
    const notification_channel = formData.get('notification_channel')?.toString();
    const design_notes = formData.get('design_notes')?.toString();
    const paid_amount = formData.get('paid_amount')?.toString();
    const is_fully_paid = formData.get('is_fully_paid')?.toString();

    // Validation errors object
    const errors: Record<string, string> = {};

    // Basic validation
    if (!customer_name || customer_name.trim().length === 0) {
      errors.customer_name = 'Nama customer wajib diisi';
    }

    if (!product_name || product_name.trim().length === 0) {
      errors.product_name = 'Nama produk wajib diisi';
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1) {
      errors.quantity = 'Jumlah harus berupa angka positif';
    }

    if (!total_price_numeric || isNaN(Number(total_price_numeric)) || Number(total_price_numeric) < 1) {
      errors.total_price = 'Harga total harus berupa angka positif';
    }

    if (!payment_type || !['dp', 'lunas'].includes(payment_type)) {
      errors.payment_type = 'Tipe pembayaran tidak valid';
    }

    if (!contact_information || contact_information.trim().length === 0) {
      errors.contact_information = 'Kontak customer wajib diisi';
    }

    if (!notification_channel || !['whatsapp', 'email'].includes(notification_channel)) {
      errors.notification_channel = 'Channel notifikasi tidak valid';
    }

    // Validate DP percentage for DP payment type
    if (payment_type === 'dp') {
      if (!dp_percent || isNaN(Number(dp_percent)) || Number(dp_percent) < 50 || Number(dp_percent) > 95) {
        errors.dp_percent = 'Persentase DP harus antara 50% - 95%';
      }
    }

    // Additional validation
    if (customer_name && customer_name.trim().length > 100) {
      errors.customer_name = 'Nama customer maksimal 100 karakter';
    }

    if (product_name && product_name.trim().length > 100) {
      errors.product_name = 'Nama produk maksimal 100 karakter';
    }

    if (contact_information && contact_information.trim().length > 50) {
      errors.contact_information = 'Kontak maksimal 50 karakter';
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return fail(400, {
        errors,
        formData: {
          customer_name,
          product_name,
          quantity,
          total_price: total_price_numeric,
          payment_type,
          dp_percent,
          contact_information,
          notification_channel,
          design_notes,
          paid_amount,
          is_fully_paid
        }
      });
    }

    // Prepare data for API
    const orderData = {
      customer_name: customer_name!.trim(),
      product_name: product_name!.trim(),
      quantity: Number(quantity),
      total_price: Number(total_price_numeric),
      payment_type: payment_type as 'dp' | 'lunas',
      dp_percent: payment_type === 'dp' ? Number(dp_percent) : undefined,
      contact_information: contact_information!.trim(),
      notification_channel: notification_channel as 'whatsapp' | 'email',
      design_notes: design_notes?.trim() || '',
      paid_amount: paid_amount ? Number(paid_amount) : 0,
      is_fully_paid: is_fully_paid === 'true'
    };

    try {
      console.log('🚀 Creating order with data:', orderData);

      // Use FormData like OrdersService for consistency with backend
      const formData = new FormData();
      
      // Add all order fields to FormData (backend expects multipart/form-data)
      Object.entries(orderData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      // Debug: Log FormData contents
      console.log('📝 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      // Try multiple endpoints in case of configuration issues
      let response;
      const endpoints = ['/admin/create-order/', '/order/'];
      let lastError;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          response = await api.uploadFile(endpoint, formData);
          console.log(`✅ Success with endpoint: ${endpoint}`);
          break;
        } catch (err: any) {
          console.log(`❌ Failed with endpoint ${endpoint}:`, err.message);
          lastError = err;
          
          // If this is the last endpoint and it failed, throw the error
          if (endpoint === endpoints[endpoints.length - 1]) {
            throw lastError;
          }
        }
      }

      console.log('✅ Order created successfully:', response);

      // Extract order data from response
      const order = response.order || response;
      const orderCode = order?.order_code || 'N/A';

      // Success! Redirect to orders list with success message
      throw redirect(303, `/admin/orders?success=Order ${orderCode} berhasil dibuat!`);

    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      console.error('❌ Error details:', {
        status: error.status,
        message: error.message,
        data: error.data,
        stack: error.stack
      });

      // Handle specific API errors
      if (error.message && error.message.includes('redirect')) {
        // This is actually a redirect, re-throw it
        throw error;
      }

      // Handle specific HTTP status codes
      if (error.status === 500) {
        console.error('🚨 Server Error 500 - Backend issue detected');
        return fail(500, {
          errors: { 
            general: 'Server mengalami masalah internal. Silakan cek log backend atau coba lagi nanti.',
            debug: `Status: ${error.status}, Message: ${error.message}`
          },
          formData: {
            customer_name,
            product_name,
            quantity,
            total_price: total_price_numeric,
            payment_type,
            dp_percent,
            contact_information,
            notification_channel,
            design_notes,
            paid_amount,
            is_fully_paid
          }
        });
      }

      if (error.status === 404) {
        console.error('🚨 Endpoint Not Found - Check if backend is running');
        return fail(404, {
          errors: { 
            			general: 'Endpoint tidak ditemukan. Pastikan backend berjalan di https://f808-180-254-65-209.ngrok-free.app',
            debug: 'Endpoint: /admin/create-order/ tidak tersedia'
          },
          formData: {
            customer_name,
            product_name,
            quantity,
            total_price: total_price_numeric,
            payment_type,
            dp_percent,
            contact_information,
            notification_channel,
            design_notes,
            paid_amount,
            is_fully_paid
          }
        });
      }

      // Handle validation errors from API
      if (error.message && error.message.includes('validation')) {
        return fail(400, {
          errors: { general: 'Data tidak valid. Periksa kembali form Anda.' },
          formData: {
            customer_name,
            product_name,
            quantity,
            total_price: total_price_numeric,
            payment_type,
            dp_percent,
            contact_information,
            notification_channel,
            design_notes,
            paid_amount,
            is_fully_paid
          }
        });
      }

      // Handle authentication errors
      if (error.message && error.message.includes('unauthorized')) {
        return fail(401, {
          errors: { general: 'Sesi Anda telah berakhir. Silakan login kembali.' },
          formData: {
            customer_name,
            product_name,
            quantity,
            total_price: total_price_numeric,
            payment_type,
            dp_percent,
            contact_information,
            notification_channel,
            design_notes,
            paid_amount,
            is_fully_paid
          }
        });
      }

      // Handle connection errors
      if (error.message && error.message.includes('fetch')) {
        return fail(500, {
          errors: { general: 'Tidak dapat terhubung ke server. Pastikan backend berjalan.' },
          formData: {
            customer_name,
            product_name,
            quantity,
            total_price: total_price_numeric,
            payment_type,
            dp_percent,
            contact_information,
            notification_channel,
            design_notes,
            paid_amount,
            is_fully_paid
          }
        });
      }

      // Generic error
      return fail(500, {
        errors: { general: error.message || 'Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.' },
        formData: {
          customer_name,
          product_name,
          quantity,
          total_price: total_price_numeric,
          payment_type,
          dp_percent,
          contact_information,
          notification_channel,
          design_notes,
          paid_amount,
          is_fully_paid
        }
      });
    }
  }
}; 