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
  try {
    const res = await apiClient.post('/items/personnels', payload);
    return res.data?.data;
  } catch (e) {
    const res = await apiClient.post('/items/personnel', payload);
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

const deleteChildrenForParents = async (parentIds, collections = ['appendix1', 'appendix2', 'appendix3']) => {
  if (!parentIds || parentIds.length === 0) return;
  for (const col of collections) {
    try {
      await apiClient.delete(`/items/${col}`, {
        params: {
          'filter[parent_id][_in]': parentIds.join(','),
        },
      });
    } catch (e) {}
  }
};

export const deletePersonnel = async (id) => {
  await deleteChildrenForParents([id]);
  try {
    const res = await apiClient.delete(`/items/personnels/${id}`);
    return res.data;
  } catch (e) {
    const res = await apiClient.delete(`/items/personnel/${id}`);
    return res.data;
  }
};

export const deleteMultiplePersonnel = async (ids) => {
  if (!ids || ids.length === 0) return;
  await deleteChildrenForParents(ids);
  try {
    const res = await apiClient.delete('/items/personnels', {
      data: ids,
    });
    return res.data;
  } catch (e) {
    const res = await apiClient.delete('/items/personnel', {
      data: ids,
    });
    return res.data;
  }
};
