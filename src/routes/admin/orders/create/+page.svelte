<!-- Halaman Buat Pesanan Baru - Fixed Implementation -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, fade, fly, scale } from "svelte/transition";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { ordersService } from "$lib/services/orders";
  import type { CreateOrderRequest } from "$lib/types/order";

  // Form state sesuai dokumentasi API
  let isSubmitting = false;
  let showSuccessMessage = false;
  let successMessage = "";
  let successData: any = null;

  // Form data sesuai spesifikasi API
  let formData = {
    customer_name: "",
    product_name: "",
    quantity: 1,
    total_price: "",
    payment_type: "dp" as "dp" | "full",
    dp_percent: 60,
    contact_information: "",
    notification_channel: "whatsapp" as "whatsapp" | "email",
    design_notes: "",
  };

  // Error handling sesuai dokumentasi
  let errors: Record<string, string> = {};
  let globalError = "";

  // Interactive states
  let contactType = "unknown";
  let contactDetectionMessage = "";
  let showContactDetection = false;
  let paymentSummary = {
    total_price: 0,
    dp_amount: 0,
    remaining_amount: 0,
    payment_type: "dp",
  };
  let showPaymentSummary = false;

  // Premium UI states
  let copiedField = "";
  let showCopyFeedback = false;
  let currentStep = 1;
  let formProgress = 0;

  // Breadcrumb navigation
  const breadcrumbs = [
    { label: "Home", link: "/admin" },
    { label: "Pesanan", link: "/admin/orders" },
    { label: "Buat Pesanan", active: true },
  ];

  // Validation Rules sesuai dokumentasi
  const validateForm = (): boolean => {
    errors = {};
    globalError = "";

    // 1. Customer Name
    if (!formData.customer_name?.trim()) {
      errors.customer_name = "Nama customer wajib diisi";
    } else if (formData.customer_name.length > 255) {
      errors.customer_name = "Nama customer maksimal 255 karakter";
    }

    // 2. Product Name
    if (!formData.product_name?.trim()) {
      errors.product_name = "Nama produk wajib diisi";
    } else if (formData.product_name.length > 255) {
      errors.product_name = "Nama produk maksimal 255 karakter";
    }

    // 3. Quantity
    const quantity = Number(formData.quantity);
    if (!formData.quantity || quantity === 0 || quantity < 1) {
      errors.quantity = "Jumlah minimal 1 pcs";
    } else if (!Number.isInteger(quantity)) {
      errors.quantity = "Jumlah harus berupa angka bulat";
    } else if (quantity > 10000) {
      errors.quantity = "Jumlah maksimal 10.000 pcs";
    }

    // 4. Total Price
    const totalPrice = parseFloat(formData.total_price);
    if (!formData.total_price || totalPrice <= 0) {
      errors.total_price = "Total harga wajib diisi dan harus lebih dari 0";
    } else if (totalPrice < 5000) {
      errors.total_price = "Total harga minimal Rp 5.000";
    } else if (totalPrice > 999999999999) {
      errors.total_price = "Total harga terlalu besar";
    }

    // 5. Payment Type
    if (!formData.payment_type) {
      errors.payment_type = "Tipe pembayaran wajib dipilih";
    } else if (!["dp", "full"].includes(formData.payment_type)) {
      errors.payment_type = "Tipe pembayaran tidak valid";
    }

    // 6. DP Percentage (conditional)
    if (formData.payment_type === "dp") {
      if (
        !formData.dp_percent ||
        formData.dp_percent < 50 ||
        formData.dp_percent > 100
      ) {
        errors.dp_percent = "Persentase DP harus antara 50% - 100%";
      }
    }

    // 7. Contact Information dengan validasi ketat
    if (!formData.contact_information?.trim()) {
      errors.contact_information = "Informasi kontak wajib diisi";
    } else {
      const contact = formData.contact_information.trim();

      // Forbidden numbers check
      const forbidden = [
        "087776299650",
        "6287776299650",
        "+6287776299650", // Admin
        "628111917291",
        "6281119172913",
        "081119172913", // Xendit
        "62 811-1917-2913",
        "811-1917-2913",
        "8111917291",
      ];

      const normalizedContact = contact.replace(/[\+\-\s]/g, "");

      // Check forbidden numbers first
      let isForbidden = false;
      for (const forbiddenNum of forbidden) {
        const normalizedForbidden = forbiddenNum.replace(/[\+\-\s]/g, "");
        if (normalizedContact.includes(normalizedForbidden)) {
          if (forbiddenNum.includes("811")) {
            errors.contact_information = "Tidak bisa menggunakan nomor Xendit!";
          } else {
            errors.contact_information = "Tidak bisa menggunakan nomor admin!";
          }
          isForbidden = true;
          break;
        }
      }

      // If not forbidden, validate format
      if (!isForbidden) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailRegex.test(contact);

        // WhatsApp number patterns (panjang hingga 13 digit)
        const cleanContact = contact.replace(/[\s\-\(\)\+]/g, "");
        const whatsappPatterns = [
          /^08[1-9][0-9]{7,12}$/, // 08xxxxxxxxx (10-14 digits total)
          /^8[1-9][0-9]{7,12}$/, // 8xxxxxxxxx (9-13 digits total)
          /^628[1-9][0-9]{7,12}$/, // 628xxxxxxxxx (11-15 digits total)
        ];
        const isValidWhatsApp = whatsappPatterns.some((pattern) =>
          pattern.test(cleanContact)
        );

        // Must be either valid email OR valid WhatsApp number
        if (!isValidEmail && !isValidWhatsApp) {
          if (contact.includes("@")) {
            errors.contact_information = "Format email tidak valid";
          } else {
            errors.contact_information =
              "Format nomor WhatsApp tidak valid. Contoh: 081234567890 atau 6281234567890";
          }
        }
      }
    }

    return Object.keys(errors).length === 0;
  };

  // API call menggunakan service (improved error handling)
  const submitOrder = async (): Promise<boolean> => {
    // Prepare request data sesuai dokumentasi API
    const requestData: CreateOrderRequest = {
      customer_name: formData.customer_name.trim(),
      product_name: formData.product_name.trim(),
      quantity: parseInt(formData.quantity.toString()),
      total_price: formData.total_price,
      payment_type: formData.payment_type,
      dp_percent:
        formData.payment_type === "dp"
          ? parseInt(formData.dp_percent.toString())
          : undefined,
      contact_information: formData.contact_information.trim(),
      notification_channel: formData.notification_channel,
      design_notes: formData.design_notes?.trim() || "",
      paid_amount: "0",
      is_fully_paid: false,
    };

    try {
      console.log("🚀 Sending order data via service:", requestData);

      const result = await ordersService.createOrder(requestData);
      console.log("📦 Service Response:", result);

      // Success handling sesuai dokumentasi
      successData = result.data || result; // Handle both old and new format
      successMessage = result.message || "✅ Pesanan berhasil dibuat!";
      showSuccessMessage = true;

      // Reset form
      resetForm();

      // Auto redirect after 15 seconds
      setTimeout(() => {
        goto("/admin/orders");
      }, 15000);

      return true;
    } catch (error: any) {
      console.error("❌ Order creation error:", error);

      // Handle different error types
      if (error.message?.includes("Sesi Anda telah berakhir")) {
        globalError =
          "Sesi login berakhir. Anda akan diarahkan ke halaman login.";
        return false;
      } else if (error.message?.includes("Tidak dapat terhubung")) {
        globalError =
          "Tidak dapat terhubung ke server backend. Pastikan Django server berjalan di f808-180-254-65-209.ngrok-free.app";
      } else if (
        error.message?.includes("401") ||
        error.message?.includes("Unauthorized")
      ) {
        globalError = "Unauthorized: Token tidak valid. Silakan login ulang.";
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (error.message?.includes("404")) {
        globalError =
          "Endpoint API tidak ditemukan. Periksa konfigurasi backend.";
      } else if (
        error.message?.includes("validation") ||
        error.message?.includes("400")
      ) {
        globalError = "Data tidak valid. Periksa form Anda.";
        // Try to extract validation errors if available
        if (error.details) {
          Object.keys(error.details).forEach((field) => {
            errors[field] = Array.isArray(error.details[field])
              ? error.details[field][0]
              : error.details[field];
          });
        }
      } else {
        globalError = `Error: ${error.message}`;
      }

      return false;
    }
  };

  // Form submission handler
  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    if (isSubmitting) return;

    // Clear previous messages
    globalError = "";
    showSuccessMessage = false;

    // Frontend validation
    if (!validateForm()) {
      scrollToFirstError();
      return;
    }

    isSubmitting = true;

    try {
      const success = await submitOrder();
      if (!success) {
        scrollToFirstError();
      }
    } finally {
      isSubmitting = false;
    }
  };

  // Reset form after successful submission
  const resetForm = () => {
    formData = {
      customer_name: "",
      product_name: "",
      quantity: 1,
      total_price: "",
      payment_type: "dp",
      dp_percent: 60,
      contact_information: "",
      notification_channel: "whatsapp",
      design_notes: "",
    };

    errors = {};
    contactType = "unknown";
    showContactDetection = false;
    showPaymentSummary = false;
    formProgress = 0;
    currentStep = 1;
  };

  // Scroll to first error field
  const scrollToFirstError = () => {
    if (!browser) return;

    const errorFields = Object.keys(errors);
    if (errorFields.length === 0) return;

    const firstErrorField = errorFields[0];
    const fieldElement = document.getElementById(firstErrorField);

    if (fieldElement) {
      fieldElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      fieldElement.focus();
      fieldElement.classList.add("error-shake");
      setTimeout(() => {
        fieldElement.classList.remove("error-shake");
      }, 600);
    }
  };

  // Auto-detect contact type sesuai dokumentasi (validasi ketat)
  function detectContactType(contact: string): string {
    if (!contact || !contact.trim()) {
      return "unknown";
    }

    const trimmedContact = contact.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check email first (harus valid)
    if (emailRegex.test(trimmedContact)) {
      return "email";
    }

    // Clean contact number
    const cleanContact = trimmedContact.replace(/[\s\-\(\)\+]/g, "");

    // Indonesian WhatsApp number patterns (panjang hingga 13 digit)
    const whatsappPatterns = [
      /^08[1-9][0-9]{7,12}$/, // 08xxxxxxxxx (10-14 digits total)
      /^8[1-9][0-9]{7,12}$/, // 8xxxxxxxxx (9-13 digits total)
      /^628[1-9][0-9]{7,12}$/, // 628xxxxxxxxx (11-15 digits total)
    ];

    if (whatsappPatterns.some((pattern) => pattern.test(cleanContact))) {
      return "whatsapp";
    }

    return "unknown";
  }

  // Handle contact input with auto-detection
  function handleContactInput() {
    if (!browser) return;

    const newContactType = detectContactType(formData.contact_information);

    if (newContactType !== contactType) {
      contactType = newContactType;
      showContactDetection = true;

      // Auto-set notification channel sesuai dokumentasi
      if (contactType === "email") {
        formData.notification_channel = "email";
        contactDetectionMessage =
          "✅ Email terdeteksi! Channel notifikasi diatur ke Email";
      } else if (contactType === "whatsapp") {
        formData.notification_channel = "whatsapp";
        contactDetectionMessage =
          "✅ Nomor WhatsApp terdeteksi! Channel notifikasi diatur ke WhatsApp";
      } else if (formData.contact_information.trim()) {
        contactDetectionMessage =
          "⚠️ Format tidak dikenal. Pastikan format email atau nomor WhatsApp benar";
      } else {
        showContactDetection = false;
        return;
      }

      // Hide detection message after 5 seconds
      setTimeout(() => {
        showContactDetection = false;
      }, 5000);
    }

    calculateFormProgress();
    updateCurrentStep();

    // Clear contact error if fixed
    if (errors.contact_information && formData.contact_information.trim()) {
      delete errors.contact_information;
      errors = { ...errors };
    }
  }

  // Calculate payment summary
  function calculatePaymentSummary() {
    if (!browser) return;

    const totalPrice = parseFloat(formData.total_price) || 0;

    if (totalPrice > 0) {
      paymentSummary = {
        total_price: totalPrice,
        dp_amount:
          formData.payment_type === "dp"
            ? Math.round((totalPrice * formData.dp_percent) / 100)
            : totalPrice,
        remaining_amount:
          formData.payment_type === "dp"
            ? totalPrice - Math.round((totalPrice * formData.dp_percent) / 100)
            : 0,
        payment_type: formData.payment_type,
      };

      showPaymentSummary = true;
    } else {
      showPaymentSummary = false;
    }
  }

  // Format Rupiah
  function formatRupiah(amount: number): string {
    if (!browser) return `Rp ${amount}`;

    try {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `Rp ${amount.toLocaleString("id-ID")}`;
    }
  }

  // Enhanced currency input with auto-calculation
  function handlePriceInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value.replace(/[^\d]/g, "");
    formData.total_price = value;

    calculatePaymentSummary();
    calculateFormProgress();
    updateCurrentStep();

    // Clear price error if fixed
    if (errors.total_price && value && parseFloat(value) > 0) {
      delete errors.total_price;
      errors = { ...errors };
    }
  }

  // Enhanced payment type change
  function handlePaymentTypeChange() {
    calculatePaymentSummary();
    updateCurrentStep();

    // Clear payment type error if fixed
    if (errors.payment_type) {
      delete errors.payment_type;
      errors = { ...errors };
    }
  }

  // Enhanced DP percentage change
  function handleDpPercentChange() {
    calculatePaymentSummary();

    // Clear dp_percent error if fixed
    if (
      errors.dp_percent &&
      formData.dp_percent >= 50 &&
      formData.dp_percent <= 100
    ) {
      delete errors.dp_percent;
      errors = { ...errors };
    }
  }

  // Enhanced input handlers with progress tracking
  function handleNameInput() {
    calculateFormProgress();
    updateCurrentStep();

    // Clear name error if fixed
    if (errors.customer_name && formData.customer_name.trim()) {
      delete errors.customer_name;
      errors = { ...errors };
    }
  }

  function handleProductInput() {
    calculateFormProgress();
    updateCurrentStep();

    // Clear product error if fixed
    if (errors.product_name && formData.product_name.trim()) {
      delete errors.product_name;
      errors = { ...errors };
    }
  }

  function handleQuantityInput() {
    calculateFormProgress();
    updateCurrentStep();

    // Clear quantity error if fixed
    if (errors.quantity && formData.quantity >= 1) {
      delete errors.quantity;
      errors = { ...errors };
    }
  }

  // Premium Currency Formatting Action
  function currencyAction(node: HTMLInputElement) {
    function formatValue() {
      let value = node.value.replace(/[^\d]/g, "");
      if (value) {
        const numValue = parseInt(value);
        node.value = new Intl.NumberFormat("id-ID").format(numValue);
        formData.total_price = value;
        calculatePaymentSummary();
      }
    }

    function handleInput() {
      formatValue();
      calculateFormProgress();
    }

    function handleFocus() {
      if (formData.total_price) {
        node.value = formData.total_price;
      }
    }

    function handleBlur() {
      formatValue();
    }

    node.addEventListener("input", handleInput);
    node.addEventListener("focus", handleFocus);
    node.addEventListener("blur", handleBlur);

    return {
      destroy() {
        node.removeEventListener("input", handleInput);
        node.removeEventListener("focus", handleFocus);
        node.removeEventListener("blur", handleBlur);
      },
    };
  }

  // Copy to Clipboard with Premium Feedback
  async function copyToClipboard(text: string, field: string) {
    if (!browser) return;

    try {
      await navigator.clipboard.writeText(text);
      copiedField = field;
      showCopyFeedback = true;

      setTimeout(() => {
        showCopyFeedback = false;
        copiedField = "";
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  // Form Progress Calculation
  function calculateFormProgress() {
    const fields = [
      formData.customer_name,
      formData.contact_information,
      formData.product_name,
      formData.quantity,
      formData.total_price,
    ];

    const completed = fields.filter(
      (field) => field && field.toString().trim()
    ).length;
    formProgress = Math.round((completed / fields.length) * 100);
  }

  // Enhanced Step Navigation
  function updateCurrentStep() {
    if (formData.customer_name && formData.contact_information) {
      currentStep = Math.max(currentStep, 2);
    }
    if (formData.product_name && formData.quantity) {
      currentStep = Math.max(currentStep, 3);
    }
    if (formData.total_price) {
      currentStep = Math.max(currentStep, 4);
    }
  }

  // Initialize
  onMount(() => {
    calculateFormProgress();
  });
</script>

<!-- Page Head -->
<svelte:head>
  <title>Buat Pesanan Baru - Admin Panel</title>
  <meta
    name="description"
    content="Buat pesanan baru untuk customer dengan form yang mudah digunakan"
  />
</svelte:head>

<div class="premium-create-order">
  <!-- Enhanced Breadcrumb with Progress -->
  <div class="page-header">
    <nav class="breadcrumb-nav">
      {#each breadcrumbs as item, index}
        {#if item.active}
          <span class="breadcrumb-item active">
            <i class="fas fa-plus"></i>
            {item.label}
          </span>
        {:else}
          <a href={item.link} class="breadcrumb-item">
            {#if index === 0}
              <i class="fas fa-home"></i>
            {:else}
              <i class="fas fa-shopping-cart"></i>
            {/if}
            {item.label}
          </a>
        {/if}
        {#if index < breadcrumbs.length - 1}
          <i class="fas fa-chevron-right breadcrumb-separator"></i>
        {/if}
      {/each}
    </nav>

    <!-- Form Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {formProgress}%"
          in:fly={{ x: -20, duration: 300 }}
        ></div>
      </div>
      <span class="progress-text">{formProgress}% completed</span>
    </div>
  </div>

  <!-- Premium Success Message -->
  {#if showSuccessMessage}
    <div
      class="premium-notification success"
      in:fly={{ y: -20, duration: 400, easing: cubicOut }}
    >
      <div class="notification-content">
        <div class="notification-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="notification-text">
          <h4>Berhasil!</h4>
          <p>{successMessage}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Premium Error Message -->
  {#if globalError}
    <div
      class="premium-notification error"
      in:fly={{ y: -20, duration: 400, easing: cubicOut }}
    >
      <div class="notification-content">
        <div class="notification-icon error">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="notification-text">
          <h4>Terjadi Kesalahan</h4>
          <p>{globalError}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Premium Main Content -->
  <div class="premium-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="fas fa-plus"></i>
        </div>
        <div class="header-text">
          <h1>Buat Pesanan Baru</h1>
          <p>Isi form di bawah ini untuk membuat pesanan baru dari customer.</p>
        </div>
      </div>

      <!-- Step Indicators -->
      <div class="step-indicators">
        <div class="step {currentStep >= 1 ? 'active' : ''}">
          <i class="fas fa-user"></i>
          <span>Customer</span>
        </div>
        <div class="step {currentStep >= 2 ? 'active' : ''}">
          <i class="fas fa-box"></i>
          <span>Produk</span>
        </div>
        <div class="step {currentStep >= 3 ? 'active' : ''}">
          <i class="fas fa-credit-card"></i>
          <span>Pembayaran</span>
        </div>
        <div class="step {currentStep >= 4 ? 'active' : ''}">
          <i class="fas fa-check"></i>
          <span>Selesai</span>
        </div>
      </div>
    </div>

    <div class="card-body">
      <form method="POST" on:submit={handleSubmit} class="create-order-form">
        <!-- Premium Customer Section -->
        <div class="premium-section" class:active={currentStep >= 1}>
          <div class="section-header">
            <div class="section-icon">
              <i class="fas fa-user"></i>
            </div>
            <div class="section-content">
              <h3>Informasi Customer</h3>
              <p>Detail customer yang melakukan pesanan</p>
            </div>
          </div>

          <div class="premium-form-grid">
            <!-- Premium Customer Name -->
            <div class="premium-field">
              <label for="customer_name" class="field-label">
                <i class="fas fa-user"></i>
                Nama Customer
              </label>
              <div class="field-wrapper">
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  class="premium-input {errors.customer_name ? 'error' : ''}"
                  bind:value={formData.customer_name}
                  on:input={handleNameInput}
                  placeholder="Masukkan nama lengkap customer"
                  required
                />
                {#if errors.customer_name}
                  <div class="premium-error" in:slide={{ duration: 200 }}>
                    <i class="fas fa-exclamation-triangle"></i>
                    {errors.customer_name}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Premium Contact with Smart Detection -->
            <div class="premium-field">
              <label for="contact_information" class="field-label">
                {#if contactType === "email"}
                  <i class="fas fa-envelope"></i>
                {:else if contactType === "whatsapp"}
                  <i class="fas fa-phone"></i>
                {:else}
                  <i class="fas fa-envelope"></i>
                {/if}
                Kontak Customer
              </label>
              <div class="field-wrapper">
                <div class="contact-input-container">
                  <input
                    type="text"
                    id="contact_information"
                    name="contact_information"
                    class="premium-input contact-input {errors.contact_information
                      ? 'error'
                      : ''} {contactType !== 'unknown' ? 'detected' : ''}"
                    bind:value={formData.contact_information}
                    on:input={handleContactInput}
                    placeholder="Email: user@domain.com | WhatsApp: 081234567890"
                    required
                  />

                  <!-- Smart Detection Badge -->
                  {#if contactType !== "unknown" && formData.contact_information.trim()}
                    <div
                      class="detection-badge {contactType}"
                      in:scale={{ duration: 300, start: 0.8 }}
                    >
                      {#if contactType === "email"}
                        <i class="fas fa-envelope"></i>
                        <span>Email</span>
                      {:else if contactType === "whatsapp"}
                        <i class="fas fa-phone"></i>
                        <span>WhatsApp</span>
                      {/if}
                    </div>
                  {/if}
                </div>

                <!-- Premium Detection Feedback -->
                {#if showContactDetection && contactDetectionMessage}
                  <div
                    class="detection-feedback {contactType}"
                    in:fly={{ y: 10, duration: 300 }}
                    out:fade={{ duration: 200 }}
                  >
                    <div class="feedback-icon">
                      {#if contactType === "email"}
                        <i class="fas fa-envelope"></i>
                      {:else if contactType === "whatsapp"}
                        <i class="fas fa-phone"></i>
                      {:else}
                        <i class="fas fa-exclamation-triangle"></i>
                      {/if}
                    </div>
                    <span>{contactDetectionMessage}</span>
                  </div>
                {/if}

                {#if errors.contact_information}
                  <div class="premium-error" in:slide={{ duration: 200 }}>
                    <i class="fas fa-exclamation-triangle"></i>
                    {errors.contact_information}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Premium Auto Notification Channel -->
            <div class="premium-field">
              <label for="notification_channel_display" class="field-label">
                {#if formData.notification_channel === "email"}
                  <i class="fas fa-envelope"></i>
                {:else}
                  <i class="fas fa-phone"></i>
                {/if}
                Channel Notifikasi
              </label>
              <div class="field-wrapper">
                <div class="auto-channel-display">
                  <div
                    class="channel-display-field {contactType !== 'unknown'
                      ? 'detected'
                      : 'pending'}"
                  >
                    <div class="channel-info">
                      {#if contactType === "email"}
                        <div class="channel-icon email">
                          <i class="fas fa-envelope"></i>
                        </div>
                        <div class="channel-text">
                          <span class="channel-name">Email</span>
                          <span class="channel-desc">Notifikasi via email</span>
                        </div>
                      {:else if contactType === "whatsapp"}
                        <div class="channel-icon whatsapp">
                          <i class="fas fa-phone"></i>
                        </div>
                        <div class="channel-text">
                          <span class="channel-name">WhatsApp</span>
                          <span class="channel-desc"
                            >Notifikasi via WhatsApp</span
                          >
                        </div>
                      {:else}
                        <div class="channel-icon unknown">
                          <i class="fas fa-question-circle"></i>
                        </div>
                        <div class="channel-text">
                          <span class="channel-name">Mendeteksi...</span>
                          <span class="channel-desc"
                            >Masukkan kontak untuk auto-detect</span
                          >
                        </div>
                      {/if}
                    </div>

                    {#if contactType !== "unknown" && formData.contact_information.trim()}
                      <div
                        class="auto-detected-badge"
                        in:scale={{ duration: 300, start: 0.8 }}
                      >
                        <i class="fas fa-magic"></i>
                        <span>Auto</span>
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="field-hint">
                  {#if contactType === "email"}
                    <i class="fas fa-magic"></i>
                    Terdeteksi otomatis dari email yang dimasukkan
                  {:else if contactType === "whatsapp"}
                    <i class="fas fa-magic"></i>
                    Terdeteksi otomatis dari nomor WhatsApp yang dimasukkan
                  {:else}
                    <i class="fas fa-lightbulb"></i>
                    Channel akan terdeteksi otomatis setelah kontak dimasukkan
                  {/if}
                </div>

                <!-- Hidden input for form submission -->
                <input
                  type="hidden"
                  name="notification_channel"
                  value={formData.notification_channel}
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Premium Product Section -->
        <div class="premium-section" class:active={currentStep >= 2}>
          <div class="section-header">
            <div class="section-icon">
              <i class="fas fa-box"></i>
            </div>
            <div class="section-content">
              <h3>Informasi Produk</h3>
              <p>Detail produk yang dipesan</p>
            </div>
          </div>

          <div class="premium-form-grid">
            <!-- Premium Product Name -->
            <div class="premium-field">
              <label for="product_name" class="field-label">
                <i class="fas fa-box"></i>
                Nama Produk
              </label>
              <div class="field-wrapper">
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  class="premium-input {errors.product_name ? 'error' : ''}"
                  bind:value={formData.product_name}
                  on:input={handleProductInput}
                  placeholder="contoh: Kaos Polo Custom"
                  required
                />
                {#if errors.product_name}
                  <div class="premium-error" in:slide={{ duration: 200 }}>
                    <i class="fas fa-exclamation-triangle"></i>
                    {errors.product_name}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Premium Quantity -->
            <div class="premium-field">
              <label for="quantity" class="field-label">
                <i class="fas fa-box"></i>
                Jumlah (pcs)
              </label>
              <div class="field-wrapper">
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  class="premium-input {errors.quantity ? 'error' : ''}"
                  bind:value={formData.quantity}
                  on:input={handleQuantityInput}
                  min="1"
                  placeholder="1"
                  required
                />
                {#if errors.quantity}
                  <div class="premium-error" in:slide={{ duration: 200 }}>
                    <i class="fas fa-exclamation-triangle"></i>
                    {errors.quantity}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Premium Design Notes -->
            <div class="premium-field full-width">
              <label for="design_notes" class="field-label">
                <i class="fas fa-box"></i>
                Catatan Design
              </label>
              <div class="field-wrapper">
                <textarea
                  id="design_notes"
                  name="design_notes"
                  class="premium-textarea"
                  bind:value={formData.design_notes}
                  placeholder="Masukkan catatan design atau request khusus..."
                  rows="4"
                ></textarea>
                <div class="field-hint">
                  <i class="fas fa-box"></i>
                  Opsional - berikan detail design atau request khusus
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Premium Payment Section -->
        <div class="premium-section" class:active={currentStep >= 3}>
          <div class="section-header">
            <div class="section-icon">
              <i class="fas fa-credit-card"></i>
            </div>
            <div class="section-content">
              <h3>Informasi Pembayaran</h3>
              <p>Detail harga dan metode pembayaran</p>
            </div>
          </div>

          <div class="premium-form-grid">
            <!-- Premium Total Price with Smart Formatting -->
            <div class="premium-field">
              <label for="total_price" class="field-label">
                <i class="fas fa-credit-card"></i>
                Total Harga
              </label>
              <div class="field-wrapper">
                <div class="currency-input-container">
                  <span class="currency-prefix">Rp</span>
                  <input
                    type="text"
                    id="total_price"
                    name="total_price"
                    class="premium-input currency-input {errors.total_price
                      ? 'error'
                      : ''}"
                    use:currencyAction
                    placeholder="Minimal Rp 5.000"
                    required
                  />
                </div>

                {#if formData.total_price}
                  <div
                    class="field-hint currency-display"
                    in:slide={{ duration: 200 }}
                  >
                    <i class="fas fa-credit-card"></i>
                    {formatRupiah(parseInt(formData.total_price))}
                  </div>
                {/if}

                {#if errors.total_price}
                  <div class="premium-error" in:slide={{ duration: 200 }}>
                    <i class="fas fa-exclamation-triangle"></i>
                    {errors.total_price}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Premium Payment Type -->
            <div class="premium-field">
              <label for="payment_type" class="field-label">
                <i class="fas fa-credit-card"></i>
                Tipe Pembayaran
              </label>
              <div class="field-wrapper">
                <select
                  id="payment_type"
                  name="payment_type"
                  class="premium-select"
                  bind:value={formData.payment_type}
                  on:change={handlePaymentTypeChange}
                  required
                >
                  <option value="dp">Down Payment (DP)</option>
                  <option value="full">Bayar Lunas</option>
                </select>

                <div class="field-hint">
                  <i class="fas fa-credit-card"></i>
                  {#if formData.payment_type === "dp"}
                    Customer bayar sebagian dulu, sisanya setelah selesai
                  {:else}
                    Customer bayar penuh di awal sebelum produksi
                  {/if}
                </div>
              </div>
            </div>

            <!-- Premium DP Percentage Input -->
            {#if formData.payment_type === "dp"}
              <div class="premium-field" in:slide={{ duration: 300 }}>
                <label for="dp_percent" class="field-label">
                  <i class="fas fa-calculator"></i>
                  Persentase DP (%)
                </label>
                <div class="field-wrapper">
                  <div class="percentage-input-container">
                    <input
                      type="number"
                      id="dp_percent"
                      name="dp_percent"
                      class="premium-input percentage-input {errors.dp_percent
                        ? 'error'
                        : ''}"
                      bind:value={formData.dp_percent}
                      on:input={handleDpPercentChange}
                      min="50"
                      max="95"
                      step="5"
                      placeholder="60"
                    />
                    <span class="percentage-suffix">%</span>
                  </div>

                  <div class="field-hint">
                    <i class="fas fa-info-circle"></i>
                    Masukkan persentase DP antara 50% - 95%
                  </div>

                  {#if errors.dp_percent}
                    <div class="premium-error" in:slide={{ duration: 200 }}>
                      <i class="fas fa-exclamation-triangle"></i>
                      {errors.dp_percent}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Compact Admin Payment Summary -->
        {#if showPaymentSummary}
          <div
            class="compact-summary-section"
            in:fly={{ y: 20, duration: 400, easing: cubicOut }}
          >
            <div class="compact-header">
              <i class="fas fa-calculator"></i>
              <span>Ringkasan Pembayaran</span>
            </div>

            <div class="compact-summary-grid">
              {#if formData.payment_type === "dp"}
                <!-- DP Summary -->
                <div class="compact-summary-item total">
                  <div class="summary-info">
                    <span class="summary-label">Total Harga</span>
                    <span class="summary-value"
                      >{formatRupiah(paymentSummary.total_price)}</span
                    >
                  </div>
                  <button
                    class="compact-copy-btn"
                    on:click={() =>
                      copyToClipboard(
                        formatRupiah(paymentSummary.total_price),
                        "total"
                      )}
                    class:copied={copiedField === "total" && showCopyFeedback}
                  >
                    <i
                      class="fas {copiedField === 'total' && showCopyFeedback
                        ? 'fa-check'
                        : 'fa-copy'}"
                    ></i>
                  </button>
                </div>

                <div class="compact-summary-item dp primary">
                  <div class="summary-info">
                    <span class="summary-label"
                      >DP ({formData.dp_percent}%)</span
                    >
                    <span class="summary-value featured"
                      >{formatRupiah(paymentSummary.dp_amount)}</span
                    >
                  </div>
                  <button
                    class="compact-copy-btn"
                    on:click={() =>
                      copyToClipboard(
                        formatRupiah(paymentSummary.dp_amount),
                        "dp"
                      )}
                    class:copied={copiedField === "dp" && showCopyFeedback}
                  >
                    <i
                      class="fas {copiedField === 'dp' && showCopyFeedback
                        ? 'fa-check'
                        : 'fa-copy'}"
                    ></i>
                  </button>
                </div>

                <div class="compact-summary-item remaining">
                  <div class="summary-info">
                    <span class="summary-label">Sisa Pembayaran</span>
                    <span class="summary-value"
                      >{formatRupiah(paymentSummary.remaining_amount)}</span
                    >
                  </div>
                  <button
                    class="compact-copy-btn"
                    on:click={() =>
                      copyToClipboard(
                        formatRupiah(paymentSummary.remaining_amount),
                        "remaining"
                      )}
                    class:copied={copiedField === "remaining" &&
                      showCopyFeedback}
                  >
                    <i
                      class="fas {copiedField === 'remaining' &&
                      showCopyFeedback
                        ? 'fa-check'
                        : 'fa-copy'}"
                    ></i>
                  </button>
                </div>
              {:else}
                <!-- Full Payment Summary -->
                <div class="compact-summary-item full primary">
                  <div class="summary-info">
                    <span class="summary-label">Bayar Lunas</span>
                    <span class="summary-value featured"
                      >{formatRupiah(paymentSummary.dp_amount)}</span
                    >
                  </div>
                  <button
                    class="compact-copy-btn"
                    on:click={() =>
                      copyToClipboard(
                        formatRupiah(paymentSummary.dp_amount),
                        "full"
                      )}
                    class:copied={copiedField === "full" && showCopyFeedback}
                  >
                    <i
                      class="fas {copiedField === 'full' && showCopyFeedback
                        ? 'fa-check'
                        : 'fa-copy'}"
                    ></i>
                  </button>
                </div>
              {/if}
            </div>

            <!-- Compact Payment Flow -->
            <div class="compact-flow" in:fade={{ duration: 400, delay: 200 }}>
              <div class="flow-steps">
                {#if formData.payment_type === "dp"}
                  <div class="flow-step active">
                    <span class="step-number">1</span>
                    <span class="step-text"
                      >DP: {formatRupiah(paymentSummary.dp_amount)}</span
                    >
                  </div>
                  <div class="flow-arrow">→</div>
                  <div class="flow-step">
                    <span class="step-number">2</span>
                    <span class="step-text">Produksi</span>
                  </div>
                  <div class="flow-arrow">→</div>
                  <div class="flow-step">
                    <span class="step-number">3</span>
                    <span class="step-text"
                      >Pelunasan: {formatRupiah(
                        paymentSummary.remaining_amount
                      )}</span
                    >
                  </div>
                {:else}
                  <div class="flow-step active">
                    <span class="step-number">1</span>
                    <span class="step-text"
                      >Bayar Lunas: {formatRupiah(
                        paymentSummary.dp_amount
                      )}</span
                    >
                  </div>
                  <div class="flow-arrow">→</div>
                  <div class="flow-step">
                    <span class="step-number">2</span>
                    <span class="step-text">Produksi Langsung</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Premium Form Actions -->
        <div class="premium-actions">
          <a href="/admin/orders" class="premium-btn secondary">
            <i class="fas fa-arrow-left"></i>
            Kembali
          </a>

          <button
            type="submit"
            class="premium-btn primary"
            class:loading={isSubmitting}
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <div class="btn-loading">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <span>Memproses...</span>
            {:else}
              <i class="fas fa-save"></i>
              <span>Buat Pesanan</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Success Popup sesuai dokumentasi API -->
{#if showSuccessMessage && successData}
  <div class="popup-overlay" transition:fade>
    <div class="success-popup" transition:fly={{ y: 50, duration: 400 }}>
      <div class="popup-header">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>✅ Pesanan Berhasil Dibuat!</h3>
        <button class="close-btn" on:click={() => (showSuccessMessage = false)}>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-content">
        <div class="order-info">
          {#if successData.order}
            <div class="info-section">
              <h4>📋 Informasi Order</h4>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Order Code:</strong>
                  <span class="order-code">{successData.order.order_code}</span>
                </div>
                <div class="info-item">
                  <strong>Customer:</strong>
                  <span>{successData.order.customer_name}</span>
                </div>
                <div class="info-item">
                  <strong>Product:</strong>
                  <span>{successData.order.product_name}</span>
                </div>
                <div class="info-item">
                  <strong>Quantity:</strong>
                  <span>{successData.order.quantity} pcs</span>
                </div>
                <div class="info-item">
                  <strong>Total Harga:</strong>
                  <span class="price-highlight">
                    {formatRupiah(successData.order.total_price)}
                  </span>
                </div>
                <div class="info-item">
                  <strong>Status:</strong>
                  <span class="status-badge"
                    >{successData.order.status_order}</span
                  >
                </div>
              </div>
            </div>
          {/if}

          {#if successData.invoice}
            <div class="info-section">
              <h4>💳 Informasi Invoice</h4>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Invoice Code:</strong>
                  <span class="invoice-code"
                    >{successData.invoice.invoice_code}</span
                  >
                </div>
                <div class="info-item">
                  <strong>Payment Type:</strong>
                  <span
                    >{successData.invoice.payment_type === "dp"
                      ? "Down Payment"
                      : "Full Payment"}</span
                  >
                </div>
                <div class="info-item">
                  <strong>Amount:</strong>
                  <span class="amount-highlight">
                    {formatRupiah(successData.invoice.invoice_amount)}
                  </span>
                </div>
                <div class="info-item">
                  <strong>Status:</strong>
                  <span class="status-pending"
                    >{successData.invoice.invoice_status}</span
                  >
                </div>
                {#if successData.invoice.expired_at}
                  <div class="info-item">
                    <strong>Expired:</strong>
                    <span class="expiry-date">
                      {new Date(successData.invoice.expired_at).toLocaleString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        {#if successData.invoice?.payment_url}
          <div class="payment-section">
            <div class="payment-notice">
              <i class="fas fa-info-circle"></i>
              <p>Link pembayaran telah dibuat dan siap dikirim ke customer</p>
            </div>

            <div class="payment-actions">
              <button
                class="payment-btn primary"
                on:click={() =>
                  window.open(successData.invoice.payment_url, "_blank")}
              >
                <i class="fas fa-external-link-alt"></i>
                Buka Link Pembayaran
              </button>

              <button
                class="payment-btn secondary"
                on:click={() =>
                  copyToClipboard(
                    successData.invoice.payment_url,
                    "payment_url"
                  )}
              >
                <i class="fas fa-copy"></i>
                Copy Link
              </button>
            </div>
          </div>
        {/if}
      </div>

      <div class="popup-footer">
        <button class="btn-primary" on:click={() => goto("/admin/orders")}>
          <i class="fas fa-list"></i>
          Lihat Semua Pesanan
        </button>

        <button
          class="btn-secondary"
          on:click={() => {
            showSuccessMessage = false;
            // Reset for new order
            formData = {
              customer_name: "",
              product_name: "",
              quantity: 1,
              total_price: "",
              payment_type: "dp",
              dp_percent: 60,
              contact_information: "",
              notification_channel: "whatsapp",
              design_notes: "",
            };
            calculateFormProgress();
          }}
        >
          <i class="fas fa-plus"></i>
          Buat Pesanan Lagi
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Admin Dashboard Consistent Light Theme */
  :root {
    --brand-primary: #6366f1;
    --brand-primary-hover: #4f46e5;
    --brand-success: #10b981;
    --brand-warning: #f59e0b;
    --brand-error: #ef4444;

    --surface-primary: #ffffff;
    --surface-secondary: #f5f5f5;
    --surface-tertiary: #e5e5e5;
    --surface-accent: #eef2ff;

    --border-light: #d4d4d4;
    --border-medium: #a3a3a3;
    --border-focus: var(--brand-primary);

    --text-primary: #262626;
    --text-secondary: #525252;
    --text-tertiary: #737373;
    --text-accent: var(--brand-primary);

    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);

    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;

    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;

    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .premium-create-order {
    min-height: 100vh;
    background: var(--surface-secondary);
    padding: var(--spacing-xl);
    font-family:
      "Inter",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    font-feature-settings:
      "kern" 1,
      "liga" 1;
  }

  /* Premium Page Header */
  .page-header {
    margin-bottom: var(--spacing-2xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    text-decoration: none;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .breadcrumb-item:hover {
    color: var(--text-accent);
    background: var(--surface-accent);
  }

  .breadcrumb-item.active {
    color: var(--text-primary);
    font-weight: 600;
    background: var(--surface-primary);
    box-shadow: var(--shadow-sm);
  }

  .breadcrumb-separator {
    color: var(--text-tertiary);
  }

  /* Progress Bar */
  .progress-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--border-light);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--brand-primary),
      var(--brand-success)
    );
    border-radius: var(--radius-sm);
    transition: width var(--transition-normal);
  }

  .progress-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    min-width: max-content;
  }

  /* Premium Card */
  .premium-card {
    background: var(--surface-primary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .card-header {
    padding: var(--spacing-2xl);
    background: var(--surface-primary);
    border-bottom: 1px solid var(--border-light);
  }

  .header-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-2xl);
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: var(--brand-primary);
    color: white;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
  }

  .header-text h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
    letter-spacing: -0.025em;
  }

  .header-text p {
    color: var(--text-secondary);
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  /* Step Indicators */
  .step-indicators {
    display: flex;
    gap: var(--spacing-md);
  }

  .step {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--surface-primary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all var(--transition-normal);
  }

  .step.active {
    background: var(--brand-primary);
    color: white;
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .card-body {
    padding: var(--spacing-2xl);
  }

  /* Premium Notifications */
  .premium-notification {
    margin-bottom: var(--spacing-xl);
    border-radius: var(--radius-lg);
    border: 1px solid;
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-md);
  }

  .premium-notification.success {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border-color: var(--brand-success);
  }

  .premium-notification.error {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border-color: var(--brand-error);
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .notification-icon.success {
    background: var(--brand-success);
    color: white;
  }

  .notification-icon.error {
    background: var(--brand-error);
    color: white;
  }

  .notification-text h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--text-primary);
  }

  .notification-text p {
    font-size: 0.875rem;
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .debug-details {
    margin-top: var(--spacing-sm);
  }

  .debug-details summary {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    cursor: pointer;
    margin-bottom: var(--spacing-xs);
  }

  .debug-details pre {
    background: var(--surface-tertiary);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    overflow-x: auto;
  }

  /* Premium Form Sections */
  .premium-section {
    margin-bottom: var(--spacing-2xl);
    padding-bottom: var(--spacing-2xl);
    border-bottom: 1px solid var(--border-light);
    opacity: 0.6;
    transition: all var(--transition-normal);
  }

  .premium-section.active {
    opacity: 1;
  }

  .premium-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-2xl);
  }

  .section-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(
      135deg,
      var(--brand-primary),
      var(--brand-primary-hover)
    );
    color: white;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
    flex-shrink: 0;
  }

  .section-content h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
    letter-spacing: -0.025em;
  }

  .section-content p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  /* Premium Form Grid */
  .premium-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }

  /* Premium Form Fields */
  .premium-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .premium-field.full-width {
    grid-column: 1 / -1;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .field-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .field-hint {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* Premium Form Inputs */
  .premium-input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--surface-primary);
    transition: all var(--transition-normal);
    color: var(--text-primary);
  }

  .premium-input:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
    background: var(--surface-accent);
  }

  .premium-input.error {
    border-color: var(--brand-error);
    box-shadow: 0 0 0 3px rgb(220 38 38 / 0.1);
  }

  .premium-input.detected {
    border-color: var(--brand-success);
    background: linear-gradient(135deg, var(--surface-primary), #f0fdf4);
  }

  .premium-textarea {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--surface-primary);
    transition: all var(--transition-normal);
    color: var(--text-primary);
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }

  .premium-textarea:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
    background: var(--surface-accent);
  }

  .premium-select {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--surface-primary);
    transition: all var(--transition-normal);
    color: var(--text-primary);
    cursor: pointer;
  }

  .premium-select:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
  }

  .premium-error {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--brand-error);
    font-size: 0.75rem;
    font-weight: 600;
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--brand-error);
    margin-top: var(--spacing-xs);
  }

  /* Error animations and states */
  .error-shake {
    animation: errorShake 0.6s ease-in-out;
  }

  .invalid-format {
    border-color: var(--brand-warning) !important;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    animation: warningPulse 1s ease-in-out;
  }

  @keyframes errorShake {
    0%,
    100% {
      transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
      transform: translateX(-8px);
    }
    20%,
    40%,
    60%,
    80% {
      transform: translateX(8px);
    }
  }

  @keyframes warningPulse {
    0%,
    100% {
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.4);
    }
  }

  /* Currency Input */
  .currency-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .currency-prefix {
    position: absolute;
    left: var(--spacing-lg);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    z-index: 2;
  }

  .currency-input {
    padding-left: 3rem !important;
  }

  .currency-display {
    background: linear-gradient(135deg, var(--surface-accent), #dbeafe);
    border: 1px solid var(--brand-primary);
    border-radius: var(--radius-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--brand-primary);
    font-weight: 600;
  }

  /* Contact Detection */
  .contact-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .detection-badge {
    position: absolute;
    right: var(--spacing-sm);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    z-index: 2;
  }

  .detection-badge.email {
    background: linear-gradient(
      135deg,
      var(--brand-primary),
      var(--brand-primary-hover)
    );
    color: white;
  }

  .detection-badge.whatsapp {
    background: linear-gradient(135deg, var(--brand-success), #059669);
    color: white;
  }

  .detection-feedback {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .detection-feedback.email {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .detection-feedback.whatsapp {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border-color: var(--brand-success);
    color: var(--brand-success);
  }

  .detection-feedback.unknown {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border-color: var(--brand-warning);
    color: var(--brand-warning);
  }

  .feedback-icon {
    flex-shrink: 0;
  }

  /* Auto Channel Display */
  .auto-channel-display {
    width: 100%;
  }

  .channel-display-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    background: var(--surface-primary);
    transition: all var(--transition-normal);
    min-height: 56px;
  }

  .channel-display-field.detected {
    border-color: var(--brand-success);
    background: linear-gradient(135deg, var(--surface-primary), #f0fdf4);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .channel-display-field.pending {
    border-color: var(--border-light);
    background: var(--surface-tertiary);
  }

  .channel-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }

  .channel-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .channel-icon.email {
    background: linear-gradient(
      135deg,
      var(--brand-primary),
      var(--brand-primary-hover)
    );
    color: white;
  }

  .channel-icon.whatsapp {
    background: linear-gradient(135deg, var(--brand-success), #059669);
    color: white;
  }

  .channel-icon.unknown {
    background: var(--surface-tertiary);
    color: var(--text-tertiary);
  }

  .channel-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .channel-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .channel-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .auto-detected-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: linear-gradient(135deg, var(--brand-success), #059669);
    color: white;
    border-radius: var(--radius-sm);
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }

  /* Premium Percentage Input */
  .percentage-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .percentage-input {
    padding-right: 3rem !important;
  }

  .percentage-suffix {
    position: absolute;
    right: var(--spacing-lg);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    pointer-events: none;
  }

  /* Compact Admin Payment Summary */
  .compact-summary-section {
    background: linear-gradient(
      135deg,
      var(--surface-primary),
      var(--surface-secondary)
    );
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-xl);
    box-shadow: var(--shadow-sm);
  }

  .compact-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--border-light);
  }

  .compact-summary-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .compact-summary-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--surface-primary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .compact-summary-item:hover {
    background: var(--surface-accent);
    border-color: var(--brand-primary);
  }

  .compact-summary-item.primary {
    border-color: var(--brand-primary);
    background: linear-gradient(
      135deg,
      var(--surface-primary),
      var(--surface-accent)
    );
  }

  .compact-summary-item.total {
    border-color: var(--text-secondary);
  }

  .compact-summary-item.remaining {
    border-color: var(--brand-warning);
  }

  .summary-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .summary-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .summary-value.featured {
    color: var(--brand-primary);
    font-size: 1.125rem;
  }

  .compact-copy-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .compact-copy-btn:hover {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: white;
  }

  .compact-copy-btn.copied {
    background: var(--brand-success);
    border-color: var(--brand-success);
    color: white;
  }

  /* Compact Payment Flow */
  .compact-flow {
    border-top: 1px solid var(--border-light);
    padding-top: var(--spacing-md);
  }

  .flow-steps {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .flow-step {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--surface-tertiary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    transition: all var(--transition-fast);
  }

  .flow-step.active {
    background: var(--brand-primary);
    color: white;
    border-color: var(--brand-primary);
  }

  .step-number {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--text-secondary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .flow-step.active .step-number {
    background: white;
    color: var(--brand-primary);
  }

  .step-text {
    font-weight: 600;
    white-space: nowrap;
  }

  .flow-arrow {
    color: var(--text-tertiary);
    font-weight: bold;
    font-size: 0.875rem;
  }

  /* Premium Form Actions */
  .premium-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-2xl);
    border-top: 1px solid var(--border-light);
  }

  .premium-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-weight: 600;
    font-size: 0.875rem;
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    text-decoration: none;
    border: 1px solid;
    cursor: pointer;
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .premium-btn.primary {
    background: linear-gradient(
      135deg,
      var(--brand-primary),
      var(--brand-primary-hover)
    );
    color: white;
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
  }

  .premium-btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  .premium-btn.primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .premium-btn.secondary {
    background: var(--surface-primary);
    color: var(--text-secondary);
    border-color: var(--border-light);
  }

  .premium-btn.secondary:hover {
    background: var(--surface-tertiary);
    color: var(--text-primary);
    border-color: var(--border-medium);
    transform: translateY(-1px);
  }

  .btn-loading {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .notification {
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
  }

  .notification.success {
    background: #d1fae5;
    border-left: 4px solid #10b981;
    color: #065f46;
  }

  .notification.error {
    background: #fee2e2;
    border-left: 4px solid #ef4444;
    color: #991b1b;
  }

  .notification-content {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .notification-content i {
    font-size: 1.125rem;
    margin-top: 0.125rem;
  }

  .error-details {
    flex: 1;
  }

  .error-message {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .error-debug {
    margin-top: 0.75rem;
  }

  .error-debug summary {
    cursor: pointer;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .error-debug summary:hover {
    color: #991b1b;
  }

  .error-debug pre {
    background: #f3f4f6;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #374151;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* Contact Input Interactive Styles */
  .contact-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .contact-input {
    flex: 1;
    transition: all 0.3s ease;
  }

  .contact-input.detected {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .contact-indicator {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
  }

  .indicator-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    animation: bounce 0.6s ease;
  }

  .indicator-icon.email {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .indicator-icon.whatsapp {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .contact-detection-message {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border: 1px solid #0ea5e9;
    position: relative;
    overflow: hidden;
  }

  .detection-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .detection-content.email {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border-color: #3b82f6;
  }

  .detection-content.whatsapp {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border-color: #10b981;
  }

  .detection-text {
    color: #0c4a6e;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .detection-animation {
    display: flex;
    align-items: center;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: #0ea5e9;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  /* Notification Channel Auto Styles */
  .notification-channel-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .notification-select {
    flex: 1;
    transition: all 0.3s ease;
  }

  .notification-select.auto-selected {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  }

  .auto-selection-badge {
    position: absolute;
    right: 0.5rem;
    top: 0.25rem;
    z-index: 2;
  }

  .auto-badge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  }

  .channel-help {
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    color: #475569;
    border-left: 3px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .help-icon {
    font-size: 1rem;
  }

  /* Payment Summary Styles */
  .payment-summary-section {
    background: linear-gradient(135deg, #fefce8, #fef3c7);
    border: 2px solid #f59e0b;
    margin-top: 1.5rem;
  }

  .payment-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .summary-card {
    background: white;
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .summary-card.total {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
  }

  .summary-card.dp-amount {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  }

  .summary-card.remaining {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
  }

  .summary-card.full-payment {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
    font-size: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .summary-content {
    flex: 1;
  }

  .summary-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .summary-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
  }

  .summary-value.highlight {
    color: #059669;
    text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);
  }

  /* Payment Flow Styles */
  .payment-flow {
    background: white;
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .flow-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .flow-steps {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .flow-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f1f5f9;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .flow-step.active {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-color: #059669;
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
  }

  .step-number {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #64748b;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flow-step.active .step-number {
    background: white;
    color: #059669;
  }

  .step-text {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .flow-arrow {
    color: #64748b;
    font-weight: bold;
    font-size: 1.25rem;
  }

  /* Animations */
  @keyframes bounce {
    0%,
    20%,
    53%,
    80%,
    100% {
      transform: translate3d(0, 0, 0);
    }
    40%,
    43% {
      transform: translate3d(0, -8px, 0);
    }
    70% {
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.2);
    }
  }

  /* Enhanced Responsive Design */
  @media (max-width: 1024px) {
    .premium-create-order {
      padding: var(--spacing-lg);
    }

    .step-indicators {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
    }

    .compact-summary-grid {
      gap: var(--spacing-xs);
    }

    .compact-summary-item {
      padding: var(--spacing-xs) var(--spacing-sm);
    }

    .summary-value {
      font-size: 0.875rem;
    }

    .summary-value.featured {
      font-size: 1rem;
    }

    .flow-steps {
      flex-direction: column;
      align-items: stretch;
    }

    .flow-arrow {
      transform: rotate(90deg);
      align-self: center;
    }
  }

  @media (max-width: 768px) {
    .premium-create-order {
      padding: var(--spacing-md);
    }

    .page-header {
      gap: var(--spacing-md);
    }

    .header-content {
      flex-direction: column;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .header-text h1 {
      font-size: 1.5rem;
    }

    .step-indicators {
      grid-template-columns: 1fr;
    }

    .card-body {
      padding: var(--spacing-lg);
    }

    .premium-form-grid {
      gap: var(--spacing-lg);
    }

    .premium-actions {
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .premium-btn {
      width: 100%;
      justify-content: center;
    }

    .detection-badge {
      position: static;
      margin-top: var(--spacing-sm);
      align-self: flex-start;
    }

    .auto-badge {
      position: static;
      margin-top: var(--spacing-xs);
      align-self: flex-start;
    }

    .currency-input {
      padding-left: var(--spacing-lg) !important;
    }

    .currency-prefix {
      display: none;
    }

    .premium-summary-section {
      padding: var(--spacing-lg);
    }

    .card-header {
      padding: var(--spacing-md);
    }

    .card-content {
      padding: var(--spacing-md);
    }

    .amount-value {
      font-size: 1.25rem;
    }

    .amount-value.featured {
      font-size: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .premium-create-order {
      padding: var(--spacing-sm);
    }

    .page-header {
      margin-bottom: var(--spacing-lg);
    }

    .breadcrumb-nav {
      flex-wrap: wrap;
    }

    .progress-container {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .progress-text {
      align-self: flex-end;
    }

    .header-text h1 {
      font-size: 1.25rem;
    }

    .section-header {
      flex-direction: column;
      gap: var(--spacing-sm);
      text-align: center;
    }

    .section-icon {
      align-self: center;
    }

    .premium-summary-section {
      padding: var(--spacing-md);
    }

    .flow-header {
      justify-content: center;
    }

    .timeline-step {
      flex-direction: column;
      text-align: center;
      gap: var(--spacing-xs);
    }

    .step-indicator {
      align-self: center;
    }
  }

  /* Premium Light Theme Optimization */
  .premium-create-order {
    color: var(--text-primary);
  }

  /* Animation enhancements */
  @media (prefers-reduced-motion: no-preference) {
    .premium-summary-card:hover {
      animation: float 2s ease-in-out infinite;
    }

    @keyframes float {
      0%,
      100% {
        transform: translateY(-2px);
      }
      50% {
        transform: translateY(-6px);
      }
    }

    .step.active {
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%,
      100% {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
      50% {
        box-shadow:
          var(--shadow-lg),
          0 0 20px rgba(37, 99, 235, 0.3);
        transform: translateY(-2px);
      }
    }
  }

  /* Focus visible for accessibility */
  .premium-input:focus-visible,
  .premium-select:focus-visible,
  .premium-btn:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }

  /* High contrast mode support */
  @media (forced-colors: active) {
    .premium-card,
    .premium-summary-card,
    .premium-input,
    .premium-select {
      border: 1px solid;
    }
  }

  /* Success Popup Styles */
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .success-popup {
    background: white;
    border-radius: var(--radius-xl);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-light);
  }

  .popup-header {
    background: linear-gradient(135deg, var(--brand-success) 0%, #059669 100%);
    color: white;
    padding: var(--spacing-2xl);
    text-align: center;
    position: relative;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .success-icon {
    background: rgba(255, 255, 255, 0.2);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg) auto;
  }

  .success-icon i {
    font-size: 2rem;
    color: white;
  }

  .popup-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .close-btn {
    position: absolute;
    top: var(--spacing-lg);
    right: var(--spacing-lg);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .popup-content {
    padding: var(--spacing-2xl);
  }

  .order-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .info-section {
    background: var(--surface-secondary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--border-light);
  }

  .info-section h4 {
    margin: 0 0 var(--spacing-lg) 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-light);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item strong {
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .order-code,
  .invoice-code {
    font-family: "Courier New", monospace;
    background: var(--surface-accent);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    color: var(--brand-primary);
    font-weight: 600;
    border: 1px solid var(--brand-primary);
  }

  .price-highlight,
  .amount-highlight {
    color: var(--brand-success);
    font-weight: 700;
    font-size: 1.125rem;
  }

  .status-badge {
    background: var(--surface-accent);
    color: var(--brand-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-pending {
    background: #fef3c7;
    color: #92400e;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .expiry-date {
    color: var(--brand-warning);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .payment-section {
    background: linear-gradient(135deg, var(--surface-accent), #dbeafe);
    border: 1px solid var(--brand-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-lg);
  }

  .payment-notice {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    color: var(--brand-primary);
  }

  .payment-notice i {
    font-size: 1.125rem;
  }

  .payment-notice p {
    margin: 0;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .payment-actions {
    display: flex;
    gap: var(--spacing-md);
  }

  .payment-btn {
    flex: 1;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-md);
    border: none;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .payment-btn.primary {
    background: var(--brand-primary);
    color: white;
  }

  .payment-btn.primary:hover {
    background: var(--brand-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .payment-btn.secondary {
    background: var(--surface-primary);
    color: var(--text-secondary);
    border: 1px solid var(--border-light);
  }

  .payment-btn.secondary:hover {
    background: var(--surface-tertiary);
    border-color: var(--border-medium);
  }

  .popup-footer {
    padding: var(--spacing-lg) var(--spacing-2xl);
    border-top: 1px solid var(--border-light);
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  .btn-primary,
  .btn-secondary {
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    border: none;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .btn-primary {
    background: var(--brand-success);
    color: white;
  }

  .btn-primary:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-secondary {
    background: var(--surface-primary);
    color: var(--text-secondary);
    border: 1px solid var(--border-light);
  }

  .btn-secondary:hover {
    background: var(--surface-tertiary);
    border-color: var(--border-medium);
  }

  /* Premium Form Actions */
  .premium-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-2xl);
    border-top: 1px solid var(--border-light);
  }

  .premium-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-weight: 600;
    font-size: 0.875rem;
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    text-decoration: none;
    border: 1px solid;
    cursor: pointer;
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .premium-btn.primary {
    background: linear-gradient(
      135deg,
      var(--brand-primary),
      var(--brand-primary-hover)
    );
    color: white;
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-md);
  }

  .premium-btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  .premium-btn.primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .premium-btn.secondary {
    background: var(--surface-primary);
    color: var(--text-secondary);
    border-color: var(--border-light);
  }

  .premium-btn.secondary:hover {
    background: var(--surface-tertiary);
    color: var(--text-primary);
    border-color: var(--border-medium);
    transform: translateY(-1px);
  }

  .btn-loading {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Mobile Responsive for Popup */
  @media (max-width: 768px) {
    .popup-overlay {
      padding: var(--spacing-sm);
    }

    .success-popup {
      margin: 0;
      border-radius: var(--radius-lg);
    }

    .popup-header {
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .popup-content {
      padding: var(--spacing-lg);
    }

    .popup-footer {
      padding: var(--spacing-md) var(--spacing-lg);
      flex-direction: column;
    }

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }

    .payment-actions {
      flex-direction: column;
    }

    .premium-actions {
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .premium-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
