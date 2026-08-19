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
    // Fallback if collection is named 'personnel'
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
  try {
    const res = await apiClient.delete(`/items/personnels/${id}`);
    return res.data;
  } catch (e) {
    const res = await apiClient.delete(`/items/personnel/${id}`);
    return res.data;
  }
};

export const deleteMultiplePersonnel = async (ids) => {
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
