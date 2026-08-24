import apiClient from './client';
import { getAppSettings, saveAppSettings } from './settings';

const DEFAULT_USERS_DATA = [
  {
    id: 'usr_admin',
    first_name: 'Quản trị viên Hệ thống',
    email: 'admin@demo.com',
    role: { id: 'admin', name: 'Admin' },
    status: 'active',
    description: 'Tài khoản Quản trị toàn quyền hệ thống',
  },
  {
    id: 'usr_editor',
    first_name: 'Cán bộ Phụ trách Hồ sơ',
    email: 'editor@demo.com',
    role: { id: 'editor', name: 'Biên tập viên' },
    status: 'active',
    description: 'Quản lý theo dõi hồ sơ xuất nhập cảnh',
  },
  {
    id: 'usr_viewer',
    first_name: 'Cán bộ Tra cứu',
    email: 'viewer@demo.com',
    role: { id: 'viewer', name: 'Người xem' },
    status: 'active',
    description: 'Chỉ có quyền tra cứu và xem báo cáo',
  },
];

export const getUsers = async () => {
  try {
    const res = await apiClient.get('/users', {
      params: { fields: ['id', 'first_name', 'last_name', 'email', 'role.id', 'role.name', 'status', 'description'] },
    });
    if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (e) {
    // 403 Forbidden or Directus restriction -> fallback
  }

  try {
    const custom = await getAppSettings('custom_system_users', null);
    if (custom && Array.isArray(custom) && custom.length > 0) {
      return custom;
    }
  } catch (e) {}

  const local = localStorage.getItem('custom_system_users');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return DEFAULT_USERS_DATA;
};

export const getRoles = async () => {
  try {
    const res = await apiClient.get('/roles');
    if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (e) {}
  return [
    { id: 'admin', name: 'Admin' },
    { id: 'editor', name: 'Biên tập viên' },
    { id: 'viewer', name: 'Người xem' },
  ];
};

export const createUser = async (userData) => {
  try {
    const res = await apiClient.post('/users', userData);
    if (res.data?.data) return res.data.data;
  } catch (e) {}

  const currentUsers = await getUsers();
  const newUser = {
    ...userData,
    id: userData.id || 'usr_' + Date.now(),
    status: userData.status || 'active',
  };
  const updated = [newUser, ...currentUsers.filter((u) => u.id !== newUser.id)];
  localStorage.setItem('custom_system_users', JSON.stringify(updated));
  try {
    await saveAppSettings('custom_system_users', updated);
  } catch (e) {}
  return newUser;
};

export const updateUser = async (id, userData) => {
  try {
    const res = await apiClient.patch(`/users/${id}`, userData);
    if (res.data?.data) return res.data.data;
  } catch (e) {}

  const currentUsers = await getUsers();
  const idx = currentUsers.findIndex((u) => u.id === id);
  if (idx !== -1) {
    currentUsers[idx] = { ...currentUsers[idx], ...userData };
    localStorage.setItem('custom_system_users', JSON.stringify(currentUsers));
    try {
      await saveAppSettings('custom_system_users', currentUsers);
    } catch (e) {}
    return currentUsers[idx];
  }
  return userData;
};

export const deleteUser = async (id) => {
  try {
    await apiClient.delete(`/users/${id}`);
  } catch (e) {}

  const currentUsers = await getUsers();
  const updated = currentUsers.filter((u) => u.id !== id);
  localStorage.setItem('custom_system_users', JSON.stringify(updated));
  try {
    await saveAppSettings('custom_system_users', updated);
  } catch (e) {}
  return { success: true };
};

export const login = async (identifier, password) => {
  let email = String(identifier || '').trim();
  if (!email.includes('@')) {
    if (email.toLowerCase() === 'admin') {
      email = 'admin@demo.com';
    } else {
      email = `${email.toLowerCase()}@demo.com`;
    }
  }

  try {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.data?.access_token) {
      const meRes = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${res.data.data.access_token}` },
      });
      const me = meRes.data?.data || {};
      const fullName = `${me.first_name || ''} ${me.last_name || ''}`.trim() || me.email || identifier;
      return {
        ...me,
        name: fullName,
        fullName: fullName,
        access_token: res.data.data.access_token,
      };
    }
  } catch (e) {
    // Fallback static login if Directus user auth fails
    if (email === 'admin@demo.com' && (password === '321456' || password === 'admin')) {
      return {
        id: 'admin-id',
        email: 'admin@demo.com',
        first_name: 'Admin',
        name: 'Admin',
        fullName: 'Admin',
        role: 'Admin',
      };
    }
    throw e;
  }
};
