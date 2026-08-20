<template>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: url('/bg-login.png') no-repeat center center fixed; background-size: cover; padding: 1.5rem;">
    <div class="app-card" style="width: 100%; max-width: 440px; padding: 2.25rem 2rem; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <img
          src="/bo-cong-an-logo.png"
          alt="Bộ Công An"
          style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"
        />
        <div style="font-size: 0.95rem; font-weight: 800; color: #dc2626; text-transform: uppercase; line-height: 1.3; white-space: nowrap;">
          CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
        </div>
        <div style="font-size: 0.85rem; font-weight: 700; color: #991b1b; margin-top: 4px; line-height: 1.3; white-space: nowrap;">
          PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
        </div>
        <div style="font-size: 0.8rem; font-weight: 600; color: #475569; margin-top: 10px; line-height: 1.4;">
          <div>Dữ liệu quản lý cán bộ, đảng viên</div>
          <div style="margin-top: 2px;">và thân nhân có yếu tố nước ngoài</div>
        </div>
      </div>

      <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="field-item">
          <label class="field-label">Email tài khoản</label>
          <InputText v-model="email" placeholder="admin@demo.com" size="small" autofocus />
        </div>

        <div class="field-item">
          <label class="field-label">Mật khẩu</label>
          <InputText v-model="password" type="password" placeholder="••••••••" size="small" />
        </div>

        <Button
          label="Đăng nhập Hệ thống"
          icon="pi pi-sign-in"
          severity="success"
          type="submit"
          :loading="loading"
          style="margin-top: 8px;"
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
