import apiClient, { API_URL, STATIC_TOKEN } from './client';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data?.data;
};

export const getFileUrl = (fileId) => {
  if (!fileId) return '';
  if (fileId.startsWith('http') || fileId.startsWith('data:')) {
    if (fileId.startsWith('http') && !fileId.includes('access_token=')) {
      return `${fileId}${fileId.includes('?') ? '&' : '?'}access_token=${STATIC_TOKEN}`;
    }
    return fileId;
  }
  return `${API_URL}/assets/${fileId}?access_token=${STATIC_TOKEN}`;
};

export const deleteFile = async (fileId) => {
  try {
    await apiClient.delete(`/files/${fileId}`);
  } catch (e) {
    console.warn('File delete warning:', e);
  }
};
