import apiClient from './client';

export const getAppSettings = async (key, defaultValue = null) => {
  try {
    const res = await apiClient.get('/items/app_settings', {
      params: {
        filter: { key: { _eq: key } },
        _t: Date.now(),
      },
    });
    if (res.data?.data && res.data.data.length > 0) {
      const val = res.data.data[0].value;
      if (val === null || val === undefined || val === '') return defaultValue;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          // Chuỗi thường (như base64 ảnh, URL, text) -> trả về nguyên bản
          return val;
        }
      }
      return val;
    }
  } catch (e) {
    console.warn('Error fetching app settings for key:', key, e);
  }
  return defaultValue;
};

export const saveAppSettings = async (key, value) => {
  const serialized = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : (value === null ? '' : String(value));
  try {
    const res = await apiClient.get('/items/app_settings', {
      params: {
        filter: { key: { _eq: key } },
      },
    });
    if (res.data?.data && res.data.data.length > 0) {
      const id = res.data.data[0].id;
      await apiClient.patch(`/items/app_settings/${id}`, { value: serialized });
    } else {
      await apiClient.post('/items/app_settings', { key, value: serialized });
    }
  } catch (e) {
    console.error('Error saving app settings for key:', key, e);
    throw e;
  }
};
