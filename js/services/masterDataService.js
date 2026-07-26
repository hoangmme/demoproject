// js/services/masterDataService.js
import { API } from '../api.js';
import { AppService } from './appService.js';

export const MasterDataService = {
    async create(type, payload) {
        const result = await API.post(`/${type}`, payload);
        // Reset cache to force reload
        AppService.clearCache();
        return result;
    },

    async update(type, id, payload) {
        const result = await API.put(`/${type}/${id}`, payload);
        AppService.clearCache();
        return result;
    },

    async remove(type, id) {
        const result = await API.delete(`/${type}/${id}`);
        AppService.clearCache();
        return result;
    }
};
