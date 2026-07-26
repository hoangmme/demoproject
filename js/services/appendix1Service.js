// js/services/appendix1Service.js
import { API } from '../api.js';
import { AppService } from './appService.js';
import { PersonnelService } from './personnelService.js';

export const Appendix1Service = {
    async list(query = '') {
        const data = await API.get(`/appendix1${query}`);
        // Cần join personnel để lấy thông tin hiển thị
        // Thay vì gọi từng request, có thể fetch tất cả personnels một lần (hoặc nếu API xịn thì API trả về sẵn)
        // Với demo offline, ta tự fetch all personnels 1 lần
        const personnels = await PersonnelService.list();
        
        return data.map(item => this._toViewModel(item, personnels));
    },

    async get(id) {
        const item = await API.get(`/appendix1/${id}`);
        const personnel = await PersonnelService.get(item.personnelId);
        return this._toViewModel(item, [personnel]);
    },

    async create(payload) {
        const item = await API.post('/appendix1', payload);
        return item; // Trả về raw
    },

    async update(id, payload) {
        return API.put(`/appendix1/${id}`, payload);
    },

    async remove(id) {
        return API.delete(`/appendix1/${id}`);
    },

    _toViewModel(entity, personnels = []) {
        const p = personnels.find(x => x.id === entity.personnelId) || {};
        return {
            ...entity,
            // Info từ Personnel
            personnelCode: p.code,
            personnelName: p.name,
            cccd: p.cccd,
            birthYear: p.birthYear,
            departmentName: p.departmentName,
            positionName: p.positionName,
            
            // Info từ Master Data
            countryName: AppService.getNameById('countries', entity.countryId),
            purposeName: AppService.getNameById('purposes', entity.purposeId),
            fundingName: AppService.getNameById('fundings', entity.fundingId)
        };
    }
};
