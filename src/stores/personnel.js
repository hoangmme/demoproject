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
    importMappingTrips: [],
    systemKeyConfig: {
      personnelKeyField: 'cccdparent',
      relativeParentKeyField: 'cccdparent',
      relativeKeyField: 'cccdthannhan',
    },
  }),
  getters: {
    allTrips: (state) => state.tripsList || [],
    flattenedRelatives: (state) => state.relativesList || [],
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
              options: c.options || '',
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
          { id: 'cccdparent', label: 'Số CCCD', width: '140px' },
        ];
      }
      return list;
    },
    allAvailablePersonnelColumns: (state) => {
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
              options: c.options || '',
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
          { id: 'cccdparent', label: 'Số CCCD', width: '140px' },
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
              options: c.options || '',
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
    allAvailableTripColumns: (state) => {
      const list = [];
      const seen = new Set();

      (state.importMappingTrips || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            list.push({
              id: c.id,
              label: c.label || c.id,
              width: '160px',
              format: c.format || 'text',
              options: c.options || '',
              group: g.group,
            });
          }
        });
      });

      if (list.length === 0) {
        return [
          { id: 'cccdchuyendi', label: 'CCCD / Định danh người đi (cccdchuyendi)' },
          { id: 'countryName', label: 'Quốc gia / Nơi đến' },
          { id: 'departureDate', label: 'Ngày xuất cảnh' },
          { id: 'arrivalDate', label: 'Ngày nhập cảnh' },
          { id: 'decisionNumber', label: 'Số quyết định duyệt' },
          { id: 'decisionDate', label: 'Ngày quyết định' },
          { id: 'fundingName', label: 'Nguồn kinh phí' },
          { id: 'purpose', label: 'Mục đích chuyến đi' },
          { id: 'passportNumber', label: 'Số Hộ chiếu' },
          { id: 'approvedDepartureDate', label: 'Ngày đi duyệt' },
          { id: 'approvedArrivalDate', label: 'Ngày về duyệt' },
          { id: 'approvedExtensionDate', label: 'Ngày gia hạn duyệt' },
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
      let dbCols = null;
      try {
        dbCols = await getAppSettings('vue_visible_columns', null);
      } catch (e) {}

      let saved = dbCols && Array.isArray(dbCols) && dbCols.length > 0 ? dbCols : null;
      if (saved && Array.isArray(saved) && saved.length > 0) {
        const filtered = saved.filter((id) => validIds.has(id));
        if (filtered.length >= 3) {
          this.visibleColumns = filtered;
        } else {
          this.visibleColumns = this.allAvailableColumns.slice(0, 6).map((c) => c.id);
        }
      } else {
        this.visibleColumns = this.allAvailableColumns.slice(0, 6).map((c) => c.id);
      }

      const validRelativeIds = new Set(this.allAvailableRelativeColumns.map((c) => c.id));
      let dbRelCols = null;
      try {
        dbRelCols = await getAppSettings('vue_visible_relative_columns', null);
      } catch (e) {}

      let savedRel = dbRelCols && Array.isArray(dbRelCols) && dbRelCols.length > 0 ? dbRelCols : null;
      if (savedRel && Array.isArray(savedRel) && savedRel.length > 0) {
        const filtered = savedRel.filter((id) => validRelativeIds.has(id));
        if (filtered.length >= 3) {
          this.visibleRelativeColumns = filtered;
        } else {
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
        const pData = await getPersonnelList();

        const allTrips = [];
        const allRelatives = [];

        this.personnelList = (pData || []).map((p) => {
          let custom = {};
          if (p.custom_data) {
            try {
              custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            } catch (e) {
              custom = {};
            }
          }

          const personCccd = String(p.cccdparent || p.cccd || custom.cccdparent || custom.cccd || '').trim();
          const matchedTrips = p.trips || custom.trips || custom['Khối B: Chuyến đi nước ngoài'] || [];
          const matchedRelatives = p.relatives || custom.relatives || [];
          const flags = custom.flags || p.flags || {};
          const files = custom.files || p.files || [];

          // Collect relatives
          if (Array.isArray(matchedRelatives)) {
            matchedRelatives.forEach((r, rIdx) => {
              allRelatives.push({
                ...r,
                personnelId: p.id,
                personnelCode: p.code || '',
                parentName: p.name,
                parentPersonnelName: p.name,
                cccdparent: personCccd,
                parentPosition: p.positionName || p.position || '',
                parentDepartment: p.departmentName || (p.departmentId ? this.getDepartmentName(p.departmentId) : '') || '',
                code: r.code || `TN-${String(allRelatives.length + 1).padStart(5, '0')}`,
              });
            });
          }

          // Collect trips
          if (Array.isArray(matchedTrips)) {
            matchedTrips.forEach((t) => {
              allTrips.push({
                ...t,
                personnelId: p.id,
                personnelCode: p.code || '',
                personnelName: p.name,
              });
            });
          }

          let extractedDept = (
            p.departmentName ||
            (p.departmentId ? this.getDepartmentName(p.departmentId) : '') ||
            custom.departmentName ||
            custom.don_vi_cong_tac ||
            custom.don_vi ||
            custom.phong_ban ||
            custom.donViCongTac ||
            custom.donVi ||
            ''
          );

          if (!extractedDept) {
            for (const [k, v] of Object.entries(custom)) {
              const cleanK = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
              if (
                (cleanK.includes('donvi') || cleanK.includes('phongban') || cleanK.includes('coquan') || cleanK.includes('department')) &&
                v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-' && String(v).trim() !== 'Chưa phân bổ'
              ) {
                extractedDept = String(v).trim();
                break;
              }
            }
          }
          const extractedPosition = (
            p.positionName ||
            p.position ||
            custom.positionName ||
            custom.position ||
            custom.chuc_vu ||
            custom.chucVu ||
            ''
          );

          return {
            ...custom,
            ...p,
            cccdparent: personCccd,
            position: extractedPosition,
            positionName: extractedPosition,
            departmentName: extractedDept,
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

        this.tripsList = allTrips;
        this.relativesList = allRelatives;
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
      const [pMap, rMap, tMap, keyCfg] = await Promise.all([
        getAppSettings('mapping_config_personnel', null),
        getAppSettings('mapping_config_relative', null),
        getAppSettings('mapping_config_trips', null),
        getAppSettings('system_key_config', null),
      ]);

      this.importMappingPersonnel = pMap || [];

      if (rMap && rMap.length > 0) {
        this.importMappingRelative = rMap;
      } else {
        this.importMappingRelative = [
          {
            group: 'Thông tin Thân nhân',
            isMultiple: true,
            columns: [
              { id: 'parentName', label: 'Họ tên Cán bộ', width: '25', format: 'text' },
              { id: 'cccdparent', label: 'CCCD Cán bộ liên quan', width: '25', format: 'text' },
              { id: 'relationshipName', label: 'Mối quan hệ', width: '25', format: 'dropdown', options: 'Bố, Mẹ, Vợ, Chồng, Con đẻ, Con nuôi, Anh, Chị, Em ruột, Bố chồng/vợ, Mẹ chồng/vợ' },
              { id: 'relativeName', label: 'Họ và tên thân nhân', width: '25', format: 'text' },
              { id: 'cccdthannhan', label: 'CCCD thân nhân', width: '25', format: 'text' },
              { id: 'birthYear', label: 'Năm sinh', width: '25', format: 'number' },
              { id: 'currentAddress', label: 'Nơi ở hiện nay', width: '50', format: 'text' },
              { id: 'occupation', label: 'Nghề nghiệp / Nơi làm việc', width: '50', format: 'text' },
              { id: 'countryName', label: 'Quốc gia định cư / lưu trú', width: '33', format: 'text' },
              { id: 'passportNumber', label: 'Số Hộ chiếu thân nhân', width: '25', format: 'text' },
              { id: 'notes', label: 'Ghi chú', width: '50', format: 'text' },
            ],
          },
        ];
      }

      if (tMap && tMap.length > 0) {
        this.importMappingTrips = tMap;
      } else {
        this.importMappingTrips = [
          {
            group: 'Thông tin chuyến đi xuất nhập cảnh',
            isMultiple: false,
            columns: [
              { id: 'cccdchuyendi', label: 'CCCD / Định danh người đi (cccdchuyendi)', width: '25', format: 'text', placeholder: 'Nhập CCCD Cán bộ hoặc Thân nhân' },
              { id: 'countryName', label: 'Quốc gia / Nơi đến', width: '33', format: 'text', placeholder: 'Nhập quốc gia' },
              { id: 'departureDate', label: 'Ngày xuất cảnh', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
              { id: 'arrivalDate', label: 'Ngày nhập cảnh', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
              { id: 'decisionNumber', label: 'Số quyết định duyệt', width: '33', format: 'text', placeholder: 'VD: 1234/QĐ-UBND' },
              { id: 'decisionDate', label: 'Ngày quyết định', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
              { id: 'fundingName', label: 'Nguồn kinh phí', width: '33', format: 'dropdown', options: 'Ngân sách nhà nước, Tài trợ, Tự túc, Khác' },
              { id: 'purpose', label: 'Mục đích chuyến đi', width: '50', format: 'text', placeholder: 'Công tác, Du lịch, Thăm thân...' },
              { id: 'passportNumber', label: 'Số Hộ chiếu', width: '25', format: 'text' },
              { id: 'approvedDepartureDate', label: 'Ngày đi duyệt', width: '25', format: 'date' },
              { id: 'approvedArrivalDate', label: 'Ngày về duyệt', width: '25', format: 'date' },
              { id: 'approvedExtensionDate', label: 'Ngày gia hạn duyệt', width: '25', format: 'date' },
            ],
          },
        ];
      }

      if (keyCfg && typeof keyCfg === 'object') {
        this.systemKeyConfig = {
          personnelKeyField: keyCfg.personnelKeyField || 'cccdparent',
          personnelNameField: keyCfg.personnelNameField || 'name',
          personnelPositionField: keyCfg.personnelPositionField || 'position',
          personnelDepartmentField: keyCfg.personnelDepartmentField || 'departmentName',
          relativeParentKeyField: keyCfg.relativeParentKeyField || 'cccdparent',
          relativeKeyField: keyCfg.relativeKeyField || 'cccdthannhan',
          tripKeyField: keyCfg.tripKeyField || 'cccdchuyendi',
        };
      }
    },
    getPersonnelKeyField() {
      return this.systemKeyConfig?.personnelKeyField || 'cccdparent';
    },
    getPersonnelNameField() {
      return this.systemKeyConfig?.personnelNameField || 'name';
    },
    getPersonnelPositionField() {
      return this.systemKeyConfig?.personnelPositionField || 'position';
    },
    getPersonnelDepartmentField() {
      return this.systemKeyConfig?.personnelDepartmentField || 'departmentName';
    },
    getRelativeParentKeyField() {
      return this.systemKeyConfig?.relativeParentKeyField || 'cccdparent';
    },
    getRelativeKeyField() {
      return this.systemKeyConfig?.relativeKeyField || 'cccdthannhan';
    },
    getTripKeyField() {
      return this.systemKeyConfig?.tripKeyField || 'cccdchuyendi';
    },
    findPersonByCccd(val) {
      if (!val) return null;
      const cleanVal = String(val).trim().toLowerCase();
      const pField = this.getPersonnelKeyField();
      return (this.personnelList || []).find((p) => {
        const cccd = String(p[pField] || p.cccd || p.cccdparent || p.custom_data?.[pField] || '').trim().toLowerCase();
        const code = String(p.code || '').trim().toLowerCase();
        const id = String(p.id || '').trim().toLowerCase();
        return cccd === cleanVal || code === cleanVal || id === cleanVal;
      }) || null;
    },
    findRelativeByCccd(val) {
      if (!val) return null;
      const cleanVal = String(val).trim().toLowerCase();
      const rField = this.getRelativeKeyField();
      return (this.relativesList || []).find((r) => {
        const cccd = String(r[rField] || r.cccd || r.cccdthannhan || r.custom_data?.[rField] || '').trim().toLowerCase();
        const code = String(r.code || '').trim().toLowerCase();
        const id = String(r.id || '').trim().toLowerCase();
        return cccd === cleanVal || code === cleanVal || id === cleanVal;
      }) || null;
    },
    async savePerson(formData) {
      this.loading = true;
      try {
        if (!formData) throw new Error('Dữ liệu cán bộ không hợp lệ');

        // 1. Unnest and sanitize customData recursively to eliminate any nested custom_data
        let customData = {};
        if (formData.custom_data) {
          let cd = formData.custom_data;
          if (typeof cd === 'string') {
            try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
          }
          if (typeof cd === 'object' && cd !== null) {
            customData = { ...cd };
          }
        }

        // Recursively unnest any legacy nested custom_data
        let unnestDepth = 0;
        while (customData.custom_data && unnestDepth < 20) {
          unnestDepth++;
          let nested = customData.custom_data;
          delete customData.custom_data;
          if (typeof nested === 'string') {
            try { nested = JSON.parse(nested); } catch (e) { nested = null; }
          }
          if (nested && typeof nested === 'object') {
            customData = { ...nested, ...customData };
          }
        }

        // Clean out runtime / circular / transient properties from customData
        delete customData.rawPerson;
        delete customData.rawRelative;
        delete customData.rawTrip;
        delete customData.uniqueKey;
        delete customData.parentPerson;
        delete customData.parentPersonnel;
        delete customData.isDeleted;
        delete customData['Khối B: Chuyến đi nước ngoài'];

        // 2. Extract strictly core database keys for Directus root payload
        const coreKeys = ['id', 'code', 'name', 'cccd', 'birthYear', 'departmentId', 'position'];
        const skipKeys = [
          'custom_data',
          'rawPerson',
          'rawRelative',
          'rawTrip',
          'uniqueKey',
          'trips',
          'relatives',
          'flags',
          'files',
          'isDeleted',
        ];

        const payload = {};
        Object.keys(formData).forEach((k) => {
          if (coreKeys.includes(k)) {
            if (formData[k] !== undefined && formData[k] !== null) {
              payload[k] = formData[k];
            }
          } else if (!skipKeys.includes(k)) {
            // Dynamic custom columns (and any other profile fields) go cleanly into customData
            customData[k] = formData[k];
          }
        });

        // 3. Ensure CCCD is synchronized
        const cccdVal = formData.cccdparent || formData.cccd || customData.cccdparent || customData.cccd || '';
        if (cccdVal) {
          payload.cccd = String(cccdVal).trim();
          customData.cccdparent = String(cccdVal).trim();
          customData.cccd = String(cccdVal).trim();
        }

        // 4. Attach trips, relatives, flags, files into customData
        if (Array.isArray(formData.trips)) {
          customData.trips = formData.trips.map((t) => {
            const cleanT = { ...t };
            delete cleanT.rawPerson;
            delete cleanT.rawRelative;
            delete cleanT.rawTrip;
            return cleanT;
          });
        }
        if (Array.isArray(formData.relatives)) {
          customData.relatives = formData.relatives.map((r) => {
            const cleanR = { ...r };
            delete cleanR.rawPerson;
            delete cleanR.rawRelative;
            delete cleanR.rawTrip;
            return cleanR;
          });
        }
        if (formData.flags && typeof formData.flags === 'object') {
          customData.flags = formData.flags;
        }
        if (formData.files && Array.isArray(formData.files)) {
          customData.files = formData.files;
        }

        // 5. Final check to guarantee no custom_data recursion
        delete customData.custom_data;
        payload.custom_data = JSON.stringify(customData);

        let saved = null;
        if (payload.id) {
          saved = await updatePersonnel(payload.id, payload);
          logActivity('Cập nhật Cán bộ', `Cập nhật hồ sơ: ${formData.name || payload.name} (${formData.code || payload.code || payload.id})`).catch(() => {});
        } else {
          payload.id = 'CB-' + Date.now();
          if (!payload.code) payload.code = payload.id;
          saved = await createPersonnel(payload);
          logActivity('Tạo Cán bộ mới', `Tạo mới hồ sơ: ${formData.name || payload.name}`).catch(() => {});
        }

        // 6. Fast optimistic in-memory update
        const fullSavedObj = {
          ...payload,
          ...customData,
          custom_data: JSON.stringify(customData),
          trips: Array.isArray(customData.trips) ? customData.trips : [],
          relatives: Array.isArray(customData.relatives) ? customData.relatives : [],
          flags: customData.flags || {},
          files: customData.files || [],
        };

        const existingIdx = this.personnelList.findIndex((p) => String(p.id) === String(payload.id));
        if (existingIdx !== -1) {
          this.personnelList[existingIdx] = { ...this.personnelList[existingIdx], ...fullSavedObj };
        } else {
          this.personnelList.unshift(fullSavedObj);
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
      if (!rel) return;
      this.loading = true;
      try {
        const isSameRel = (r) => {
          if (!r || !rel) return false;
          if (r === rel || r === rel.rawRelative) return true;
          if (r.id && rel.id && String(r.id) === String(rel.id)) return true;
          if (r.code && rel.code && String(r.code) === String(rel.code)) return true;
          const c1 = String(r.cccdthannhan || r.cccd || '').trim();
          const c2 = String(rel.cccdthannhan || rel.cccd || '').trim();
          if (c1 && c2 && c1 === c2) return true;
          const n1 = String(r.relativeName || r.name || '').trim().toLowerCase();
          const n2 = String(rel.relativeName || rel.name || '').trim().toLowerCase();
          const s1 = String(r.relationshipName || r.relationship || '').trim().toLowerCase();
          const s2 = String(rel.relationshipName || rel.relationship || '').trim().toLowerCase();
          if (n1 && n2 && n1 === n2 && s1 && s2 && s1 === s2) return true;
          if (n1 && n2 && n1 === n2 && (c1 || c2 ? c1 === c2 : true)) return true;
          return false;
        };

        for (const p of this.personnelList) {
          let custom = {};
          if (p.custom_data) {
            try {
              custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            } catch (e) {}
          }
          const relsInP = Array.isArray(p.relatives) ? p.relatives : (Array.isArray(custom.relatives) ? custom.relatives : []);
          const isTargetP = relsInP.some(isSameRel) || (rel.personnelId && String(p.id) === String(rel.personnelId)) || (rel.cccdparent && (p.cccd === rel.cccdparent || p.cccdparent === rel.cccdparent));
          
          if (isTargetP) {
            const updatedP = JSON.parse(JSON.stringify(p));
            updatedP.relatives = relsInP.filter((r) => !isSameRel(r));
            custom.relatives = updatedP.relatives;
            updatedP.custom_data = custom;
            await this.savePerson(updatedP);
            break;
          }
        }

        if (rel.id) {
          await apiClient.delete(`/items/appendix2/${rel.id}`).catch(() => {});
        }

        await logActivity('Xóa Thân nhân', `Xóa thân nhân: ${rel.relativeName || rel.name || rel.id}`).catch(() => {});
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
        const idSet = new Set(ids.map((x) => String(x)));
        for (const p of this.personnelList) {
          if (Array.isArray(p.relatives)) {
            const hasMatch = p.relatives.some((r) => idSet.has(String(r.id)) || idSet.has(String(r.code)) || idSet.has(String(r.cccdthannhan)) || idSet.has(String(r.cccd)));
            if (hasMatch) {
              const updatedP = JSON.parse(JSON.stringify(p));
              updatedP.relatives = updatedP.relatives.filter((r) => !idSet.has(String(r.id)) && !idSet.has(String(r.code)) && !idSet.has(String(r.cccdthannhan)) && !idSet.has(String(r.cccd)));
              await this.savePerson(updatedP);
            }
          }
        }

        try {
          await apiClient.delete('/items/appendix2', { data: ids });
        } catch (e) {
          await Promise.allSettled(ids.map((id) => apiClient.delete(`/items/appendix2/${id}`)));
        }
        await logActivity('Xóa nhiều Thân nhân', `Xóa hàng loạt ${ids.length} thân nhân`).catch(() => {});
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
      saveAppSettings('vue_visible_columns', this.visibleColumns).catch(() => {});
    },
    setColumns(cols) {
      this.visibleColumns = cols;
      saveAppSettings('vue_visible_columns', this.visibleColumns).catch(() => {});
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
      if (!deptId) return '';
      return this.departmentMap[deptId] || deptId;
    },
    async seedSampleTripsData() {
      this.loading = true;
      try {
        // 1. Ensure we have at least 10 Cán bộ & 10 Thân nhân in system
        const sampleCbList = [
          { name: 'Nguyễn Văn An', cccd: '001085001234', position: 'Trưởng phòng', departmentName: 'Phòng Kế hoạch', birthYear: 1985 },
          { name: 'Trần Thị Bích', cccd: '001188002345', position: 'Phó Giám đốc', departmentName: 'Phòng Tổ chức', birthYear: 1988 },
          { name: 'Lê Hoàng Cường', cccd: '001090003456', position: 'Chuyên viên chính', departmentName: 'Phòng Kế hoạch', birthYear: 1990 },
          { name: 'Phạm Minh Đức', cccd: '001082004567', position: 'Giám đốc Trung tâm', departmentName: 'Ban Quản lý', birthYear: 1982 },
          { name: 'Hoàng Thu Hà', cccd: '001192005678', position: 'Phó Trưởng phòng', departmentName: 'Phòng Tài chính', birthYear: 1992 },
          { name: 'Đặng Quốc Hùng', cccd: '001087006789', position: 'Trưởng phòng', departmentName: 'Phòng Hợp tác Quốc tế', birthYear: 1987 },
          { name: 'Vũ Thị Lan', cccd: '001195007890', position: 'Chuyên viên', departmentName: 'Văn phòng', birthYear: 1995 },
          { name: 'Bùi Quang Minh', cccd: '001089008901', position: 'Phó Chánh Văn phòng', departmentName: 'Văn phòng', birthYear: 1989 },
          { name: 'Ngô Hồng Nhung', cccd: '001193009012', position: 'Kế toán trưởng', departmentName: 'Phòng Tài chính', birthYear: 1993 },
          { name: 'Đỗ Tuấn Phong', cccd: '001084010123', position: 'Thanh tra viên', departmentName: 'Thanh tra', birthYear: 1984 },
        ];

        const sampleTnList = [
          { relativeName: 'Nguyễn Văn Bình', cccdthannhan: '001202001111', relationshipName: 'Con đẻ', parentName: 'Nguyễn Văn An', cccdparent: '001085001234', birthYear: 2002 },
          { relativeName: 'Trần Đức Anh', cccdthannhan: '001086002222', relationshipName: 'Chồng', parentName: 'Trần Thị Bích', cccdparent: '001188002345', birthYear: 1986 },
          { relativeName: 'Lê Mai Chi', cccdthannhan: '001192003333', relationshipName: 'Vợ', parentName: 'Lê Hoàng Cường', cccdparent: '001090003456', birthYear: 1992 },
          { relativeName: 'Phạm Khánh Linh', cccdthannhan: '001205004444', relationshipName: 'Con đẻ', parentName: 'Phạm Minh Đức', cccdparent: '001082004567', birthYear: 2005 },
          { relativeName: 'Hoàng Hải Đăng', cccdthannhan: '001096005555', relationshipName: 'Em ruột', parentName: 'Hoàng Thu Hà', cccdparent: '001192005678', birthYear: 1996 },
          { relativeName: 'Đặng Bảo Ngọc', cccdthannhan: '001208006666', relationshipName: 'Con đẻ', parentName: 'Đặng Quốc Hùng', cccdparent: '001087006789', birthYear: 2008 },
          { relativeName: 'Vũ Quốc Tuấn', cccdthannhan: '001091007777', relationshipName: 'Anh ruột', parentName: 'Vũ Thị Lan', cccdparent: '001195007890', birthYear: 1991 },
          { relativeName: 'Bùi Gia Hân', cccdthannhan: '001210008888', relationshipName: 'Con đẻ', parentName: 'Bùi Quang Minh', cccdparent: '001089008901', birthYear: 2010 },
          { relativeName: 'Ngô Minh Trí', cccdthannhan: '001058009999', relationshipName: 'Bố đẻ', parentName: 'Ngô Hồng Nhung', cccdparent: '001193009012', birthYear: 1958 },
          { relativeName: 'Đỗ Thị Thanh Tâm', cccdthannhan: '001187010000', relationshipName: 'Vợ', parentName: 'Đỗ Tuấn Phong', cccdparent: '001084010123', birthYear: 1987 },
        ];

        // Ensure Cán bộ exist
        const pMap = {};
        for (let i = 0; i < sampleCbList.length; i++) {
          const item = sampleCbList[i];
          let found = this.findPersonByCccd(item.cccd);
          if (!found) {
            const newCode = 'CB-' + String(i + 1).padStart(5, '0');
            const created = await createPersonnel({
              code: newCode,
              name: item.name,
              cccd: item.cccd,
              cccdparent: item.cccd,
              position: item.position,
              positionName: item.position,
              departmentName: item.departmentName,
              birthYear: item.birthYear,
            });
            found = created || { id: 'p_' + Date.now() + '_' + i, ...item, code: newCode };
          }
          pMap[item.cccd] = found;
        }

        // Ensure Thân nhân exist
        for (let j = 0; j < sampleTnList.length; j++) {
          const rItem = sampleTnList[j];
          const found = this.findRelativeByCccd(rItem.cccdthannhan);
          if (!found) {
            const parentP = pMap[rItem.cccdparent];
            const newTnCode = 'TN-' + String(j + 1).padStart(5, '0');
            try {
              await apiClient.post('/items/appendix2', {
                code: newTnCode,
                personnelId: parentP?.id || '',
                parentName: rItem.parentName,
                cccdparent: rItem.cccdparent,
                relationshipName: rItem.relationshipName,
                relativeName: rItem.relativeName,
                cccdthannhan: rItem.cccdthannhan,
                birthYear: rItem.birthYear,
                currentAddress: 'Hà Nội, Việt Nam',
                countryName: '',
              });
            } catch (err) {}
          }
        }

        // 2. 20 Sample Trips (10 CB + 10 TN)
        const sampleTrips = [
          // 10 Chuyến đi của Cán bộ (CB)
          {
            cccdchuyendi: '001085001234',
            countryName: 'Nhật Bản',
            departureDate: '10/01/2025',
            arrivalDate: '18/01/2025',
            decisionNumber: '102/QĐ-UBND',
            decisionDate: '05/01/2025',
            fundingName: 'Ngân sách nhà nước',
            purpose: 'Tham gia hội thảo xúc tiến đầu tư công nghệ cao',
            passportNumber: 'C8291029',
            approvedDepartureDate: '10/01/2025',
            approvedArrivalDate: '18/01/2025',
          },
          {
            cccdchuyendi: '001188002345',
            countryName: 'Đức',
            departureDate: '15/03/2025',
            arrivalDate: '25/03/2025',
            decisionNumber: '245/QĐ-BCT',
            decisionDate: '01/03/2025',
            fundingName: 'Tài trợ',
            purpose: 'Khảo sát chuyển đổi năng lượng xanh',
            passportNumber: 'B9102934',
            approvedDepartureDate: '15/03/2025',
            approvedArrivalDate: '25/03/2025',
          },
          {
            cccdchuyendi: '001090003456',
            countryName: 'Hàn Quốc',
            departureDate: '12/04/2025',
            arrivalDate: '20/04/2025',
            decisionNumber: '318/QĐ-BNG',
            decisionDate: '02/04/2025',
            fundingName: 'Ngân sách nhà nước',
            purpose: 'Tập huấn nghiệp vụ quản lý đô thị thông minh',
            passportNumber: 'C1122334',
            approvedDepartureDate: '12/04/2025',
            approvedArrivalDate: '20/04/2025',
          },
          {
            cccdchuyendi: '001082004567',
            countryName: 'Singapore',
            departureDate: '05/05/2025',
            arrivalDate: '10/05/2025',
            decisionNumber: '412/QĐ-UBND',
            decisionDate: '28/04/2025',
            fundingName: 'Tự túc',
            purpose: 'Nghỉ phép và du lịch cá nhân',
            passportNumber: 'B7788990',
            approvedDepartureDate: '05/05/2025',
            approvedArrivalDate: '10/05/2025',
          },
          {
            cccdchuyendi: '001192005678',
            countryName: 'Pháp',
            departureDate: '20/06/2025',
            arrivalDate: '30/06/2025',
            decisionNumber: '520/QĐ-BYT',
            decisionDate: '10/06/2025',
            fundingName: 'Tài trợ',
            purpose: 'Tham dự Diễn đàn Y tế & Sức khỏe cộng đồng',
            passportNumber: 'C3344556',
            approvedDepartureDate: '20/06/2025',
            approvedArrivalDate: '30/06/2025',
          },
          {
            cccdchuyendi: '001087006789',
            countryName: 'Úc',
            departureDate: '14/07/2025',
            arrivalDate: '26/07/2025',
            decisionNumber: '605/QĐ-BGD',
            decisionDate: '01/07/2025',
            fundingName: 'Ngân sách nhà nước',
            purpose: 'Trao đổi hợp tác giáo dục và đào tạo sau đại học',
            passportNumber: 'C5566778',
            approvedDepartureDate: '14/07/2025',
            approvedArrivalDate: '26/07/2025',
          },
          {
            cccdchuyendi: '001195007890',
            countryName: 'Trung Quốc',
            departureDate: '08/09/2025',
            arrivalDate: '16/09/2025',
            decisionNumber: '719/QĐ-BKH',
            decisionDate: '25/08/2025',
            fundingName: 'Ngân sách nhà nước',
            purpose: 'Tham quan triển lãm thương mại quốc tế Thượng Hải',
            passportNumber: 'B2233445',
            approvedDepartureDate: '08/09/2025',
            approvedArrivalDate: '16/09/2025',
          },
          {
            cccdchuyendi: '001089008901',
            countryName: 'Mỹ',
            departureDate: '10/11/2025',
            arrivalDate: '25/11/2025',
            decisionNumber: '830/QĐ-UBND',
            decisionDate: '20/10/2025',
            fundingName: 'Tài trợ',
            purpose: 'Tham gia khóa bồi dưỡng lãnh đạo quản lý công',
            passportNumber: 'C9988776',
            approvedDepartureDate: '10/11/2025',
            approvedArrivalDate: '25/11/2025',
          },
          {
            cccdchuyendi: '001193009012',
            countryName: 'Thái Lan',
            departureDate: '02/12/2025',
            arrivalDate: '07/12/2025',
            decisionNumber: '915/QĐ-BTT',
            decisionDate: '20/11/2025',
            fundingName: 'Tự túc',
            purpose: 'Thăm thân nhân kết hợp du lịch',
            passportNumber: 'B6677889',
            approvedDepartureDate: '02/12/2025',
            approvedArrivalDate: '07/12/2025',
          },
          {
            cccdchuyendi: '001084010123',
            countryName: 'Canada',
            departureDate: '15/01/2026',
            arrivalDate: '30/01/2026',
            decisionNumber: '045/QĐ-BNV',
            decisionDate: '05/01/2026',
            fundingName: 'Khác',
            purpose: 'Giao lưu trao đổi văn hóa và hành chính công',
            passportNumber: 'C4455667',
            approvedDepartureDate: '15/01/2026',
            approvedArrivalDate: '30/01/2026',
          },

          // 10 Chuyến đi của Thân nhân (TN)
          {
            cccdchuyendi: '001202001111',
            countryName: 'Mỹ',
            departureDate: '01/02/2025',
            arrivalDate: '20/02/2025',
            decisionNumber: 'QĐ-TN-01',
            decisionDate: '15/01/2025',
            fundingName: 'Tự túc',
            purpose: 'Du học ngắn hạn và tham quan trường đại học',
            passportNumber: 'B1122331',
            approvedDepartureDate: '01/02/2025',
            approvedArrivalDate: '20/02/2025',
          },
          {
            cccdchuyendi: '001086002222',
            countryName: 'Đức',
            departureDate: '15/03/2025',
            arrivalDate: '25/03/2025',
            decisionNumber: 'QĐ-TN-02',
            decisionDate: '01/03/2025',
            fundingName: 'Tự túc',
            purpose: 'Đi cùng cán bộ công tác kết hợp thăm người thân',
            passportNumber: 'B2233442',
            approvedDepartureDate: '15/03/2025',
            approvedArrivalDate: '25/03/2025',
          },
          {
            cccdchuyendi: '001192003333',
            countryName: 'Hàn Quốc',
            departureDate: '12/04/2025',
            arrivalDate: '20/04/2025',
            decisionNumber: 'QĐ-TN-03',
            decisionDate: '02/04/2025',
            fundingName: 'Tự túc',
            purpose: 'Du lịch và nghỉ dưỡng gia đình',
            passportNumber: 'B3344553',
            approvedDepartureDate: '12/04/2025',
            approvedArrivalDate: '20/04/2025',
          },
          {
            cccdchuyendi: '001205004444',
            countryName: 'Singapore',
            departureDate: '05/05/2025',
            arrivalDate: '10/05/2025',
            decisionNumber: 'QĐ-TN-04',
            decisionDate: '28/04/2025',
            fundingName: 'Tự túc',
            purpose: 'Du lịch cùng gia đình',
            passportNumber: 'B4455664',
            approvedDepartureDate: '05/05/2025',
            approvedArrivalDate: '10/05/2025',
          },
          {
            cccdchuyendi: '001096005555',
            countryName: 'Pháp',
            departureDate: '01/08/2025',
            arrivalDate: '30/08/2025',
            decisionNumber: 'QĐ-TN-05',
            decisionDate: '15/07/2025',
            fundingName: 'Tài trợ',
            purpose: 'Tham gia khóa học trao đổi sinh viên quốc tế',
            passportNumber: 'B5566775',
            approvedDepartureDate: '01/08/2025',
            approvedArrivalDate: '30/08/2025',
          },
          {
            cccdchuyendi: '001208006666',
            countryName: 'Úc',
            departureDate: '10/09/2025',
            arrivalDate: '25/09/2025',
            decisionNumber: 'QĐ-TN-06',
            decisionDate: '01/09/2025',
            fundingName: 'Tự túc',
            purpose: 'Nhập học chương trình liên kết đào tạo',
            passportNumber: 'B6677886',
            approvedDepartureDate: '10/09/2025',
            approvedArrivalDate: '25/09/2025',
          },
          {
            cccdchuyendi: '001091007777',
            countryName: 'Trung Quốc',
            departureDate: '05/10/2025',
            arrivalDate: '15/10/2025',
            decisionNumber: 'QĐ-TN-07',
            decisionDate: '20/09/2025',
            fundingName: 'Tự túc',
            purpose: 'Tìm hiểu thị trường và khảo sát nguồn hàng',
            passportNumber: 'B7788997',
            approvedDepartureDate: '05/10/2025',
            approvedArrivalDate: '15/10/2025',
          },
          {
            cccdchuyendi: '001210008888',
            countryName: 'Anh',
            departureDate: '01/11/2025',
            arrivalDate: '15/11/2025',
            decisionNumber: 'QĐ-TN-08',
            decisionDate: '15/10/2025',
            fundingName: 'Tài trợ',
            purpose: 'Tham dự kỳ thi Olympic học sinh quốc tế',
            passportNumber: 'B8899008',
            approvedDepartureDate: '01/11/2025',
            approvedArrivalDate: '15/11/2025',
          },
          {
            cccdchuyendi: '001058009999',
            countryName: 'Thái Lan',
            departureDate: '02/12/2025',
            arrivalDate: '07/12/2025',
            decisionNumber: 'QĐ-TN-09',
            decisionDate: '20/11/2025',
            fundingName: 'Tự túc',
            purpose: 'Nghỉ dưỡng và khám sức khỏe định kỳ',
            passportNumber: 'B9900119',
            approvedDepartureDate: '02/12/2025',
            approvedArrivalDate: '07/12/2025',
          },
          {
            cccdchuyendi: '001187010000',
            countryName: 'Canada',
            departureDate: '15/01/2026',
            arrivalDate: '30/01/2026',
            decisionNumber: 'QĐ-TN-10',
            decisionDate: '05/01/2026',
            fundingName: 'Tự túc',
            purpose: 'Thăm người thân tại Vancouver',
            passportNumber: 'B0011220',
            approvedDepartureDate: '15/01/2026',
            approvedArrivalDate: '30/01/2026',
          },
        ];

        // 3. Attach trips directly into Cán bộ profiles and save to DB
        for (let i = 0; i < 10; i++) {
          const cbFallback = sampleCbList[i];
          const person = this.personnelList[i] || this.findPersonByCccd(cbFallback.cccd) || pMap[cbFallback.cccd];
          if (!person) continue;

          const cbTrip = sampleTrips[i];
          const tnItem = sampleTnList[i];
          const tnTrip = sampleTrips[i + 10];

          const personCccd = person.cccd || person.cccdparent || cbFallback.cccd;
          const personName = person.name || cbFallback.name;

          // Prepare trips for this person (1 trip for CB, 1 trip for relative)
          const tripsForPerson = [
            {
              id: 'trip_cb_' + Date.now() + '_' + i,
              ...cbTrip,
              cccdchuyendi: personCccd,
              personnelId: person.id,
              personnelCode: person.code,
              personnelName: personName,
              quoc_gia_xuat_canh: cbTrip.countryName,
              nguon_kinh_phi: cbTrip.fundingName,
            },
            {
              id: 'trip_tn_' + Date.now() + '_' + i,
              ...tnTrip,
              isRelative: true,
              cccdchuyendi: tnItem.cccdthannhan,
              personnelId: person.id,
              personnelCode: person.code,
              parentName: personName,
              cccdparent: personCccd,
              relativeName: tnItem.relativeName,
              cccdthannhan: tnItem.cccdthannhan,
              relationshipName: tnItem.relationshipName,
              quoc_gia_xuat_canh: tnTrip.countryName,
              nguon_kinh_phi: tnTrip.fundingName,
            },
          ];

          // Prepare relatives for this person
          const relativesForPerson = [
            {
              id: 'rel_' + Date.now() + '_' + i,
              parentName: personName,
              cccdparent: personCccd,
              relationshipName: tnItem.relationshipName,
              relativeName: tnItem.relativeName,
              cccdthannhan: tnItem.cccdthannhan,
              birthYear: tnItem.birthYear,
              currentAddress: 'Hà Nội, Việt Nam',
              occupation: 'Lao động tự do',
              countryName: tnTrip.countryName,
              trips: [
                {
                  id: 'trip_rel_' + Date.now() + '_' + i,
                  ...tnTrip,
                  cccdchuyendi: tnItem.cccdthannhan,
                  personnelId: person.id,
                },
              ],
            },
          ];

          // Merge into person profile and save directly to DB
          const updatedPersonData = {
            ...person,
            trips: tripsForPerson,
            relatives: relativesForPerson,
          };

          await this.savePerson(updatedPersonData);
        }

        await this.fetchPersonnel();
        await logActivity('Tạo Dữ liệu Mẫu', 'Đã lưu 20 chuyến đi trực tiếp vào hồ sơ Cán bộ & Thân nhân');
        return true;
      } catch (e) {
        console.error('Error seeding sample trips data:', e);
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
