<template>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f4f6f8; padding: 1rem;">
    <div class="app-card" style="width: 100%; max-width: 400px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #2e7d32; color: #ffffff; margin-bottom: 8px;">
          <i class="pi pi-id-card" style="font-size: 1.5rem;"></i>
        </div>
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #1f2937;">HỒ SƠ CÁN BỘ</h2>
        <p style="font-size: 0.8rem; color: #6b7280; margin-top: 4px;">Đăng nhập để truy cập hệ thống quản trị</p>
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
