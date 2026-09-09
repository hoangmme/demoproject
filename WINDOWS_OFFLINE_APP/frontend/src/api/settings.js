import apiClient from './client';

export const getAppSettings = async (key, defaultValue = null) => {
  // 1. Luôn ưu tiên truy vấn trực tiếp từ Directus Database
  try {
    const res = await apiClient.get('/items/app_settings', {
      params: {
        filter: { key: { _eq: key } },
        _t: Date.now(),
      },
      timeout: 5000,
    });
    if (res.data?.data && res.data.data.length > 0) {
      const val = res.data.data[0].value;
      if (val === null || val === undefined || val === '') {
        return defaultValue;
      }
      let finalVal = val;
      if (typeof val === 'string') {
        try {
          finalVal = JSON.parse(val);
        } catch {
          finalVal = val;
        }
      }
      try {
        localStorage.setItem(`app_settings_${key}`, typeof val === 'string' ? val : JSON.stringify(val));
      } catch {}
      return finalVal;
    }
  } catch (e) {
    // Không ném lỗi làm gián đoạn ứng dụng khi offline hoặc mạng gián đoạn
    // console.debug(`Directus unreachable for key: ${key}, using cached fallback.`);
  }

  // 2. Fallback sang localStorage nếu Directus offline hoặc gián đoạn kết nối
  try {
    const cached = localStorage.getItem(`app_settings_${key}`) || localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return cached;
      }
    }
  } catch {}

  return defaultValue;
};

export const saveAppSettings = async (key, value) => {
  const serialized = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : (value === null ? '' : String(value));

  // Luôn lưu bản sao vào localStorage làm bộ đệm
  try {
    localStorage.setItem(`app_settings_${key}`, serialized);
  } catch {}

  // Ghi trực tiếp lên Directus Database
  try {
    const res = await apiClient.get('/items/app_settings', {
      params: {
        filter: { key: { _eq: key } },
        _t: Date.now(),
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
    const errText = e.response?.data?.errors?.[0]?.message || e.message || '';
    if (errText.includes('SQLITE_FULL') || errText.includes('disk is full')) {
      throw new Error('Ổ cứng máy chủ backend (api.hscb.online) đang bị đầy dung lượng (SQLITE_FULL: disk is full). Đã lưu tạm cấu hình vào bộ nhớ máy này! Bạn cần giải phóng dung lượng ổ cứng VPS backend.');
    }
    throw e;
  }
};

