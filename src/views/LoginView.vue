<template>
  <div class="login-wrapper">
    <div class="app-card login-card">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <img
          src="/bo-cong-an-logo.png"
          alt="Bộ Công An"
          style="width: 110px; height: 110px; object-fit: contain; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));"
        />
        <div style="font-size: 1.25rem; font-weight: 800; color: #dc2626; text-transform: uppercase; line-height: 1.3; letter-spacing: -0.01em;">
          CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
        </div>
        <div style="font-size: 1.1rem; font-weight: 800; color: #dc2626; text-transform: uppercase; margin-top: 4px; line-height: 1.3; letter-spacing: -0.01em;">
          PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
        </div>
        <div style="font-size: 1.05rem; font-weight: 700; color: #000000; margin-top: 14px; line-height: 1.45;">
          <div>Dữ liệu quản lý cán bộ, đảng viên</div>
          <div style="margin-top: 2px;">và thân nhân có yếu tố nước ngoài</div>
        </div>
      </div>

      <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 1.1rem;">
        <div class="field-item">
          <label class="field-label" style="font-weight: 600; color: #334155;">Tên tài khoản hoặc Email</label>
          <InputText v-model="email" placeholder="admin hoặc admin@demo.com" size="small" autofocus style="width: 100%;" />
        </div>

        <div class="field-item">
          <label class="field-label" style="font-weight: 600; color: #334155;">Mật khẩu</label>
          <InputText v-model="password" type="password" placeholder="••••••••" size="small" style="width: 100%;" />
        </div>

        <Button
          label="Đăng nhập Hệ thống"
          icon="pi pi-sign-in"
          severity="success"
          type="submit"
          :loading="loading"
          style="margin-top: 10px; font-weight: 700; padding: 0.65rem 1rem;"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    alert('Vui lòng nhập Email và Mật khẩu!');
    return;
  }
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push('/personnel');
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
  justify-content: flex-end;
  min-height: 100vh;
  background: url('/login-bg.jpeg') no-repeat center center fixed;
  background-size: cover;
  padding: 2rem 8% 2rem 2rem;
}

.login-card {
  width: 100%;
  max-width: 480px;
  padding: 2.5rem 2.25rem;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
}

@media (max-width: 900px) {
  .login-wrapper {
    justify-content: center;
    padding: 1.5rem;
  }
  
  .login-card {
    padding: 2rem 1.5rem;
  }
}
</style>
