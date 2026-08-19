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

const deleteChildrenForParents = async (parentIds, collections = ['appendix1', 'appendix2', 'appendix3']) => {
  if (!parentIds || parentIds.length === 0) return;
  const filterParams = parentIds.length === 1 
    ? { 'filter[personnelId][_eq]': parentIds[0], fields: ['id'], limit: -1 }
    : { 'filter[personnelId][_in]': parentIds.join(','), fields: ['id'], limit: -1 };

  await Promise.allSettled(
    collections.map(async (col) => {
      try {
        const res = await apiClient.get(`/items/${col}`, { params: filterParams });
        const childIds = (res.data?.data || []).map((x) => x.id).filter(Boolean);
        if (childIds.length > 0) {
          try {
            await apiClient.delete(`/items/${col}`, { data: childIds });
          } catch (delErr) {
            await Promise.allSettled(childIds.map((cid) => apiClient.delete(`/items/${col}/${cid}`)));
          }
        }
      } catch (err) {}
    })
  );
};

export const deletePersonnel = async (id) => {
  if (!id) return;
  
  // 1. Delete all child records in appendix1, appendix2, appendix3 first to satisfy foreign key constraints
  await deleteChildrenForParents([id]);

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
  await deleteChildrenForParents(ids);

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
