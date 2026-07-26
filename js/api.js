// js/api.js
import { CONFIG } from './config.js';
import { Toast } from './components/toast.js';

export const API = {
    async fetch(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        
        try {
            document.getElementById('global-loading').style.display = 'flex';
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                if(response.status === 404) {
                    throw new Error("Không tìm thấy dữ liệu yêu cầu.");
                }
                throw new Error("Hệ thống đang bận hoặc phản hồi chậm.");
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                Toast.error("Không thể kết nối đến máy chủ dữ liệu. Vui lòng kiểm tra backend.");
            } else {
                Toast.error(error.message);
            }
            throw error;
        } finally {
            document.getElementById('global-loading').style.display = 'none';
        }
    },

    async get(endpoint) {
        return this.fetch(endpoint);
    },

    async post(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.fetch(endpoint, {
            method: 'DELETE'
        });
    }
};
