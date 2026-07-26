// js/services/personnelService.js
import { API } from '../api.js';
import { AppService } from './appService.js';

export const PersonnelService = {
    /**
     * Lấy danh sách cán bộ (chưa phân trang API cho đơn giản ở bản demo offline)
     * Trả về ViewModel (đã join tên đơn vị, chức vụ)
     */
    async list() {
        const personnels = await API.get('/personnels');
        return personnels.map(this._toViewModel);
    },

    /**
     * Lấy chi tiết 1 cán bộ (ViewModel)
     */
    async get(id) {
        const p = await API.get(`/personnels/${id}`);
        return this._toViewModel(p);
    },

    async create(payload) {
        const p = await API.post('/personnels', payload);
        return this._toViewModel(p);
    },

    async update(id, payload) {
        const p = await API.put(`/personnels/${id}`, payload);
        return this._toViewModel(p);
    },

    async remove(id) {
        return API.delete(`/personnels/${id}`);
    },

    // Map Entity -> ViewModel
    _toViewModel(entity) {
        return {
            ...entity,
            departmentName: AppService.getNameById('departments', entity.departmentId),
            positionName: AppService.getNameById('positions', entity.positionId)
        };
    }
};
