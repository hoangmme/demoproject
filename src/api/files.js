import apiClient, { getBaseUrl, STATIC_TOKEN } from './client';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 phút để tải tệp lớn lên tới 100MB
  });
  return res.data?.data;
};

export const getFileUrl = (fileInput) => {
  if (!fileInput) return '';
  const currentBaseUrl = getBaseUrl();
  const token = STATIC_TOKEN || 'CooAJKTu9_NLEgtaq3qULrswZGLFfsAw';

  let raw = '';
  if (typeof fileInput === 'object' && fileInput !== null) {
    raw = fileInput.url || fileInput.id || '';
  } else {
    raw = String(fileInput);
  }
  if (!raw) return '';

  // Decode URI components if encoded (e.g. %20)
  try {
    if (raw.includes('%')) {
      raw = decodeURIComponent(raw);
    }
  } catch (e) {}

  // Strip all whitespace/spaces inside or around the URL
  let clean = raw.trim().replace(/\s+/g, '');

  // If it's a data URI or blob
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // Extract Directus file UUID if present (standard 36-char UUID)
  const uuidMatch = clean.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
  if (uuidMatch) {
    const assetId = uuidMatch[1];
    return `${currentBaseUrl}/assets/${assetId}?access_token=${token}`;
  }

  // If protocol-relative //
  if (clean.startsWith('//')) {
    clean = 'https:' + clean;
  }

  // If starts with /assets/
  if (clean.startsWith('/assets/')) {
    return `${currentBaseUrl}${clean}${clean.includes('?') ? '&' : '?'}access_token=${token}`;
  }

  // If starts with http:// or https://
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('/assets/') && !clean.includes('access_token=')) {
      return `${clean}${clean.includes('?') ? '&' : '?'}access_token=${token}`;
    }
    return clean;
  }

  // Fallback: treat as direct file/asset ID
  return `${currentBaseUrl}/assets/${clean}?access_token=${token}`;
};

export const deleteFile = async (fileId) => {
  try {
    await apiClient.delete(`/files/${fileId}`);
  } catch (e) {
    console.warn('File delete warning:', e);
  }
};
