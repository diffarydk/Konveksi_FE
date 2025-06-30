<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { login } from "$lib/services/auth";
  import { fadeIn, fadeOut } from "$lib/utils/animations";

  let username = "";
  let password = "";
  let loading = false;
  let showPassword = false;

  // Alert state
  let showAlert = false;
  let alertType: "success" | "error" = "error";
  let alertMessage = "";

  // Animate alert
  function displayAlert(message: string, type: "success" | "error" = "error") {
    alertMessage = message;
    alertType = type;
    showAlert = true;

    // Auto hide after 5 seconds
    setTimeout(() => {
      showAlert = false;
    }, 5000);
  }

  // Toggle password visibility
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  // Handle form submission
  async function handleSubmit() {
    if (!username || !password) {
      displayAlert("Mohon isi username dan password");
      return;
    }

    loading = true;

    try {
      const response = await login(username, password);

      if (response.access) {
        displayAlert("Login berhasil! Mengalihkan...", "success");

        // Update auth store with user data
        auth.set({
          isAuthenticated: true,
          user: response.user,
          accessToken: response.access,
        });

        // Redirect to admin dashboard after short delay
        setTimeout(() => {
          goto("/admin");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle different error scenarios
      if (error.status === 401) {
        displayAlert("Username atau password salah!");
      } else if (error.data?.non_field_errors) {
        displayAlert(error.data.non_field_errors[0]);
      } else {
        displayAlert("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login Admin - Hay Hill Clothing</title>
</svelte:head>

<div class="login-page">
  <div class="login-container" in:fadeIn={{ duration: 500, y: 20 }}>
    <div class="login-header">
      <div class="login-logo">
        <span class="logo-primary">Hay Hill</span>
        <span class="logo-secondary">Clothing</span>
      </div>
      <h1 class="login-title">Login Admin</h1>
      <p class="login-subtitle">Masuk ke panel administrasi</p>
    </div>

    {#if showAlert}
      <div
        class="alert"
        class:alert-error={alertType === "error"}
        class:alert-success={alertType === "success"}
        transition:fadeIn|fadeOut={{ duration: 300 }}
      >
        <i
          class="fas {alertType === 'error'
            ? 'fa-exclamation-circle'
            : 'fa-check-circle'}"
        ></i>
        <span>{alertMessage}</span>
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="username" class="form-label">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          class="form-control"
          required
          placeholder="Masukkan username"
          autocomplete="username"
        />
      </div>

      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <div class="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            bind:value={password}
            class="form-control"
            required
            placeholder="Masukkan password"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="password-toggle"
            on:click={togglePasswordVisibility}
          >
            <i class="fas {showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
          </button>
        </div>
      </div>

      <button type="submit" class="btn" disabled={loading}>
        <span>Login</span>
        {#if loading}
          <div class="loader"></div>
        {/if}
      </button>
    </form>

    <div class="back-link">
      <a href="/">
        <i class="fas fa-arrow-left"></i>
        Kembali ke Beranda
      </a>
    </div>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
    padding: 1.5rem;
  }

  .login-container {
    background: var(--white);
    padding: 2.5rem;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 450px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .login-logo {
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .logo-primary {
    color: var(--primary);
  }

  .logo-secondary {
    color: var(--secondary);
  }

  .login-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
  }

  .login-subtitle {
    color: var(--text-light);
    font-size: 1rem;
  }

  .alert {
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .alert-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .alert-success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .alert i {
    font-size: 1.25rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-dark);
  }

  .form-control {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .password-field {
    position: relative;
  }

  .password-toggle {
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    font-size: 1rem;
  }

  .btn {
    width: 100%;
    padding: 1rem;
    background: var(--primary);
    color: var(--white);
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .loader {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .back-link {
    text-align: center;
    margin-top: 1.5rem;
  }

  .back-link a {
    color: var(--primary);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .back-link a:hover {
    color: var(--primary-dark);
  }
</style>
