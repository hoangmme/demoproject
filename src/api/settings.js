import apiClient from './client';

// High-speed In-Memory Settings Cache
const settingsCache = new Map();

export const getAppSettings = async (key, defaultValue = null, forceRefresh = false) => {
  // 1. Check memory cache (0ms)
  if (!forceRefresh && settingsCache.has(key)) {
    return settingsCache.get(key);
  }

  // 2. Check localStorage cache (0ms)
  if (!forceRefresh && typeof window !== 'undefined') {
    const local = localStorage.getItem(`app_setting_${key}`);
    if (local !== null && local !== undefined) {
      try {
        const parsed = JSON.parse(local);
        settingsCache.set(key, parsed);
        return parsed;
      } catch {
        settingsCache.set(key, local);
        return local;
      }
    }
  }

  // 3. Fetch from Directus API if cache misses
  try {
    const res = await apiClient.get('/items/app_settings', {
      params: {
        filter: { key: { _eq: key } },
        _t: forceRefresh ? Date.now() : undefined,
      },
    });
    if (res.data?.data && res.data.data.length > 0) {
      const val = res.data.data[0].value;
      if (val === null || val === undefined || val === '') {
        settingsCache.set(key, defaultValue);
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
      // Update memory & localStorage cache
      settingsCache.set(key, finalVal);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`app_setting_${key}`, typeof finalVal === 'object' ? JSON.stringify(finalVal) : String(finalVal));
      }
      return finalVal;
    }
  } catch (e) {
    console.warn('Error fetching app settings for key:', key, e);
  }

  settingsCache.set(key, defaultValue);
  return defaultValue;
};

export const saveAppSettings = async (key, value) => {
  // 1. Immediately update in-memory and localStorage cache for 0ms reads
  settingsCache.set(key, value);
  const serialized = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : (value === null ? '' : String(value));
  if (typeof window !== 'undefined') {
    localStorage.setItem(`app_setting_${key}`, serialized);
  }

  // 2. Persist to Directus DB
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

