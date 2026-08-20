import apiClient from './client';

export const getUsers = async () => {
  try {
    const res = await apiClient.get('/users', {
      params: { fields: ['id', 'first_name', 'last_name', 'email', 'role.id', 'role.name', 'status', 'description'] },
    });
    return res.data?.data || [];
  } catch (e) {
    return [];
  }
};

export const getRoles = async () => {
  try {
    const res = await apiClient.get('/roles');
    return res.data?.data || [];
  } catch (e) {
    return [];
  }
};

export const createUser = async (userData) => {
  const res = await apiClient.post('/users', userData);
  return res.data?.data;
};

export const updateUser = async (id, userData) => {
  const res = await apiClient.patch(`/users/${id}`, userData);
  return res.data?.data;
};

export const deleteUser = async (id) => {
  const res = await apiClient.delete(`/users/${id}`);
  return res.data;
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
