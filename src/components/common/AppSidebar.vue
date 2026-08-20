<template>
  <aside class="app-sidebar">
    <div class="app-sidebar-header" style="padding: 1.15rem 0.5rem; text-align: center;">
      <img
        src="/bo-cong-an-logo.png"
        alt="Bộ Công An"
        style="width: 85px; height: 85px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"
      />
      <div style="font-size: 0.8rem; font-weight: 800; color: #ffffff; text-transform: uppercase; line-height: 1.3; white-space: nowrap;">
        CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
      </div>
      <div style="font-size: 0.72rem; font-weight: 700; color: #fde047; margin-top: 4px; line-height: 1.3; white-space: nowrap;">
        PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ
      </div>
      <p style="font-size: 0.65rem; color: #dcfce7; margin: 6px 0 0 0; line-height: 1.3; opacity: 0.9; padding: 0 4px;">
        Dữ liệu quản lý cán bộ, đảng viên và thân nhân có yếu tố nước ngoài
      </p>
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
