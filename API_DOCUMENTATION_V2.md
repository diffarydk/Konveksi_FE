# 📖 **DOKUMENTASI API LENGKAP v2.0**

## **Sistem Manajemen Konveksi dengan Real-time WebSocket**

---

## **🚀 Pendahuluan (Introduction)**

**Base URL:** `http://localhost:8000/api/v1/`  
**WebSocket URL:** `ws://localhost:8000/ws/`

**Format Data:** Semua request dan response body menggunakan format `application/json`.

**Versi API:** v2.0  
**Arsitektur:** RESTful API dengan Django REST Framework + WebSocket Real-time

### **🆕 Fitur Baru di v2.0:**

- ✅ **Real-time WebSocket** untuk update otomatis
- ✅ **Enhanced Admin Dashboard** dengan statistics real-time
- ✅ **Order Code Format Baru**: `ORD-YYYYMMDD-XXX`
- ✅ **Advanced Notification System** dengan template customizable
- ✅ **Multi-tab Synchronization** untuk admin
- ✅ **Enhanced Payment Integration** dengan Xendit
- ✅ **Production Status Tracking** yang lebih detail

---

## **🔌 WebSocket Real-time Endpoints**

### **1. Admin Orders WebSocket**

```
ws://localhost:8000/ws/orders/
```

**Event Types Received:**

- `order_created` - Order baru dibuat
- `order_updated` - Order diupdate
- `order_deleted` - Order dihapus
- `connection_established` - Koneksi berhasil

**Event Data Format:**

```json
{
  "type": "order_created",
  "order_id": "550e8400-e29b-41d4-a716-446655440001",
  "order_code": "ORD-20250630-A1B",
  "message": "Order baru telah dibuat",
  "timestamp": "2025-06-30T10:30:00Z",
  "order": {
    // ... complete order data
  }
}
```

### **2. Customer Order Tracking WebSocket**

```
ws://localhost:8000/ws/orders/{order_code}/
```

**Event Types Received:**

- `order_status_update` - Status order berubah
- `payment_update` - Status pembayaran berubah
- `production_update` - Status produksi berubah

### **3. Admin Dashboard Statistics WebSocket**

```
ws://localhost:8000/ws/admin/dashboard/
```

**Event Types Received:**

- `dashboard_update` - Update statistik dashboard
- `stats_update` - Update angka-angka statistik

### **4. Global Notifications WebSocket**

```
ws://localhost:8000/ws/notifications/
```

**Event Types Received:**

- `notification_broadcast` - Notifikasi global

### **Frontend Integration Example:**

```javascript
// Connect to admin orders WebSocket
const ws = new WebSocket("ws://localhost:8000/ws/orders/");

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "order_created":
      // Add new order to list
      addOrderToList(data.order);
      showNotification(`Order baru: ${data.order_code}`);
      break;

    case "order_deleted":
      // Remove order from list
      removeOrderFromList(data.order_id);
      showNotification(`Order ${data.order_code} telah dihapus`);
      break;

    case "order_updated":
      // Update order in list
      updateOrderInList(data.order);
      showNotification(`Order ${data.order_code} diupdate`);
      break;
  }
};
```

---

## **🔐 Autentikasi (Authentication)**

### **Session Authentication (Admin)**

```http
POST /api/v1/auth/login/
```

**Request:**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response Success (200):**

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "Admin"
  },
  "success": true
}
```

### **Profile & Logout**

```http
GET /api/v1/auth/profile/     # Get user info
POST /api/v1/auth/logout/     # Logout
```

---

## **📋 Orders Management API**

### **1. List Orders (Enhanced)**

```http
GET /api/v1/order/
```

**Query Parameters:**

- `page=1` - Page number
- `page_size=20` - Items per page
- `status=menunggu_link` - Filter by status
- `search=customer_name` - Search by customer name
- `date_from=2025-06-01` - Filter by date range
- `date_to=2025-06-30` - Filter by date range

**Response (200):**

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/order/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "order_code": "ORD-20250630-A1B",
      "customer_name": "John Doe",
      "product_name": "Kaos Custom",
      "quantity": 50,
      "total_price": "7500000.00",
      "payment_type": "dp",
      "dp_percent": "50.00",
      "paid_amount": "3750000.00",
      "is_fully_paid": false,
      "status_order": "dp_dibayar",
      "production_status": "diproses",
      "contact_information": "081234567890",
      "notification_channel": "whatsapp",
      "design_notes": "Logo di dada kiri",
      "created_at": "2025-06-30T10:30:00Z",
      "updated_at": "2025-06-30T11:00:00Z"
    }
  ]
}
```

### **2. Create Order (Enhanced)**

```http
POST /api/v1/order/
```

**Request Body (multipart/form-data):**

```javascript
const formData = new FormData();
formData.append("customer_name", "John Doe");
formData.append("product_name", "Kaos Custom");
formData.append("quantity", "50");
formData.append("total_price", "7500000");
formData.append("payment_type", "dp");
formData.append("dp_percent", "50");
formData.append("contact_information", "081234567890");
formData.append("notification_channel", "whatsapp");
formData.append("design_notes", "Logo di dada kiri");
formData.append("design", fileInput.files[0]); // Optional
```

**Response Success (201):**

```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "order_code": "ORD-20250630-A1B"
    // ... complete order data
  },
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "invoice_code": "INV-123456-ABC",
    "payment_url": "https://checkout.xendit.co/web/123456",
    "invoice_amount": "3750000.00"
  },
  "message": "Order berhasil dibuat dan link pembayaran telah dikirim"
}
```

### **3. Admin Create Order (Special Endpoint)**

```http
POST /api/v1/admin/create-order/
```

**Features:**

- Otomatis generate order code format baru
- Integrated dengan notification system
- Real-time WebSocket broadcast
- Auto-create payment link jika diperlukan

### **4. Update Order Status**

```http
PATCH /api/v1/order/{order_id}/
```

**Request Body:**

```json
{
  "status_order": "pengerjaan_selesai",
  "production_status": "selesai",
  "notes": "Produksi telah selesai, siap kirim"
}
```

### **5. Delete Order**

```http
DELETE /api/v1/order/{order_id}/
```

**Response (204):** No content

**Real-time Effect:** Akan trigger WebSocket event `order_deleted` ke semua connected admin clients.

---

## **💳 Payment & Invoice Management**

### **1. Create Payment Link**

```http
POST /api/v1/order/{order_id}/create-payment-link/
```

**Request Body:**

```json
{
  "payment_type": "dp",
  "dp_percent": 50,
  "notification_channel": "whatsapp"
}
```

**Response (201):**

```json
{
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "invoice_code": "INV-123456-ABC",
    "payment_url": "https://checkout.xendit.co/web/123456",
    "invoice_amount": "3750000.00",
    "invoice_expired_at": "2025-07-01T10:30:00Z"
  },
  "message": "Link pembayaran berhasil dibuat dan dikirim",
  "notification_sent": true
}
```

### **2. Manual Payment Recording**

```http
POST /api/v1/payment/manual/
```

**Request Body:**

```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440002",
  "payment_method": "BANK_TRANSFER",
  "amount": "3750000.00",
  "payment_time": "2025-06-30T14:30:00Z",
  "notes": "Transfer via BCA a.n John Doe"
}
```

### **3. Xendit Webhook (Auto)**

```http
POST /api/v1/webhook/xendit/
```

**Webhook akan otomatis:**

- Update status invoice menjadi "sudah dibayar"
- Update status order sesuai payment type
- Send confirmation notification via WhatsApp/Email
- Trigger real-time WebSocket update

---

## **📱 Public Customer Endpoints**

### **1. Track Order**

```http
GET /api/v1/track-order/?order_code={order_code}
```

**Response (200):**

```json
{
  "order": {
    "order_code": "ORD-20250630-A1B",
    "customer_name": "John Doe",
    "product_name": "Kaos Custom",
    "quantity": 50,
    "status_order": "dp_dibayar",
    "production_status": "diproses",
    "created_at": "2025-06-30T10:30:00Z"
  },
  "timeline": [
    {
      "status": "menunggu_link",
      "timestamp": "2025-06-30T10:30:00Z",
      "description": "Pesanan telah diterima"
    },
    {
      "status": "link_dibuat",
      "timestamp": "2025-06-30T10:32:00Z",
      "description": "Link pembayaran telah dibuat"
    },
    {
      "status": "dp_dibayar",
      "timestamp": "2025-06-30T11:00:00Z",
      "description": "DP telah dibayar - Rp 3.750.000"
    }
  ],
  "payments": [
    {
      "payment_type": "dp",
      "amount": "3750000.00",
      "status": "sudah dibayar",
      "paid_at": "2025-06-30T11:00:00Z"
    }
  ],
  "summary": {
    "total_price": "7500000.00",
    "total_paid": "3750000.00",
    "remaining": "3750000.00",
    "is_fully_paid": false,
    "next_payment_amount": "3750000.00"
  }
}
```

### **2. Invoice Detail (Customer)**

```http
GET /api/v1/invoice/detail/{invoice_code}/
```

**Response (200):**

```json
{
  "invoice": {
    "invoice_code": "INV-123456-ABC",
    "payment_type": "dp",
    "invoice_amount": "3750000.00",
    "invoice_status": "belum dibayar",
    "payment_url": "https://checkout.xendit.co/web/123456",
    "invoice_expired_at": "2025-07-01T10:30:00Z"
  },
  "order": {
    "order_code": "ORD-20250630-A1B",
    "customer_name": "John Doe",
    "product_name": "Kaos Custom",
    "quantity": 50
  }
}
```

---

## **👑 Admin Dashboard Endpoints**

### **1. Dashboard Statistics**

```http
GET /api/v1/admin/dashboard/stats/
```

**Response (200):**

```json
{
  "total_orders": 150,
  "total_revenue": "125000000.00",
  "pending_orders": 25,
  "completed_orders": 100,
  "monthly_growth": 15.5,
  "recent_orders": [
    {
      "order_code": "ORD-20250630-A1B",
      "customer_name": "John Doe",
      "total_price": "7500000.00",
      "status": "dp_dibayar",
      "created_at": "2025-06-30T10:30:00Z"
    }
  ],
  "revenue_chart": [
    {
      "month": "2025-01",
      "revenue": "15000000.00"
    },
    {
      "month": "2025-02",
      "revenue": "18000000.00"
    }
  ],
  "status_distribution": {
    "menunggu_link": 10,
    "dp_dibayar": 15,
    "lunas": 100,
    "dibatalkan": 5
  }
}
```

### **2. Order Management**

```http
GET /api/v1/admin/orders/
POST /api/v1/admin/create-order/
PUT /api/v1/admin/orders/{order_id}/
DELETE /api/v1/admin/orders/{order_id}/
```

### **3. Bulk Operations**

```http
POST /api/v1/admin/orders/bulk-update/
```

**Request Body:**

```json
{
  "order_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "action": "update_status",
  "data": {
    "production_status": "selesai"
  }
}
```

---

## **🎯 Status & Choices**

### **Order Status (status_order)**

```python
STATUS_CHOICES = [
    ("menunggu_link", "Menunggu Link"),
    ("link_dibuat", "Link Dibuat"),
    ("dp_dibayar", "DP Dibayar"),
    ("pengerjaan_selesai", "Pengerjaan Selesai"),
    ("menunggu_pelunasan", "Menunggu Pelunasan"),
    ("lunas", "Lunas"),
    ("dibatalkan", "Dibatalkan"),
]
```

### **Production Status (production_status)**

```python
PRODUCTION_STATUS_CHOICES = [
    ("menunggu", "Menunggu"),
    ("diproses", "Diproses"),
    ("selesai", "Selesai"),
    ("dikirim", "Dikirim"),
    ("dibatalkan", "Dibatalkan"),
]
```

### **Payment Type**

```python
PAYMENT_TYPE_CHOICES = [
    ("dp", "Down Payment"),
    ("full", "Full Payment"),
    ("pelunasan", "Pelunasan"),
]
```

### **Notification Channel**

```python
NOTIFICATION_CHOICES = [
    ("whatsapp", "WhatsApp"),
    ("email", "Email"),
    ("both", "WhatsApp & Email"),
]
```

---

## **🚨 Error Handling**

### **HTTP Status Codes**

- `200` OK - Request berhasil
- `201` Created - Resource berhasil dibuat
- `204` No Content - Delete berhasil
- `400` Bad Request - Validation error
- `401` Unauthorized - Authentication required
- `403` Forbidden - Permission denied
- `404` Not Found - Resource tidak ditemukan
- `429` Too Many Requests - Rate limited
- `500` Internal Server Error - Server error

### **Error Response Format**

```json
{
  "error": "Pesan error dalam Bahasa Indonesia",
  "details": {
    "field_name": ["Field specific error message"]
  },
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-06-30T10:30:00Z"
}
```

### **Validation Errors**

```json
{
  "customer_name": ["Nama customer tidak boleh kosong"],
  "total_price": ["Harga harus lebih besar dari 0"],
  "dp_percent": ["DP minimal 50% untuk payment type dp"]
}
```

---

## **⚡ Rate Limiting**

### **Limits per IP:**

- `POST` endpoints: 100 requests/hour
- `GET` endpoints: 500 requests/hour
- `Webhook` endpoints: 1000 requests/hour

### **Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

---

## **🧪 Testing Examples**

### **JavaScript Frontend Integration**

#### **1. Create Order with Real-time Updates**

```javascript
class OrderManager {
  constructor() {
    this.wsUrl = "ws://localhost:8000/ws/orders/";
    this.apiUrl = "http://localhost:8000/api/v1";
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeUpdate(data);
    };
  }

  async createOrder(orderData) {
    const formData = new FormData();
    Object.keys(orderData).forEach((key) => {
      formData.append(key, orderData[key]);
    });

    const response = await fetch(`${this.apiUrl}/order/`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      // Order akan muncul via WebSocket real-time
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  }

  async deleteOrder(orderId) {
    const response = await fetch(`${this.apiUrl}/order/${orderId}/`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Order akan hilang via WebSocket real-time
      return true;
    } else {
      throw new Error("Failed to delete order");
    }
  }

  handleRealtimeUpdate(data) {
    switch (data.type) {
      case "order_created":
        this.addOrderToUI(data.order);
        this.showNotification(`Order baru: ${data.order_code}`);
        break;

      case "order_deleted":
        this.removeOrderFromUI(data.order_id);
        this.showNotification(`Order ${data.order_code} dihapus`);
        break;

      case "order_updated":
        this.updateOrderInUI(data.order);
        break;
    }
  }
}

// Usage
const orderManager = new OrderManager();

// Create order
orderManager
  .createOrder({
    customer_name: "John Doe",
    product_name: "Kaos Custom",
    quantity: 50,
    total_price: "7500000",
    payment_type: "dp",
    dp_percent: 50,
    contact_information: "081234567890",
  })
  .then((result) => {
    console.log("Order created:", result);
  });
```

#### **2. Customer Order Tracking**

```javascript
class OrderTracker {
  constructor(orderCode) {
    this.orderCode = orderCode;
    this.wsUrl = `ws://localhost:8000/ws/orders/${orderCode}/`;
    this.setupWebSocket();
    this.loadOrderData();
  }

  setupWebSocket() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleStatusUpdate(data);
    };
  }

  async loadOrderData() {
    const response = await fetch(
      `http://localhost:8000/api/v1/track-order/?order_code=${this.orderCode}`
    );

    if (response.ok) {
      const data = await response.json();
      this.updateUI(data);
    }
  }

  handleStatusUpdate(data) {
    switch (data.type) {
      case "payment_update":
        this.updatePaymentStatus(data);
        break;

      case "order_status_update":
        this.updateOrderStatus(data);
        break;

      case "production_update":
        this.updateProductionStatus(data);
        break;
    }
  }
}

// Usage
const tracker = new OrderTracker("ORD-20250630-A1B");
```

### **cURL Examples**

#### **Create Order**

```bash
curl -X POST http://localhost:8000/api/v1/order/ \
  -H "Content-Type: multipart/form-data" \
  -F "customer_name=John Doe" \
  -F "product_name=Kaos Custom" \
  -F "quantity=50" \
  -F "total_price=7500000" \
  -F "payment_type=dp" \
  -F "dp_percent=50" \
  -F "contact_information=081234567890"
```

#### **Track Order**

```bash
curl -X GET "http://localhost:8000/api/v1/track-order/?order_code=ORD-20250630-A1B"
```

#### **Admin Login**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}' \
  -c cookies.txt
```

#### **Admin Get Orders**

```bash
curl -X GET http://localhost:8000/api/v1/order/ \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

---

## **🔧 Environment Setup**

### **Required Environment Variables**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/konveksi_db

# Xendit Payment Gateway
XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_PUBLIC_KEY=your_xendit_public_key
XENDIT_WEBHOOK_TOKEN=your_webhook_token

# WhatsApp API (Fonnte)
FONNTE_API_TOKEN=your_fonnte_token

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Redis (for WebSocket scaling)
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## **🚀 Production Deployment**

### **WebSocket Production Notes:**

- Use `wss://` (secure WebSocket) in production
- Configure load balancer for sticky sessions
- Use Redis channel layer for multiple server instances
- Monitor WebSocket connection metrics

### **Server Configuration:**

```python
# settings_production.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

# Use daphne for ASGI
# daphne -b 0.0.0.0 -p 8000 konveksi.asgi:application
```

---

## **📈 Performance Metrics**

### **Real-time vs Traditional:**

- **Latency**: 0ms vs 30s polling
- **Server Load**: Event-driven vs periodic requests
- **User Experience**: Instant updates vs manual refresh
- **Bandwidth**: Minimal vs repeated API calls

### **Expected Response Times:**

- `GET` endpoints: < 100ms
- `POST` endpoints: < 500ms
- WebSocket connection: < 50ms
- Payment webhook: < 2000ms

---

**🎉 Dokumentasi API v2.0 - Complete dengan Real-time WebSocket Integration**

_Last updated: 2025-06-30_
