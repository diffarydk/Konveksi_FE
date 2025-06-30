<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { slide, fade, fly } from "svelte/transition";
  import { ordersService } from "$lib/services/orders";
  import type {
    CreateOrderRequest,
    CreateOrderResponse,
  } from "$lib/types/order";

  export let isLoading = false;

  const dispatch = createEventDispatcher<{
    success: CreateOrderResponse;
    error: string;
    cancel: void;
  }>();

  // Form data mengikuti API documentation
  let formData: CreateOrderRequest = {
    customer_name: "",
    product_name: "",
    quantity: 1,
    total_price: "",
    payment_type: "dp",
    dp_percent: 60,
    contact_information: "",
    notification_channel: "whatsapp",
    design_notes: "",
    paid_amount: "0",
    is_fully_paid: false,
  };

  let designFile: File | null = null;
  let designPreview: string | null = null;
  let errors: Record<string, string[]> = {};
  let isSubmitting = false;

  // Success popup state
  let showSuccessPopup = false;
  let successData: any = null; // Flexible type to handle both old and new response formats

  // Helper computed properties for template
  $: orderData = successData?.order || successData?.data?.order || null;
  $: invoiceData = successData?.invoice || successData?.data?.invoice || null;

  // Error summary state
  let showErrorSummary = true;

  // Critical error modal state
  let showCriticalErrorModal = false;
  let criticalErrorData: {
    message: string;
    status?: string;
    details?: any;
  } | null = null;

  // Reactive calculations
  $: paymentSummary = calculatePaymentSummary(
    parseFloat(formData.total_price) || 0,
    formData.payment_type,
    formData.dp_percent || 60
  );

  // Auto-detect contact type and notification channel
  $: contactType = detectContactType(formData.contact_information);
  $: {
    const previousChannel = formData.notification_channel;

    if (contactType === "email") {
      formData.notification_channel = "email";
    } else if (contactType === "whatsapp") {
      formData.notification_channel = "whatsapp";
    } else if (formData.contact_information.trim()) {
      // Jika format tidak dikenali tapi ada input, gunakan both
      formData.notification_channel = "both";
    } else {
      // Default fallback
      formData.notification_channel = "whatsapp";
    }

    // Debug log for auto-detection
    if (previousChannel !== formData.notification_channel) {
      console.log(
        `📱 Auto-detected notification channel: ${formData.notification_channel} (contact type: ${contactType})`
      );
    }
  }

  // Auto show error summary only when new validation occurs
  let lastErrorCount = 0;
  $: {
    const currentErrorCount = Object.keys(errors).length;

    // Show error summary pada kondisi:
    // 1. Error count bertambah (validasi baru)
    // 2. Tidak ada error -> error summary harus disembunyikan
    if (currentErrorCount > lastErrorCount && currentErrorCount > 0) {
      showErrorSummary = true;
    } else if (currentErrorCount === 0) {
      showErrorSummary = false;
    }

    lastErrorCount = currentErrorCount;
  }

  function calculatePaymentSummary(
    totalPrice: number,
    paymentType: string,
    dpPercent: number = 60
  ) {
    const summary = {
      total_price: totalPrice,
      dp_amount: 0,
      remaining_amount: 0,
      payment_type: paymentType,
    };

    if (paymentType === "dp") {
      summary.dp_amount = Math.round((totalPrice * dpPercent) / 100);
      summary.remaining_amount = totalPrice - summary.dp_amount;
    } else if (paymentType === "full") {
      summary.dp_amount = totalPrice;
      summary.remaining_amount = 0;
    }

    return summary;
  }

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

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

    // Clean contact number (remove spaces, dashes, parentheses, plus signs)
    const cleanContact = trimmedContact.replace(/[\s\-\(\)\+]/g, "");

    // Indonesian WhatsApp number patterns (panjang hingga 13 digit, validasi ketat)
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

  function handleCurrencyInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/[^\d]/g, "");

    if (value) {
      formData.total_price = value;
      target.value = new Intl.NumberFormat("id-ID").format(parseInt(value));
    } else {
      formData.total_price = "";
      target.value = "";
    }

    clearFieldError("total_price");
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldError("design", ["Ukuran file maksimal 5MB"]);
        return;
      }

      if (!file.type.startsWith("image/")) {
        setFieldError("design", ["File harus berupa gambar (JPG, PNG, GIF)"]);
        return;
      }

      designFile = file;
      formData.design = file;
      clearFieldError("design");

      const reader = new FileReader();
      reader.onload = (e) => {
        designPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function removeDesign() {
    designFile = null;
    designPreview = null;
    formData.design = undefined;
    clearFieldError("design");

    const fileInput = document.getElementById(
      "design-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  function clearFieldError(field: string) {
    if (errors[field]) {
      errors = { ...errors };
      delete errors[field];
    }

    // Clear highlight effect jika ada
    const fieldElement = document.getElementById(field);
    if (fieldElement) {
      fieldElement.style.boxShadow = "";
      fieldElement.style.animation = "";
    }
  }

  function closeErrorSummary() {
    showErrorSummary = false;
  }

  function showCriticalError(message: string, status: string, details?: any) {
    criticalErrorData = {
      message,
      status,
      details: details?.data || details,
    };
    showCriticalErrorModal = true;

    // Log error untuk debugging admin
    console.error("🚨 Critical admin error:", {
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  function closeCriticalErrorModal() {
    showCriticalErrorModal = false;
    criticalErrorData = null;
  }

  function setFieldError(field: string, messages: string[]) {
    errors = { ...errors, [field]: messages };
  }

  function scrollToFirstError() {
    // Tunggu DOM update terlebih dahulu
    setTimeout(() => {
      const firstErrorElement = document.querySelector(
        ".form-input.error, .form-select.error, .form-textarea.error"
      );

      if (firstErrorElement) {
        // Scroll ke element
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Focus dan highlight effect
        setTimeout(() => {
          if (
            firstErrorElement instanceof HTMLInputElement ||
            firstErrorElement instanceof HTMLSelectElement ||
            firstErrorElement instanceof HTMLTextAreaElement
          ) {
            firstErrorElement.focus();

            // Tambahkan efek highlight sementara
            firstErrorElement.style.boxShadow =
              "0 0 0 3px rgba(239, 68, 68, 0.2)";
            firstErrorElement.style.animation = "errorPulse 0.6s ease-in-out";

            // Hapus efek setelah 2 detik
            setTimeout(() => {
              firstErrorElement.style.boxShadow = "";
              firstErrorElement.style.animation = "";
            }, 2000);
          }
        }, 500);
      }
    }, 100);
  }

  function validateForm(): boolean {
    errors = {};
    let isValid = true;

    if (!formData.customer_name?.trim()) {
      setFieldError("customer_name", ["Nama customer wajib diisi"]);
      isValid = false;
    } else if (formData.customer_name.trim().length < 2) {
      setFieldError("customer_name", ["Nama customer minimal 2 karakter"]);
      isValid = false;
    }

    if (!formData.product_name?.trim()) {
      setFieldError("product_name", ["Nama produk wajib diisi"]);
      isValid = false;
    } else if (formData.product_name.trim().length < 3) {
      setFieldError("product_name", ["Nama produk minimal 3 karakter"]);
      isValid = false;
    }

    const quantity = Number(formData.quantity);
    if (!formData.quantity || quantity === 0 || quantity < 1) {
      setFieldError("quantity", ["Jumlah minimal 1 pcs"]);
      isValid = false;
    } else if (!Number.isInteger(quantity)) {
      setFieldError("quantity", ["Jumlah harus berupa angka bulat"]);
      isValid = false;
    } else if (quantity > 10000) {
      setFieldError("quantity", ["Quantity maksimal 10,000 pcs"]);
      isValid = false;
    }

    const totalPrice = parseFloat(formData.total_price || "0");
    if (!formData.total_price || totalPrice <= 0) {
      setFieldError("total_price", [
        "Harga total wajib diisi dan harus lebih dari 0",
      ]);
      isValid = false;
    } else if (totalPrice < 5000) {
      setFieldError("total_price", ["Harga total minimal Rp 5.000"]);
      isValid = false;
    }

    if (formData.payment_type === "dp") {
      const dpPercent = Number(formData.dp_percent);
      if (!dpPercent || dpPercent < 50 || dpPercent > 95) {
        setFieldError("dp_percent", ["Persentase DP harus antara 50% - 95%"]);
        isValid = false;
      }
    }

    if (!formData.contact_information?.trim()) {
      setFieldError("contact_information", ["Informasi kontak wajib diisi"]);
      isValid = false;
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
            setFieldError("contact_information", [
              "Tidak bisa menggunakan nomor Xendit!",
            ]);
          } else {
            setFieldError("contact_information", [
              "Tidak bisa menggunakan nomor admin!",
            ]);
          }
          isForbidden = true;
          isValid = false;
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
            setFieldError("contact_information", ["Format email tidak valid"]);
          } else {
            setFieldError("contact_information", [
              "Format nomor WhatsApp tidak valid. Contoh: 081234567890 atau 6281234567890",
            ]);
          }
          isValid = false;
        }
      }
    }

    if (formData.design_notes && formData.design_notes.length > 1000) {
      setFieldError("design_notes", ["Catatan design maksimal 1000 karakter"]);
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      const errorCount = Object.keys(errors).length;
      const errorMessage =
        errorCount === 1
          ? "Ada 1 kesalahan pada form"
          : `Ada ${errorCount} kesalahan pada form`;

      dispatch("error", `${errorMessage}. Mohon perbaiki sebelum melanjutkan.`);

      // Show error summary dan auto scroll ke error pertama
      showErrorSummary = true;
      scrollToFirstError();
      return;
    }

    isSubmitting = true;

    try {
      const submitData: CreateOrderRequest = {
        customer_name: formData.customer_name.trim(),
        product_name: formData.product_name.trim(),
        quantity: Number(formData.quantity),
        total_price: formData.total_price,
        payment_type: formData.payment_type,
        dp_percent:
          formData.payment_type === "dp"
            ? Number(formData.dp_percent)
            : undefined,
        contact_information: formData.contact_information.trim(),
        notification_channel: formData.notification_channel,
        design_notes: formData.design_notes?.trim() || "",
        paid_amount: "0",
        is_fully_paid: false,
        design: designFile || undefined,
      };

      const response = await ordersService.createOrder(submitData);

      // Show success popup first
      showSuccessMessage(response);

      // Dispatch success event
      dispatch("success", response);

      // Reset form after short delay to ensure success popup is displayed
      setTimeout(() => {
        resetForm();
      }, 200);
    } catch (error: any) {
      console.error("❌ Order creation error:", error);

      let errorMessage = "Gagal membuat pesanan";

      if (
        error.status === 400 &&
        error.data &&
        typeof error.data === "object"
      ) {
        const backendErrors: Record<string, string[]> = {};

        for (const [field, messages] of Object.entries(error.data)) {
          if (Array.isArray(messages)) {
            backendErrors[field] = messages;
          } else if (typeof messages === "string") {
            backendErrors[field] = [messages];
          }
        }

        errors = { ...errors, ...backendErrors };
        errorMessage = "Data yang dikirim tidak valid. Periksa form Anda.";

        // Show error summary dan auto scroll ke backend validation error pertama
        showErrorSummary = true;
        scrollToFirstError();
      } else if (error.status === 0) {
        errorMessage =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
        showCriticalError(errorMessage, "CONNECTION_FAILED", error);
        return;
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Request timeout. Pastikan server backend berjalan.";
        showCriticalError(errorMessage, "TIMEOUT", error);
        return;
      } else if (error.status >= 500) {
        errorMessage = "Terjadi kesalahan server. Silakan coba lagi nanti.";
        showCriticalError(errorMessage, error.status?.toString(), error);
        return;
      } else if (error.status === 401) {
        errorMessage = "Sesi login Anda telah berakhir. Silakan login ulang.";

        // Redirect ke payment-failed dengan session error reason
        setTimeout(() => {
          window.location.href =
            "/payment-failed?reason=session_expired&status=401";
        }, 2000);

        showCriticalError(errorMessage, "UNAUTHORIZED", error);
        return;
      } else if (error.status === 403) {
        errorMessage = "Anda tidak memiliki akses untuk melakukan operasi ini.";

        // Redirect ke payment-failed dengan unauthorized reason
        setTimeout(() => {
          window.location.href =
            "/payment-failed?reason=unauthorized&status=403";
        }, 2000);

        showCriticalError(errorMessage, "FORBIDDEN", error);
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Untuk validation errors biasa, tampilkan di UI
      dispatch("error", errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function resetForm() {
    // Reset form data
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
      paid_amount: "0",
      is_fully_paid: false,
    };

    // Reset file upload
    removeDesign();

    // Reset errors dan error summary
    errors = {};
    showErrorSummary = false;
    lastErrorCount = 0;

    // Reset DOM inputs yang mungkin tidak ter-reactive
    setTimeout(() => {
      const totalPriceInput = document.getElementById(
        "total_price"
      ) as HTMLInputElement;
      if (totalPriceInput) {
        totalPriceInput.value = "";
      }

      const customerNameInput = document.getElementById(
        "customer_name"
      ) as HTMLInputElement;
      if (customerNameInput) {
        customerNameInput.value = "";
      }

      const productNameInput = document.getElementById(
        "product_name"
      ) as HTMLInputElement;
      if (productNameInput) {
        productNameInput.value = "";
      }

      const contactInput = document.getElementById(
        "contact_information"
      ) as HTMLInputElement;
      if (contactInput) {
        contactInput.value = "";
      }

      const notesTextarea = document.getElementById(
        "design_notes"
      ) as HTMLTextAreaElement;
      if (notesTextarea) {
        notesTextarea.value = "";
      }
    }, 100);
  }

  // Success popup functions
  function showSuccessMessage(responseData: CreateOrderResponse) {
    console.log(
      "📊 Success response data (full):",
      JSON.stringify(responseData, null, 2)
    );
    console.log("📊 Response type:", typeof responseData);
    console.log("📊 Response data field:", responseData?.data);
    console.log("📊 Response success:", responseData?.success);

    // Relaksasi validasi - hanya cek ada responseData
    if (!responseData) {
      console.error("❌ No response data received");
      dispatch("error", "Tidak ada data response dari server");
      return;
    }

    // Jika responseData ada tapi tidak sesuai struktur yang diharapkan
    if (typeof responseData !== "object") {
      console.error("❌ Response is not an object:", responseData);
      dispatch("error", "Format response tidak valid dari server");
      return;
    }

    // Set success data - handle both old and new format
    successData = responseData.data || responseData;
    showSuccessPopup = true;

    // Auto close after 15 seconds (increased for better UX)
    setTimeout(() => {
      showSuccessPopup = false;
    }, 15000);
  }

  function closeSuccessPopup() {
    showSuccessPopup = false;

    // Clear success data after animation completes
    setTimeout(() => {
      successData = null;
    }, 400);
  }

  function openPaymentLink() {
    // Handle both old and new response formats
    const paymentUrl =
      successData?.payment_url ||
      successData?.invoice?.payment_url ||
      successData?.data?.invoice?.payment_url;
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    } else {
      console.warn("⚠️ Payment URL not found in response data");
    }
  }
</script>

<div class="create-order-form">
  <div class="form-header">
    <h2>
      <i class="fas fa-plus-circle"></i>
      Buat Pesanan Baru
    </h2>
    <p>
      Isi form di bawah untuk membuat pesanan baru sesuai kebutuhan customer
    </p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="order-form">
    <!-- Error Summary -->
    {#if Object.keys(errors).length > 0 && showErrorSummary}
      <div class="error-summary" transition:slide>
        <div class="error-summary-content">
          <i class="fas fa-exclamation-triangle"></i>
          <span>
            {Object.keys(errors).length === 1
              ? "Ada 1 kesalahan pada form"
              : `Ada ${Object.keys(errors).length} kesalahan pada form`}
          </span>
          <button
            type="button"
            class="close-error-btn"
            on:click={closeErrorSummary}
            title="Tutup peringatan"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    {/if}

    <!-- Customer Information -->
    <section class="form-section">
      <h3>
        <i class="fas fa-user"></i>
        Informasi Customer
      </h3>

      <div class="form-group">
        <label for="customer_name"
          >Nama Customer <span class="required">*</span></label
        >
        <input
          id="customer_name"
          type="text"
          bind:value={formData.customer_name}
          on:input={() => clearFieldError("customer_name")}
          class="form-input"
          class:error={errors.customer_name}
          placeholder="Nama lengkap customer"
          disabled={isSubmitting}
        />
        {#if errors.customer_name}
          <span class="error-message">{errors.customer_name[0]}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="contact_information"
          >Informasi Kontak <span class="required">*</span></label
        >
        <input
          id="contact_information"
          type="text"
          bind:value={formData.contact_information}
          on:input={() => clearFieldError("contact_information")}
          class="form-input"
          class:error={errors.contact_information}
          placeholder="Email: user@domain.com | WhatsApp: 081234567890"
          disabled={isSubmitting}
        />
        <div class="form-hint">
          {#if contactType === "email"}
            <i class="fas fa-envelope"></i> Format email terdeteksi - notifikasi
            via email
          {:else if contactType === "whatsapp"}
            <i class="fab fa-whatsapp"></i> Format WhatsApp terdeteksi - notifikasi
            via WhatsApp
          {:else if formData.contact_information.trim()}
            <i class="fas fa-exclamation-triangle"></i> Format tidak dikenali - akan
            menggunakan kedua channel
          {:else}
            <i class="fas fa-info-circle"></i> Masukkan email atau nomor WhatsApp
          {/if}
        </div>
        {#if errors.contact_information}
          <span class="error-message">{errors.contact_information[0]}</span>
        {/if}
      </div>
    </section>

    <!-- Product Information -->
    <section class="form-section">
      <h3>
        <i class="fas fa-tshirt"></i>
        Informasi Produk
      </h3>

      <div class="form-group">
        <label for="product_name"
          >Nama Produk <span class="required">*</span></label
        >
        <input
          id="product_name"
          type="text"
          bind:value={formData.product_name}
          on:input={() => clearFieldError("product_name")}
          class="form-input"
          class:error={errors.product_name}
          placeholder="Nama produk konveksi"
          disabled={isSubmitting}
        />
        {#if errors.product_name}
          <span class="error-message">{errors.product_name[0]}</span>
        {/if}
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="quantity">Quantity <span class="required">*</span></label>
          <input
            id="quantity"
            type="number"
            bind:value={formData.quantity}
            on:input={() => clearFieldError("quantity")}
            class="form-input"
            class:error={errors.quantity}
            min="1"
            max="10000"
            step="1"
            disabled={isSubmitting}
          />
          {#if errors.quantity}
            <span class="error-message">{errors.quantity[0]}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="total_price"
            >Total Harga <span class="required">*</span></label
          >
          <input
            id="total_price"
            type="text"
            on:input={handleCurrencyInput}
            class="form-input"
            class:error={errors.total_price}
            placeholder="Minimal Rp 5.000"
            disabled={isSubmitting}
          />
          <small>Minimal Rp 5.000</small>
          {#if errors.total_price}
            <span class="error-message">{errors.total_price[0]}</span>
          {/if}
        </div>
      </div>

      <!-- Design Upload -->
      <div class="form-group">
        <label for="design-upload">Design (Opsional)</label>
        <div class="file-upload-container">
          {#if designPreview}
            <div class="design-preview" transition:slide>
              <img
                src={designPreview}
                alt="Preview design"
                class="preview-image"
              />
              <div class="file-details">
                <div class="file-name">{designFile?.name}</div>
                <div class="file-size">
                  {designFile ? (designFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </div>
              </div>
              <button
                type="button"
                class="remove-button"
                on:click={removeDesign}
                disabled={isSubmitting}
                title="Hapus file"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          {:else}
            <div class="upload-area">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Klik untuk upload design</span>
              <small>Maksimal 5MB • JPG, PNG, GIF</small>
            </div>
          {/if}

          <input
            id="design-upload"
            type="file"
            accept="image/*"
            on:change={handleFileUpload}
            class="file-input"
            disabled={isSubmitting}
          />
        </div>
        {#if errors.design}
          <span class="error-message">{errors.design[0]}</span>
        {/if}
      </div>

      <!-- Design Notes -->
      <div class="form-group">
        <label for="design_notes">Catatan Design (Opsional)</label>
        <textarea
          id="design_notes"
          bind:value={formData.design_notes}
          on:input={() => clearFieldError("design_notes")}
          class="form-textarea"
          class:error={errors.design_notes}
          placeholder="Catatan design atau request khusus dari customer"
          rows="4"
          disabled={isSubmitting}
        ></textarea>
        <div class="char-count">
          {formData.design_notes?.length || 0}/1000 karakter
        </div>
        {#if errors.design_notes}
          <span class="error-message">{errors.design_notes[0]}</span>
        {/if}
      </div>
    </section>

    <!-- Payment Configuration -->
    <section class="form-section">
      <h3>
        <i class="fas fa-credit-card"></i>
        Konfigurasi Pembayaran
      </h3>

      <div class="form-group">
        <label for="payment_type"
          >Tipe Pembayaran <span class="required">*</span></label
        >
        <div class="payment-options">
          <label
            class="payment-option"
            class:selected={formData.payment_type === "dp"}
          >
            <input
              type="radio"
              bind:group={formData.payment_type}
              value="dp"
              on:change={() => clearFieldError("payment_type")}
              disabled={isSubmitting}
            />
            <div class="option-content">
              <div class="option-title">
                <i class="fas fa-percentage"></i>
                DP (Custom %)
              </div>
              <div class="option-description">
                Pembayaran sebagian terlebih dahulu
              </div>
            </div>
          </label>

          <label
            class="payment-option"
            class:selected={formData.payment_type === "full"}
          >
            <input
              type="radio"
              bind:group={formData.payment_type}
              value="full"
              on:change={() => clearFieldError("payment_type")}
              disabled={isSubmitting}
            />
            <div class="option-content">
              <div class="option-title">
                <i class="fas fa-money-bill-wave"></i>
                Full Payment (100%)
              </div>
              <div class="option-description">Bayar langsung keseluruhan</div>
            </div>
          </label>
        </div>
        {#if errors.payment_type}
          <span class="error-message">{errors.payment_type[0]}</span>
        {/if}
      </div>

      {#if formData.payment_type === "dp"}
        <div class="dp-configuration" transition:slide>
          <div class="form-group">
            <label for="dp_percent"
              >Persentase DP <span class="required">*</span></label
            >
            <div class="percent-input-wrapper">
              <input
                id="dp_percent"
                type="number"
                bind:value={formData.dp_percent}
                on:input={() => clearFieldError("dp_percent")}
                class="form-input"
                class:error={errors.dp_percent}
                min="50"
                max="95"
                step="5"
                disabled={isSubmitting}
              />
              <span class="percent-symbol">%</span>
            </div>
            <small>Minimal 50%, sisanya akan dibuat invoice pelunasan</small>
            {#if errors.dp_percent}
              <span class="error-message">{errors.dp_percent[0]}</span>
            {/if}
          </div>
        </div>
      {/if}

      <div class="form-group">
        <label>Channel Notifikasi (Otomatis)</label>
        <div class="notification-channel-display">
          <div class="channel-info">
            {#if formData.notification_channel === "email"}
              <i class="fas fa-envelope"></i>
              <span>Email</span>
              <small>Notifikasi akan dikirim via email</small>
            {:else if formData.notification_channel === "whatsapp"}
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
              <small>Notifikasi akan dikirim via WhatsApp</small>
            {:else if formData.notification_channel === "both"}
              <i class="fas fa-paper-plane"></i>
              <span>WhatsApp & Email</span>
              <small>Notifikasi akan dikirim via kedua channel</small>
            {:else}
              <i class="fas fa-question-circle"></i>
              <span>Belum terdeteksi</span>
              <small>Masukkan email atau nomor WhatsApp yang valid</small>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- Payment Summary -->
    <section class="payment-summary">
      <h4>
        <i class="fas fa-calculator"></i>
        Ringkasan Pembayaran
      </h4>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Total Harga:</span>
          <span class="summary-value">
            <strong>{formatRupiah(paymentSummary.total_price)}</strong>
          </span>
        </div>
        {#if formData.payment_type === "dp"}
          <div class="summary-item highlight">
            <span class="summary-label">DP Amount:</span>
            <span class="summary-value">
              <strong>{formatRupiah(paymentSummary.dp_amount)}</strong>
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Sisa Pelunasan:</span>
            <span class="summary-value">
              <strong>{formatRupiah(paymentSummary.remaining_amount)}</strong>
            </span>
          </div>
        {:else}
          <div class="summary-item highlight">
            <span class="summary-label">Jumlah Pembayaran:</span>
            <span class="summary-value">
              <strong>{formatRupiah(paymentSummary.total_price)}</strong>
            </span>
          </div>
        {/if}
        <div class="summary-item">
          <span class="summary-label">Channel Notifikasi:</span>
          <span class="summary-value">
            {#if formData.notification_channel === "email"}
              <i class="fas fa-envelope"></i> Email
            {:else if formData.notification_channel === "whatsapp"}
              <i class="fab fa-whatsapp"></i> WhatsApp
            {:else if formData.notification_channel === "both"}
              <i class="fas fa-paper-plane"></i> Keduanya
            {:else}
              <i class="fas fa-question-circle"></i> Otomatis
            {/if}
          </span>
        </div>
      </div>
    </section>

    <!-- Form Actions -->
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        disabled={isSubmitting}
        on:click={() => dispatch("cancel")}
      >
        <i class="fas fa-times"></i>
        Batal
      </button>

      <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
        {#if isSubmitting}
          <i class="fas fa-spinner fa-spin"></i>
          Creating Order...
        {:else}
          <i class="fas fa-plus"></i>
          Create Order
        {/if}
      </button>
    </div>
  </form>
</div>

<!-- Critical Error Modal -->
{#if showCriticalErrorModal && criticalErrorData}
  <div class="popup-overlay" transition:fade>
    <div class="critical-error-modal" transition:fly={{ y: 50, duration: 400 }}>
      <div class="error-header">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Error Sistem</h3>
        <button class="close-btn" on:click={closeCriticalErrorModal}>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="error-content">
        <div class="error-message">
          <p>{criticalErrorData.message}</p>
        </div>

        {#if criticalErrorData.status}
          <div class="error-details">
            <strong>Status:</strong>
            {criticalErrorData.status}
          </div>
        {/if}

        <div class="error-suggestions">
          <h4>Saran Penyelesaian:</h4>
          <ul>
            {#if criticalErrorData.status === "CONNECTION_FAILED"}
              <li>Periksa koneksi internet Anda</li>
              <li>Pastikan server backend sedang berjalan</li>
              <li>Coba refresh halaman dan ulangi</li>
            {:else if criticalErrorData.status === "TIMEOUT"}
              <li>Server sedang lambat atau tidak merespons</li>
              <li>Tunggu beberapa saat lalu coba lagi</li>
              <li>Hubungi tim IT jika masalah berlanjut</li>
            {:else if criticalErrorData.status?.startsWith("5")}
              <li>Terjadi kesalahan pada server</li>
              <li>Tim IT telah diberitahu secara otomatis</li>
              <li>Coba lagi dalam beberapa menit</li>
            {:else if criticalErrorData.status === "UNAUTHORIZED"}
              <li>Sesi login Anda telah berakhir</li>
              <li>Silakan login ulang</li>
              <li>Pastikan kredensial Anda masih valid</li>
            {:else if criticalErrorData.status === "FORBIDDEN"}
              <li>Akun Anda tidak memiliki izin untuk operasi ini</li>
              <li>Hubungi administrator untuk mendapatkan akses</li>
            {:else}
              <li>Coba refresh halaman dan ulangi</li>
              <li>Hubungi tim IT jika masalah berlanjut</li>
            {/if}
          </ul>
        </div>
      </div>

      <div class="error-footer">
        <button class="btn-danger" on:click={closeCriticalErrorModal}>
          <i class="fas fa-check"></i>
          Mengerti
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Success Popup -->
{#if showSuccessPopup && successData}
  <div class="popup-overlay" transition:fade>
    <div class="success-popup" transition:fly={{ y: 50, duration: 400 }}>
      <div class="popup-header">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>Pesanan Berhasil Dibuat!</h3>
        <button class="close-btn" on:click={closeSuccessPopup}>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-content">
        <div class="order-info">
          {#if orderData?.order_code}
            <div class="info-item">
              <strong>Order Code:</strong>
              <span class="order-code">{orderData.order_code}</span>
            </div>
          {/if}

          {#if orderData?.customer_name}
            <div class="info-item">
              <strong>Customer:</strong>
              <span>{orderData.customer_name}</span>
            </div>
          {/if}

          {#if orderData?.product_name}
            <div class="info-item">
              <strong>Product:</strong>
              <span>{orderData.product_name}</span>
            </div>
          {/if}

          {#if orderData?.quantity}
            <div class="info-item">
              <strong>Quantity:</strong>
              <span>{orderData.quantity} pcs</span>
            </div>
          {/if}

          {#if orderData?.total_price}
            <div class="info-item">
              <strong>Total Harga:</strong>
              <span class="price">
                {formatRupiah(parseFloat(orderData.total_price.toString()))}
              </span>
            </div>
          {/if}

          {#if invoiceData}
            {#if invoiceData.invoice_code}
              <div class="info-item">
                <strong>Invoice:</strong>
                <span class="invoice-code">
                  {invoiceData.invoice_code}
                </span>
              </div>
            {/if}

            {#if invoiceData.invoice_amount}
              <div class="info-item">
                <strong>Jumlah Pembayaran:</strong>
                <span class="amount">
                  {formatRupiah(
                    parseFloat(invoiceData.invoice_amount.toString())
                  )}
                </span>
              </div>
            {/if}

            {#if invoiceData.invoice_expired_at}
              <div class="info-item">
                <strong>Batas Pembayaran:</strong>
                <span class="expiry-date">
                  {new Date(invoiceData.invoice_expired_at).toLocaleString(
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
          {/if}

          <!-- Fallback jika tidak ada data order yang spesifik -->
          {#if !orderData && !invoiceData}
            <div class="info-item">
              <strong>Status:</strong>
              <span class="success-message">✅ Pesanan berhasil dibuat!</span>
            </div>

            {#if successData?.message}
              <div class="info-item">
                <strong>Pesan:</strong>
                <span>{successData.message}</span>
              </div>
            {/if}
          {/if}
        </div>

        {#if successData?.payment_url || invoiceData?.payment_url}
          <div class="payment-section">
            <p class="payment-note">
              <i class="fas fa-info-circle"></i>
              Link pembayaran telah dibuat dan siap dikirim ke customer
            </p>

            <button class="payment-btn" on:click={openPaymentLink}>
              <i class="fas fa-external-link-alt"></i>
              Buka Link Pembayaran
            </button>
          </div>
        {/if}
      </div>

      <div class="popup-footer">
        <button class="btn-primary" on:click={closeSuccessPopup}>
          <i class="fas fa-check"></i>
          Tutup
        </button>

        <button
          class="btn-secondary"
          on:click={() => {
            closeSuccessPopup();
            resetForm();
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
  .create-order-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-header h2 {
    color: var(--text-dark);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .form-header h2 i {
    color: var(--primary);
  }

  .form-header p {
    color: var(--text-light);
    margin: 0;
    font-size: 0.875rem;
  }

  .order-form {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .form-section {
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .form-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0 0 1.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .form-section h3 i {
    color: var(--primary);
    width: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
  }

  .required {
    color: #ef4444;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s ease-in-out;
    background: white;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .form-input:disabled,
  .form-select:disabled,
  .form-textarea:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    color: #6b7280;
  }

  .form-input.error,
  .form-select.error,
  .form-textarea.error {
    border-color: #ef4444;
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }

  .form-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-light);
  }

  .form-hint i {
    color: var(--primary);
  }

  /* Notification Channel Display */
  .notification-channel-display {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
  }

  .channel-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .channel-info i {
    font-size: 1.25rem;
    width: 20px;
    flex-shrink: 0;
  }

  .channel-info i.fa-envelope {
    color: #059669;
  }

  .channel-info i.fa-whatsapp {
    color: #10b981;
  }

  .channel-info i.fa-paper-plane {
    color: var(--primary);
  }

  .channel-info i.fa-question-circle {
    color: #9ca3af;
  }

  .channel-info span {
    font-weight: 500;
    color: var(--text-dark);
    flex-shrink: 0;
  }

  .channel-info small {
    color: var(--text-light);
    font-size: 0.75rem;
    flex-grow: 1;
  }

  .char-count {
    text-align: right;
    font-size: 0.75rem;
    color: var(--text-light);
    margin-top: 0.5rem;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    font-weight: 500;
  }

  .error-message::before {
    content: "\f071";
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    color: #ef4444;
    flex-shrink: 0;
  }

  .form-group small {
    display: block;
    color: var(--text-light);
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  /* File Upload */
  .file-upload-container {
    position: relative;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
  }

  .file-upload-container:hover {
    border-color: var(--primary);
    background: rgba(37, 99, 235, 0.02);
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .upload-area {
    padding: 2rem;
    text-align: center;
  }

  .upload-area i {
    font-size: 2.5rem;
    color: var(--text-light);
    margin-bottom: 1rem;
  }

  .upload-area span {
    display: block;
    font-weight: 500;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
  }

  .upload-area small {
    color: var(--text-light);
  }

  .design-preview {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .preview-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .file-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .file-name {
    font-weight: 500;
    color: var(--text-dark);
    font-size: 0.875rem;
  }

  .file-size {
    font-size: 0.75rem;
    color: var(--text-light);
  }

  .remove-button {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .remove-button:hover {
    background: #dc2626;
  }

  /* Payment Options */
  .payment-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .payment-option {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .payment-option:hover {
    border-color: var(--primary);
    background: rgba(37, 99, 235, 0.02);
  }

  .payment-option.selected {
    border-color: var(--primary);
    background: rgba(37, 99, 235, 0.05);
  }

  .payment-option input {
    position: absolute;
    top: 1rem;
    left: 1rem;
  }

  .option-content {
    margin-left: 1.75rem;
  }

  .option-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: var(--text-dark);
    margin-bottom: 0.25rem;
  }

  .option-title i {
    color: var(--primary);
  }

  .option-description {
    font-size: 0.875rem;
    color: var(--text-light);
  }

  .dp-configuration {
    background: rgba(37, 99, 235, 0.05);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid rgba(37, 99, 235, 0.1);
    margin-top: 1rem;
  }

  .percent-input-wrapper {
    position: relative;
  }

  .percent-symbol {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-light);
    font-weight: 500;
    pointer-events: none;
  }

  /* Payment Summary */
  .payment-summary {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-bottom: 2rem;
  }

  .payment-summary h4 {
    margin: 0 0 1rem 0;
    color: var(--text-dark);
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .payment-summary h4 i {
    color: var(--primary);
  }

  .summary-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e9ecef;
  }

  .summary-item:last-child {
    border-bottom: none;
  }

  .summary-item.highlight {
    background: rgba(37, 99, 235, 0.05);
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(37, 99, 235, 0.1);
  }

  .summary-label {
    font-size: 0.875rem;
    color: var(--text-light);
  }

  .summary-value {
    font-weight: 500;
    color: var(--text-dark);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .summary-value i {
    font-size: 0.875rem;
  }

  .summary-value i.fa-envelope {
    color: #059669;
  }

  .summary-value i.fa-whatsapp {
    color: #10b981;
  }

  .summary-value i.fa-paper-plane {
    color: var(--primary);
  }

  .summary-value i.fa-question-circle {
    color: #9ca3af;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: var(--text-light);
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-dark);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  }

  .success-popup {
    background: white;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
  }

  .popup-header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 2rem;
    text-align: center;
    position: relative;
    border-radius: 16px 16px 0 0;
  }

  .success-icon {
    background: rgba(255, 255, 255, 0.2);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem auto;
  }

  .success-icon i {
    font-size: 2rem;
    color: white;
  }

  .popup-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
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
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .popup-content {
    padding: 2rem;
  }

  .order-info {
    margin-bottom: 1.5rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item strong {
    color: var(--text-dark);
    font-weight: 500;
  }

  .order-code,
  .invoice-code {
    font-family: "Courier New", monospace;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--primary);
    font-weight: 600;
  }

  .price,
  .amount {
    color: var(--primary);
    font-weight: 600;
  }

  .expiry-date {
    color: #f59e0b;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .success-message {
    color: #10b981;
    font-weight: 600;
  }

  /* Error Summary */
  .error-summary {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-left: 4px solid #ef4444;
  }

  .error-summary-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .error-summary-content i {
    color: #ef4444;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .error-summary-content span {
    color: #7f1d1d;
    font-weight: 500;
    flex-grow: 1;
  }

  .close-error-btn {
    background: transparent;
    color: #9ca3af;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .close-error-btn:hover {
    background: rgba(156, 163, 175, 0.1);
    color: #6b7280;
    transform: scale(1.1);
  }

  /* Error highlight animation */
  @keyframes errorPulse {
    0% {
      border-color: #ef4444;
      transform: scale(1);
    }
    50% {
      border-color: #dc2626;
      transform: scale(1.02);
    }
    100% {
      border-color: #ef4444;
      transform: scale(1);
    }
  }

  .payment-section {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  }

  .payment-note {
    margin: 0 0 1rem 0;
    color: var(--text-light);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .payment-note i {
    color: var(--primary);
  }

  .payment-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 auto;
  }

  .payment-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .popup-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .popup-footer .btn-primary {
    background: #10b981;
    border: none;
    padding: 0.75rem 2rem;
  }

  .popup-footer .btn-primary:hover {
    background: #059669;
  }

  /* Critical Error Modal Styles */
  .critical-error-modal {
    background: white;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
  }

  .error-header {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 2rem;
    text-align: center;
    position: relative;
    border-radius: 16px 16px 0 0;
  }

  .error-icon {
    background: rgba(255, 255, 255, 0.2);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem auto;
  }

  .error-icon i {
    font-size: 2rem;
    color: white;
  }

  .error-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .error-content {
    padding: 2rem;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .error-message p {
    margin: 0;
    color: #7f1d1d;
    font-weight: 500;
  }

  .error-details {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    color: #64748b;
  }

  .error-suggestions h4 {
    color: var(--text-dark);
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .error-suggestions ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .error-suggestions li {
    color: var(--text-light);
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .error-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid #f3f4f6;
    text-align: center;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 auto;
  }

  .btn-danger:hover {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .create-order-form {
      padding: 0.5rem;
    }

    .order-form {
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .payment-options {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }

    .design-preview {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .preview-image {
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .popup-overlay {
      padding: 0.5rem;
    }

    .success-popup {
      margin: 0;
      border-radius: 12px;
    }

    .popup-header {
      padding: 1.5rem;
      border-radius: 12px 12px 0 0;
    }

    .popup-content {
      padding: 1.5rem;
    }

    .popup-footer {
      padding: 1rem 1.5rem;
    }

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .payment-btn {
      width: 100%;
      justify-content: center;
    }

    .error-summary {
      padding: 0.875rem;
      margin-bottom: 1rem;
    }

    .error-summary-content {
      gap: 0.5rem;
    }

    .error-summary-content span {
      font-size: 0.875rem;
    }

    .close-error-btn {
      width: 24px;
      height: 24px;
    }

    .notification-channel-display {
      padding: 0.75rem;
    }

    .channel-info {
      gap: 0.5rem;
    }

    .channel-info i {
      font-size: 1rem;
    }

    .channel-info span {
      font-size: 0.875rem;
    }

    .channel-info small {
      font-size: 0.7rem;
    }

    .critical-error-modal {
      margin: 0;
      border-radius: 12px;
    }

    .error-header {
      padding: 1.5rem;
      border-radius: 12px 12px 0 0;
    }

    .error-content {
      padding: 1.5rem;
    }

    .error-footer {
      padding: 1rem 1.5rem;
    }

    .error-message,
    .error-details {
      padding: 0.875rem;
    }
  }
</style>
