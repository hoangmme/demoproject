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
  try {
    const res = await apiClient.post('/items/personnels', data);
    return res.data?.data;
  } catch (e) {
    const res = await apiClient.post('/items/personnel', data);
    return res.data?.data;
  }
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
  
  // 1. Clean up child records in appendix1, appendix2, appendix3 to satisfy Foreign Key constraints
  try {
    const a1Res = await apiClient.get('/items/appendix1', { params: { filter: { personnelId: { _eq: id } }, fields: ['id'] } });
    for (const item of (a1Res.data?.data || [])) {
      await apiClient.delete(`/items/appendix1/${item.id}`).catch(() => {});
    }
  } catch (e) {}

  try {
    const a2Res = await apiClient.get('/items/appendix2', { params: { filter: { personnelId: { _eq: id } }, fields: ['id'] } });
    for (const item of (a2Res.data?.data || [])) {
      await apiClient.delete(`/items/appendix2/${item.id}`).catch(() => {});
    }
  } catch (e) {}

  try {
    const a3Res = await apiClient.get('/items/appendix3', { params: { filter: { personnelId: { _eq: id } }, fields: ['id'] } });
    for (const item of (a3Res.data?.data || [])) {
      await apiClient.delete(`/items/appendix3/${item.id}`).catch(() => {});
    }
  } catch (e) {}

  // 2. Now delete from personnels
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
  for (const id of ids) {
    try {
      await deletePersonnel(id);
    } catch (err) {
      console.warn('Error deleting person:', id, err);
    }
  }
  return { success: true };
};
