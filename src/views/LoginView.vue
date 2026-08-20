<template>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f4f6f8; padding: 1rem;">
    <div class="app-card" style="width: 100%; max-width: 400px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <img
          src="/bo-cong-an-logo.png"
          alt="Bộ Công An"
          style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"
        />
        <div style="font-size: 0.95rem; font-weight: 800; color: #dc2626; text-transform: uppercase; line-height: 1.3; letter-spacing: 0.02em;">
          CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
        </div>
        <div style="font-size: 0.85rem; font-weight: 700; color: #991b1b; margin-top: 3px; line-height: 1.3;">
          PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
        </div>
        <p style="font-size: 0.78rem; color: #475569; margin-top: 8px; line-height: 1.35;">
          Dữ liệu quản lý cán bộ, đảng viên và thân nhân có yếu tố nước ngoài
        </p>
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
