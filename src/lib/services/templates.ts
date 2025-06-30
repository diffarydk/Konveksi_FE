import { api } from './api';

export interface Template {
  id: string;
  name: string;
  type: 'dp_invoice' | 'pelunasan_invoice' | 'payment_confirmation' | 'order_status_update' | 'marketing_blast' | 'custom';
  channel: 'whatsapp' | 'email' | 'both';
  subject?: string;
  body: string;
  is_active: boolean;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateFilters {
  type?: string;
  channel?: string;
  is_active?: boolean;
  search?: string;
}

export interface CreateTemplateRequest {
  name: string;
  type: Template['type'];
  channel: Template['channel'];
  subject?: string;
  body: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  id: string;
}

export interface TemplateTypesResponse {
  template_types: [string, string][];
  notification_channels: [string, string][];
  available_variables: string[];
}

export type TemplateType = 
  | 'dp_invoice' 
  | 'pelunasan_invoice' 
  | 'full_invoice'
  | 'payment_confirmation' 
  | 'order_status_update' 
  | 'marketing_blast' 
  | 'custom';

export type NotificationChannel = 'whatsapp' | 'email' | 'both';

export class TemplatesService {
  private readonly baseUrl = '/admin/templates/';

  // Stub data for development
  private stubTemplates: Template[] = [
    {
      id: 'template-1',
      name: 'DP Payment Request WhatsApp',
      type: 'dp_invoice',
      channel: 'whatsapp',
      subject: '',
      body: '💳 *Link Pembayaran DP*\n\nHalo {{customer_name}},\n\nSilakan bayar DP untuk pesanan {{order_code}}:\n\n💰 Jumlah: Rp {{amount_due}}\n🔗 Link: {{payment_link}}\n⏰ Batas: {{expiry_date}}\n\nTerima kasih!',
      is_active: true,
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'template-2',
      name: 'Final Payment Request Email',
      type: 'pelunasan_invoice',
      channel: 'email',
      subject: 'Pelunasan Pembayaran - {{order_code}}',
      body: 'Dear {{customer_name}},\n\nProduksi untuk pesanan {{order_code}} telah selesai.\n\nSilakan lakukan pembayaran pelunasan sebesar Rp {{amount_due}}.\n\nLink pembayaran: {{payment_link}}\n\nBatas waktu: {{expiry_date}}\n\nTerima kasih atas kepercayaan Anda.',
      is_active: true,
      is_default: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'template-3',
      name: 'Payment Confirmation',
      type: 'payment_confirmation',
      channel: 'both',
      subject: 'Pembayaran Diterima - {{order_code}}',
      body: '✅ *Pembayaran Diterima*\n\nHalo {{customer_name}},\n\nPembayaran untuk {{order_code}} telah diterima.\n\n💰 Jumlah: Rp {{amount_due}}\n📦 Produk: {{product_name}}\n\nTerima kasih!',
      is_active: true,
      is_default: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  /**
   * Get all templates with optional filters
   */
  async getTemplates(filters?: TemplateFilters): Promise<Template[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filtered = [...this.stubTemplates];

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      if (filters.channel) {
        filtered = filtered.filter(t => t.channel === filters.channel);
      }
      if (filters.is_active !== undefined) {
        filtered = filtered.filter(t => t.is_active === filters.is_active);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.body.toLowerCase().includes(searchLower)
        );
      }
    }

    return filtered;
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const template = this.stubTemplates.find(t => t.id === id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    return template;
  }

  /**
   * Create new template
   */
  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: data.name,
      type: data.type,
      channel: data.channel,
      subject: data.subject || '',
      body: data.body,
      is_active: data.is_active !== false,
      is_default: data.is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.stubTemplates.push(newTemplate);
    return newTemplate;
  }

  /**
   * Update existing template
   */
  async updateTemplate(id: string, data: Partial<CreateTemplateRequest>): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const index = this.stubTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updated: Template = {
      ...this.stubTemplates[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.stubTemplates[index] = updated;
    return updated;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = this.stubTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template with id ${id} not found`);
    }

    this.stubTemplates.splice(index, 1);
  }

  /**
   * Preview template with context
   */
  async previewTemplate(id: string, context: Record<string, string>): Promise<{
    subject: string;
    body: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const template = await this.getTemplate(id);

    // Simple template variable replacement
    let renderedSubject = template.subject || '';
    let renderedBody = template.body;

    Object.entries(context).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      renderedSubject = renderedSubject.replace(pattern, value);
      renderedBody = renderedBody.replace(pattern, value);
    });

    return {
      subject: renderedSubject,
      body: renderedBody
    };
  }

  /**
   * Get template types and available variables
   */
  async getTemplateTypes(): Promise<TemplateTypesResponse> {
    return await api.get('/admin/template-types/');
  }

  /**
   * Send notification using template
   */
  async sendNotification(invoiceId: string, templateId: string, customContext?: Record<string, any>) {
    const payload: any = { template_id: templateId };
    if (customContext) {
      payload.custom_context = customContext;
    }
    
    return await api.post(`/admin/invoice/${invoiceId}/send-notification/`, payload);
  }

  /**
   * Validate template data
   */
  private validateTemplateData(data: CreateTemplateRequest, isCreate = true) {
    if (isCreate && !data.name?.trim()) {
      throw new Error('Nama template harus diisi');
    }
    
    if (isCreate && !data.type) {
      throw new Error('Tipe template harus dipilih');
    }
    
    if (isCreate && !data.channel) {
      throw new Error('Channel notifikasi harus dipilih');
    }
    
    if (isCreate && !data.body?.trim()) {
      throw new Error('Body template harus diisi');
    }
    
    // Validate subject for email channels
    if ((data.channel === 'email' || data.channel === 'both') && !data.subject?.trim()) {
      throw new Error('Subject harus diisi untuk template email');
    }
    
    // Validate name length
    if (data.name && data.name.length < 3) {
      throw new Error('Nama template minimal 3 karakter');
    }
    
    if (data.name && data.name.length > 100) {
      throw new Error('Nama template maksimal 100 karakter');
    }
    
    // Validate body length
    if (data.body && data.body.length < 10) {
      throw new Error('Body template minimal 10 karakter');
    }
  }

  /**
   * Get template type display name
   */
  getTemplateTypeDisplay(type: TemplateType): string {
    const typeMap: Record<TemplateType, string> = {
      'dp_invoice': 'DP Invoice',
      'pelunasan_invoice': 'Pelunasan Invoice',
      'full_invoice': 'Full Payment Invoice',
      'payment_confirmation': 'Payment Confirmation',
      'order_status_update': 'Order Status Update',
      'marketing_blast': 'Marketing Blast',
      'custom': 'Custom'
    };
    return typeMap[type] || type;
  }

  /**
   * Get channel display name
   */
  getChannelDisplay(channel: NotificationChannel): string {
    const channelMap: Record<NotificationChannel, string> = {
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'both': 'WhatsApp & Email'
    };
    return channelMap[channel] || channel;
  }

  /**
   * Get channel icon
   */
  getChannelIcon(channel: NotificationChannel): string {
    const iconMap: Record<NotificationChannel, string> = {
      'whatsapp': 'fab fa-whatsapp',
      'email': 'fas fa-envelope',
      'both': 'fas fa-paper-plane'
    };
    return iconMap[channel] || 'fas fa-bell';
  }

  /**
   * Extract variables from template body
   */
  extractVariables(body: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(body)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }

  /**
   * Insert variable into template body at cursor position
   */
  insertVariableAtCursor(body: string, variable: string, cursorPosition: number): string {
    const variableText = `{{${variable}}}`;
    return body.slice(0, cursorPosition) + variableText + body.slice(cursorPosition);
  }

  /**
   * Generate sample context for preview
   */
  generateSampleContext(): Record<string, any> {
    return {
      customer_name: 'Budi Santoso',
      order_code: 'ORD-001-ABC',
      invoice_code: 'INV-001',
      product_name: 'Kaos Custom Logo Perusahaan',
      amount_due: '1,500,000',
      payment_link: 'https://checkout.xendit.co/sample-link',
      expiry_date: '31/12/2024 23:59',
      quantity: '50',
      total_price: '2,500,000',
      paid_amount: '1,000,000',
      payment_type: 'DP',
      order_status: 'DP Dibayar'
    };
  }

  /**
   * Format template body for display
   */
  formatTemplateBody(body: string, maxLength = 100): string {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + '...';
  }

  /**
   * Get template status badge class
   */
  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'success' : 'secondary';
  }

  /**
   * Get default badge class
   */
  getDefaultBadgeClass(isDefault: boolean): string {
    return isDefault ? 'primary' : 'secondary';
  }
}

// Export singleton instance
export const templatesService = new TemplatesService(); 