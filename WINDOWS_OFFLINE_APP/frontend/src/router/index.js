import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Eagerly import all views for 0ms instantaneous route transitions
import LoginView from '@/views/LoginView.vue';
import PersonnelView from '@/views/PersonnelView.vue';
import ChildDashboardView from '@/views/ChildDashboardView.vue';
import DashboardView from '@/views/DashboardView.vue';
import SettingsImportView from '@/views/SettingsImportView.vue';
import UserManagementView from '@/views/UserManagementView.vue';
import AuditLogView from '@/views/AuditLogView.vue';
import AdvancedSearchView from '@/views/AdvancedSearchView.vue';
import TableHelperView from '@/views/TableHelperView.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/bang-tuy-chinh',
    name: 'TableHelper',
    component: TableHelperView,
    meta: { title: 'Công cụ Nhập Bảng & List Dữ liệu' },
  },
  {
    path: '/advanced-search',
    name: 'AdvancedSearch',
    component: AdvancedSearchView,
    meta: { title: 'Tìm kiếm nâng cao', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Đăng nhập' },
  },
  {
    path: '/personnel',
    name: 'Personnel',
    component: PersonnelView,
    meta: { title: 'Quản lý Cán bộ', requiresAuth: true },
  },
  {
    path: '/trips',
    name: 'Trips',
    component: ChildDashboardView,
    meta: { title: 'Chuyên đề', requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { title: 'Thống kê', requiresAuth: true },
  },
  {
    path: '/pl1',
    redirect: '/dashboard',
  },
  {
    path: '/pl2',
    redirect: '/dashboard',
  },
  {
    path: '/pl3',
    redirect: '/dashboard',
  },
  {
    path: '/appendix/:id',
    redirect: (to) => `/dashboard-topic/${to.params.id}`,
  },
  {
    path: '/dashboard-topic/:id',
    name: 'DynamicTopicDashboard',
    component: ChildDashboardView,
    meta: { title: 'Chuyên đề', requiresAuth: true },
  },
  {
    path: '/settings-import',
    name: 'SettingsImport',
    component: SettingsImportView,
    meta: { title: 'Cấu hình Mẫu Cột Import', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: UserManagementView,
    meta: { title: 'Quản lý Người dùng', requiresAuth: true, adminOnly: true },
  },
  {
    path: '/audit',
    name: 'AuditLog',
    component: AuditLogView,
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
