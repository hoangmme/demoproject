import apiClient from './client';

export const getAuditLogs = async (limit = 100) => {
  try {
    const res = await apiClient.get('/items/audit_logs', {
      params: {
        limit,
        sort: ['-timestamp'],
        _t: Date.now(),
      },
    });
    return res.data?.data || [];
  } catch (e) {
    return [];
  }
};

export const logActivity = async (action, details, user = null) => {
  try {
    const sessionUser = user || JSON.parse(localStorage.getItem('mvp_session') || '{}');
    const logData = {
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      user_email: sessionUser.email || 'Hệ thống',
      timestamp: new Date().toISOString(),
    };
    await apiClient.post('/items/audit_logs', logData);
  } catch (e) {
    console.warn('Audit log write error:', e);
  }
};
