import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Đăng nhập' },
  },
  {
    path: '/personnel',
    name: 'Personnel',
    component: () => import('@/views/PersonnelView.vue'),
    meta: { title: 'Quản lý Cán bộ', requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard Thống kê', requiresAuth: true },
  },
  {
    path: '/pl1',
    name: 'Appendix1',
    component: () => import('@/views/Appendix1View.vue'),
    meta: { title: 'Phụ lục 1: Đi nước ngoài', requiresAuth: true },
  },
  {
    path: '/pl2',
    name: 'Appendix2',
    component: () => import('@/views/Appendix2View.vue'),
    meta: { title: 'Phụ lục 2: Thân nhân nước ngoài', requiresAuth: true },
  },
  {
    path: '/pl3',
    name: 'Appendix3',
    component: () => import('@/views/Appendix3View.vue'),
    meta: { title: 'Phụ lục 3: Lưu ý & Kỷ luật', requiresAuth: true },
  },
  {
    path: '/settings-import',
    name: 'SettingsImport',
    component: () => import('@/views/SettingsImportView.vue'),
    meta: { title: 'Cấu hình Mẫu Cột Import', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('@/views/UserManagementView.vue'),
    meta: { title: 'Quản lý Người dùng', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/audit',
    name: 'AuditLog',
    component: () => import('@/views/AuditLogView.vue'),
    meta: { title: 'Nhật ký Hệ thống', requiresAuth: true, adminOnly: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta?.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login' });
  } else if (to.meta?.adminOnly && !authStore.isAdmin) {
    next({ name: 'Personnel' });
  } else {
    next();
  }
});

export default router;
