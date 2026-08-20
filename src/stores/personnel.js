import { defineStore } from 'pinia';
import apiClient from '@/api/client';
import {
  getPersonnelList,
  getDepartments,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  deleteMultiplePersonnel,
} from '@/api/personnel';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { logActivity } from '@/api/audit';

export const usePersonnelStore = defineStore('personnel', {
  state: () => ({
    personnelList: [],
    relativesList: [],
    tripsList: [],
    departments: [],
    loading: false,
    selectedPerson: null,
    isDialogOpen: false,
    visibleColumns: ['code', 'name', 'birthYear', 'departmentId', 'position', 'cccd'],
    visibleRelativeColumns: ['parentName', 'relationshipName', 'relativeName', 'birthYear', 'currentAddress', 'occupation', 'countryName'],
    importMappingPersonnel: [],
    importMappingRelative: [],
  }),
  getters: {
    departmentMap: (state) => {
      const map = {};
      state.departments.forEach((d) => {
        map[d.id] = d.name;
      });
      return map;
    },
    allAvailableColumns: (state) => {
      const list = [];
      const seen = new Set();

      (state.importMappingPersonnel || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            list.push({
              id: c.id,
              label: c.label || c.id,
              width: '160px',
              format: c.format || 'text',
              group: g.group,
            });
          }
        });
      });

      if (list.length === 0) {
        return [
          { id: 'code', label: 'Mã CB', width: '110px' },
          { id: 'name', label: 'Họ và tên', width: '200px' },
          { id: 'birthYear', label: 'Năm sinh', width: '120px' },
          { id: 'departmentId', label: 'Phòng ban', width: '160px' },
          { id: 'position', label: 'Chức vụ', width: '140px' },
          { id: 'cccd', label: 'Số CCCD', width: '140px' },
        ];
      }
      return list;
    },
    allAvailableRelativeColumns: (state) => {
      const list = [];
      const seen = new Set();

      (state.importMappingRelative || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            list.push({
              id: c.id,
              label: c.label || c.id,
              width: '160px',
              format: c.format || 'text',
              group: g.group,
            });
          }
        });
      });

      if (list.length === 0) {
        return [
          { id: 'relationshipName', label: 'Mối quan hệ', width: '130px' },
          { id: 'relativeName', label: 'Họ và tên Thân nhân', width: '180px' },
          { id: 'birthYear', label: 'Năm sinh', width: '110px' },
          { id: 'currentAddress', label: 'Nơi cư trú', width: '180px' },
          { id: 'occupation', label: 'Nghề nghiệp', width: '160px' },
          { id: 'countryName', label: 'Quốc gia', width: '140px' },
        ];
      }
      return list;
    },
  },
  actions: {
    async init() {
      await Promise.all([
        this.loadSettings(),
        this.fetchDepartments(),
      ]);

      const validIds = new Set(this.allAvailableColumns.map((c) => c.id));
      const saved = localStorage.getItem('vue_visible_columns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter((id) => validIds.has(id));
            if (filtered.length >= 3) {
              this.visibleColumns = filtered;
            } else {
              this.visibleColumns = this.allAvailableColumns.slice(0, 6).map((c) => c.id);
            }
          }
        } catch (e) {
          this.visibleColumns = this.allAvailableColumns.slice(0, 6).map((c) => c.id);
        }
      } else {
        this.visibleColumns = this.allAvailableColumns.slice(0, 6).map((c) => c.id);
      }

      const validRelativeIds = new Set(this.allAvailableRelativeColumns.map((c) => c.id));
      const savedRel = localStorage.getItem('vue_visible_relative_columns');
      if (savedRel) {
        try {
          const parsed = JSON.parse(savedRel);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter((id) => validRelativeIds.has(id));
            if (filtered.length >= 3) {
              this.visibleRelativeColumns = filtered;
            } else {
              this.visibleRelativeColumns = this.allAvailableRelativeColumns.slice(0, 7).map((c) => c.id);
            }
          }
        } catch (e) {
          this.visibleRelativeColumns = this.allAvailableRelativeColumns.slice(0, 7).map((c) => c.id);
        }
      } else {
        this.visibleRelativeColumns = this.allAvailableRelativeColumns.slice(0, 7).map((c) => c.id);
      }

      await this.fetchPersonnel();
    },
    async fetchPersonnel() {
      this.loading = true;
      try {
        const [pData, a1Res, a2Res] = await Promise.all([
          getPersonnelList(),
          apiClient.get('/items/appendix1', { params: { limit: -1, _t: Date.now() } }).catch(() => ({ data: { data: [] } })),
          apiClient.get('/items/appendix2', { params: { limit: -1, _t: Date.now() } }).catch(() => ({ data: { data: [] } })),
        ]);

        const rawTrips = a1Res.data?.data || [];
        const rawRelatives = a2Res.data?.data || [];

        this.tripsList = rawTrips.filter((x) => x.isDeleted !== 1).map((t) => {
          let custom = {};
          if (t.custom_data) {
            try {
              custom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data;
            } catch (e) {
              custom = {};
            }
          }
          return {
            ...custom,
            ...t,
            custom_data: custom,
          };
        });

        this.relativesList = rawRelatives.filter((x) => x.isDeleted !== 1).map((r, idx) => {
          const assignedCode = r.code && r.code.startsWith('TN-') ? r.code : `TN-${String(idx + 1).padStart(5, '0')}`;
          let custom = {};
          if (r.custom_data) {
            try {
              custom = typeof r.custom_data === 'string' ? JSON.parse(r.custom_data) : r.custom_data;
            } catch (e) {
              custom = {};
            }
          }
          return {
            ...custom,
            ...r,
            code: assignedCode,
            custom_data: custom,
          };
        });

        // Build quick lookup maps
        const tripsMap = {};
        this.tripsList.forEach((t) => {
          const k = t.personnelId || t.personnelCode;
          if (k) {
            if (!tripsMap[k]) tripsMap[k] = [];
            tripsMap[k].push(t);
          }
        });

        const relativesMap = {};
        this.relativesList.forEach((r) => {
          const k = String(r.cccd_can_bo || r.personnelId || '').trim();
          if (k) {
            if (!relativesMap[k]) relativesMap[k] = [];
            relativesMap[k].push(r);
          }
        });

        this.personnelList = pData.map((p) => {
          let custom = {};
          if (p.custom_data) {
            try {
              custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            } catch (e) {
              custom = {};
            }
          }

          const personCccd = String(p.cccdparent || p.cccd || custom.cccdparent || custom.cccd || '').trim();
          const matchedTrips = tripsMap[p.id] || tripsMap[p.code] || custom.trips || custom['Khối B: Chuyến đi nước ngoài'] || [];
          const matchedRelatives = (personCccd && relativesMap[personCccd]) || relativesMap[p.id] || relativesMap[p.code] || custom.relatives || [];
          const flags = custom.flags || p.flags || {};
          const files = custom.files || p.files || [];

          return {
            ...custom,
            ...p,
            cccdparent: personCccd,
            position: p.position || p.positionName || custom.positionName || custom.position || '',
            positionName: p.positionName || p.position || custom.position || custom.positionName || '',
            departmentName: p.departmentName || (p.departmentId ? this.getDepartmentName(p.departmentId) : '') || custom.departmentName || '',
            hcCaNhan: p.hcCaNhan || p.passportPersonal || custom.hcCaNhan || custom.passportPersonal || '',
            hcCongVu: p.hcCongVu || p.passportOfficial || custom.hcCongVu || custom.passportOfficial || '',
            kqThamTra: p.kqThamTra || p.tcctResult || custom.kqThamTra || custom.tcctResult || '',
            trips: Array.isArray(matchedTrips) ? matchedTrips : [],
            relatives: Array.isArray(matchedRelatives) ? matchedRelatives : [],
            flags: typeof flags === 'object' ? flags : {},
            files: Array.isArray(files) ? files : [],
            custom_data: custom,
          };
        });

        // Fast parent linking on relativesList strictly by cccd_can_bo -> cccdparent
        const personLookup = {};
        this.personnelList.forEach((p) => {
          if (p.cccdparent) personLookup[String(p.cccdparent).trim()] = p;
          if (p.id) personLookup[p.id] = p;
          if (p.code) personLookup[p.code] = p;
        });

        this.relativesList = this.relativesList.map((r) => {
          const parent = (r.cccd_can_bo && personLookup[String(r.cccd_can_bo).trim()]) || (r.personnelId && personLookup[r.personnelId]) || null;
          return {
            ...r,
            parentName: parent ? parent.name : (r.parentName || r.personnelName || ''),
            parentPersonnelName: parent ? parent.name : (r.parentPersonnelName || r.parentName || ''),
            cccd_can_bo: r.cccd_can_bo || (parent ? parent.cccdparent : ''),
            parentPosition: parent ? (parent.positionName || parent.position || '') : (r.parentPosition || ''),
            parentDepartment: parent ? (parent.departmentName || '') : (r.parentDepartment || ''),
          };
        });
      } catch (e) {
        console.error('Error fetching personnel and appendices:', e);
      } finally {
        this.loading = false;
      }
    },
    async fetchDepartments() {
      this.departments = await getDepartments();
    },
    async loadSettings() {
      let pMap = await getAppSettings('mapping_config_personnel', null);
      if (!pMap || pMap.length === 0) pMap = await getAppSettings('importMappingPersonnel', []);
      this.importMappingPersonnel = pMap || [];

      let rMap = await getAppSettings('mapping_config_relative', null);
      if (!rMap || rMap.length === 0) rMap = await getAppSettings('importMappingRelative', []);
      this.importMappingRelative = rMap || [];
    },
    async savePerson(formData) {
      this.loading = true;
      try {
        const coreKeys = [
          'id', 'code', 'name', 'cccd', 'birthYear', 'departmentId',
          'position', 'positionName', 'departmentName', 'hometown',
          'ethnicity', 'religion', 'email', 'otherName', 'isDeleted',
        ];

        const payload = {};
        const customData = { ...(formData.custom_data || {}) };

        Object.keys(formData).forEach((k) => {
          if (coreKeys.includes(k)) {
            payload[k] = formData[k];
          } else {
            customData[k] = formData[k];
          }
        });

        payload.custom_data = JSON.stringify(customData);

        let saved = null;
        if (payload.id) {
          saved = await updatePersonnel(payload.id, payload);
          await logActivity('Cập nhật Cán bộ', `Cập nhật hồ sơ: ${formData.name} (${formData.code || formData.id})`);
        } else {
          payload.id = 'CB-' + Date.now();
          if (!payload.code) payload.code = payload.id;
          saved = await createPersonnel(payload);
          await logActivity('Tạo Cán bộ mới', `Tạo mới hồ sơ: ${formData.name}`);
        }

        // Sync relatives to appendix2
        const pId = payload.id;
        if (Array.isArray(formData.relatives)) {
          for (const rel of formData.relatives) {
            try {
              if (rel.id && !String(rel.id).startsWith('temp_')) {
                await apiClient.patch(`/items/appendix2/${rel.id}`, {
                  ...rel,
                  personnelId: pId,
                });
              } else {
                await apiClient.post('/items/appendix2', {
                  ...rel,
                  id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                  personnelId: pId,
                });
              }
            } catch (err) {}
          }
        }

        // Sync trips to appendix1
        if (Array.isArray(formData.trips)) {
          for (const trip of formData.trips) {
            try {
              if (trip.id && !String(trip.id).startsWith('temp_')) {
                await apiClient.patch(`/items/appendix1/${trip.id}`, {
                  ...trip,
                  personnelId: pId,
                });
              } else {
                await apiClient.post('/items/appendix1', {
                  ...trip,
                  id: 'app1_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                  personnelId: pId,
                });
              }
            } catch (err) {}
          }
        }

        await this.fetchPersonnel();
        this.isDialogOpen = false;
        return saved;
      } catch (e) {
        console.error('Error saving person:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async deletePerson(person) {
      if (!person?.id) return;
      this.loading = true;
      try {
        await deletePersonnel(person.id);
        await logActivity('Xóa Cán bộ', `Xóa hồ sơ: ${person.name} (${person.code || person.id})`);
        await this.fetchPersonnel();
      } catch (e) {
        console.error('Error deleting person:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async deleteMultiple(ids) {
      if (!ids || ids.length === 0) return;
      this.loading = true;
      try {
        await deleteMultiplePersonnel(ids);
        await logActivity('Xóa nhiều Cán bộ', `Xóa hàng loạt ${ids.length} hồ sơ`);
        await this.fetchPersonnel();
      } catch (e) {
        console.error('Error deleting multiple personnel:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async deleteRelative(rel) {
      if (!rel?.id) return;
      this.loading = true;
      try {
        await apiClient.delete(`/items/appendix2/${rel.id}`);
        await logActivity('Xóa Thân nhân', `Xóa thân nhân: ${rel.relativeName || rel.name}`);
        await this.fetchPersonnel();
      } catch (e) {
        console.error('Error deleting relative:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    async deleteMultipleRelatives(ids) {
      if (!ids || ids.length === 0) return;
      this.loading = true;
      try {
        try {
          await apiClient.delete('/items/appendix2', { data: ids });
        } catch (e) {
          await Promise.allSettled(ids.map((id) => apiClient.delete(`/items/appendix2/${id}`)));
        }
        await logActivity('Xóa nhiều Thân nhân', `Xóa hàng loạt ${ids.length} thân nhân`);
        await this.fetchPersonnel();
      } catch (e) {
        console.error('Error deleting multiple relatives:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
    toggleColumn(colId) {
      if (this.visibleColumns.includes(colId)) {
        if (this.visibleColumns.length <= 1) return;
        this.visibleColumns = this.visibleColumns.filter((id) => id !== colId);
      } else {
        this.visibleColumns.push(colId);
      }
      localStorage.setItem('vue_visible_columns', JSON.stringify(this.visibleColumns));
    },
    setColumns(cols) {
      this.visibleColumns = cols;
      localStorage.setItem('vue_visible_columns', JSON.stringify(this.visibleColumns));
    },
    async renumberPersonnelCodes() {
      if (this.personnelList.length === 0 && (this.relativesList || []).length === 0) {
        alert('Chưa có dữ liệu nào trong danh sách!');
        return;
      }
      if (!confirm(`Bạn có chắc chắn muốn đánh lại Mã Cán bộ (CB-00001...) và Mã Thân nhân (TN-00001...) đồng bộ cho toàn bộ hồ sơ không?`)) {
        return;
      }
      this.loading = true;
      try {
        let cbCount = 0;
        for (let i = 0; i < this.personnelList.length; i++) {
          const p = this.personnelList[i];
          const newCode = 'CB-' + String(i + 1).padStart(5, '0');
          await updatePersonnel(p.id, { code: newCode });
          p.code = newCode;
          cbCount++;
        }

        let tnCount = 0;
        for (let j = 0; j < (this.relativesList || []).length; j++) {
          const r = this.relativesList[j];
          const newTnCode = 'TN-' + String(j + 1).padStart(5, '0');
          if (r.id) {
            try {
              await apiClient.patch(`/items/appendix2/${r.id}`, { code: newTnCode });
            } catch (err) {}
            r.code = newTnCode;
            tnCount++;
          }
        }

        await logActivity('Đánh lại Mã CB & TN', `Đã đánh lại ${cbCount} mã CB và ${tnCount} mã TN`);
        await this.fetchPersonnel();
        alert(`Đã đánh lại mã thành công cho ${cbCount} cán bộ (CB-00001 đến CB-${String(cbCount).padStart(5, '0')}) và ${tnCount} thân nhân (TN-00001 đến TN-${String(tnCount).padStart(5, '0')})!`);
      } catch (e) {
        alert('Lỗi đánh lại mã: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    getDepartmentName(deptId) {
      if (!deptId) return 'Chưa phân bổ';
      return this.departmentMap[deptId] || deptId;
    },
  },
});
