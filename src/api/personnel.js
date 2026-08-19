import apiClient from './client';

export const getPersonnelList = async (limit = -1) => {
  try {
    const res = await apiClient.get('/items/personnels', {
      params: {
        limit,
        fields: ['*'],
        sort: ['-id'],
        _t: Date.now(),
      },
    });
    return res.data?.data || [];
  } catch (e) {
    try {
      const res = await apiClient.get('/items/personnel', {
        params: {
          limit,
          fields: ['*'],
          sort: ['-id'],
          _t: Date.now(),
        },
      });
      return res.data?.data || [];
    } catch (err) {
      throw e;
    }
  }
};

export const getDepartments = async () => {
  try {
    const res = await apiClient.get('/items/departments', {
      params: { limit: -1, _t: Date.now() },
    });
    return res.data?.data || [];
  } catch (e) {
    return [
      { id: 'D1', name: 'Phòng Kế hoạch' },
      { id: 'D2', name: 'Phòng Tổ chức' },
    ];
  }
};

export const createPersonnel = async (data) => {
  const payload = {
    ...data,
    id: data.id || ('p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7)),
  };
  const res = await apiClient.post('/items/personnels', payload);
  return res.data?.data;
};

export const updatePersonnel = async (id, data) => {
  try {
    const res = await apiClient.patch(`/items/personnels/${id}`, data);
    return res.data?.data;
  } catch (e) {
    const res = await apiClient.patch(`/items/personnel/${id}`, data);
    return res.data?.data;
  }
};

export const deletePersonnel = async (id) => {
  if (!id) return;
  
  // 1. Clean up child records concurrently
  await Promise.allSettled([
    apiClient.delete('/items/appendix1', { params: { filter: { personnelId: { _eq: id } } } }).catch(() => {}),
    apiClient.delete('/items/appendix2', { params: { filter: { personnelId: { _eq: id } } } }).catch(() => {}),
    apiClient.delete('/items/appendix3', { params: { filter: { personnelId: { _eq: id } } } }).catch(() => {}),
  ]);

  // 2. Delete from personnels
  try {
    const res = await apiClient.delete(`/items/personnels/${id}`);
    return res.data;
  } catch (e) {
    const res = await apiClient.delete(`/items/personnel/${id}`);
    return res.data;
  }
};

export const deleteMultiplePersonnel = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;

  // 1. Clean up child records in parallel
  await Promise.allSettled([
    apiClient.delete('/items/appendix1', { data: ids, params: { filter: { personnelId: { _in: ids } } } }).catch(() => {}),
    apiClient.delete('/items/appendix2', { data: ids, params: { filter: { personnelId: { _in: ids } } } }).catch(() => {}),
    apiClient.delete('/items/appendix3', { data: ids, params: { filter: { personnelId: { _in: ids } } } }).catch(() => {}),
  ]);

  // 2. Batch delete all personnels in 1 single HTTP request
  try {
    await apiClient.delete('/items/personnels', { data: ids });
  } catch (e) {
    // Fallback: Concurrently delete in parallel
    await Promise.allSettled(
      ids.map((id) =>
        apiClient.delete(`/items/personnels/${id}`).catch(() => apiClient.delete(`/items/personnel/${id}`))
      )
    );
  }
  return { success: true };
};
