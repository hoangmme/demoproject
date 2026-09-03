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

export const getFileUrl = (fileId) => {
  if (!fileId) return '';
  const currentBaseUrl = getBaseUrl();
  if (typeof fileId === 'string' && (fileId.includes('/assets/') || fileId.startsWith('http') || fileId.startsWith('data:'))) {
    if (fileId.includes('/assets/')) {
      const assetId = fileId.split('/assets/')[1]?.split('?')[0];
      return `${currentBaseUrl}/assets/${assetId}?access_token=${STATIC_TOKEN}`;
    }
    if (fileId.startsWith('http') && !fileId.includes('access_token=')) {
      return `${fileId}${fileId.includes('?') ? '&' : '?'}access_token=${STATIC_TOKEN}`;
    }
    return fileId;
  }
  return `${currentBaseUrl}/assets/${fileId}?access_token=${STATIC_TOKEN}`;
};

export const deleteFile = async (fileId) => {
  try {
    await apiClient.delete(`/files/${fileId}`);
  } catch (e) {
    console.warn('File delete warning:', e);
  }
};
