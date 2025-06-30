# 🚀 **Advanced API Features Documentation**

## **Enhanced Endpoints & Integrations**

---

## **🔍 Advanced Search & Filtering**

### **Smart Order Search**

```http
GET /api/v1/order/?search={query}
```

**Multi-field Search Support:**

- Customer name (fuzzy matching)
- Order code (exact match)
- Product name (partial match)
- Contact information (phone/email)

**Advanced Filters:**

```http
GET /api/v1/order/?status=dp_dibayar&date_from=2025-01-01&date_to=2025-12-31&min_amount=1000000&max_amount=10000000
```

**Response with Metadata:**

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/order/?page=2",
  "previous": null,
  "filters_applied": {
    "status": "dp_dibayar",
    "date_range": "2025-01-01 to 2025-12-31",
    "amount_range": "1000000 to 10000000"
  },
  "summary": {
    "total_revenue": "125000000.00",
    "avg_order_value": "8333333.33",
    "completion_rate": 85.5
  },
  "results": [...]
}
```

---

## **📊 Analytics & Reporting Endpoints**

### **1. Dashboard Analytics**

```http
GET /api/v1/admin/analytics/dashboard/
```

**Response:**

```json
{
  "period": "last_30_days",
  "metrics": {
    "total_orders": 245,
    "total_revenue": "185000000.00",
    "avg_order_value": "755102.04",
    "conversion_rate": 78.5,
    "customer_retention": 65.2
  },
  "trends": {
    "orders_growth": 15.3,
    "revenue_growth": 22.1,
    "customer_growth": 8.7
  },
  "top_products": [
    {
      "name": "Kaos Custom",
      "orders": 120,
      "revenue": "95000000.00"
    }
  ],
  "status_distribution": {
    "lunas": 180,
    "dp_dibayar": 35,
    "menunggu_link": 20,
    "dibatalkan": 10
  }
}
```

### **2. Revenue Analytics**

```http
GET /api/v1/admin/analytics/revenue/?period=monthly&year=2025
```

**Response:**

```json
{
  "period": "monthly",
  "year": 2025,
  "data": [
    {
      "month": "2025-01",
      "revenue": "15000000.00",
      "orders": 25,
      "avg_value": "600000.00"
    },
    {
      "month": "2025-02",
      "revenue": "18000000.00",
      "orders": 32,
      "avg_value": "562500.00"
    }
  ],
  "totals": {
    "total_revenue": "125000000.00",
    "total_orders": 200,
    "avg_monthly_revenue": "10416666.67"
  }
}
```

### **3. Customer Analytics**

```http
GET /api/v1/admin/analytics/customers/
```

**Response:**

```json
{
  "total_customers": 180,
  "new_customers_this_month": 25,
  "repeat_customers": 35,
  "top_customers": [
    {
      "customer_name": "John Doe",
      "total_orders": 5,
      "total_spent": "25000000.00",
      "avg_order_value": "5000000.00"
    }
  ],
  "customer_segments": {
    "high_value": 20,
    "medium_value": 80,
    "low_value": 80
  }
}
```

---

## **📱 Notification Management**

### **1. Notification Templates**

```http
GET /api/v1/admin/notification-templates/
POST /api/v1/admin/notification-templates/
```

**Template Types:**

- `order_created` - Order baru dibuat
- `payment_received` - Pembayaran diterima
- `production_complete` - Produksi selesai
- `payment_reminder` - Reminder pembayaran
- `order_cancelled` - Order dibatalkan

**Create Template Example:**

```json
{
  "name": "Payment Received WhatsApp",
  "type": "payment_received",
  "channel": "whatsapp",
  "subject": "",
  "body": "✅ *Pembayaran Diterima*\n\nHalo {{customer_name}},\n\nPembayaran {{payment_type}} untuk order {{order_code}} telah diterima:\n\n💰 Jumlah: Rp {{amount}}\n📅 Tanggal: {{payment_date}}\n\n{{#if is_full_payment}}Terima kasih! Order Anda akan segera diproduksi.{{else}}Menunggu pelunasan sebesar Rp {{remaining_amount}}.{{/if}}\n\nTerima kasih!",
  "variables": [
    "customer_name",
    "order_code",
    "payment_type",
    "amount",
    "payment_date",
    "is_full_payment",
    "remaining_amount"
  ],
  "is_active": true,
  "is_default": true
}
```

### **2. Send Bulk Notifications**

```http
POST /api/v1/admin/notifications/send-bulk/
```

**Request:**

```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440003",
  "recipients": [
    {
      "order_id": "550e8400-e29b-41d4-a716-446655440001",
      "customer_name": "John Doe",
      "contact": "081234567890"
    }
  ],
  "schedule_at": "2025-06-30T14:00:00Z"
}
```

### **3. Notification History**

```http
GET /api/v1/admin/notifications/history/
```

**Response:**

```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "template_name": "Payment Received WhatsApp",
      "recipient": "081234567890",
      "channel": "whatsapp",
      "status": "sent",
      "sent_at": "2025-06-30T10:30:00Z",
      "order_code": "ORD-20250630-A1B"
    }
  ]
}
```

---

## **🎨 File & Media Management**

### **1. Design Upload with Processing**

```http
POST /api/v1/media/upload-design/
```

**Features:**

- Auto resize untuk optimasi
- Multiple format support (JPG, PNG, PDF, AI)
- Virus scanning
- Metadata extraction

**Request (multipart/form-data):**

```javascript
const formData = new FormData();
formData.append("design", fileInput.files[0]);
formData.append("order_id", "550e8400-e29b-41d4-a716-446655440001");
formData.append("description", "Logo design untuk kaos");
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "original_filename": "logo_design.png",
  "url": "http://localhost:8000/media/designs/2025/06/30/logo_design_processed.png",
  "thumbnail_url": "http://localhost:8000/media/designs/2025/06/30/logo_design_thumb.png",
  "file_size": 2048576,
  "dimensions": {
    "width": 1920,
    "height": 1080
  },
  "format": "PNG",
  "created_at": "2025-06-30T10:30:00Z"
}
```

### **2. Bulk File Operations**

```http
POST /api/v1/admin/media/bulk-operations/
```

**Operations:**

- `delete` - Delete multiple files
- `move` - Move to different folder
- `compress` - Compress file sizes

**Request:**

```json
{
  "operation": "compress",
  "file_ids": [
    "550e8400-e29b-41d4-a716-446655440005",
    "550e8400-e29b-41d4-a716-446655440006"
  ],
  "options": {
    "quality": 85,
    "max_width": 1920
  }
}
```

---

## **💰 Advanced Payment Features**

### **1. Payment Plans**

```http
POST /api/v1/payment/create-plan/
```

**Create Custom Payment Plan:**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440001",
  "plan": "custom",
  "installments": [
    {
      "amount": "2500000.00",
      "due_date": "2025-07-01T00:00:00Z",
      "description": "DP 1/3"
    },
    {
      "amount": "2500000.00",
      "due_date": "2025-07-15T00:00:00Z",
      "description": "DP 2/3"
    },
    {
      "amount": "2500000.00",
      "due_date": "2025-08-01T00:00:00Z",
      "description": "Pelunasan"
    }
  ]
}
```

### **2. Payment Verification**

```http
POST /api/v1/payment/verify-manual/
```

**Manual Payment Verification:**

```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440002",
  "bank_statement": "file_upload",
  "transfer_amount": "3750000.00",
  "transfer_date": "2025-06-30T14:30:00Z",
  "bank_name": "BCA",
  "account_name": "John Doe",
  "notes": "Transfer sesuai nominal"
}
```

### **3. Refund Management**

```http
POST /api/v1/payment/refund/
```

**Request:**

```json
{
  "payment_id": "550e8400-e29b-41d4-a716-446655440007",
  "refund_amount": "1000000.00",
  "reason": "Order cancelled by customer",
  "refund_method": "bank_transfer"
}
```

---

## **📈 Export & Import Features**

### **1. Data Export**

```http
GET /api/v1/admin/export/orders/?format=excel&date_from=2025-01-01&date_to=2025-12-31
```

**Export Formats:**

- `excel` - Excel XLSX
- `csv` - Comma Separated Values
- `pdf` - PDF Report
- `json` - JSON Data

**Response Headers:**

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="orders_2025.xlsx"
```

### **2. Bulk Import**

```http
POST /api/v1/admin/import/orders/
```

**Import CSV/Excel:**

```javascript
const formData = new FormData();
formData.append("file", csvFile);
formData.append(
  "mapping",
  JSON.stringify({
    customer_name: "A",
    product_name: "B",
    quantity: "C",
    total_price: "D",
  })
);
```

**Response:**

```json
{
  "status": "success",
  "processed": 150,
  "created": 145,
  "errors": 5,
  "error_details": [
    {
      "row": 23,
      "error": "Invalid email format",
      "data": "john.doe@invalid"
    }
  ]
}
```

---

## **🔄 Automation & Workflows**

### **1. Automated Actions**

```http
GET /api/v1/admin/automation/rules/
POST /api/v1/admin/automation/rules/
```

**Create Automation Rule:**

```json
{
  "name": "Auto send payment reminder",
  "trigger": "payment_overdue",
  "conditions": {
    "days_overdue": 3,
    "payment_type": "dp"
  },
  "actions": [
    {
      "type": "send_notification",
      "template": "payment_reminder",
      "channel": "whatsapp"
    },
    {
      "type": "update_status",
      "status": "payment_overdue"
    }
  ],
  "is_active": true
}
```

### **2. Workflow Management**

```http
GET /api/v1/admin/workflows/
```

**Available Workflows:**

- Order Processing Pipeline
- Payment Verification Flow
- Production Tracking
- Customer Communication

---

## **🔐 Advanced Security Features**

### **1. API Rate Limiting**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1625097600
X-RateLimit-Window: 3600
```

**Rate Limits by Endpoint Type:**

- Public endpoints: 100/hour
- Admin endpoints: 1000/hour
- Upload endpoints: 50/hour
- Webhook endpoints: Unlimited

### **2. Request Logging**

```http
GET /api/v1/admin/security/logs/
```

**Response:**

```json
{
  "results": [
    {
      "timestamp": "2025-06-30T10:30:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "endpoint": "/api/v1/order/",
      "method": "POST",
      "status_code": 201,
      "response_time": 245,
      "user": "admin"
    }
  ]
}
```

### **3. Security Alerts**

```http
GET /api/v1/admin/security/alerts/
```

**Alert Types:**

- Multiple failed login attempts
- Unusual API usage patterns
- Large file uploads
- Suspicious IP addresses

---

## **🧪 Testing & Development Tools**

### **1. API Testing Endpoint**

```http
POST /api/v1/dev/test-notifications/
```

**Test Notification Delivery:**

```json
{
  "channel": "whatsapp",
  "recipient": "081234567890",
  "message": "Test message from API",
  "template_vars": {
    "customer_name": "Test User"
  }
}
```

### **2. Database Health Check**

```http
GET /api/v1/health/
```

**Response:**

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "websocket": "active",
  "version": "2.0.0",
  "uptime": "72h 15m 30s",
  "last_deployment": "2025-06-30T08:00:00Z"
}
```

### **3. Performance Metrics**

```http
GET /api/v1/admin/performance/
```

**Response:**

```json
{
  "avg_response_time": 125,
  "requests_per_minute": 45,
  "error_rate": 0.5,
  "database_queries": {
    "avg_per_request": 3.2,
    "slow_queries": 2
  },
  "memory_usage": "68%",
  "cpu_usage": "25%"
}
```

---

## **🎯 Integration Examples**

### **1. E-commerce Platform Integration**

```javascript
// Shopify Integration Example
class ShopifyKonveksiSync {
  constructor(apiKey, shopUrl) {
    this.apiKey = apiKey;
    this.shopUrl = shopUrl;
    this.konveksiApi = "http://localhost:8000/api/v1";
  }

  async syncOrder(shopifyOrder) {
    // Transform Shopify order to Konveksi format
    const konveksiOrder = {
      customer_name:
        shopifyOrder.customer.first_name +
        " " +
        shopifyOrder.customer.last_name,
      product_name: shopifyOrder.line_items[0].name,
      quantity: shopifyOrder.line_items[0].quantity,
      total_price: shopifyOrder.total_price,
      payment_type: "full",
      contact_information: shopifyOrder.customer.email,
      notification_channel: "email",
    };

    // Create order in Konveksi system
    const response = await fetch(`${this.konveksiApi}/order/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(konveksiOrder),
    });

    if (response.ok) {
      const result = await response.json();

      // Update Shopify order with Konveksi order code
      await this.updateShopifyOrder(shopifyOrder.id, {
        note: `Konveksi Order: ${result.order.order_code}`,
      });

      return result;
    }
  }
}
```

### **2. Accounting Software Integration**

```javascript
// Accurate/Jurnal Integration
class AccountingSync {
  async syncPayment(konveksiPayment) {
    // Create journal entry in accounting software
    const journalEntry = {
      date: konveksiPayment.paid_at,
      reference: konveksiPayment.invoice_code,
      entries: [
        {
          account: "Bank Account",
          debit: konveksiPayment.amount,
          credit: 0,
        },
        {
          account: "Sales Revenue",
          debit: 0,
          credit: konveksiPayment.amount,
        },
      ],
    };

    // Send to accounting API
    return await this.sendToAccounting(journalEntry);
  }
}
```

---

## **🚀 Performance Optimization**

### **1. Caching Strategy**

```python
# Redis caching for frequently accessed data
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Cache timeouts
CACHE_TIMEOUTS = {
    'dashboard_stats': 300,      # 5 minutes
    'order_list': 60,           # 1 minute
    'customer_data': 1800,      # 30 minutes
}
```

### **2. Database Optimization**

```sql
-- Recommended indexes
CREATE INDEX idx_order_created_at ON order_order(created_at);
CREATE INDEX idx_order_status ON order_order(status_order);
CREATE INDEX idx_order_customer ON order_order(customer_name);
CREATE INDEX idx_invoice_status ON order_invoice(invoice_status);
CREATE INDEX idx_payment_date ON order_payment(payment_time);
```

### **3. API Response Optimization**

```python
# Selective field loading
class OrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'order_code', 'customer_name', 'status_order', 'total_price']

# Full detail only when needed
class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
```

---

**🚀 Advanced API Features Complete - Production Ready!**

_Last updated: 2025-06-30_
