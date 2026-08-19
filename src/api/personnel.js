import apiClient from './client';

export const getPersonnelList = async (limit = -1) => {
  const res = await apiClient.get('/items/personnel', {
    params: {
      limit,
      fields: ['*'],
      sort: ['-id'],
      _t: Date.now(),
    },
  });
  return res.data?.data || [];
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
  const res = await apiClient.post('/items/personnel', data);
  return res.data?.data;
};

export const updatePersonnel = async (id, data) => {
  const res = await apiClient.patch(`/items/personnel/${id}`, data);
  return res.data?.data;
};

export const deletePersonnel = async (id) => {
  const res = await apiClient.delete(`/items/personnel/${id}`);
  return res.data;
};

export const deleteMultiplePersonnel = async (ids) => {
  const res = await apiClient.delete('/items/personnel', {
    data: ids,
  });
  return res.data;
};
