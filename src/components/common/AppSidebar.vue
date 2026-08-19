<template>
  <aside class="app-sidebar">
    <div class="app-sidebar-header">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.15); margin-bottom: 6px;">
        <i class="pi pi-id-card" style="font-size: 1.25rem; color: #a5d6a7;"></i>
      </div>
      <h1>HỒ SƠ CÁN BỘ</h1>
      <p>Version 3.0 Enterprise</p>
    </div>

    <nav class="app-sidebar-nav">
      <router-link to="/personnel" class="app-nav-item">
        <i class="pi pi-users"></i>
        <span>Quản lý Cán bộ</span>
      </router-link>

      <div class="app-nav-heading">Báo cáo Phụ lục</div>

      <router-link to="/dashboard" class="app-nav-item">
        <i class="pi pi-chart-pie"></i>
        <span>Dashboard Thống kê</span>
      </router-link>

      <router-link to="/pl1" class="app-nav-item">
        <i class="pi pi-globe"></i>
        <span>PL1: Đi nước ngoài</span>
      </router-link>

      <router-link to="/pl2" class="app-nav-item">
        <i class="pi pi-heart"></i>
        <span>PL2: Thân nhân NN</span>
      </router-link>

      <router-link to="/pl3" class="app-nav-item">
        <i class="pi pi-exclamation-triangle"></i>
        <span>PL3: Lịch sử & Lưu ý</span>
      </router-link>

      <template v-if="authStore.isAdmin">
        <div class="app-nav-heading">Hệ thống</div>

        <router-link to="/users" class="app-nav-item">
          <i class="pi pi-user-plus"></i>
          <span>Quản lý Người dùng</span>
        </router-link>

        <router-link to="/audit" class="app-nav-item">
          <i class="pi pi-history"></i>
          <span>Nhật ký Hệ thống</span>
        </router-link>

        <router-link to="/settings-import" class="app-nav-item">
          <i class="pi pi-cog"></i>
          <span>Cấu hình Cột Import</span>
        </router-link>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
