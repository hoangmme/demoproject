<template>
  <div
    class="login-wrapper"
    :style="{ backgroundImage: customLoginBg ? `url(${customLoginBg})` : 'url(/login-bg.jpg)' }"
  >
    <div class="app-card login-card-grid">
      <!-- CỘT TRÁI: LOGO & ĐƠN VỊ CHỦ QUẢN -->
      <div class="login-left-col">
        <img
          src="/bo-cong-an-logo.png"
          alt="Bộ Công An"
          class="login-logo"
        />
        <div class="agency-title-main">
          CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
        </div>
        <div class="agency-title-sub">
          PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
        </div>
      </div>

      <!-- ĐƯỜNG PHÂN CÁCH -->
      <div class="login-divider"></div>

      <!-- CỘT PHẢI: TIÊU ĐỀ HỆ THỐNG & FORM ĐĂNG NHẬP -->
      <div class="login-right-col">
        <div class="software-header">
          <div class="software-title-main">
            DỮ LIỆU QUẢN LÝ CÁN BỘ, ĐẢNG VIÊN
          </div>
          <div class="software-title-sub">
            VÀ THÂN NHÂN CÓ YẾU TỐ NƯỚC NGOÀI
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field-item">
            <label class="field-label">Tài khoản</label>
            <InputText v-model="email" placeholder="admin" size="small" autofocus style="width: 100%;" />
          </div>

          <div class="field-item">
            <label class="field-label">Mật khẩu</label>
            <InputText v-model="password" type="password" placeholder="••••••••" size="small" style="width: 100%;" />
          </div>

          <Button
            label="Đăng nhập hệ thống"
            icon="pi pi-sign-in"
            severity="success"
            type="submit"
            :loading="loading"
            class="btn-submit-login"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth';
import { getAppSettings } from '@/api/settings';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const customLoginBg = ref('');

onMounted(async () => {
  const cached = localStorage.getItem('custom_login_bg');
  if (cached) customLoginBg.value = cached;
  try {
    const bgData = await getAppSettings('custom_login_bg', null);
    if (bgData) {
      customLoginBg.value = bgData;
      localStorage.setItem('custom_login_bg', bgData);
    }
  } catch (e) {
    // fallback to /login-bg.jpg
  }
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    alert('Vui lòng nhập Email và Mật khẩu!');
    return;
  }
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push('/dashboard');
  } catch (e) {
    alert('Đăng nhập không thành công: ' + (e.response?.data?.errors?.[0]?.message || e.message || 'Sai thông tin'));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #0f172a;
  background-repeat: no-repeat;
  background-position: center center;
  background-attachment: fixed;
  background-size: cover;
  padding: 2rem 1.5rem;
  transition: background-image 0.3s ease;
}

/* iOS Glassmorphic Card Container */
.login-card-grid {
  width: 100%;
  max-width: 920px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(28px) saturate(200%);
  -webkit-backdrop-filter: blur(28px) saturate(200%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.9);
  display: grid;
  grid-template-columns: 360px 1px 1fr;
  padding: 0;
  overflow: hidden;
}

/* Left Column: Frosted Glass Tint */
.login-left-col {
  padding: 2.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.login-logo {
  width: 115px;
  height: 115px;
  object-fit: contain;
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.2));
}

.agency-title-main {
  font-size: 0.95rem;
  font-weight: 800;
  color: #dc2626;
  text-transform: uppercase;
  line-height: 1.35;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.agency-title-sub {
  font-size: 0.9rem;
  font-weight: 800;
  color: #dc2626;
  text-transform: uppercase;
  margin-top: 4px;
  line-height: 1.35;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.login-divider {
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.8) 20%, rgba(255, 255, 255, 0.8) 80%, transparent);
}

/* Right Column: Software Header & Frosted Form */
.login-right-col {
  padding: 2.75rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.software-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.software-title-main,
.software-title-sub {
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
  text-transform: uppercase;
  line-height: 1.35;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

.software-title-sub {
  margin-top: 3px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  display: block;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
}

.login-form :deep(.p-inputtext) {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.9) !important;
  border-radius: 10px !important;
  font-size: 0.88rem !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  padding: 0.65rem 0.9rem !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s ease !important;
}

.login-form :deep(.p-inputtext:focus) {
  background: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.25) !important;
}

.btn-submit-login {
  margin-top: 10px !important;
  font-weight: 700 !important;
  padding: 0.72rem 1.2rem !important;
  font-size: 0.95rem !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, #15803d 0%, #16a34a 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.5) !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.btn-submit-login:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 10px 28px rgba(22, 163, 74, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6) !important;
}

@media (max-width: 860px) {
  .login-card-grid {
    grid-template-columns: 1fr;
    max-width: 480px;
    border-radius: 20px;
  }
  
  .login-divider {
    height: 1px;
    width: 100%;
    background: rgba(255, 255, 255, 0.6);
  }
  
  .login-left-col {
    padding: 2rem 1.5rem 1.5rem 1.5rem;
  }
  
  .login-right-col {
    padding: 1.5rem 1.5rem 2rem 1.5rem;
  }
  
  .software-header {
    text-align: center;
  }
  
  .software-title-main,
  .software-title-sub {
    font-size: 1.1rem;
  }
  
  .agency-title-main,
  .agency-title-sub {
    white-space: normal;
  }
}
</style>
