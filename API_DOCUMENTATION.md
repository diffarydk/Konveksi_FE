# 📖 **DOKUMENTASI API LENGKAP**

## **Sistem Manajemen Konveksi**

---

## **🚀 Pendahuluan (Introduction)**

**Base URL:** `https://your-domain.com/api/v1/`

**Format Data:** Semua request dan response body menggunakan format `application/json`.

**Versi API:** v1

**Arsitektur:** RESTful API dengan Django REST Framework

---

## **🔐 Autentikasi (Authentication)**

### **Admin Endpoints**

**Metode:** Session Authentication (Django)

Admin harus login terlebih dahulu melalui endpoint `/api/v1/auth/login/` untuk mendapatkan `sessionid` dan `csrftoken`.

**Headers Wajib untuk Admin:**

```http
Content-Type: application/json
X-CSRFToken: <your_csrf_token>
Cookie: sessionid=<your_session_id>
```

**Cara Mendapatkan CSRF Token:**

```javascript
// JavaScript
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
const csrftoken = getCookie("csrftoken");
```

### **Public Endpoints**

Endpoint berikut **TIDAK** memerlukan autentikasi:

- `GET /api/v1/` (API Root)
- `GET /api/v1/produkpost/` (List Produk)
- `GET /api/v1/track-order/` (Lacak Pesanan)
- `GET /api/v1/invoice/detail/{invoice_code}/` (Detail Invoice)
- `POST /api/v1/webhook/xendit/` (Webhook)

---

## **📋 Konvensi Respons (Response Conventions)**

### **Success Response**

- **200 OK:** Operasi berhasil (GET, PUT, PATCH)
- **201 Created:** Resource berhasil dibuat (POST)
- **204 No Content:** Operasi berhasil tanpa content (DELETE)

### **Error Response**

```json
// 400 Bad Request
{
    "error": "Deskripsi error yang mudah dipahami",
    "details": {
        "field_name": ["Pesan error spesifik untuk field ini"]
    }
}

// 401 Unauthorized
{
    "detail": "Authentication credentials were not provided."
}

// 403 Forbidden
{
    "detail": "You do not have permission to perform this action."
}

// 404 Not Found
{
    "detail": "Not found."
}

// 429 Too Many Requests
{
    "detail": "Terlalu banyak permintaan. Coba lagi dalam 1 menit."
}

// 500 Internal Server Error
{
    "error": "Terjadi kesalahan server",
    "detail": "Silakan coba lagi nanti"
}
```

### **Validation Error Format**

```json
{
  "customer_name": ["Nama customer tidak boleh kosong atau hanya 1 karakter."],
  "total_price": ["Harga harus lebih besar dari 0."],
  "contact_information": ["Format email tidak valid."]
}
```

---

## **🏷️ Model Data**

### **Order Model**

| Field                | Tipe     | Deskripsi                                               |
| -------------------- | -------- | ------------------------------------------------------- |
| id                   | UUID     | ID unik order (read-only)                               |
| order_code           | string   | Kode order (contoh: ORD-001-ABC)                        |
| customer_name        | string   | Nama lengkap pelanggan (required)                       |
| product_name         | string   | Nama produk (required)                                  |
| quantity             | integer  | Jumlah pesanan (min: 1, max: 10000)                     |
| total_price          | decimal  | Total harga (min: 1, max: 999999999)                    |
| payment_type         | string   | Tipe pembayaran: "dp" atau "full"                       |
| dp_percent           | decimal  | Persentase DP (50-100, required jika payment_type="dp") |
| design               | file     | File gambar desain (opsional)                           |
| contact_information  | string   | Email atau nomor telepon (required)                     |
| notification_channel | string   | Channel notifikasi: "whatsapp", "email", "both"         |
| design_notes         | string   | Catatan desain (max 1000 karakter)                      |
| paid_amount          | decimal  | Jumlah yang sudah dibayar (read-only)                   |
| is_fully_paid        | boolean  | Status lunas (read-only)                                |
| status_order         | string   | Status pesanan (read-only)                              |
| production_status    | string   | Status produksi (read-only)                             |
| created_at           | datetime | Waktu dibuat (read-only)                                |
| updated_at           | datetime | Waktu diupdate (read-only)                              |

### **Status Order Choices**

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

### **Invoice Model**

| Field                | Tipe     | Deskripsi                        |
| -------------------- | -------- | -------------------------------- |
| id                   | UUID     | ID unik invoice (read-only)      |
| invoice_code         | string   | Kode invoice (contoh: INV-001)   |
| order                | UUID     | Foreign key ke Order             |
| payment_type         | string   | "dp", "pelunasan", atau "full"   |
| dp_percent           | decimal  | Persentase DP                    |
| invoice_amount       | decimal  | Nominal invoice                  |
| invoice_status       | string   | Status invoice                   |
| payment_url          | string   | URL pembayaran Xendit            |
| xendit_invoice_id    | string   | ID invoice di Xendit (read-only) |
| notification_channel | string   | Channel notifikasi               |
| blast_notification   | boolean  | Flag notifikasi terkirim         |
| invoice_created_at   | datetime | Waktu dibuat (read-only)         |
| invoice_expired_at   | datetime | Waktu kadaluarsa                 |
| invoice_paid_at      | datetime | Waktu dibayar                    |

### **Invoice Status Choices**

```python
PAYMENT_STATUS_CHOICES = [
    ("belum dibayar", "Belum Dibayar"),
    ("sudah dibayar", "Sudah Dibayar"),
    ("kadaluarsa", "Kadaluarsa"),
    ("dibatalkan", "Dibatalkan"),
]
```

---

## Daftar Isi

1. [Informasi Umum](#informasi-umum)
2. [Authentication](#authentication)
3. [Endpoint API](#endpoint-api)
4. [Model Data](#model-data)
5. [Error Handling](#error-handling)
6. [Contoh Integrasi](#contoh-integrasi)

---

## Informasi Umum

### Base URL

```
http://localhost:8000/api/v1/
```

### Authentication Type

- JWT (JSON Web Token) untuk endpoint yang memerlukan autentikasi
- Beberapa endpoint bersifat public (tidak memerlukan autentikasi)

### Content Type

- Request: `application/json`
- Response: `application/json`
- File Upload: `multipart/form-data`

### Pagination

- Default page size: 20 items per page
- Query parameters: `?page=1&page_size=20`

---

## Authentication

### 1. Login

**Endpoint:** `POST /auth/login/`  
**Permission:** Public  
**Description:** Login untuk mendapatkan access token

**Request Body:**

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
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response Error (400):**

```json
{
  "non_field_errors": ["Invalid credentials."]
}
```

### 2. Logout

**Endpoint:** `POST /auth/logout/`  
**Permission:** Authenticated  
**Description:** Logout dan blacklist refresh token

**Response Success (205):**

```json
{}
```

### 3. Refresh Token

**Endpoint:** `POST /auth/refresh/`  
**Permission:** Public  
**Description:** Refresh access token menggunakan refresh token dari cookie

**Response Success (200):**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 4. User Profile

**Endpoint:** `GET /auth/profile/`  
**Permission:** Authenticated  
**Description:** Mendapatkan informasi profil user yang sedang login

**Response Success (200):**

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "first_name": "Admin"
}
```

---

## Endpoint API

### PRODUK POSTS (Landing Page)

#### 1. List/Create Produk Posts

**Endpoint:** `GET/POST /produkpost/`  
**Permission:** Authenticated  
**Description:** Mendapatkan daftar produk atau membuat produk baru

**GET Response (200):**

```json
{
  "count": 10,
  "next": "http://localhost:8000/api/v1/produkpost/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nama": "Kaos Custom",
      "deskripsi": "Kaos dengan desain custom sesuai keinginan",
      "kategori": "Pakaian",
      "harga": "150000.00",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**POST Request Body:**

```json
{
  "nama": "Kaos Custom",
  "deskripsi": "Kaos dengan desain custom sesuai keinginan",
  "kategori": "Pakaian",
  "harga": "150000.00"
}
```

**Validasi:**

- `nama`: Minimal 3 karakter, maksimal 100 karakter
- `deskripsi`: Wajib diisi
- `kategori`: Minimal 3 karakter, maksimal 100 karakter
- `harga`: Harus lebih besar dari 0

#### 2. Detail/Update/Delete Produk Post

**Endpoint:** `GET/PUT/PATCH/DELETE /produkpost/{id}/`  
**Permission:** Authenticated  
**Description:** Operasi CRUD untuk produk specific

---

### ORDERS (Pesanan)

#### 1. List/Create Orders

**Endpoint:** `GET/POST /order/`  
**Permission:** Public  
**Description:** Mendapatkan daftar pesanan atau membuat pesanan baru

**GET Response (200):**

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "order_code": "ORD-1234-ABCD",
      "customer_name": "John Doe",
      "product_name": "Kaos Custom",
      "quantity": 50,
      "total_price": "7500000",
      "payment_type": "dp",
      "design": "http://localhost:8000/media/designs/design1.jpg",
      "contact_information": "081234567890",
      "paid_amount": "0",
      "is_fully_paid": false,
      "status_order": "menunggu_link",
      "production_status": "menunggu",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**POST Request Body:**

```json
{
  "customer_name": "John Doe",
  "product_name": "Kaos Custom",
  "quantity": 50,
  "total_price": "7500000",
  "payment_type": "dp",
  "dp_percent": 50,
  "design": "file_upload",
  "contact_information": "081234567890",
  "paid_amount": "0",
  "is_fully_paid": false
}
```

**POST Response Success (201):**

```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "order_code": "ORD-1234-ABCD"
    // ... order data
  },
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "invoice_code": "INV-12345-ABCD"
    // ... invoice data
  },
  "payment_url": "https://checkout.xendit.co/web/12345"
}
```

**Validasi:**

- `customer_name`: Minimal 2 karakter, maksimal 255 karakter
- `product_name`: Minimal 2 karakter, maksimal 255 karakter
- `quantity`: Harus lebih besar dari 0
- `total_price`: Harus lebih besar dari 0
- `contact_information`: Wajib diisi, maksimal 255 karakter
- `dp_percent`: Minimal 50% jika payment_type = "dp"

#### 2. Detail/Update/Delete Order

**Endpoint:** `GET/PUT/PATCH/DELETE /order/{id}/`  
**Permission:** Public  
**Description:** Operasi CRUD untuk pesanan specific

#### 3. Create Payment Link

**Endpoint:** `POST /order/{order_id}/create-payment-link/`  
**Permission:** Public  
**Description:** Membuat link pembayaran untuk pesanan yang sudah ada

**Response Success (201):**

```json
{
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "invoice_code": "INV-12345-ABCD",
    "order": "550e8400-e29b-41d4-a716-446655440001",
    "payment_type": "dp",
    "dp_percent": "50",
    "invoice_amount": "3750000",
    "invoice_status": "belum dibayar",
    "payment_url": "https://checkout.xendit.co/web/12345",
    "xendit_invoice_id": "xendit_inv_123",
    "notification_channel": "whatsapp",
    "blast_notification": false,
    "invoice_created_at": "2024-01-15T10:30:00Z",
    "invoice_expired_at": "2024-01-16T10:30:00Z",
    "invoice_paid_at": null
  },
  "payment_url": "https://checkout.xendit.co/web/12345"
}
```

#### 4. Check Order Status (Public)

**Endpoint:** `GET /check-order/?order_code={order_code}`  
**Permission:** Public  
**Description:** Mengecek status pesanan menggunakan kode pesanan

**Response Success (200):**

```json
{
  "order": {
    // ... order data
  },
  "invoices": [
    {
      // ... invoice data
    }
  ],
  "payments": [
    {
      // ... payment data
    }
  ],
  "summary": {
    "total_price": 7500000.0,
    "total_paid": 3750000.0,
    "remaining": 3750000.0,
    "is_fully_paid": false
  }
}
```

---

### INVOICES (Faktur)

#### 1. List/Create Invoices

**Endpoint:** `GET/POST /invoice/`  
**Permission:** Public  
**Description:** Mendapatkan daftar faktur atau membuat faktur baru

**GET Response (200):**

```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "invoice_code": "INV-12345-ABCD",
      "order": "550e8400-e29b-41d4-a716-446655440001",
      "payment_type": "dp",
      "dp_percent": "50",
      "invoice_amount": "3750000",
      "invoice_status": "belum dibayar",
      "payment_url": "https://checkout.xendit.co/web/12345",
      "xendit_invoice_id": "xendit_inv_123",
      "notification_channel": "whatsapp",
      "blast_notification": false,
      "invoice_created_at": "2024-01-15T10:30:00Z",
      "invoice_expired_at": "2024-01-16T10:30:00Z",
      "invoice_paid_at": null
    }
  ]
}
```

#### 2. Detail/Update/Delete Invoice

**Endpoint:** `GET/PUT/PATCH/DELETE /invoice/{id}/`  
**Permission:** Public

#### 3. Send Payment Link

**Endpoint:** `POST /invoice/{invoice_id}/send-payment-link/`  
**Permission:** Public  
**Description:** Mengirim link pembayaran ke customer via WhatsApp/Email

**Response Success (200):**

```json
{
  "message": "Link pembayaran berhasil dikirim",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

#### 4. Get Invoice Detail (Public)

**Endpoint:** `GET /invoice/detail/{invoice_code}/`  
**Permission:** Public  
**Description:** Mendapatkan detail faktur untuk halaman pembayaran

**Response Success (200):**

```json
{
  "invoice": {
    // ... invoice data
  },
  "order": {
    // ... order data
  },
  "payment_url": "https://checkout.xendit.co/web/12345"
}
```

---

### PAYMENTS (Pembayaran)

#### 1. List/Create Payments

**Endpoint:** `GET/POST /payment/`  
**Permission:** Public

#### 2. Detail/Update/Delete Payment

**Endpoint:** `GET/PUT/PATCH/DELETE /payment/{id}/`  
**Permission:** Public

#### 3. Manual Payment

**Endpoint:** `POST /payment/manual/`  
**Permission:** Public (should be admin only in production)  
**Description:** Mencatat pembayaran manual oleh admin

**Request Body:**

```json
{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440002",
  "payment_method": "BANK_TRANSFER",
  "amount": "3750000",
  "contact_info": "081234567890",
  "payment_time": "2024-01-15T14:30:00Z",
  "notes": "Transfer via BCA"
}
```

#### 4. Payment Callbacks

**Endpoint:** `GET /payment/success/`  
**Endpoint:** `GET /payment/failed/`  
**Permission:** Public  
**Description:** Callback endpoints dari Xendit setelah pembayaran

---

### WEBHOOK

#### Xendit Webhook

**Endpoint:** `POST /webhook/xendit/`  
**Permission:** Public  
**Description:** Webhook untuk menerima notifikasi pembayaran dari Xendit

---

## Model Data

### Order Status Flow

```
menunggu_link → link_dibuat → dp_dibayar → menunggu_pelunasan → lunas
                     ↓              ↓              ↓
                dibatalkan    dibatalkan    dibatalkan
```

### Production Status Flow

```
menunggu → diproses → selesai → dikirim
```

### Payment Types

- `dp`: Down Payment (DP) - minimal 50%
- `full`: Full Payment - pembayaran penuh
- `pelunasan`: Pelunasan - pembayaran sisa setelah DP

### Invoice Status

- `belum dibayar`: Belum Dibayar
- `sudah dibayar`: Sudah Dibayar
- `kadaluarsa`: Kadaluarsa
- `dibatalkan`: Dibatalkan

### Notification Channels

- `whatsapp`: WhatsApp only
- `email`: Email only
- `both`: WhatsApp & Email

---

## Error Handling

### HTTP Status Codes

- `200`: OK - Request berhasil
- `201`: Created - Resource berhasil dibuat
- `400`: Bad Request - Request tidak valid
- `401`: Unauthorized - Tidak terautentikasi
- `403`: Forbidden - Tidak memiliki permission
- `404`: Not Found - Resource tidak ditemukan
- `500`: Internal Server Error - Error server

### Error Response Format

```json
{
  "error": "Pesan error dalam bahasa Indonesia"
}
```

### Validation Error Format

```json
{
  "field_name": ["Error message for this field"],
  "another_field": ["Another error message"]
}
```

---

## Contoh Integrasi

### 1. Membuat Pesanan Baru (Frontend)

```javascript
// Create new order
const createOrder = async (orderData) => {
  const formData = new FormData();
  Object.keys(orderData).forEach((key) => {
    formData.append(key, orderData[key]);
  });

  const response = await fetch("/api/v1/order/", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    const result = await response.json();
    // Redirect to payment URL
    window.open(result.payment_url, "_blank");
    return result;
  } else {
    const error = await response.json();
    throw new Error(error.error || "Gagal membuat pesanan");
  }
};

// Usage
const orderData = {
  customer_name: "John Doe",
  product_name: "Kaos Custom",
  quantity: 50,
  total_price: "7500000",
  payment_type: "dp",
  dp_percent: 50,
  design: fileInput.files[0], // File object
  contact_information: "081234567890",
  paid_amount: "0",
  is_fully_paid: false,
};

createOrder(orderData).then((result) => {
  console.log("Order created:", result);
});
```

### 2. Cek Status Pesanan

```javascript
const checkOrderStatus = async (orderCode) => {
  const response = await fetch(`/api/v1/check-order/?order_code=${orderCode}`);

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Pesanan tidak ditemukan");
  }
};

// Usage
checkOrderStatus("ORD-1234-ABCD").then((result) => {
  console.log("Order status:", result);
  console.log("Total paid:", result.summary.total_paid);
  console.log("Remaining:", result.summary.remaining);
});
```

### 3. Authentication dengan JWT

```javascript
class APIClient {
  constructor() {
    this.baseURL = "/api/v1";
    this.accessToken = localStorage.getItem("access_token");
  }

  async login(username, password) {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.access;
      localStorage.setItem("access_token", data.access);
      return data;
    } else {
      throw new Error("Login failed");
    }
  }

  async authenticatedRequest(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshToken();
      headers["Authorization"] = `Bearer ${this.accessToken}`;
      return fetch(`${this.baseURL}${url}`, { ...options, headers });
    }

    return response;
  }

  async refreshToken() {
    const response = await fetch(`${this.baseURL}/auth/refresh/`, {
      method: "POST",
      credentials: "include", // Include cookies
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.access;
      localStorage.setItem("access_token", data.access);
    } else {
      // Redirect to login
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  }
}

// Usage
const api = new APIClient();

// Login
api.login("admin", "password123").then((user) => {
  console.log("Logged in:", user);
});

// Make authenticated request
api
  .authenticatedRequest("/produkpost/")
  .then((response) => {
    return response.json();
  })
  .then((products) => {
    console.log("Products:", products);
  });
```

### 4. Upload File dengan Progress

```javascript
const uploadOrderWithDesign = async (orderData, onProgress) => {
  const formData = new FormData();
  Object.keys(orderData).forEach((key) => {
    formData.append(key, orderData[key]);
  });

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload error"));
    });

    xhr.open("POST", "/api/v1/order/");
    xhr.send(formData);
  });
};

// Usage
uploadOrderWithDesign(orderData, (progress) => {
  console.log(`Upload progress: ${progress}%`);
}).then((result) => {
  console.log("Order created with design:", result);
});
```

---

## Catatan Implementasi

### Security

- Semua input di-sanitize menggunakan `bleach` library
- JWT tokens disimpan dalam httpOnly cookies untuk refresh token
- CORS harus dikonfigurasi untuk production
- Rate limiting sebaiknya ditambahkan untuk endpoints public

### Performance

- Pagination digunakan untuk list endpoints
- Database indexing pada field yang sering di-query
- File upload menggunakan chunked upload untuk file besar

### Integration Notes

- Xendit integration untuk payment gateway
- WhatsApp API untuk notifikasi (perlu konfigurasi terpisah)
- Email service untuk notifikasi (perlu konfigurasi SMTP)

### Environment Variables

```env
XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_PUBLIC_KEY=your_xendit_public_key
WHATSAPP_API_TOKEN=your_whatsapp_token
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

---

_Dokumentasi ini dibuat untuk memudahkan integrasi antara backend API dengan frontend UI. Pastikan untuk mengecek versi terbaru dari dokumentasi ini sebelum implementasi._

# 🎯 **NEW ADMIN ENDPOINTS - NOTIFICATION TEMPLATE SYSTEM**

## **Template Management Endpoints**

### **1. List/Create Notification Templates**

```http
GET /api/v1/admin/templates/
POST /api/v1/admin/templates/
```

**GET Parameters:**

- `type` (optional): Filter by template type (dp_invoice, pelunasan_invoice, etc.)
- `channel` (optional): Filter by channel (whatsapp, email, both)
- `is_active` (optional): Filter by active status

**POST Body Example:**

```json
{
  "name": "DP Payment Request WhatsApp",
  "type": "dp_invoice",
  "channel": "whatsapp",
  "subject": "",
  "body": "💳 *Link Pembayaran DP*\n\nHalo {{customer_name}},\n\nSilakan bayar DP untuk pesanan {{order_code}}:\n\n💰 Jumlah: Rp {{amount_due}}\n🔗 Link: {{payment_link}}\n⏰ Batas: {{expiry_date}}\n\nTerima kasih!",
  "is_active": true,
  "is_default": true
}
```

### **2. Get/Update/Delete Specific Template**

```http
GET /api/v1/admin/templates/{template_id}/
PUT /api/v1/admin/templates/{template_id}/
DELETE /api/v1/admin/templates/{template_id}/
```

### **3. Preview Template**

```http
POST /api/v1/admin/templates/{template_id}/preview/
```

**Body Example:**

```json
{
  "context": {
    "customer_name": "John Doe",
    "order_code": "ORD-001-ABC",
    "amount_due": "150,000",
    "payment_link": "https://pay.example.com/123"
  }
}
```

### **4. Get Template Types and Variables**

```http
GET /api/v1/admin/template-types/
```

**Response:**

```json
{
  "template_types": [
    ["dp_invoice", "DP Invoice"],
    ["pelunasan_invoice", "Pelunasan Invoice"],
    ["payment_confirmation", "Payment Confirmation"]
  ],
  "notification_channels": [
    ["whatsapp", "WhatsApp"],
    ["email", "Email"],
    ["both", "Both"]
  ],
  "available_variables": [
    "customer_name",
    "order_code",
    "invoice_code",
    "product_name",
    "amount_due",
    "payment_link",
    "expiry_date"
  ]
}
```

---

## **🎯 NEW ADMIN ENDPOINTS - ORDER MANAGEMENT**

### **5. Request Final Payment (Admin-Triggered)**

```http
POST /api/v1/admin/order/{order_id}/request-final-payment/
```

**Purpose:** Admin manually triggers final payment workflow when production is complete.

**Prerequisites:**

- Order status must be `dp_dibayar`
- Order must not be fully paid
- No existing unpaid `pelunasan` invoice

**Response Example:**

```json
{
  "success": true,
  "message": "Final payment invoice created successfully",
  "order_id": "123e4567-e89b-12d3-a456-426614174000",
  "order_code": "ORD-001-ABC",
  "new_order_status": "pengerjaan_selesai",
  "final_invoice": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "invoice_code": "INV-002",
    "amount": "140000",
    "payment_url": "https://checkout.xendit.co/...",
    "expires_at": "2024-01-15T23:59:59+07:00"
  },
  "note": "Invoice created but notification NOT sent automatically. Use send-notification endpoint to notify customer."
}
```

### **6. Send Notification (Admin-Controlled)**

```http
POST /api/v1/admin/invoice/{invoice_id}/send-notification/
```

**Purpose:** Admin manually sends customized notification to customer using templates.

**Body Example:**

```json
{
  "template_id": "template-uuid-here",
  "custom_context": {
    "special_message": "Terima kasih atas kesabaran Anda!"
  }
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Notification sent successfully via whatsapp",
  "invoice_id": "456e7890-e89b-12d3-a456-426614174001",
  "invoice_code": "INV-002",
  "template_used": {
    "id": "template-uuid",
    "name": "Final Payment Request",
    "type": "pelunasan_invoice",
    "channel": "whatsapp"
  },
  "sent_channels": ["whatsapp"],
  "rendered_content": {
    "subject": "",
    "body": "💳 *Pembayaran Pelunasan*\n\nHalo John Doe,\n\nProduksi telah selesai! Silakan lakukan pembayaran pelunasan..."
  }
}
```

### **7. Regenerate Payment Link (Admin-Only)**

```http
POST /api/v1/admin/invoice/{invoice_id}/regenerate-payment-link/
```

**Purpose:** Admin can regenerate payment link for expired or problematic invoices without creating new invoice.

**Use Cases:**

- Invoice expired before customer could pay
- Customer encountered technical issues with payment link
- Payment gateway issues required new link generation

**Prerequisites:**

- Invoice status must be `belum dibayar` or `kadaluarsa`
- Cannot regenerate for `sudah dibayar` invoices

**Response Example (Success):**

```json
{
  "success": true,
  "message": "Payment link berhasil dibuat ulang",
  "invoice": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "invoice_code": "INV-002",
    "order_code": "ORD-001-ABC",
    "payment_type": "pelunasan",
    "amount": "140000",
    "status": "belum dibayar",
    "payment_url": "https://checkout.xendit.co/new-link-here",
    "expires_at": "2024-01-20T23:59:59+07:00",
    "regenerated_at": "2024-01-16T10:00:00+07:00"
  },
  "previous_data": {
    "payment_url": "https://checkout.xendit.co/old-link-here",
    "xendit_invoice_id": "old-xendit-id-123",
    "expired_at": "2024-01-15T23:59:59+07:00",
    "status": "kadaluarsa"
  },
  "next_steps": {
    "notification": "Use /admin/invoice/{id}/send-notification/ to notify customer",
    "note": "Payment link regenerated but notification NOT sent automatically"
  }
}
```

**Error Responses:**

```json
// 400 - Cannot regenerate paid invoice
{
  "error": "Tidak bisa membuat ulang link untuk invoice yang sudah lunas",
  "invoice_code": "INV-002",
  "current_status": "sudah dibayar"
}

// 400 - Invalid status for regeneration
{
  "error": "Regenerasi hanya diizinkan untuk invoice dengan status: belum dibayar, kadaluarsa",
  "invoice_code": "INV-002",
  "current_status": "dibatalkan"
}

// 404 - Invoice not found
{
  "error": "Invoice tidak ditemukan",
  "invoice_id": "456e7890-e89b-12d3-a456-426614174001"
}

// 500 - Xendit API error
{
  "error": "Gagal melakukan regenerasi payment link: Xendit API connection failed",
  "invoice_id": "456e7890-e89b-12d3-a456-426614174001"
}
```

**New Invoice Expiration Rules:**

- **DP invoices**: 3 days from regeneration
- **Pelunasan invoices**: 4 days from regeneration
- **Full payment invoices**: 48 hours from regeneration

**Important Notes:**

- Regeneration creates completely new Xendit invoice with new ID
- Old payment link becomes invalid immediately
- Invoice status automatically reset to `belum dibayar`
- Full audit trail logged for regeneration action
- **NO automatic notification** - admin must manually send notification

---

## **📋 WORKFLOW CHANGES**

### **New DP Payment Workflow:**

1. **Admin creates order** → System generates DP invoice (expires in 3 days)
2. **Customer pays DP** → Order status: `dp_dibayar` (NO auto pelunasan invoice)
3. **Production work continues** → Admin monitors progress
4. **Production complete** → Admin calls `/request-final-payment/`
   - Order status: `pengerjaan_selesai`
   - Creates pelunasan invoice (expires in 4 days)
   - **NO automatic notification sent**
5. **Admin sends notification** → Admin calls `/send-notification/` with chosen template
6. **Customer pays final** → Order status: `lunas`

### **Template Variables Available:**

- `{{customer_name}}` - Customer name
- `{{order_code}}` - Order code (e.g., ORD-001-ABC)
- `{{invoice_code}}` - Invoice code (e.g., INV-002)
- `{{product_name}}` - Product name
- `{{amount_due}}` - Amount to pay (formatted: "150,000")
- `{{payment_link}}` - Xendit payment URL
- `{{expiry_date}}` - Payment deadline (formatted: "31/12/2024 23:59")
- `{{quantity}}` - Order quantity
- `{{total_price}}` - Total order price
- `{{paid_amount}}` - Amount already paid
- `{{payment_type}}` - Payment type (DP/PELUNASAN/FULL)
- `{{order_status}}` - Current order status display

---

## **🔒 SECURITY UPDATES**

### **Template Security:**

- All template variables are automatically sanitized to prevent XSS
- HTML content is stripped from user inputs
- Template rendering is context-isolated

### **Admin Endpoints:**

- All admin endpoints use `AllowAny` permission for testing
- **TODO:** Change to `IsAdminUser` in production
- Full audit logging for all admin actions

---

## **⏰ SCHEDULED TASKS (CELERY)**

### **Auto-Expire Invoices Task**

**Task:** `auto_expire_invoices`
**Schedule:** Setiap jam (recommended)
**Purpose:** Otomatis mengubah status invoice yang sudah melewati `invoice_expired_at` menjadi `kadaluarsa`.

**Process:**

1. Mencari semua invoice dengan status `belum dibayar` dan `invoice_expired_at < now()`
2. Update status menjadi `kadaluarsa`
3. Log perubahan untuk audit trail
4. Return summary report

**Task Response:**

```json
{
  "expired_count": 5,
  "processed_at": "2024-01-16T12:00:00Z",
  "status": "success"
}
```

**Manual Execution:**

```bash
# Via Django management command (if implemented)
python manage.py expire_invoices

# Via Celery directly
from order.tasks import auto_expire_invoices
result = auto_expire_invoices.delay()
```

### **Cleanup Old Expired Invoices Task**

**Task:** `cleanup_old_expired_invoices`
**Schedule:** Harian (recommended)
**Purpose:** Maintenance task untuk log invoice yang sudah kadaluarsa lebih dari 30 hari.

**Note:** Task ini saat ini hanya melakukan logging, tidak menghapus data (safety measure).

---

## **📊 ENHANCED AUDIT SYSTEM**

### **New Audit Capabilities:**

- Track all admin-triggered status changes
- Log template usage and notification sending
- Monitor webhook processing with timing
- Complete audit trail for each order

### **Audit Trail Example:**

```json
{
  "order_code": "ORD-001-ABC",
  "audit_trail": [
    {
      "timestamp": "2024-01-10T10:00:00Z",
      "change_type": "order_status",
      "previous_status": "dp_dibayar",
      "new_status": "pengerjaan_selesai",
      "trigger_source": "admin",
      "notes": "Admin requested final payment - order moved to production complete"
    },
    {
      "timestamp": "2024-01-10T10:01:00Z",
      "change_type": "invoice_status",
      "new_status": "belum dibayar",
      "trigger_source": "admin",
      "notes": "Final payment invoice created by admin"
    },
    {
      "timestamp": "2024-01-10T10:05:00Z",
      "change_type": "invoice_status",
      "previous_status": "belum dibayar",
      "new_status": "belum dibayar",
      "trigger_source": "admin",
      "notes": "Notification sent via whatsapp using template: Final Payment Request"
    }
  ]
}
```

---

# 🌐 **PUBLIC TRACKING ENDPOINT (ENHANCED)**

## **Track Order Status (Customer Timeline)**

### **Endpoint Details**

```http
GET /api/v1/track-order/
```

**Purpose:** Memungkinkan pelanggan untuk melacak status pesanan dengan timeline yang customer-friendly, progress tracking, dan estimated milestones.

**Authentication:** Tidak diperlukan (Public endpoint)

**Rate Limiting:** 10 requests per menit per IP address

**Cache:** 15 menit server-side cache untuk performance optimal

**Enhancement Features:**

- 📅 Customer-friendly timeline milestones
- 📊 Real-time progress percentage
- 🎯 Current stage indication
- 📅 Estimated future milestones
- 🎨 Icon-based categories
- 🔄 Production status integration

---

### **Request Parameters**

**Query Parameters:**

- `order_code` (required): Kode order yang diterima pelanggan (format: ORD-XXX-YYY)

**Example Request:**

```http
GET /api/v1/track-order/?order_code=ORD-001-ABC
```

---

### **Enhanced Response Format**

#### **Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Data order berhasil ditemukan",
  "data": {
    "order_code": "ORD-001-ABC",
    "customer_name": "Budi S.",
    "product_name": "Kaos Custom Logo",
    "quantity": 100,
    "status_order": "dp_dibayar",
    "order_status_display": "DP Dibayar",
    "production_status": "diproses",
    "production_status_display": "Sedang Diproduksi",
    "is_fully_paid": false,
    "created_at": "2025-06-29T12:11:04.169000Z",

    // 📅 Enhanced Timeline (Customer-Friendly)
    "timeline": [
      {
        "id": "order_created_uuid",
        "timestamp": "2025-06-29T12:11:04.169000Z",
        "milestone": "Pesanan Dibuat",
        "description": "Pesanan ORD-001-ABC telah diterima",
        "icon": "📝",
        "category": "order",
        "status": "completed",
        "order": 1,
        "is_estimated": false
      },
      {
        "id": "invoice_created_uuid",
        "timestamp": "2025-06-29T12:11:05.000000Z",
        "milestone": "Invoice DP Dibuat",
        "description": "Invoice Down Payment telah dibuat (INV-009)",
        "icon": "🧾",
        "category": "payment",
        "status": "completed",
        "order": 10,
        "invoice_code": "INV-009",
        "amount": "600000"
      },
      {
        "id": "payment_received_uuid",
        "timestamp": "2025-06-29T14:30:00.000000Z",
        "milestone": "DP Dibayar",
        "description": "Down Payment telah diterima (INV-009)",
        "icon": "✅",
        "category": "payment",
        "status": "completed",
        "order": 20,
        "invoice_code": "INV-009",
        "amount": "600000"
      },
      {
        "id": "production_diproses",
        "timestamp": "2025-06-29T15:00:00.000000Z",
        "milestone": "Sedang Diproduksi",
        "description": "Tim produksi sedang mengerjakan pesanan Anda",
        "icon": "🔧",
        "category": "production",
        "status": "current",
        "order": 40
      },
      {
        "id": "future_pelunasan",
        "timestamp": "2025-07-02T12:11:04.169000Z",
        "milestone": "Pelunasan Tersedia",
        "description": "Estimasi invoice pelunasan akan tersedia",
        "icon": "📅",
        "category": "payment",
        "status": "pending",
        "order": 50,
        "is_estimated": true
      },
      {
        "id": "future_shipping",
        "timestamp": "2025-07-03T12:11:04.169000Z",
        "milestone": "Estimasi Pengiriman",
        "description": "Estimasi pesanan akan dikirim dalam 3 hari",
        "icon": "📦",
        "category": "shipping",
        "status": "pending",
        "order": 60,
        "is_estimated": true
      }
    ],

    // 📊 Progress Information
    "progress": {
      "percentage": 55.0,
      "completed_milestones": 3,
      "total_milestones": 5,
      "status": "in_progress"
    },

    // 🎯 Current Stage
    "current_stage": {
      "code": "production",
      "display": "Produksi"
    },

    // 🔮 Next Expected Milestone
    "next_milestone": {
      "milestone": "Produksi Selesai",
      "description": "Produksi selesai, produk siap untuk pengiriman",
      "icon": "✨",
      "estimated_date": "2025-07-02"
    },

    // 💰 Payment Summary
    "payment_summary": {
      "total_amount": "1000000",
      "amount_paid": "600000",
      "remaining_balance": "400000",
      "payment_type": "dp",
      "payment_type_display": "Down Payment"
    },

    // 🧾 Invoice Details
    "invoices": [
      {
        "invoice_code": "INV-009",
        "payment_type": "dp",
        "invoice_type_display": "Down Payment",
        "invoice_status": "sudah dibayar",
        "status_display": "Sudah Dibayar",
        "invoice_amount": "600000",
        "invoice_paid_at": "2025-06-29T14:30:00Z",
        "payment_link": null
      }
    ]
  }
}
```

### **Timeline Data Structure**

#### **Timeline Categories:**

- `order`: Order-related milestones (creation, cancellation)
- `payment`: Payment-related milestones (invoice creation, payments)
- `production`: Production-related milestones (production phases)
- `shipping`: Shipping-related milestones (dispatch, delivery)

#### **Timeline Status:**

- `completed`: ✅ Milestone sudah selesai
- `current`: 🔄 Milestone sedang aktif/berjalan
- `pending`: ⏳ Milestone masa depan/estimasi

#### **Progress Status:**

- `in_progress`: Pesanan masih dalam proses
- `completed`: Pesanan selesai sepenuhnya

#### **Current Stage Codes:**

- `payment`: Menunggu atau proses pembayaran
- `production`: Fase produksi
- `shipping`: Fase pengiriman
- `completed`: Pesanan selesai
- `cancelled`: Pesanan dibatalkan
- `in_progress`: Status umum dalam proses

#### **Icons & Meanings:**

- 📝 Pesanan dibuat
- 🧾 Invoice dibuat
- ✅ Pembayaran diterima
- 💯 Pembayaran lunas
- ⏳ Menunggu produksi
- 🔧 Sedang diproduksi
- ✨ Produksi selesai
- 🚚 Sedang dikirim
- 📦 Estimasi pengiriman
- 📅 Estimasi milestone
- 💰 Menunggu pelunasan

#### **Error Responses**

**400 Bad Request - Missing Parameter:**

```json
{
  "error": "Parameter order_code diperlukan",
  "detail": "Gunakan format: /api/v1/track-order/?order_code=ORD-001-XYZ"
}
```

**400 Bad Request - Invalid Format:**

```json
{
  "error": "Format order code tidak valid",
  "detail": "Format order code harus: ORD-XXX-YYY (contoh: ORD-001-ABC)"
}
```

**404 Not Found - Order Not Found:**

```json
{
  "error": "Order dengan kode tersebut tidak ditemukan",
  "detail": "Pastikan kode order yang Anda masukkan benar"
}
```

**429 Too Many Requests - Rate Limited:**

```json
{
  "detail": "Terlalu banyak permintaan. Coba lagi dalam 1 menit."
}
```

**500 Internal Server Error:**

```json
{
  "error": "Terjadi kesalahan server",
  "detail": "Silakan coba lagi nanti"
}
```

---

### **Data Privacy & Security**

#### **Customer Name Masking**

Nama pelanggan ditampilkan dengan format yang melindungi privasi:

- Input: "Budi Santoso" → Output: "Budi S."
- Input: "Ahmad" → Output: "Ahmad"
- Input: "Siti Fatimah Zahra" → Output: "Siti Z."

#### **Payment Link Security**

- Payment link hanya ditampilkan jika invoice status = "belum dibayar"
- Link otomatis dihilangkan jika invoice sudah expired
- Link tidak ditampilkan untuk invoice yang sudah dibayar

#### **Data Exclusions**

Endpoint ini **TIDAK** menampilkan informasi sensitif berikut:

- Nomor telepon lengkap
- Alamat email
- Catatan internal admin
- Detail gateway payment
- Contact information
- Design notes

---

### **Rate Limiting**

**Limit:** 10 requests per menit per IP address

**Implementation:**

- Menggunakan Django cache system
- Counter reset setiap 1 menit
- IP address detection melalui X-Forwarded-For header

**Production Recommendation:**
Gunakan Redis dan django-ratelimit untuk rate limiting yang lebih robust.

---

### **Usage Examples**

#### **Frontend Integration (JavaScript)**

```javascript
async function trackOrder(orderCode) {
  try {
    const response = await fetch(
      `/api/v1/track-order/?order_code=${orderCode}`
    );

    const data = await response.json();

    if (data.success) {
      displayOrderInfo(data.data);
    } else {
      showError(data.error);
    }
  } catch (error) {
    showError("Terjadi kesalahan jaringan");
  }
}
```

#### **Mobile App Integration (React Native)**

```javascript
import { trackOrder } from "./api";

const TrackOrderScreen = () => {
  const [orderCode, setOrderCode] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrackOrder = async () => {
    setLoading(true);
    try {
      const response = await trackOrder(orderCode);
      if (response.success) {
        setOrderData(response.data);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... render UI
};
```

---

### **Status Display Mapping**

**Order Status:**

- `menunggu_link` → "Menunggu Link"
- `link_dibuat` → "Link Dibuat"
- `dp_dibayar` → "DP Dibayar"
- `pengerjaan_selesai` → "Pengerjaan Selesai"
- `menunggu_pelunasan` → "Menunggu Pelunasan"
- `lunas` → "Lunas"
- `dibatalkan` → "Dibatalkan"

**Invoice Status:**

- `belum dibayar` → "Belum Dibayar"
- `sudah dibayar` → "Sudah Dibayar"
- `kadaluarsa` → "Kadaluarsa"
- `dibatalkan` → "Dibatalkan"

**Invoice Types:**

- `dp` → "Down Payment"
- `pelunasan` → "Pelunasan"
- `full` → "Full Payment"

---

### **Testing Examples**

#### **cURL Commands**

```bash
# Test valid order code
curl -X GET "https://your-domain.com/api/v1/track-order/?order_code=ORD-001-ABC"

# Test invalid format
curl -X GET "https://your-domain.com/api/v1/track-order/?order_code=INVALID"

# Test missing parameter
curl -X GET "https://your-domain.com/api/v1/track-order/"

# Test non-existent order
curl -X GET "https://your-domain.com/api/v1/track-order/?order_code=ORD-999-ZZZ"
```

#### **Postman Collection**

```json
{
  "name": "Track Order - Valid",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{base_url}}/api/v1/track-order/?order_code=ORD-001-ABC",
      "query": [
        {
          "key": "order_code",
          "value": "ORD-001-ABC"
        }
      ]
    }
  }
}
```

---

### **Performance Considerations**

#### **Database Optimization**

```python
# Query optimization yang digunakan:
Order.objects.select_related().prefetch_related(
    'invoices',
    'invoices__payments',
    'status_histories'
).get(order_code=order_code)
```

#### **Caching Strategy**

Untuk production, pertimbangkan caching response:

```python
from django.core.cache import cache

cache_key = f"track_order:{order_code}"
cached_data = cache.get(cache_key)

if not cached_data:
    # Generate data
    cache.set(cache_key, data, 300)  # 5 minutes cache
```

---

### **Security Audit Log**

Setiap akses tracking order dicatat untuk audit:

```
INFO: Order tracking accessed: ORD-001-ABC from IP: 192.168.1.100
```

Log ini membantu monitoring dan deteksi aktivitas mencurigakan seperti:

- Brute force attempts
- Unusual access patterns
- Potential scraping behavior

---

# **📋 ENDPOINT ADMIN LENGKAP**

## **🔧 MANAJEMEN ORDER ADMIN**

### **Create Order Admin**

**Endpoint:** `POST /api/v1/admin/create-order/`

**Deskripsi:** Admin membuat order baru untuk pelanggan dengan otomatis generate invoice

**Otorisasi:** Admin Only

**Request Body:**
| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| customer_name | string | Ya | Nama lengkap pelanggan |
| product_name | string | Ya | Nama produk |
| quantity | integer | Ya | Jumlah pesanan (1-10000) |
| total_price | decimal | Ya | Total harga |
| payment_type | string | Ya | "dp" atau "full" |
| dp_percent | decimal | Kondisional | Persentase DP (50-100, wajib jika payment_type="dp") |
| contact_information | string | Ya | Email atau nomor telepon |
| notification_channel | string | Ya | "whatsapp", "email", atau "both" |
| design_notes | string | Tidak | Catatan desain (max 1000 karakter) |

**Contoh Request Body:**

```json
{
  "customer_name": "Budi Santoso",
  "product_name": "Kaos Custom Logo Perusahaan",
  "quantity": 50,
  "total_price": "2500000",
  "payment_type": "dp",
  "dp_percent": "60",
  "contact_information": "081234567890",
  "notification_channel": "whatsapp",
  "design_notes": "Logo perusahaan warna biru di bagian dada kiri"
}
```

**Contoh Respons Sukses (201 Created):**

```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "order": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "order_code": "ORD-001-ABC",
    "customer_name": "Budi Santoso",
    "product_name": "Kaos Custom Logo Perusahaan",
    "quantity": 50,
    "total_price": "2500000",
    "payment_type": "dp",
    "status_order": "link_dibuat",
    "created_at": "2024-01-10T10:00:00Z"
  },
  "invoice": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "invoice_code": "INV-001",
    "payment_type": "dp",
    "invoice_amount": "1500000",
    "payment_url": "https://checkout.xendit.co/...",
    "invoice_expired_at": "2024-01-13T23:59:59Z"
  }
}
```

**Contoh Penggunaan cURL:**

```bash
curl -X POST 'https://your-domain.com/api/v1/admin/create-order/' \
-H 'Content-Type: application/json' \
-H 'X-CSRFToken: <your_csrf_token>' \
-b 'sessionid=<your_session_id>' \
--data-raw '{
    "customer_name": "Budi Santoso",
    "product_name": "Kaos Custom Logo Perusahaan",
    "quantity": 50,
    "total_price": "2500000",
    "payment_type": "dp",
    "dp_percent": "60",
    "contact_information": "081234567890",
    "notification_channel": "whatsapp"
}'
```

---

## **🔄 MANAJEMEN PAYMENT LINKS**

### **Regenerate Payment Link**

**Endpoint:** `POST /api/v1/admin/invoice/{invoice_id}/regenerate-payment-link/`

**Deskripsi:** Admin membuat ulang link pembayaran untuk invoice yang expired atau bermasalah

**Otorisasi:** Admin Only

**Prerequisites:**

- Invoice status harus `belum dibayar` atau `kadaluarsa`
- Tidak bisa regenerate invoice yang `sudah dibayar`

**URL Parameters:**

- `invoice_id` (UUID): ID invoice yang akan di-regenerate

**Contoh Respons Sukses (200 OK):**

```json
{
  "success": true,
  "message": "Payment link berhasil dibuat ulang",
  "invoice": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "invoice_code": "INV-002",
    "order_code": "ORD-001-ABC",
    "payment_type": "pelunasan",
    "amount": "1000000",
    "status": "belum dibayar",
    "payment_url": "https://checkout.xendit.co/new-link-here",
    "expires_at": "2024-01-20T23:59:59Z",
    "regenerated_at": "2024-01-16T10:00:00Z"
  },
  "previous_data": {
    "payment_url": "https://checkout.xendit.co/old-link-here",
    "xendit_invoice_id": "old-xendit-id-123",
    "expired_at": "2024-01-15T23:59:59Z",
    "status": "kadaluarsa"
  },
  "next_steps": {
    "notification": "Use /admin/invoice/{id}/send-notification/ to notify customer",
    "note": "Payment link regenerated but notification NOT sent automatically"
  }
}
```

**Contoh Respons Error (400 Bad Request):**

```json
{
  "error": "Tidak bisa membuat ulang link untuk invoice yang sudah lunas",
  "invoice_code": "INV-002",
  "current_status": "sudah dibayar"
}
```

**Ekspirasi Rules Baru:**

- **DP invoices**: 3 hari dari regeneration
- **Pelunasan invoices**: 4 hari dari regeneration
- **Full payment invoices**: 48 jam dari regeneration

---

## **📤 MANAJEMEN NOTIFIKASI**

### **Send Notification Manual**

**Endpoint:** `POST /api/v1/admin/invoice/{invoice_id}/send-notification/`

**Deskripsi:** Admin mengirim notifikasi manual ke pelanggan menggunakan template yang dipilih

**Otorisasi:** Admin Only

**URL Parameters:**

- `invoice_id` (UUID): ID invoice untuk dikirim notifikasi

**Request Body:**
| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| template_id | UUID | Ya | ID template notifikasi yang akan digunakan |
| custom_context | object | Tidak | Context tambahan untuk template |

**Contoh Request Body:**

```json
{
  "template_id": "abc12345-e89b-12d3-a456-426614174003",
  "custom_context": {
    "special_message": "Terima kasih atas kesabaran Anda!"
  }
}
```

**Contoh Respons Sukses (200 OK):**

```json
{
  "success": true,
  "message": "Notification sent successfully via whatsapp",
  "invoice_id": "456e7890-e89b-12d3-a456-426614174001",
  "invoice_code": "INV-002",
  "template_used": {
    "id": "abc12345-e89b-12d3-a456-426614174003",
    "name": "Final Payment Request",
    "type": "pelunasan_invoice",
    "channel": "whatsapp"
  },
  "sent_channels": ["whatsapp"],
  "rendered_content": {
    "subject": "",
    "body": "💳 *Pembayaran Pelunasan*\n\nHalo Budi Santoso,\n\nProduksi telah selesai! Silakan lakukan pembayaran pelunasan..."
  },
  "context_used": {
    "customer_name": "Budi Santoso",
    "order_code": "ORD-001-ABC",
    "amount_due": "1,000,000",
    "payment_link": "https://checkout.xendit.co/...",
    "special_message": "Terima kasih atas kesabaran Anda!"
  }
}
```

---

## **📝 TEMPLATE MANAGEMENT**

### **List Templates**

**Endpoint:** `GET /api/v1/admin/templates/`

**Deskripsi:** Mendapatkan daftar semua notification templates

**Otorisasi:** Admin Only

**Query Parameters:**

- `type` (string, optional): Filter berdasarkan tipe template
- `channel` (string, optional): Filter berdasarkan channel
- `is_active` (boolean, optional): Filter berdasarkan status aktif

**Contoh Response (200 OK):**

```json
[
  {
    "id": "abc12345-e89b-12d3-a456-426614174003",
    "name": "DP Payment Request",
    "type": "dp_invoice",
    "channel": "whatsapp",
    "subject": "",
    "body": "💳 *Pembayaran DP*\n\nHalo {{customer_name}},\n\nSilakan lakukan pembayaran DP untuk pesanan {{order_code}}:\n\n💰 Jumlah: Rp {{amount_due}}\n🔗 Link: {{payment_link}}\n⏰ Batas: {{expiry_date}}\n\nTerima kasih!",
    "is_active": true,
    "is_default": true,
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-10T10:00:00Z"
  }
]
```

### **Create Template**

**Endpoint:** `POST /api/v1/admin/templates/`

**Request Body:**
| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| name | string | Ya | Nama template (min 3 karakter) |
| type | string | Ya | Tipe: dp_invoice, pelunasan_invoice, payment_confirmation, dll |
| channel | string | Ya | Channel: whatsapp, email, both |
| subject | string | Kondisional | Subject email (wajib untuk email/both) |
| body | string | Ya | Body template dengan variabel (min 10 karakter) |
| is_active | boolean | Tidak | Status aktif (default: true) |
| is_default | boolean | Tidak | Template default untuk tipe (default: false) |

**Template Variables yang Tersedia:**

- `{{customer_name}}` - Nama customer
- `{{order_code}}` - Kode order
- `{{invoice_code}}` - Kode invoice
- `{{product_name}}` - Nama produk
- `{{amount_due}}` - Jumlah yang harus dibayar
- `{{payment_link}}` - Link pembayaran
- `{{expiry_date}}` - Tanggal kadaluarsa
- `{{quantity}}` - Jumlah pesanan
- `{{total_price}}` - Total harga pesanan
- `{{paid_amount}}` - Jumlah yang sudah dibayar
- `{{payment_type}}` - Tipe pembayaran
- `{{order_status}}` - Status pesanan

### **Update/Delete Template**

**Endpoint:** `PUT/DELETE /api/v1/admin/templates/{template_id}/`

### **Preview Template**

**Endpoint:** `POST /api/v1/admin/templates/{template_id}/preview/`

**Request Body:**

```json
{
  "context": {
    "customer_name": "John Doe",
    "order_code": "ORD-001-ABC",
    "amount_due": "1,500,000",
    "payment_link": "https://pay.example.com/123"
  }
}
```

**Response:**

```json
{
  "rendered": {
    "subject": "",
    "body": "💳 *Pembayaran DP*\n\nHalo John Doe,\n\nSilakan lakukan pembayaran DP untuk pesanan ORD-001-ABC:\n\n💰 Jumlah: Rp 1,500,000\n🔗 Link: https://pay.example.com/123\n⏰ Batas: {{expiry_date}}\n\nTerima kasih!"
  }
}
```

### **Get Template Types**

**Endpoint:** `GET /api/v1/admin/template-types/`

**Response:**

```json
{
  "template_types": [
    ["dp_invoice", "DP Invoice"],
    ["pelunasan_invoice", "Pelunasan Invoice"],
    ["full_invoice", "Full Payment Invoice"],
    ["payment_confirmation", "Payment Confirmation"],
    ["order_status_update", "Order Status Update"],
    ["marketing_blast", "Marketing Blast"],
    ["custom", "Custom"]
  ],
  "notification_channels": [
    ["whatsapp", "WhatsApp"],
    ["email", "Email"],
    ["both", "Both"]
  ],
  "available_variables": [
    "customer_name",
    "order_code",
    "invoice_code",
    "product_name",
    "amount_due",
    "payment_link",
    "expiry_date",
    "quantity",
    "total_price",
    "paid_amount",
    "payment_type",
    "order_status"
  ]
}
```

---

## **🔗 WEBHOOK ENDPOINT**

### **Xendit Webhook**

**Endpoint:** `POST /api/v1/webhook/xendit/`

**Deskripsi:** Webhook receiver untuk notifikasi pembayaran dari Xendit

**Otorisasi:** Public (dengan X-CALLBACK-TOKEN validation)

**Headers Required:**

- `X-CALLBACK-TOKEN`: Token validasi dari Xendit

**Webhook Events yang Didukung:**

- `invoice.paid` - Invoice telah dibayar
- `invoice.expired` - Invoice telah kadaluarsa

**Webhook Processing:**

1. Validasi callback token
2. Log webhook untuk audit
3. Update status invoice dan order
4. Tidak mengirim notifikasi otomatis (sesuai workflow baru)

**Response:**

```json
{
  "status": "success",
  "message": "Webhook processed successfully"
}
```

---

## **📊 ENDPOINTS LAINNYA**

### **Order CRUD Lengkap**

**List Orders:** `GET /api/v1/order/`
**Create Order:** `POST /api/v1/order/`
**Detail Order:** `GET /api/v1/{order_id}/`
**Update Order:** `PUT /api/v1/{order_id}/`
**Delete Order:** `DELETE /api/v1/{order_id}/`

### **Invoice CRUD Lengkap**

**List Invoices:** `GET /api/v1/invoice/`
**Create Invoice:** `POST /api/v1/invoice/`
**Detail Invoice:** `GET /api/v1/invoice/{invoice_id}/`
**Update Invoice:** `PUT /api/v1/invoice/{invoice_id}/`
**Delete Invoice:** `DELETE /api/v1/invoice/{invoice_id}/`

### **Payment CRUD Lengkap**

**List Payments:** `GET /api/v1/payment/`
**Create Payment:** `POST /api/v1/payment/`
**Detail Payment:** `GET /api/v1/payment/{payment_id}/`
**Update Payment:** `PUT /api/v1/payment/{payment_id}/`
**Delete Payment:** `DELETE /api/v1/payment/{payment_id}/`

### **Public Invoice Detail**

**Endpoint:** `GET /api/v1/invoice/detail/{invoice_code}/`

**Deskripsi:** Mendapatkan detail invoice untuk pelanggan (public)

**Response:**

```json
{
  "invoice_code": "INV-001",
  "order_code": "ORD-001-ABC",
  "customer_name": "Budi S.",
  "product_name": "Kaos Custom",
  "invoice_amount": "1500000",
  "invoice_status": "belum dibayar",
  "payment_url": "https://checkout.xendit.co/...",
  "invoice_expired_at": "2024-01-13T23:59:59Z"
}
```

### **Audit Trail**

**Endpoint:** `GET /api/v1/orders/{order_id}/audit-trail/`

**Deskripsi:** Mendapatkan complete audit trail untuk order tertentu

**Response:**

```json
{
  "order": {
    "order_code": "ORD-001-ABC",
    "customer_name": "Budi Santoso"
  },
  "status_histories": [
    {
      "change_type": "order_status",
      "previous_status": "dp_dibayar",
      "new_status": "pengerjaan_selesai",
      "trigger_source": "admin",
      "notes": "Admin requested final payment",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "webhook_logs": [
    {
      "source": "xendit",
      "webhook_type": "invoice.paid",
      "status": "processed",
      "created_at": "2024-01-10T09:55:00Z"
    }
  ]
}
```

---

# **🧪 TESTING & DEVELOPMENT**

## **Environment Setup**

**Development Base URL:** `http://localhost:8000/api/v1/`
**Production Base URL:** `https://your-domain.com/api/v1/`

## **Authentication untuk Testing**

1. **Login sebagai Admin:**

```bash
curl -X POST 'http://localhost:8000/api/v1/auth/login/' \
-H 'Content-Type: application/json' \
--data-raw '{
    "username": "admin",
    "password": "admin123"
}'
```

2. **Extract sessionid dan csrftoken dari response cookies**

3. **Gunakan untuk request selanjutnya:**

```bash
curl -X POST 'http://localhost:8000/api/v1/admin/create-order/' \
-H 'Content-Type: application/json' \
-H 'X-CSRFToken: your_csrf_token' \
-b 'sessionid=your_session_id' \
--data-raw '{...}'
```

## **Postman Collection**

Import collection berikut untuk testing:

```json
{
  "info": {
    "name": "Konveksi API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "noauth"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000/api/v1"
    }
  ]
}
```

---

# **🚀 PRODUCTION DEPLOYMENT**

## **Security Checklist**

- [ ] Change `AllowAny` permissions to `IsAdminUser` for admin endpoints
- [ ] Enable HTTPS
- [ ] Configure proper CORS settings
- [ ] Set up Redis for caching dan rate limiting
- [ ] Configure Celery untuk scheduled tasks
- [ ] Set up proper logging dan monitoring
- [ ] Configure environment variables untuk secrets

## **Monitoring**

- **Health Check:** `GET /api/v1/` (API Root)
- **Metrics:** Track API response times dan error rates
- **Logs:** Monitor audit logs untuk security events

---

**📝 Dokumentasi ini mencakup semua endpoint yang tersedia dalam sistem. Untuk pertanyaan lebih lanjut, hubungi tim development.**
