import { defineStore } from 'pinia';
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
    departments: [],
    loading: false,
    selectedPerson: null,
    isDialogOpen: false,
    visibleColumns: ['code', 'name', 'birthYear', 'departmentId', 'position', 'cccd'],
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
      const list = [
        { id: 'code', label: 'Mã CB', width: '110px' },
        { id: 'name', label: 'Họ và tên', width: '200px' },
        { id: 'otherName', label: 'Tên gọi khác', width: '140px' },
        { id: 'birthYear', label: 'Năm sinh', width: '120px' },
        { id: 'ethnicity', label: 'Dân tộc', width: '110px' },
        { id: 'religion', label: 'Tôn giáo', width: '110px' },
        { id: 'hometown', label: 'Quê quán', width: '180px' },
        { id: 'departmentId', label: 'Phòng ban', width: '160px' },
        { id: 'position', label: 'Chức vụ', width: '140px' },
        { id: 'thuongTru', label: 'Nơi ĐKHK thường trú', width: '200px' },
        { id: 'tamTru', label: 'Nơi ở hiện nay', width: '200px' },
        { id: 'cccd', label: 'Số CCCD', width: '140px' },
        { id: 'passportPersonal', label: 'Hộ chiếu cá nhân', width: '150px' },
        { id: 'passportOfficial', label: 'Hộ chiếu công vụ', width: '150px' },
        { id: 'tcctResult', label: 'Kết quả thẩm tra TCCT', width: '220px' },
      ];

      (state.importMappingPersonnel || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt') {
            const exist = list.find((x) => x.id === c.id);
            if (!exist) {
              list.push({
                id: c.id,
                label: (c.label || c.id).replace(/^\[Cột \d+\]\s*/, ''),
                width: '160px',
                format: c.format || 'text',
              });
            } else if (c.label) {
              exist.label = c.label.replace(/^\[Cột \d+\]\s*/, '');
            }
          }
        });
      });
      return list;
    },
  },
  actions: {
    async init() {
      const saved = localStorage.getItem('vue_visible_columns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (!parsed.includes('name')) parsed.splice(1, 0, 'name');
            this.visibleColumns = parsed;
          }
        } catch (e) {}
      }
      await Promise.all([
        this.fetchPersonnel(),
        this.fetchDepartments(),
        this.loadSettings(),
      ]);
    },
    async fetchPersonnel() {
      this.loading = true;
      try {
        const data = await getPersonnelList();
        this.personnelList = data.map((p) => {
          let custom = {};
          if (p.custom_data) {
            try {
              custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            } catch (e) {
              custom = {};
            }
          }

          const trips = custom.trips || p.trips || custom['Khối B: Chuyến đi nước ngoài'] || [];
          const relatives = custom.relatives || p.relatives || [];
          const flags = custom.flags || p.flags || {};
          const files = custom.files || p.files || [];

          return {
            ...custom,
            ...p,
            trips: Array.isArray(trips) ? trips : [],
            relatives: Array.isArray(relatives) ? relatives : [],
            flags: typeof flags === 'object' ? flags : {},
            files: Array.isArray(files) ? files : [],
            custom_data: custom,
          };
        });
      } catch (e) {
        console.error('Error fetching personnel:', e);
      } finally {
        this.loading = false;
      }
    },
    async fetchDepartments() {
      this.departments = await getDepartments();
    },
    async loadSettings() {
      this.importMappingPersonnel = await getAppSettings('importMappingPersonnel', []);
      this.importMappingRelative = await getAppSettings('importMappingRelative', []);
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
    getDepartmentName(deptId) {
      if (!deptId) return 'Chưa phân bổ';
      return this.departmentMap[deptId] || deptId;
    },
  },
});
