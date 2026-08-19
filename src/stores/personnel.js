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
        { id: 'code', label: 'Mã CB', group: 'Mã định danh' },
        { id: 'name', label: 'Họ và tên', group: 'Thông tin chung' },
        { id: 'otherName', label: 'Tên gọi khác', group: 'Thông tin chung' },
        { id: 'birthYear', label: 'Năm sinh', group: 'Thông tin chung' },
        { id: 'ethnicity', label: 'Dân tộc', group: 'Thông tin chung' },
        { id: 'religion', label: 'Tôn giáo', group: 'Thông tin chung' },
        { id: 'hometown', label: 'Quê quán', group: 'Thông tin chung' },
        { id: 'departmentId', label: 'Phòng ban', group: 'Thông tin chung' },
        { id: 'position', label: 'Chức vụ', group: 'Thông tin chung' },
        { id: 'thuongTru', label: 'Nơi ĐKHK thường trú', group: 'Thông tin chung' },
        { id: 'tamTru', label: 'Nơi ở hiện nay', group: 'Thông tin chung' },
        { id: 'cccd', label: 'Số CCCD', group: 'Thông tin chung' },
        { id: 'passportPersonal', label: 'Hộ chiếu cá nhân', group: 'Thông tin chung' },
        { id: 'passportOfficial', label: 'Hộ chiếu công vụ', group: 'Thông tin chung' },
        { id: 'tcctResult', label: 'Kết quả thẩm tra TCCT', group: 'Thông tin chung' },
      ];

      (state.importMappingPersonnel || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt') {
            const exist = list.find((x) => x.id === c.id);
            if (!exist) {
              list.push({
                id: c.id,
                label: (c.label || c.id).replace(/^\[Cột \d+\]\s*/, ''),
                group: g.group || 'Thông tin chung',
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
          // Normalize JSON fields
          if (p.trips && typeof p.trips === 'string') {
            try { p.trips = JSON.parse(p.trips); } catch (e) { p.trips = []; }
          }
          if (p.relatives && typeof p.relatives === 'string') {
            try { p.relatives = JSON.parse(p.relatives); } catch (e) { p.relatives = []; }
          }
          if (p.flags && typeof p.flags === 'string') {
            try { p.flags = JSON.parse(p.flags); } catch (e) { p.flags = {}; }
          }
          if (p.custom_data && typeof p.custom_data === 'string') {
            try { p.custom_data = JSON.parse(p.custom_data); } catch (e) { p.custom_data = {}; }
          }
          return p;
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
        const payload = { ...formData };
        if (payload.trips) payload.trips = JSON.stringify(payload.trips);
        if (payload.relatives) payload.relatives = JSON.stringify(payload.relatives);
        if (payload.flags) payload.flags = JSON.stringify(payload.flags);
        if (payload.custom_data) payload.custom_data = JSON.stringify(payload.custom_data);

        let saved = null;
        if (payload.id) {
          saved = await updatePersonnel(payload.id, payload);
          await logActivity('Cập nhật Cán bộ', `Cập nhật hồ sơ: ${formData.name} (Mã: ${formData.code || formData.id})`);
        } else {
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
