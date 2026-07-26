// js/services/appendix3Service.js
import { API } from '../api.js';
import { AppService } from './appService.js';
import { PersonnelService } from './personnelService.js';

export const Appendix3Service = {
    async list(query = '') {
        const data = await API.get(`/appendix3${query}`);
        const personnels = await PersonnelService.list();
        return data.map(item => this._toViewModel(item, personnels));
    },

    async get(id) {
        const item = await API.get(`/appendix3/${id}`);
        const personnel = await PersonnelService.get(item.personnelId);
        return this._toViewModel(item, [personnel]);
    },

    async create(payload) {
        return API.post('/appendix3', payload);
    },

    async update(id, payload) {
        return API.put(`/appendix3/${id}`, payload);
    },

    async remove(id) {
        return API.delete(`/appendix3/${id}`);
    },

    _toViewModel(entity, personnels = []) {
        const p = personnels.find(x => x.id === entity.personnelId) || {};
        return {
            ...entity,
            // Info từ Personnel
            personnelCode: p.code,
            personnelName: p.name,
            personnelBirthYear: p.birthYear,
            cccd: p.cccd,
            departmentName: p.departmentName,
            positionName: p.positionName,
            
            // Info từ Master Data
            countryName: AppService.getNameById('countries', entity.countryId),
            fundingName: AppService.getNameById('fundings', entity.fundingId)
        };
    }
};
