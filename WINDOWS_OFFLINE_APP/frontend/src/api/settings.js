import apiClient from './client';

// Tự động dọn dẹp các key app_setting_* cũ trong localStorage khi tải web
if (typeof window !== 'undefined') {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('app_setting_') || k.startsWith('custom_dashboards_') || k.startsWith('dashboard_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}

export const getAppSettings = async (key, defaultValue = null) => {
  // Luôn truy vấn trực tiếp từ Directus Database (100% thời gian thực)
  try {
    const res = await apiClient.get('/items/app_settings', {
      params: {
        filter: { key: { _eq: key } },
        _t: Date.now(),
      },
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
    console.warn('Error fetching app settings for key:', key, e);
  }

  // Fallback sang localStorage nếu Directus gặp sự cố
  try {
    const cached = localStorage.getItem(`app_settings_${key}`);
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

