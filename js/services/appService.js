// js/services/appService.js
import { API } from '../api.js';

let masterDataCache = null;

export const AppService = {
    /**
     * Load tất cả Master Data 1 lần và cache lại
     */
    async loadMasterData() {
        if (masterDataCache) return masterDataCache;
        
        try {
            const [departments, positions, countries, purposes, fundings, relationships] = await Promise.all([
                API.get('/departments'),
                API.get('/positions'),
                API.get('/countries'),
                API.get('/purposes'),
                API.get('/fundings'),
                API.get('/relationships')
            ]);
            
            masterDataCache = {
                departments,
                positions,
                countries,
                purposes,
                fundings,
                relationships
            };
            return masterDataCache;
        } catch (error) {
            console.error("Lỗi khi load Master Data", error);
            throw error;
        }
    },

    getMasterData() {
        return masterDataCache;
    },

    clearCache() {
        masterDataCache = null;
    },

    /**
     * Lấy thống kê cho Dashboard
     */
    async getDashboardStats() {
        try {
            // json-server không hỗ trợ count endpoint chuẩn, ta đành gọi / để đếm hoặc lấy length
            // Trong thực tế, backend thật sẽ có API /dashboard/stats
            const [personnels, appx1, appx2] = await Promise.all([
                API.get('/personnels'),
                API.get('/appendix1'),
                API.get('/appendix2')
            ]);
            
            // Tính số lượng cán bộ đã đi nước ngoài (distinct personnelId trong appx1)
            const wentAbroadSet = new Set(appx1.map(item => item.personnelId));
            
            // Tính số lượng cán bộ có thân nhân nước ngoài
            const hasRelativeSet = new Set(appx2.map(item => item.personnelId));
            
            return {
                totalPersonnel: personnels.length,
                wentAbroad: wentAbroadSet.size,
                hasRelativesAbroad: hasRelativeSet.size,
                totalTrips: appx1.length
            };
        } catch (error) {
            console.error("Lỗi khi load Dashboard Stats", error);
            throw error;
        }
    },
    
    // Helper để lookup name từ ID
    getNameById(type, id) {
        if(!masterDataCache || !masterDataCache[type]) return id;
        const item = masterDataCache[type].find(x => x.id === id);
        return item ? item.name : id;
    }
};
