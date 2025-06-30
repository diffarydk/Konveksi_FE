<!-- Admin Orders Page - Fixed untuk menggunakan API v2.0 -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { ordersStore, cleanupOrdersStore } from "$lib/stores/ordersStore";
  import { api } from "$lib/services/api";
  import Breadcrumb from "$lib/components/admin/common/Breadcrumb.svelte";
  import OrderList from "$lib/components/admin/Orders/OrderList.svelte";
  import OrderStats from "$lib/components/admin/Orders/OrderStats.svelte";
  import OrderForm from "$lib/components/admin/Orders/OrderForm.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import type { Order, CreateOrderResponse } from "$lib/types/order";

  // Page state
  let currentView: "list" | "create" | "edit" | "detail" = "list";
  let orders: Order[] = [];
  let isLoading = false;
  let error = "";
  let success = "";
  let showStats = false; // Minimalist - hide stats by default
  let isSyncing = false; // Background sync indicator

  // Pagination
  let currentPage = 1;
  let totalPages = 1;
  let totalCount = 0;
  let pageSize = 20;

  // Edit/detail state
  let selectedOrder: Order | null = null;
  let editOrderData: any = null;

  // Detail view variables
  let newProductionStatus: Order["production_status"] = "menunggu";
  let paymentLinkType: "dp" | "pelunasan" | "full" = "dp";
  let dpPercent = 50;
  let orderTrackingData: any = null;
  let paymentLinkCopied = false;

  // Page metadata
  const pageTitle = "Manajemen Pesanan";
  const breadcrumbs = [
    { label: "Home", link: "/admin" },
    { label: "Pesanan", active: true },
  ];

  // Helper functions untuk status display
  function getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      menunggu_link: "warning",
      link_dibuat: "info",
      dp_dibayar: "success",
      pengerjaan_selesai: "primary",
      menunggu_pelunasan: "warning",
      lunas: "success",
      dibatalkan: "danger",
    };
    return statusClasses[status] || "secondary";
  }

  function getStatusDisplayText(status: string): string {
    const statusTexts: Record<string, string> = {
      menunggu_link: "⏳ Menunggu Link",
      link_dibuat: "🔗 Link Dibuat",
      dp_dibayar: "💰 DP Dibayar",
      pengerjaan_selesai: "✅ Pengerjaan Selesai",
      menunggu_pelunasan: "⏳ Menunggu Pelunasan",
      lunas: "✅ Lunas",
      dibatalkan: "❌ Dibatalkan",
    };
    return statusTexts[status] || status;
  }

  function getProductionStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      menunggu: "warning",
      diproses: "info",
      selesai: "success",
    };
    return statusClasses[status] || "secondary";
  }

  function getProductionStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      menunggu: "⏳ Menunggu",
      diproses: "🔄 Diproses",
      selesai: "✅ Selesai",
    };
    return statusTexts[status] || status;
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  }

  // Detail view handlers
  async function handleUpdateProductionStatus(
    orderId: string,
    newStatus: Order["production_status"]
  ) {
    if (!selectedOrder) return;

    try {
      isLoading = true;
      const updatedOrder = await ordersStore.updateProductionStatus(
        orderId,
        newStatus
      );
      success = `Status produksi berhasil diupdate ke: ${getProductionStatusText(newStatus)}`;

      // Update selected order for UI dan refresh data
      selectedOrder = updatedOrder;
      await loadOrders(currentPage, false); // Silent background sync

      // Clear success message setelah 3 detik
      setTimeout(() => {
        success = "";
      }, 3000);
    } catch (err: any) {
      console.error("❌ Error updating production status:", err);
      error = err.message || "Gagal mengupdate status produksi";
    } finally {
      isLoading = false;
    }
  }

  async function handleCreatePaymentLink(orderId: string) {
    if (!selectedOrder) return;

    try {
      isLoading = true;

      // Include notification channel from order untuk email blast
      const paymentData = {
        payment_type: "dp" as const,
        dp_percent: 60, // Default 60% DP
        notification_channel: selectedOrder.notification_channel || "email", // Include email blast setting
      };

      console.log("📧 Creating payment link with email blast:", paymentData);

      const response = await ordersStore.createPaymentLink(
        orderId,
        paymentData
      );

      // Copy payment URL to clipboard
      if (response.payment_url) {
        try {
          await navigator.clipboard.writeText(response.payment_url);
          paymentLinkCopied = true;
          success = `✅ Payment link berhasil dibuat dan dicopy ke clipboard! ${
            selectedOrder.notification_channel === "email" ||
            selectedOrder.notification_channel === "both"
              ? "Email notifikasi telah dikirim."
              : ""
          }`;
          console.log(
            "📋 Payment URL copied to clipboard:",
            response.payment_url
          );

          // Reset copied state after 3 seconds
          setTimeout(() => {
            paymentLinkCopied = false;
          }, 3000);
        } catch (clipboardErr) {
          console.warn("⚠️ Could not copy to clipboard:", clipboardErr);
          success = `Payment link berhasil dibuat: ${response.payment_url} ${
            selectedOrder.notification_channel === "email" ||
            selectedOrder.notification_channel === "both"
              ? "Email notifikasi telah dikirim."
              : ""
          }`;
        }
      } else {
        success = `Payment link berhasil dibuat ${
          selectedOrder.notification_channel === "email" ||
          selectedOrder.notification_channel === "both"
            ? "dan email notifikasi telah dikirim"
            : ""
        }`;
      }

      // Refresh data untuk update status
      await loadOrders(currentPage, false); // Silent background sync

      // Clear success message setelah 5 detik
      setTimeout(() => {
        success = "";
      }, 5000);
    } catch (err: any) {
      console.error("❌ Error creating payment link:", err);
      error = err.message || "Gagal membuat payment link";
    } finally {
      isLoading = false;
    }
  }

  async function handleTrackOrder(orderCode: string) {
    try {
      isLoading = true;
      orderTrackingData = await ordersStore.trackOrder(orderCode);
      console.log("📍 Order tracking data loaded:", orderTrackingData);
    } catch (err: any) {
      console.error("❌ Error tracking order:", err);
      error = err.message || "Gagal memuat data tracking";
    } finally {
      isLoading = false;
    }
  }

  // Delete confirmation modal
  let showDeleteModal = false;
  let deleteOrderId = "";
  let deleteOrderCode = "";

  function handleEditOrder(order: Order) {
    goToEdit(order);
  }

  function handleDeleteOrder(orderId: string, orderCode: string) {
    deleteOrderId = orderId;
    deleteOrderCode = orderCode;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    try {
      isLoading = true;
      await ordersStore.deleteOrder(deleteOrderId);
      success = `Pesanan ${deleteOrderCode} berhasil dihapus`;

      // Auto refresh data dan kembali ke list
      goToList();
      await loadOrders(currentPage, false); // Silent background sync

      // Clear success message setelah 3 detik
      setTimeout(() => {
        success = "";
      }, 3000);
    } catch (err: any) {
      console.error("❌ Error deleting order:", err);
      error = err.message || "Gagal menghapus pesanan";
    } finally {
      isLoading = false;
      showDeleteModal = false;
      deleteOrderId = "";
      deleteOrderCode = "";
    }
  }

  function cancelDelete() {
    showDeleteModal = false;
    deleteOrderId = "";
    deleteOrderCode = "";
  }

  // Subscribe ke store
  let unsubscribeOrders: (() => void) | null = null;
  let unsubscribeLoading: (() => void) | null = null;
  let unsubscribeError: (() => void) | null = null;
  let refreshInterval: number | null = null;

  // Real-time status (now handled by ordersStore)
  let realtimeStatus: {
    websocketConnected: boolean;
    pollingActive: boolean;
    fallbackMode: boolean;
    lastUpdate: string | null;
  } = {
    websocketConnected: false,
    pollingActive: false,
    fallbackMode: false,
    lastUpdate: null,
  };

  // Real-time update indicator
  let realtimeUpdateReceived = false;
  let lastRealtimeUpdate = new Date();

  onMount(async () => {
    try {
      console.log("🚀 Admin orders page mounted");

      // Subscribe ke orders data
      unsubscribeOrders = ordersStore.subscribe((ordersData) => {
        orders = ordersData;
        totalCount = ordersData.length;
        totalPages = Math.ceil(totalCount / pageSize);
        console.log("📊 Orders updated from store:", ordersData.length);
      });

      // Subscribe ke loading state
      unsubscribeLoading = ordersStore.loading.subscribe((loading) => {
        isLoading = loading;
      });

      // Subscribe ke error state
      unsubscribeError = ordersStore.error.subscribe((errorMessage) => {
        if (errorMessage) {
          error = errorMessage;
        }
      });

      // Subscribe ke real-time status
      ordersStore.realtimeStatus.subscribe((status) => {
        realtimeStatus = status;
        console.log("📊 Real-time status updated:", status);

        // Show real-time update indicator
        if (
          status.lastUpdate &&
          status.lastUpdate !== lastRealtimeUpdate.toISOString()
        ) {
          realtimeUpdateReceived = true;
          lastRealtimeUpdate = new Date();
          console.log("🔄 Real-time update detected - refreshing UI");

          // Hide indicator after 3 seconds
          setTimeout(() => {
            realtimeUpdateReceived = false;
          }, 3000);
        }
      });

      // Initialize real-time connection for orders
      await ordersStore.initRealtimeConnection();

      // Load initial orders data
      await loadOrders(1, true); // Initial load dengan loading

      console.log("✅ Admin orders setup complete with real-time integration");
    } catch (err: any) {
      console.error("❌ Failed to setup admin orders:", err);
      error = err.message || "Gagal memuat data orders";
      isLoading = false;
    }
  });

  onDestroy(() => {
    console.log("💀 Admin orders page destroyed");

    // Cleanup subscriptions
    if (unsubscribeOrders) unsubscribeOrders();
    if (unsubscribeLoading) unsubscribeLoading();
    if (unsubscribeError) unsubscribeError();

    // Cleanup real-time connections (handled by ordersStore)
    // Note: ordersStore manages its own cleanup automatically
    console.log("✅ Real-time cleanup handled by ordersStore");
  });

  // Load orders function
  async function loadOrders(page = 1, showLoading = true) {
    try {
      currentPage = page;

      if (showLoading) {
        isLoading = true;
      } else {
        isSyncing = true; // Show subtle sync indicator
      }

      console.log(
        "📡 Loading orders for page:",
        page,
        showLoading ? "(with loading)" : "(silent)"
      );
      await ordersStore.loadOrders({ page, page_size: pageSize });
      console.log("✅ Orders loaded successfully");
    } catch (err: any) {
      console.error("❌ Error loading orders:", err);
      error = err.message || "Gagal memuat orders";
    } finally {
      if (showLoading) {
        isLoading = false;
      } else {
        isSyncing = false;
      }
    }
  }

  // Navigation functions
  function goToCreate() {
    currentView = "create";
    selectedOrder = null;
    editOrderData = null;
    clearMessages();
  }

  function goToList() {
    currentView = "list";
    selectedOrder = null;
    editOrderData = null;
    orderTrackingData = null;
    clearMessages();
  }

  function goToEdit(order: Order) {
    selectedOrder = order;
    editOrderData = {
      customer_name: order.customer_name,
      product_name: order.product_name,
      quantity: order.quantity,
      total_price: order.total_price,
      payment_type: order.payment_type,
      dp_percent: order.dp_percent || "60",
      contact_information: order.contact_information,
      paid_amount: order.paid_amount,
      is_fully_paid: order.is_fully_paid,
    };
    currentView = "edit";
  }

  function goToDetail(order: Order) {
    selectedOrder = order;
    newProductionStatus = order.production_status;
    paymentLinkCopied = false; // Reset copy state
    currentView = "detail";
    // Auto-load tracking data
    handleTrackOrder(order.order_code);
  }

  // Event handlers for OrderList component
  function handleEdit(event: CustomEvent<Order>) {
    goToEdit(event.detail);
  }

  async function handleDelete(event: CustomEvent<string>) {
    const orderId = event.detail;
    const order = orders.find((o) => o.id === orderId);

    if (order) {
      await handleDeleteOrder(orderId, order.order_code);
    }
  }

  function handleCreatePaymentLinkFromList(event: CustomEvent<string>) {
    const orderId = event.detail;
    const order = orders.find((o) => o.id === orderId);

    if (order) {
      goToDetail(order);
    }
  }

  function handleViewDetails(event: CustomEvent<Order>) {
    goToDetail(event.detail);
  }

  function handlePageChange(event: CustomEvent<number>) {
    loadOrders(event.detail, true); // Manual page change dengan loading
  }

  // Event handlers for OrderForm component
  async function handleCreateSuccess(event: CustomEvent<CreateOrderResponse>) {
    const response = event.detail;
    console.log("🎉 Order creation response:", response);

    // Safe access dengan fallback
    const orderCode =
      (response as any)?.order?.order_code ||
      (response as any)?.order_code ||
      "N/A";
    success = `Pesanan berhasil dibuat! Kode pesanan: ${orderCode}`;

    // Auto refresh data dan kembali ke list
    goToList();
    await loadOrders(currentPage, false); // Silent background sync

    // Clear success message setelah 5 detik
    setTimeout(() => {
      success = "";
    }, 5000);
  }

  async function handleEditSuccess(event: CustomEvent<any>) {
    const response = event.detail;
    console.log("✏️ Order edit response:", response);

    // Safe access dengan fallback
    const orderCode = selectedOrder?.order_code || "N/A";
    success = `Pesanan ${orderCode} berhasil diupdate!`;

    // Auto refresh data dan kembali ke list
    goToList();
    await loadOrders(currentPage, false); // Silent background sync

    // Clear success message setelah 3 detik
    setTimeout(() => {
      success = "";
    }, 3000);
  }

  function handleFormError(event: CustomEvent<string>) {
    error = event.detail;
  }

  function handleFormCancel() {
    goToList();
  }

  // Legacy WebSocket functions removed - now handled by ordersStore

  // Notification helper
  function clearMessages() {
    error = "";
    success = "";
    ordersStore.clearError();
  }

  // Email blast management
  async function sendManualEmail(
    orderId: string,
    type: "payment_reminder" | "payment_link"
  ) {
    if (!selectedOrder) return;

    try {
      isLoading = true;

      // Debug info
      console.log("🔧 Email Blast Debug Info:", {
        orderId,
        emailType: type,
        order: {
          code: selectedOrder.order_code,
          customer: selectedOrder.customer_name,
          contact: selectedOrder.contact_information,
          notification_channel: selectedOrder.notification_channel,
          status: selectedOrder.status_order,
        },
      });

      const emailResult = await ordersStore.sendManualEmail(orderId, type);

      // Handle different response scenarios
      if (emailResult.email_sent) {
        success = `✅ Email ${type === "payment_reminder" ? "reminder" : "link"} berhasil dikirim ke ${selectedOrder.contact_information}!`;
        if (
          emailResult.fallback_method &&
          emailResult.fallback_method !== "invoice_endpoint"
        ) {
          success += ` (via ${emailResult.fallback_method})`;
        }
      } else if (emailResult.whatsapp_sent) {
        success = `✅ Notification berhasil dikirim via WhatsApp ke ${selectedOrder.contact_information}!`;
      } else if (
        emailResult.fallback_method === "manual_notification_required"
      ) {
        success = `⚠️ Payment link berhasil dibuat tapi email gagal terkirim.`;

        // Copy payment URL to clipboard for manual sharing
        if (emailResult.payment_url) {
          try {
            await navigator.clipboard.writeText(emailResult.payment_url);
            success += ` Payment link sudah dicopy ke clipboard untuk dibagikan manual.`;
          } catch (clipErr) {
            console.warn("Could not copy to clipboard:", clipErr);
            success += ` Payment link: ${emailResult.payment_url}`;
          }
        }

        // Show additional guidance
        success += ` Silakan bagikan link pembayaran secara manual ke customer.`;
      } else if (emailResult.fallback_method === "payment_recreation") {
        success = `✅ Email berhasil dikirim via payment link recreation fallback!`;
      } else {
        success = `✅ Email ${type === "payment_reminder" ? "reminder" : "link"} berhasil dikirim ke ${selectedOrder.contact_information}!`;
      }

      // Clear success message setelah 8 detik (longer for manual action messages)
      setTimeout(() => {
        success = "";
      }, 8000);
    } catch (err: any) {
      console.error("❌ Error sending email:", err);

      // Enhanced error handling with specific 500 error guidance
      let errorMessage = "Gagal mengirim email";

      if (err.message.includes("404")) {
        errorMessage =
          "❌ Email endpoint tidak ditemukan - backend belum implement endpoint";
      } else if (err.message.includes("500")) {
        errorMessage =
          "❌ Server Error 500 - Backend email endpoint bermasalah. Kemungkinan: 1) Email SMTP config error, 2) Template email belum disetup, 3) Database constraint error. Check backend logs untuk detail.";
      } else if (err.message.includes("400")) {
        errorMessage =
          "❌ Bad Request 400 - Payload tidak sesuai format yang diharapkan backend atau endpoint belum fully implemented.";
      } else if (err.message.includes("403")) {
        errorMessage =
          "❌ Permission denied - Check authentication/authorization";
      } else if (err.message.includes("422")) {
        errorMessage =
          "❌ Validation error - Check payload format atau email address validity";
      } else if (err.message.includes("network")) {
        errorMessage = "❌ Network error - Backend tidak bisa diakses";
      } else {
        errorMessage = err.message || "Gagal mengirim email";
      }

      // Jika ada fallback response, tampilkan info tambahan
      if (err.response?.fallback_method) {
        errorMessage += ` Fallback method: ${err.response.fallback_method}`;
      }

      error = errorMessage;
    } finally {
      isLoading = false;
    }
  }

  // Debug helper untuk testing email blast
  function debugEmailBlast() {
    if (!selectedOrder) {
      console.warn("⚠️ No order selected for debug");
      return;
    }

    console.log("🔧 EMAIL BLAST DEBUG REPORT:");
    console.log("================================");
    console.log("📋 Order Info:", {
      id: selectedOrder.id,
      code: selectedOrder.order_code,
      customer: selectedOrder.customer_name,
      contact: selectedOrder.contact_information,
      notification_channel: selectedOrder.notification_channel,
      status: selectedOrder.status_order,
    });

    console.log("📧 Email Capabilities:", {
      hasEmailChannel: ["email", "both"].includes(
        selectedOrder.notification_channel
      ),
      contactIsEmail: selectedOrder.contact_information.includes("@"),
      canSendEmail:
        ["email", "both"].includes(selectedOrder.notification_channel) &&
        selectedOrder.contact_information.includes("@"),
    });

    console.log("🔗 API Endpoints yang akan dipanggil:");
    console.log(
      `  - Payment Reminder: POST /${selectedOrder.id}/send-payment-reminder/`
    );
    console.log(
      `  - Payment Link: POST /${selectedOrder.id}/send-payment-link/`
    );

    console.log("💡 Troubleshooting Tips:");
    console.log("  1. Pastikan backend mendukung email endpoints");
    console.log("  2. Cek environment variables untuk email configuration");
    console.log("  3. Verifikasi notification_channel order sudah benar");
    console.log("  4. Pastikan contact_information adalah email valid");

    // Test API connection
    api
      .healthCheck()
      .then((health: any) => {
        console.log("🔗 Backend Connection:", health);
      })
      .catch((err: any) => {
        console.error("❌ Backend Connection Failed:", err);
      });
  }

  // Expose debug function to window for testing
  if (typeof window !== "undefined") {
    (window as any).debugEmailBlast = debugEmailBlast;
    console.log(
      "🔧 Email blast debug function exposed: window.debugEmailBlast()"
    );
  }

  // Enhanced debugging untuk email blast troubleshooting
  async function testEmailBlastStep1_Backend() {
    console.log("🧪 STEP 1: Testing Backend Connection...");
    try {
      const health = await api.healthCheck();
      console.log("✅ Backend Health:", health);
      return true;
    } catch (err: any) {
      console.error("❌ Backend Connection Failed:", err);
      error = `Backend tidak bisa diakses: ${err.message}`;
      return false;
    }
  }

  async function testEmailBlastStep2_Endpoints() {
    console.log("🧪 STEP 2: Testing Email Endpoints...");
    if (!selectedOrder) {
      console.error("❌ No order selected");
      return false;
    }

    // Test endpoints sesuai dokumentasi API
    const documentedEndpoints = [
      {
        endpoint: `/${selectedOrder.id}/create-payment-link/`,
        method: "POST",
        payload: {
          payment_type: "dp",
          dp_percent: 60,
          notification_channel: "email",
          test: true,
        },
        description: "Create Payment Link (Order-based)",
      },
      {
        endpoint: `/email-blast/`,
        method: "POST",
        payload: {
          recipients: [selectedOrder.contact_information],
          subject: `Test Payment Reminder - ${selectedOrder.order_code}`,
          message: `Halo ${selectedOrder.customer_name}, ini adalah test email untuk order ${selectedOrder.order_code}. Terima kasih.`,
          template_type: "payment_reminder",
          order_id: selectedOrder.id,
          custom_data: {
            customer_name: selectedOrder.customer_name,
            order_code: selectedOrder.order_code,
            total_price: selectedOrder.total_price,
          },
        },
        description: "General Email Blast (Sesuai Dokumentasi)",
      },
    ];

    console.log("✅ Testing documented API endpoints:");
    for (const test of documentedEndpoints) {
      try {
        console.log(`Testing ${test.description}: ${test.endpoint}`);
        const result = await api.debugEndpoint(
          test.endpoint,
          test.method,
          test.payload
        );
        console.log(`✅ ${test.endpoint}:`, result);
      } catch (err: any) {
        console.error(`❌ ${test.endpoint} failed:`, err);
      }
    }

    // Test invoice-based endpoint (memerlukan invoice_id terlebih dahulu)
    console.log("🔍 Testing invoice-based send payment link:");
    try {
      // Step 1: Create payment link untuk dapat invoice_id
      const paymentResult = await api.debugEndpoint(
        `/${selectedOrder.id}/create-payment-link/`,
        "POST",
        {
          payment_type: "dp",
          dp_percent: 60,
          notification_channel: "email",
        }
      );

      if (paymentResult.details?.data?.invoice?.id) {
        // Step 2: Test send payment link via invoice
        const invoiceId = paymentResult.details.data.invoice.id;
        console.log(
          `Testing invoice send: /invoice/${invoiceId}/send-payment-link/`
        );
        const sendResult = await api.debugEndpoint(
          `/invoice/${invoiceId}/send-payment-link/`,
          "POST",
          {
            channel: "email",
          }
        );
        console.log(`✅ Invoice send result:`, sendResult);
      } else {
        console.warn("⚠️ No invoice_id received from payment link creation");
      }
    } catch (err: any) {
      console.error("❌ Invoice-based test failed:", err);
    }

    return true;
  }

  async function testEmailBlastStep3_OrderData() {
    console.log("🧪 STEP 3: Validating Order Data...");
    if (!selectedOrder) return false;

    const validations = {
      hasEmailChannel: ["email", "both"].includes(
        selectedOrder.notification_channel
      ),
      hasValidEmail: selectedOrder.contact_information.includes("@"),
      hasValidStatus: !["dibatalkan", "lunas"].includes(
        selectedOrder.status_order
      ),
      hasOrderId: !!selectedOrder.id,
      hasOrderCode: !!selectedOrder.order_code,
    };

    console.log("📋 Order Validations:", validations);

    const isValid = Object.values(validations).every((v) => v);

    if (!isValid) {
      const issues = Object.entries(validations)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      error = `Order tidak valid untuk email blast: ${issues.join(", ")}`;
      console.error("❌ Order validation failed:", issues);
      return false;
    }

    console.log("✅ Order validation passed");
    return true;
  }

  async function testEmailBlastStep4_ManualSend() {
    console.log("🧪 STEP 4: Testing Manual Email Send...");
    if (!selectedOrder) return false;

    try {
      // Method 1: Create payment link dengan email notification
      console.log("🔄 Method 1: Create payment link with email notification");
      const paymentLinkResponse = await api.post(
        `/${selectedOrder.id}/create-payment-link/`,
        {
          payment_type: "dp",
          dp_percent: 60,
          notification_channel: "email",
          test_mode: true,
        }
      );

      console.log("✅ Payment link created:", paymentLinkResponse);

      // Method 2: Test invoice-based send (jika ada invoice_id)
      if (paymentLinkResponse.invoice?.id) {
        console.log("🔄 Method 2: Testing invoice-based send payment link");
        try {
          const invoiceId = paymentLinkResponse.invoice.id;
          const sendResponse = await api.post(
            `/invoice/${invoiceId}/send-payment-link/`,
            {
              channel: "email",
            }
          );
          console.log("✅ Invoice-based send successful:", sendResponse);
          success = "✅ Email berhasil dikirim via invoice endpoint!";
          return true;
        } catch (invoiceErr: any) {
          console.warn("⚠️ Invoice-based send failed:", invoiceErr.message);
        }
      }

      // Method 3: Test general email blast
      console.log("🔄 Method 3: Testing general email blast");
      try {
        const emailBlastResponse = await api.post("/email-blast/", {
          recipients: [selectedOrder.contact_information],
          subject: "Test Payment Reminder",
          message: `Halo ${selectedOrder.customer_name}, test email blast untuk order ${selectedOrder.order_code}`,
          template_type: "payment_reminder",
        });
        console.log("✅ Email blast successful:", emailBlastResponse);
        success = "✅ Email berhasil dikirim via email blast endpoint!";
        return true;
      } catch (emailErr: any) {
        console.warn("⚠️ Email blast failed:", emailErr.message);
      }

      // Default success dari payment link creation
      if (
        paymentLinkResponse.email_sent ||
        paymentLinkResponse.notification_sent
      ) {
        success = "✅ Email berhasil dikirim via payment link creation!";
      } else {
        success =
          "⚠️ Payment link dibuat, tapi email notification belum dikonfirmasi.";
      }
      return true;
    } catch (err: any) {
      console.error("❌ All email methods failed:", err);

      // Enhanced error analysis
      if (err.message.includes("404")) {
        error = "❌ Endpoint tidak ditemukan - Check API documentation";
      } else if (err.message.includes("403")) {
        error = "❌ Unauthorized - Check authentication/permissions";
      } else if (err.message.includes("500")) {
        error = "❌ Server Error - Check backend logs dan email configuration";
      } else if (err.message.includes("422")) {
        error = "❌ Validation Error - Check request payload format";
      } else {
        error = `❌ Email send failed: ${err.message}`;
      }
      return false;
    }
  }

  async function runFullEmailTest() {
    console.log("🚀 STARTING FULL EMAIL BLAST DIAGNOSTIC...");
    console.log("=".repeat(50));

    error = "";
    success = "";

    if (!selectedOrder) {
      error = "❌ Pilih order terlebih dahulu untuk test email blast";
      return;
    }

    const step1 = await testEmailBlastStep1_Backend();
    if (!step1) return;

    await testEmailBlastStep2_Endpoints();

    const step3 = await testEmailBlastStep3_OrderData();
    if (!step3) return;

    await testEmailBlastStep4_ManualSend();

    console.log("🎯 DIAGNOSTIC COMPLETE - Check messages above");
  }

  // Quick email blast test dengan real API call
  async function quickEmailTest() {
    if (!selectedOrder) {
      error = "❌ Pilih order terlebih dahulu";
      return;
    }

    try {
      isLoading = true;
      console.log("⚡ Quick Email Test - Real API Call");

      // Step 1: Create payment link dengan email notification
      const paymentResponse = await api.post(
        `/${selectedOrder.id}/create-payment-link/`,
        {
          payment_type: "dp",
          dp_percent: 60,
          notification_channel: selectedOrder.notification_channel,
          test_email: true,
        }
      );

      console.log("✅ Payment link created:", paymentResponse);

      // Step 2: Jika ada invoice_id, coba send via invoice endpoint
      if (paymentResponse.invoice?.id) {
        try {
          console.log("🔄 Trying invoice-based send...");
          const invoiceId = paymentResponse.invoice.id;
          const sendResponse = await api.post(
            `/invoice/${invoiceId}/send-payment-link/`,
            {
              channel:
                selectedOrder.notification_channel === "both"
                  ? "email"
                  : selectedOrder.notification_channel,
            }
          );
          console.log("✅ Invoice send successful:", sendResponse);
          success = `✅ Email berhasil dikirim via invoice endpoint!`;
          return;
        } catch (invoiceErr: any) {
          console.warn("⚠️ Invoice send failed:", invoiceErr.message);
        }
      }

      // Step 3: Fallback ke general email blast
      if (
        selectedOrder.notification_channel === "email" ||
        selectedOrder.notification_channel === "both"
      ) {
        try {
          console.log("🔄 Trying general email blast...");
          const emailResponse = await api.post(`/email-blast/`, {
            recipients: [selectedOrder.contact_information],
            subject: "Payment Link - " + selectedOrder.order_code,
            message: `Halo ${selectedOrder.customer_name}, berikut link pembayaran untuk order ${selectedOrder.order_code}: ${paymentResponse.payment_url || "Link tidak tersedia"}`,
            template_type: "payment_reminder",
          });
          console.log("✅ Email blast successful:", emailResponse);
          success = `✅ Email berhasil dikirim via email blast!`;
          return;
        } catch (emailErr: any) {
          console.warn("⚠️ Email blast failed:", emailErr.message);
        }
      }

      // Default response
      if (paymentResponse.email_sent || paymentResponse.notification_sent) {
        success = `✅ Email notification berhasil dikirim via payment creation!`;
      } else {
        success = `⚠️ Payment link dibuat tapi email status tidak dikonfirmasi. Check backend logs.`;
      }
    } catch (err: any) {
      console.error("❌ Quick test failed:", err);
      error = `❌ Quick test gagal: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  // Network diagnostics
  async function checkNetworkAndAuth() {
    console.log("🌐 Checking Network & Authentication...");

    try {
      // Test basic API call
      const orders = await api.get("/order/", {}, { page: 1, page_size: 1 });
      console.log("✅ API Authentication OK, can access orders");

      // Test base URL
      console.log("🔗 API Base URL:", api.baseUrl);

      // Check if backend supports email endpoints
      const testEndpoints = ["/order/", "/admin/dashboard/stats/"];

      for (const endpoint of testEndpoints) {
        try {
          const result = await api.debugEndpoint(endpoint, "GET");
          console.log(`✅ ${endpoint}:`, result.status);
        } catch (err) {
          console.log(`❌ ${endpoint}:`, err);
        }
      }

      return true;
    } catch (err: any) {
      console.error("❌ Network/Auth check failed:", err);
      error = `Network atau authentication bermasalah: ${err.message}`;
      return false;
    }
  }

  // Expose all test functions to window
  if (typeof window !== "undefined") {
    (window as any).emailBlastDebug = {
      runFullTest: runFullEmailTest,
      quickTest: quickEmailTest,
      checkNetwork: checkNetworkAndAuth,
      step1Backend: testEmailBlastStep1_Backend,
      step2Endpoints: testEmailBlastStep2_Endpoints,
      step3OrderData: testEmailBlastStep3_OrderData,
      step4ManualSend: testEmailBlastStep4_ManualSend,
    };
    console.log("🔧 Email Blast Debug Tools Available:");
    console.log(
      "  window.emailBlastDebug.runFullTest()    - Complete diagnostic"
    );
    console.log(
      "  window.emailBlastDebug.quickTest()       - Quick email test"
    );
    console.log("  window.emailBlastDebug.checkNetwork()    - Network check");
  }
</script>

<svelte:head>
  <title>{pageTitle} - Admin Panel</title>
</svelte:head>

<div class="orders-page">
  <!-- Breadcrumb -->
  <Breadcrumb items={breadcrumbs} />

  <!-- Minimalist Page Header -->
  <div class="page-header">
    <div class="header-main">
      <div class="title-section">
        <h1 class="page-title">{pageTitle}</h1>
        <div
          class="status-pill {realtimeStatus.websocketConnected
            ? 'active'
            : 'inactive'}"
        >
          <div class="status-dot"></div>
          <span class="status-label">
            {realtimeStatus.websocketConnected ? "Live" : "Offline"}
            {#if isSyncing}<span class="sync">⟳</span>{/if}
          </span>
        </div>
      </div>

      <div class="header-actions">
        {#if currentView === "list"}
          <a href="/admin/orders/create" class="btn btn-primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 5v14m-7-7h14" />
            </svg>
            Buat Pesanan
          </a>
        {:else}
          <button class="btn-secondary" on:click={goToList}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
            Kembali
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Notifications -->
  {#if error}
    <div class="notification error" transition:slide>
      <div class="notification-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>{error}</span>
        <button class="notification-close" on:click={clearMessages}>
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  {/if}

  {#if success}
    <div class="notification success" transition:slide>
      <div class="notification-content">
        <i class="fas fa-check-circle"></i>
        <span>{success}</span>
        <button class="notification-close" on:click={clearMessages}>
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="page-content">
    {#if currentView === "list"}
      <!-- Clean Controls -->
      <div class="list-controls">
        <button
          class="toggle-stats"
          on:click={() => (showStats = !showStats)}
          class:active={showStats}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 20V10m-6 10V4m-6 16v-6" />
          </svg>
          {showStats ? "Sembunyikan" : "Statistik"}
        </button>
      </div>

      <!-- Stats Container -->
      {#if showStats}
        <div class="stats-section" transition:slide>
          <OrderStats {orders} {isLoading} />
        </div>
      {/if}

      <!-- Real-time Status Indicator -->
      <div class="realtime-status-bar">
        <div class="status-left">
          <div class="status-indicators">
            <div class="status-item">
              <div
                class="status-dot {realtimeStatus.websocketConnected
                  ? 'connected'
                  : 'disconnected'}"
                title="WebSocket Status"
              ></div>
              <span class="status-text">
                {realtimeStatus.websocketConnected
                  ? "Real-time Connected"
                  : "Disconnected"}
              </span>
            </div>

            {#if realtimeStatus.fallbackMode}
              <div class="status-item">
                <div class="status-dot warning" title="Fallback Mode"></div>
                <span class="status-text">Polling Mode</span>
              </div>
            {/if}
          </div>
        </div>

        <div class="status-right">
          {#if realtimeUpdateReceived}
            <div class="realtime-indicator" transition:slide>
              <i class="fas fa-bolt"></i>
              <span>Real-time update received</span>
            </div>
          {/if}

          {#if isSyncing}
            <div class="sync-indicator">
              <i class="fas fa-sync fa-spin"></i>
              <span>Syncing...</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Order List Component -->
      <OrderList
        {orders}
        {isLoading}
        {currentPage}
        {totalPages}
        {totalCount}
        on:edit={handleEdit}
        on:delete={handleDelete}
        on:createPaymentLink={handleCreatePaymentLinkFromList}
        on:viewDetails={handleViewDetails}
        on:pageChange={handlePageChange}
      />
    {:else if currentView === "create"}
      <!-- Create Order Form -->
      <div class="form-container">
        <div class="form-header">
          <h2>📝 Buat Pesanan Baru</h2>
          <p>Isi form berikut untuk membuat pesanan customer</p>
        </div>

        <OrderForm
          {isLoading}
          on:success={handleCreateSuccess}
          on:error={handleFormError}
          on:cancel={handleFormCancel}
        />
      </div>
    {:else if currentView === "edit" && selectedOrder}
      <!-- Edit Order Form -->
      <div class="form-container">
        <div class="form-header">
          <h2>✏️ Edit Pesanan</h2>
          <p>Edit data pesanan: <strong>{selectedOrder.order_code}</strong></p>
        </div>

        <!-- TODO: Implement proper edit form atau extend OrderForm component -->
        <div class="edit-placeholder">
          <div class="alert info">
            <h3>🚧 Edit Mode</h3>
            <p>Edit mode sedang dalam pengembangan.</p>
            <p>Untuk saat ini, Anda dapat:</p>
            <ul>
              <li>Update status produksi di halaman detail</li>
              <li>Generate payment link baru</li>
              <li>Menghapus dan membuat pesanan baru jika diperlukan</li>
            </ul>
            <div class="edit-actions">
              <button
                class="btn btn-primary"
                on:click={() => selectedOrder && goToDetail(selectedOrder)}
              >
                Lihat Detail
              </button>
              <button class="btn btn-secondary" on:click={goToList}>
                Kembali ke Daftar
              </button>
            </div>
          </div>
        </div>
      </div>
    {:else if currentView === "detail" && selectedOrder}
      <!-- Clean Order Detail -->
      <div class="detail-container">
        <div class="detail-header">
          <div class="detail-header-content">
            <h2>Detail Pesanan</h2>
            <span class="order-code">{selectedOrder.order_code}</span>
          </div>
          <div class="detail-header-actions">
            <div class="status-pills">
              <span
                class="status-pill status-{getStatusClass(
                  selectedOrder.status_order
                )}"
              >
                {getStatusDisplayText(selectedOrder.status_order)}
              </span>
              <span
                class="status-pill production-{getProductionStatusClass(
                  selectedOrder.production_status
                )}"
              >
                {getProductionStatusText(selectedOrder.production_status)}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-content">
          <!-- Information Cards -->
          <div class="info-cards">
            <!-- Customer Info -->
            <div class="info-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <h3>Customer</h3>
              </div>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">Nama</span>
                  <span class="value">{selectedOrder.customer_name}</span>
                </div>
                <div class="info-item">
                  <span class="label">Kontak</span>
                  <span class="value">{selectedOrder.contact_information}</span>
                </div>
                <div class="info-item">
                  <span class="label">Notifikasi</span>
                  <span class="value">
                    <span
                      class="badge badge-{selectedOrder.notification_channel}"
                    >
                      {#if selectedOrder.notification_channel === "whatsapp"}
                        WhatsApp
                      {:else if selectedOrder.notification_channel === "email"}
                        Email
                      {:else}
                        WhatsApp & Email
                      {/if}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Product Info -->
            <div class="info-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 12H3m18 0l-3-3m3 3l-3 3" />
                </svg>
                <h3>Produk</h3>
              </div>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">Nama Produk</span>
                  <span class="value">{selectedOrder.product_name}</span>
                </div>
                <div class="info-item">
                  <span class="label">Quantity</span>
                  <span class="value">{selectedOrder.quantity} pcs</span>
                </div>
                <div class="info-item">
                  <span class="label">Catatan Design</span>
                  <span class="value text-muted">
                    {selectedOrder.design_notes || "Tidak ada catatan"}
                  </span>
                </div>
              </div>
            </div>

            <!-- Payment Info -->
            <div class="info-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                <h3>Pembayaran</h3>
              </div>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">Tipe</span>
                  <span class="value">
                    <span
                      class="badge badge-payment-{selectedOrder.payment_type}"
                    >
                      {selectedOrder.payment_type === "dp"
                        ? "Down Payment"
                        : "Full Payment"}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">Total Harga</span>
                  <span class="value price">
                    Rp {parseInt(selectedOrder.total_price).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">Dibayar</span>
                  <span class="value price">
                    Rp {parseInt(
                      selectedOrder.paid_amount || "0"
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
                {#if selectedOrder.payment_type === "dp" && selectedOrder.dp_percent}
                  <div class="info-item">
                    <span class="label">DP %</span>
                    <span class="value">{selectedOrder.dp_percent}%</span>
                  </div>
                {/if}
                <div class="info-item">
                  <span class="label">Status</span>
                  <span class="value">
                    <span
                      class="badge badge-{selectedOrder.is_fully_paid
                        ? 'success'
                        : 'warning'}"
                    >
                      {selectedOrder.is_fully_paid ? "Lunas" : "Belum Lunas"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Management Sections -->
          <div class="management-sections">
            <!-- Status Update -->
            <div class="management-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                <h3>Update Status Produksi</h3>
              </div>
              <div class="card-content">
                <div class="status-current">
                  <span class="label">Status Saat Ini:</span>
                  <span
                    class="status-badge badge-{getProductionStatusClass(
                      selectedOrder.production_status
                    )}"
                  >
                    {getProductionStatusText(selectedOrder.production_status)}
                  </span>
                </div>
                <div class="status-controls">
                  <select bind:value={newProductionStatus} class="form-select">
                    <option value="menunggu">Menunggu</option>
                    <option value="diproses">Diproses</option>
                    <option value="selesai">Selesai</option>
                  </select>
                  <button
                    class="btn btn-primary"
                    on:click={() =>
                      selectedOrder &&
                      handleUpdateProductionStatus(
                        selectedOrder.id,
                        newProductionStatus
                      )}
                    disabled={isLoading ||
                      newProductionStatus === selectedOrder.production_status}
                  >
                    {isLoading ? "Updating..." : "Update"}
                  </button>
                </div>
                <div class="timestamp">
                  <small
                    >Terakhir diupdate: {formatDate(
                      selectedOrder.updated_at
                    )}</small
                  >
                </div>
              </div>
            </div>

            <!-- Email Blast Management -->
            <div class="management-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <h3>Email Blast</h3>
              </div>
              <div class="card-content">
                <div class="email-info">
                  <div class="email-status">
                    <span class="email-label">Channel:</span>
                    <span
                      class="badge badge-{selectedOrder?.notification_channel}"
                    >
                      {#if selectedOrder?.notification_channel === "email"}
                        📧 Email
                      {:else if selectedOrder?.notification_channel === "whatsapp"}
                        📱 WhatsApp
                      {:else if selectedOrder?.notification_channel === "both"}
                        📧📱 Both
                      {:else}
                        ❓ Unknown
                      {/if}
                    </span>
                  </div>
                  <div class="email-contact">
                    <span class="email-label">Contact:</span>
                    <span class="contact-info"
                      >{selectedOrder?.contact_information || "N/A"}</span
                    >
                  </div>
                </div>

                <div class="email-actions">
                  <button
                    class="btn btn-info btn-sm"
                    on:click={() =>
                      selectedOrder &&
                      sendManualEmail(selectedOrder.id, "payment_reminder")}
                    disabled={isLoading ||
                      !selectedOrder ||
                      !["email", "both"].includes(
                        selectedOrder.notification_channel
                      )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    Send Reminder
                  </button>

                  <button
                    class="btn btn-success btn-sm"
                    on:click={() =>
                      selectedOrder &&
                      sendManualEmail(selectedOrder.id, "payment_link")}
                    disabled={isLoading ||
                      !selectedOrder ||
                      !["email", "both"].includes(
                        selectedOrder.notification_channel
                      )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M22 2L11 13" />
                      <polygon points="22,2 15,22 11,13 2,9" />
                    </svg>
                    Resend Link
                  </button>
                </div>

                {#if selectedOrder && !["email", "both"].includes(selectedOrder.notification_channel)}
                  <div class="email-warning">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                      />
                    </svg>
                    Email not enabled for this order
                  </div>
                {/if}
              </div>
            </div>

            <!-- Payment Link -->
            <div class="management-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                <h3>Generate Payment Link</h3>
              </div>
              <div class="card-content">
                <p class="card-description">
                  Generate link pembayaran untuk customer
                </p>
                <button
                  class="btn btn-success btn-full"
                  class:btn-copied={paymentLinkCopied}
                  on:click={() =>
                    selectedOrder && handleCreatePaymentLink(selectedOrder.id)}
                  disabled={isLoading}
                >
                  {#if isLoading}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="spinner"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating...
                  {:else if paymentLinkCopied}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Copied to Clipboard!
                  {:else}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      />
                    </svg>
                    Generate Payment Link
                  {/if}
                </button>
              </div>
            </div>

            <!-- Email Blast Debug Panel -->
            <div class="management-card debug-panel">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
                <h3>🔧 Email Debug Panel</h3>
              </div>
              <div class="card-content">
                <div class="debug-info">
                  <div class="debug-status">
                    <span class="debug-label">Backend Status:</span>
                    <span class="status-indicator" id="backend-status"
                      >🔄 Testing...</span
                    >
                  </div>
                  <div class="debug-status">
                    <span class="debug-label">Email Endpoints:</span>
                    <span class="status-indicator" id="endpoints-status"
                      >⏳ Not tested</span
                    >
                  </div>
                  <div class="debug-status">
                    <span class="debug-label">Order Validation:</span>
                    <span class="status-indicator" id="order-status"
                      >⏳ Not tested</span
                    >
                  </div>
                </div>

                <div class="debug-actions">
                  <button
                    class="btn btn-info btn-sm"
                    on:click={runFullEmailTest}
                    disabled={isLoading}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M9 12l2 2 4-4" />
                      <path
                        d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1"
                      />
                      <path
                        d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1"
                      />
                    </svg>
                    Run Full Diagnostic
                  </button>

                  <button
                    class="btn btn-warning btn-sm"
                    on:click={quickEmailTest}
                    disabled={isLoading}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Quick Test
                  </button>

                  <button
                    class="btn btn-secondary btn-sm"
                    on:click={checkNetworkAndAuth}
                    disabled={isLoading}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z"
                      />
                      <path d="M13 2.05S16 6 16 12s-3 9.95-3 9.95" />
                      <path d="M11 21.95S8 18 8 12s3-9.95 3-9.95" />
                      <path d="M2 12h20" />
                    </svg>
                    Check Network
                  </button>
                </div>

                <div class="debug-tips">
                  <h4>💡 Troubleshooting Tips:</h4>
                  <ul>
                    <li>
                      Pastikan order punya <code
                        >notification_channel: "email"</code
                      >
                    </li>
                    <li>Check console browser untuk error details</li>
                    <li>
                      Verify backend running di <code
                        >f808-180-254-65-209.ngrok-free.app</code
                      >
                    </li>
                    <li>Pastikan email SMTP configured di backend</li>
                  </ul>
                </div>

                <div class="debug-console">
                  <button
                    class="btn btn-link btn-sm"
                    on:click={() => {
                      console.log("🔧 Available debugging commands:");
                      console.log("window.emailBlastDebug.runFullTest()");
                      console.log("window.emailBlastDebug.quickTest()");
                      console.log("window.emailBlastDebug.checkNetwork()");
                    }}
                  >
                    📋 Show Console Commands
                  </button>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="management-card">
              <div class="card-header">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
                <h3>Quick Actions</h3>
              </div>
              <div class="card-content">
                <div class="action-buttons-grid">
                  <button
                    class="btn btn-secondary btn-sm"
                    on:click={() =>
                      selectedOrder && handleEditOrder(selectedOrder)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                      />
                    </svg>
                    Edit
                  </button>

                  <button
                    class="btn btn-danger btn-sm"
                    on:click={() =>
                      selectedOrder &&
                      handleDeleteOrder(
                        selectedOrder.id,
                        selectedOrder.order_code
                      )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Loading Spinner -->
{#if isLoading}
  <div class="loading-overlay">
    <LoadingSpinner />
  </div>
{/if}

<!-- Custom Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="modal-overlay" on:click={cancelDelete}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Konfirmasi Hapus Pesanan</h3>
        <button class="modal-close" on:click={cancelDelete}>
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="warning-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <p>Apakah Anda yakin ingin menghapus pesanan berikut?</p>
        <div class="order-details">
          <strong>{deleteOrderCode}</strong>
        </div>
        <p class="warning-text">
          <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan. Semua
          data terkait pesanan akan dihapus permanen.
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" on:click={cancelDelete}>
          <i class="fas fa-times"></i>
          Batal
        </button>
        <button class="btn-confirm" on:click={confirmDelete}>
          <i class="fas fa-trash"></i>
          Ya, Hapus
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Minimalist Orders Page */
  .orders-page {
    min-height: 100vh;
    background: #fafafa;
    padding: 1.5rem;
  }

  /* Clean Header */
  .page-header {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  /* Status Pill */
  .status-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status-pill.active {
    background: #dcfce7;
    color: #16a34a;
  }

  .status-pill.inactive {
    background: #fef3c7;
    color: #d97706;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .sync {
    animation: spin 1s linear infinite;
    margin-left: 0.25rem;
  }

  /* Clean Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  /* List Controls */
  .list-controls {
    margin-bottom: 1rem;
  }

  .toggle-stats {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-stats:hover,
  .toggle-stats.active {
    background: #f9fafb;
    color: #374151;
    border-color: #d1d5db;
  }

  /* Stats Section */
  .stats-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Spinner Animation */
  .spinner {
    animation: spin 1s linear infinite;
  }

  /* Clean Notifications */
  .notification {
    margin-bottom: 1rem;
    border-radius: 8px;
    padding: 0.875rem 1rem;
    border-left: 3px solid;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .notification.error {
    background: #fef2f2;
    border-left-color: #ef4444;
    color: #991b1b;
  }

  .notification.success {
    background: #f0fdf4;
    border-left-color: #22c55e;
    color: #166534;
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .notification-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  /* Form Container */
  .form-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .form-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .form-header p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
  }

  /* Detail Container */
  .detail-container {
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  /* Detail Header */
  .detail-header {
    background: #f9fafb;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-header-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .order-code {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
  }

  .detail-header-actions {
    display: flex;
    align-items: center;
  }

  .detail-header-actions .status-pills {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .status-pill {
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
  }

  .status-pill.status-info {
    background: #dbeafe;
    color: #1e40af;
  }
  .status-pill.status-success {
    background: #dcfce7;
    color: #166534;
  }
  .status-pill.status-warning {
    background: #fef3c7;
    color: #92400e;
  }
  .status-pill.status-danger {
    background: #fef2f2;
    color: #dc2626;
  }
  .status-pill.production-info {
    background: #e0e7ff;
    color: #3730a3;
  }
  .status-pill.production-success {
    background: #d1fae5;
    color: #065f46;
  }
  .status-pill.production-warning {
    background: #fef3c7;
    color: #92400e;
  }

  .detail-content {
    padding: 1.5rem;
  }

  /* Info Cards Layout */
  .info-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .info-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: #374151;
  }

  .card-header h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.375rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item .label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .info-item .value {
    font-weight: 600;
    color: #111827;
    text-align: right;
    font-size: 0.875rem;
  }

  .info-item .value.price {
    font-weight: 600;
    color: #059669;
  }

  .info-item .value.text-muted {
    color: #9ca3af;
    font-weight: 400;
  }

  /* Clean Badges */
  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .badge-whatsapp {
    background: #dcfce7;
    color: #166534;
  }
  .badge-email {
    background: #dbeafe;
    color: #1e40af;
  }
  .badge-both {
    background: #f3e8ff;
    color: #7c3aed;
  }
  .badge-success {
    background: #dcfce7;
    color: #166534;
  }
  .badge-warning {
    background: #fef3c7;
    color: #92400e;
  }
  .badge-payment-dp {
    background: #dbeafe;
    color: #1e40af;
  }
  .badge-payment-full {
    background: #dcfce7;
    color: #166534;
  }

  /* Management Sections */
  .management-sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .management-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }

  .management-card .card-content {
    gap: 0.75rem;
  }

  .status-current {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .status-current .label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .badge-info {
    background: #dbeafe;
    color: #1e40af;
  }
  .badge-primary {
    background: #eff6ff;
    color: #1d4ed8;
  }
  .badge-danger {
    background: #fef2f2;
    color: #dc2626;
  }

  .status-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .status-controls .form-select {
    flex: 1;
    min-width: 120px;
  }

  .timestamp {
    margin-top: 0.5rem;
  }

  .timestamp small {
    color: #9ca3af;
    font-size: 0.75rem;
  }

  .payment-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .dp-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .dp-input input {
    width: 80px;
    margin-bottom: 0;
  }

  .input-suffix {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .action-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  /* Payment Management */
  .payment-management {
    margin-bottom: 1.5rem;
  }

  .payment-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-card {
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .action-header h4 {
    margin: 0 0 0.25rem 0;
    color: #111827;
    font-size: 1rem;
    font-weight: 600;
  }

  .action-header p {
    margin: 0 0 0.75rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .payment-options {
    margin-bottom: 0.75rem;
  }

  .payment-options label {
    display: block;
    margin-bottom: 0.375rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-select,
  .form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    background: white;
  }

  .dp-percent-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .dp-percent-control input {
    width: 80px;
    margin-bottom: 0;
  }

  /* Clean Buttons */
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
    transform: translateY(-1px);
  }

  .btn-success {
    background: #059669;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background: #047857;
    transform: translateY(-1px);
  }

  .btn-info {
    background: #3b82f6;
    color: white;
  }

  .btn-info:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-info:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
    transform: translateY(-1px);
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  /* Button Full Width */
  .btn-full {
    width: 100%;
    justify-content: center;
  }

  /* Button Copied State */
  .btn-copied {
    background: #059669 !important;
    animation: successPulse 0.6s ease-in-out;
  }

  @keyframes successPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Card Description */
  .card-description {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  /* Edit Placeholder */
  .edit-placeholder {
    padding: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .alert {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .alert.info {
    border-left: 4px solid #3b82f6;
  }

  .alert h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  .alert p {
    color: #6b7280;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .alert ul {
    text-align: left;
    color: #6b7280;
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  .alert li {
    margin-bottom: 0.5rem;
  }

  .edit-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }

  /* Loading Overlay */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  /* Delete Confirmation Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    animation: modalSlideIn 0.3s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: #6b7280;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
    text-align: center;
  }

  .warning-icon {
    margin-bottom: 1rem;
  }

  .warning-icon i {
    font-size: 3rem;
    color: #f59e0b;
  }

  .modal-body p {
    margin: 0 0 1rem 0;
    color: #374151;
    line-height: 1.5;
  }

  .order-details {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    font-family: "Courier New", monospace;
    font-size: 1.1rem;
    color: #1f2937;
  }

  .warning-text {
    font-size: 0.875rem;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.75rem;
    margin-top: 1rem;
  }

  .modal-actions {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-confirm {
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
  }

  .btn-cancel {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-cancel:hover {
    background: #e5e7eb;
  }

  .btn-confirm {
    background: #dc2626;
    color: white;
  }

  .btn-confirm:hover {
    background: #b91c1c;
    transform: translateY(-1px);
  }

  /* Real-time Status Bar */
  .realtime-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .status-left {
    display: flex;
    align-items: center;
  }

  .status-indicators {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .status-dot.connected {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    animation: pulse 2s infinite;
  }

  .status-dot.disconnected {
    background: #ef4444;
  }

  .status-dot.warning {
    background: #f59e0b;
  }

  .status-text {
    color: #6b7280;
    font-weight: 500;
  }

  .status-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .realtime-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #10b981;
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    animation: slideInRight 0.3s ease-out;
  }

  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.75rem;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .order-list-placeholder {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .orders-page {
      padding: 1rem;
    }

    .info-cards,
    .management-sections,
    .timeline-summary-section {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .detail-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .detail-header-actions .status-pills {
      margin-top: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .orders-page {
      padding: 0.75rem;
    }

    .page-header,
    .form-container,
    .detail-container,
    .stats-section {
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .header-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .detail-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .detail-header-actions .status-pills {
      align-self: flex-start;
      justify-content: flex-start;
      flex-wrap: wrap;
    }

    .title-section {
      width: 100%;
      justify-content: space-between;
    }

    .page-title {
      font-size: 1.25rem;
    }

    .status-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .action-buttons-grid {
      grid-template-columns: 1fr;
    }

    .realtime-status-bar {
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .status-right {
      width: 100%;
      justify-content: flex-end;
    }
  }

  @media (max-width: 480px) {
    .orders-page {
      padding: 0.5rem;
    }

    .page-header,
    .form-container,
    .detail-container {
      padding: 1rem;
    }

    .info-cards {
      gap: 0.75rem;
    }

    .info-card,
    .management-card,
    .timeline-card,
    .summary-card {
      padding: 0.75rem;
    }

    .detail-header-actions .status-pills {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .modal-content {
      margin: 1rem;
      width: calc(100% - 2rem);
    }

    .modal-actions {
      flex-direction: column;
    }

    .btn-cancel,
    .btn-confirm {
      justify-content: center;
    }

    .realtime-status-bar {
      padding: 0.5rem;
      font-size: 0.75rem;
    }

    .status-indicators {
      gap: 0.75rem;
    }

    .status-item {
      font-size: 0.75rem;
    }
  }

  /* Debug Panel Styles */
  .debug-panel {
    border: 2px dashed #e5e7eb;
    background: #fafafa;
  }

  .debug-panel .card-header {
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .debug-info {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .debug-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0;
  }

  .debug-status:last-child {
    margin-bottom: 0;
  }

  .debug-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .status-indicator {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    background: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    font-family: monospace;
  }

  .debug-actions {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .debug-tips {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #fffbeb;
    border: 1px solid #fed7aa;
    border-radius: 6px;
  }

  .debug-tips h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #92400e;
  }

  .debug-tips ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.75rem;
    color: #92400e;
  }

  .debug-tips li {
    margin-bottom: 0.25rem;
  }

  .debug-tips code {
    background: #fef3c7;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.6875rem;
  }

  .debug-console {
    text-align: center;
  }

  /* Additional Button Variants */
  .btn-warning {
    background: #f59e0b;
    color: white;
  }

  .btn-warning:hover:not(:disabled) {
    background: #d97706;
  }

  .btn-warning:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .btn-link {
    background: transparent;
    color: #6b7280;
    border: 1px solid transparent;
    text-decoration: underline;
  }

  .btn-link:hover:not(:disabled) {
    color: #374151;
    background: #f3f4f6;
    text-decoration: none;
  }

  /* Responsive Design */
</style>
