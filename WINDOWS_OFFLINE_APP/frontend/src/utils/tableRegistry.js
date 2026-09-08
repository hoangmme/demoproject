/**
 * UNIFIED TABLE REGISTRY ENGINE
 * Đồng bộ hóa toàn bộ các bảng trong hệ thống thành một mô hình Table thống nhất (Unified Table Model).
 * Loại bỏ hoàn toàn sự phân chia nhị nguyên giữa "Bảng dữ liệu hệ thống" và "Bảng dữ liệu tự tạo".
 * Mọi Bảng (Cán bộ, Thân nhân, Chuyến đi, hoặc Bảng tự tạo bất kỳ) đều là một thực thể Table hạng nhất.
 */

import { buildTopicSourceList, matchCardCondition as matchSharedCardCondition } from './dashboardMetrics';
import { computeColumnIndexMap } from './formatters';

/**
 * Lấy danh sách toàn bộ các Bảng trong hệ thống dưới dạng đối tượng chuẩn hóa
 * @param {Object} options
 * @param {Object} options.personnelStore Pinia store chứa dữ liệu hồ sơ
 * @param {Array} options.customDashboards Danh sách cấu hình bảng tự tạo / chuyên đề
 * @param {Object} options.systemBranding Cấu hình tên nhãn menu
 * @returns {Array<Object>} Mảng danh sách các bảng chuẩn hóa
 */
export function getUnifiedTableDefinitions(options = {}) {
  let store = null;
  let customDashboards = [];
  let systemBranding = {};

  if (options && (options.$id === 'personnel' || options.personnelList)) {
    store = options;
  } else if (options && typeof options === 'object') {
    store = options.personnelStore || options.store || null;
    customDashboards = options.customDashboards || [];
    systemBranding = options.systemBranding || {};
  }

  // Tự động quét và nạp toàn bộ cấu hình bảng tự tạo từ custom_dashboards_config nếu chưa được truyền
  if (!customDashboards || customDashboards.length === 0) {
    try {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customDashboards = parsed;
        }
      }
    } catch (e) {}
  }
  customDashboards = ensureStandardDashboards(customDashboards);

  const savedTripsCfg = (customDashboards || []).find(d => d.id === 'trips');
  const savedPersonnelCfg = (customDashboards || []).find(d => d.id === 'personnel');
  const savedRelativesCfg = (customDashboards || []).find(d => d.id === 'relatives');

  const corePersonnelTitle = savedPersonnelCfg?.title || systemBranding?.menuLabelPersonnel || 'Cán bộ';
  const coreRelativesTitle = savedRelativesCfg?.title || systemBranding?.menuLabelRelatives || 'Thân nhân';
  const coreTripsTitle = savedTripsCfg?.title || systemBranding?.menuLabelTrips || 'Chuyến đi';

  // Bảng 1: Chuyến đi
  const tripsTable = {
    id: 'trips',
    code: 'CD-03',
    title: coreTripsTitle,
    icon: savedTripsCfg?.icon || 'pi-send',
    iconColor: savedTripsCfg?.iconColor || '#10b981',
    source: 'trips',
    isCore: true,
    route: '/trips',
    getRows: (store) => (store ? buildTopicSourceList('trips', store) : []),
    getColumns: (store) => {
      const cols = [];
      const seen = new Set();

      (store?.importMappingTrips || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            cols.push({
              id: c.id,
              label: c.label || c.id,
              group: g.group || 'Chuyến đi',
              format: c.format || 'text',
              width: (c.tableWidth ? c.tableWidth + 'px' : c.width) || '160px',
              tableWidth: c.tableWidth || null,
              formulaType: c.formulaType,
              isVirtual: false,
            });
          }
        });
      });

      // Cột liên kết Cán bộ (mặc định để sau các cột nghiệp vụ chuyến đi)
      if (!seen.has('_parentPersonnelName')) {
        cols.push({
          id: '_parentPersonnelName',
          label: 'Cán bộ liên quan',
          group: 'Liên kết',
          format: 'text',
          width: '180px',
          isVirtual: true,
        });
        seen.add('_parentPersonnelName');
      }

      if (!seen.has('presenceStatus')) {
        cols.push({
          id: 'presenceStatus',
          label: 'Trạng thái hiện diện',
          group: 'Trạng thái',
          format: 'presence',
          width: '170px',
          isVirtual: true,
        });
      }
      return cols;
    },
    getSearchableGroups: (store) => {
      const colMap = computeColumnIndexMap(store?.importMappingTrips || []);
      return (store?.importMappingTrips || []).map((g) => ({
        name: `[${tripsTable.code}] ${coreTripsTitle} - ${g.group || 'Thông tin'}`,
        columns: (g.columns || []).filter((c) => c.id && c.id !== 'stt').map((c) => ({
          id: c.id,
          rawId: c.id,
          label: c.label || c.id,
          colIndex: colMap[c.id] ? colMap[c.id].replace(/^Cột\s+/, '') : null,
          isVirtual: false,
          format: c.format,
          formulaType: c.formulaType,
          options: c.options,
        })),
      })).filter((g) => g.columns.length > 0);
    },
  };

  // Bảng 2: Cán bộ
  const personnelTable = {
    id: 'personnel',
    title: corePersonnelTitle,
    icon: savedPersonnelCfg?.icon || 'pi-users',
    iconColor: savedPersonnelCfg?.iconColor || '#0284c7',
    source: 'personnel',
    isCore: true,
    route: '/personnel',
    getRows: (store) => (store ? buildTopicSourceList('personnel', store) : []),
    getColumns: (store) => {
      const cols = [];
      const seen = new Set();
      (store?.importMappingPersonnel || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            cols.push({
              id: c.id,
              label: c.label || c.id,
              group: g.group || 'Thông tin cán bộ',
              format: c.format || 'text',
              width: (c.tableWidth ? c.tableWidth + 'px' : c.width) || '160px',
              tableWidth: c.tableWidth || null,
              formulaType: c.formulaType,
              isVirtual: false,
            });
          }
        });
      });
      return cols;
    },
    getSearchableGroups: (store) => {
      const colMap = computeColumnIndexMap(store?.importMappingPersonnel || []);
      return (store?.importMappingPersonnel || []).map((g) => ({
        name: `[${personnelTable.code}] ${corePersonnelTitle} - ${g.group || 'Thông tin'}`,
        columns: (g.columns || []).filter((c) => c.id && c.id !== 'stt').map((c) => ({
          id: c.id,
          rawId: c.id,
          label: c.label || c.id,
          colIndex: colMap[c.id] ? colMap[c.id].replace(/^Cột\s+/, '') : null,
          isVirtual: false,
          format: c.format,
          formulaType: c.formulaType,
          options: c.options,
        })),
      })).filter((g) => g.columns.length > 0);
    },
  };

  // Bảng 3: Thân nhân
  const relativesTable = {
    id: 'relatives',
    code: 'TN-02',
    title: coreRelativesTitle,
    icon: savedRelativesCfg?.icon || 'pi-heart',
    iconColor: savedRelativesCfg?.iconColor || '#a855f7',
    source: 'relatives',
    isCore: true,
    route: '/relatives',
    getRows: (store) => (store ? buildTopicSourceList('relatives', store) : []),
    getColumns: (store) => {
      const cols = [];
      const seen = new Set();
      (store?.importMappingRelative || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            cols.push({
              id: c.id,
              label: c.label || c.id,
              group: g.group || 'Thông tin thân nhân',
              format: c.format || 'text',
              width: (c.tableWidth ? c.tableWidth + 'px' : c.width) || '160px',
              tableWidth: c.tableWidth || null,
              formulaType: c.formulaType,
              isVirtual: false,
            });
          }
        });
      });
      if (!seen.has('_parentPersonnelName')) {
        cols.push({
          id: '_parentPersonnelName',
          label: 'Cán bộ liên quan',
          group: 'Liên kết',
          format: 'text',
          width: '180px',
          isVirtual: true,
        });
      }
      return cols;
    },
    getSearchableGroups: (store) => {
      const colMap = computeColumnIndexMap(store?.importMappingRelative || []);
      return (store?.importMappingRelative || []).map((g) => ({
        name: `[${relativesTable.code}] ${coreRelativesTitle} - ${g.group || 'Thông tin'}`,
        columns: (g.columns || []).filter((c) => c.id && c.id !== 'stt').map((c) => ({
          id: c.id,
          rawId: c.id,
          label: c.label || c.id,
          colIndex: colMap[c.id] ? colMap[c.id].replace(/^Cột\s+/, '') : null,
          isVirtual: false,
          format: c.format,
          formulaType: c.formulaType,
          options: c.options,
        })),
      })).filter((g) => g.columns.length > 0);
    },
  };

  // Các Bảng Tùy chỉnh / Người dùng tạo (Custom Tables)
  const customList = (customDashboards || [])
    .filter((d) => d && d.id && d.id !== 'trips' && d.id !== 'personnel' && d.id !== 'relatives')
    .map((ct, idx) => {
      const code = ct.code || `TB-${String(idx + 1).padStart(2, '0')}`;
      return {
        id: ct.id,
        code: code,
        title: ct.title || `Bảng ${code}`,
        icon: ct.icon || 'pi-table',
        iconColor: ct.iconColor || '#f59e0b',
        source: ct.source || 'blank',
        isCore: false,
        route: `/dashboard-topic/${ct.id}`,
        rawConfig: ct,
        getRows: (store, customTableRowsMap = {}) => {
          if (ct.source === 'blank') {
            if (customTableRowsMap[ct.id] && Array.isArray(customTableRowsMap[ct.id])) {
              return customTableRowsMap[ct.id];
            }
            try {
              const local = localStorage.getItem(`custom_table_rows_${ct.id}`);
              if (local) {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed)) {
                  return parsed.map((r, rIdx) => ({
                    ...r,
                    uniqueKey: r.uniqueKey || r.id || `row_${rIdx}`,
                  }));
                }
              }
            } catch (e) {}
            return [];
          } else {
            const baseSource = ct.source || 'trips';
            const baseList = baseSource === 'personnel'
              ? (store ? buildTopicSourceList('personnel', store) : [])
              : (baseSource === 'relatives' ? (store ? buildTopicSourceList('relatives', store) : []) : (store ? buildTopicSourceList('trips', store) : []));

            const firstCard = (ct.metricCards || [])[0];
            if (firstCard && firstCard.condition && firstCard.condition !== 'all') {
              return baseList.filter((row) => matchSharedCardCondition(row, firstCard, store));
            }
            if (Array.isArray(ct.scopeConditions) && ct.scopeConditions.length > 0) {
              const scopeCard = { conditions: ct.scopeConditions, logicOp: ct.scopeLogicOp || 'AND' };
              return baseList.filter((row) => matchSharedCardCondition(row, scopeCard, store));
            }
            return baseList;
          }
        },
        getColumns: (store) => {
          const customCols = ct.customColumns || ct.columns || [];
          if (customCols.length > 0) {
            return customCols.filter((c) => c.id && c.id !== 'stt').map((c) => ({
              id: c.id,
              label: c.label || c.id,
              group: ct.title,
              format: c.format || 'text',
              width: (c.tableWidth ? c.tableWidth + 'px' : c.width) || '160px',
              tableWidth: c.tableWidth || null,
              formulaType: c.formulaType,
              isVirtual: false,
            }));
          }
          const baseSource = ct.source || 'trips';
          if (baseSource === 'personnel') return personnelTable.getColumns(store);
          if (baseSource === 'relatives') return relativesTable.getColumns(store);
          return tripsTable.getColumns(store);
        },
        getSearchableGroups: (store) => {
          const customCols = ct.customColumns || ct.columns || [];
          if (customCols.length > 0) {
            return [{
              name: `[${code}] ${ct.title}`,
              columns: customCols.filter((c) => c.id && c.id !== 'stt').map((c, cIdx) => ({
                id: c.id,
                rawId: c.id,
                label: c.label || c.id,
                colIndex: cIdx + 1,
                isVirtual: false,
                format: c.format,
                formulaType: c.formulaType,
                options: c.options,
              })),
            }].filter((g) => g.columns.length > 0);
          }
          const baseSource = ct.source || 'trips';
          if (baseSource === 'personnel') return personnelTable.getSearchableGroups(store);
          if (baseSource === 'relatives') return relativesTable.getSearchableGroups(store);
          return tripsTable.getSearchableGroups(store);
        },
      };
    });

  // Gom toàn bộ thành MỘT MẢNG THỐNG NHẤT
  return [tripsTable, personnelTable, relativesTable, ...customList];
}

/**
 * Tìm bảng theo ID trong registry
 */
export function findUnifiedTable(tableId, options = {}) {
  const tables = getUnifiedTableDefinitions(options);
  return tables.find((t) => t.id === tableId || t.source === tableId) || null;
}

/**
 * Lấy danh sách dòng dữ liệu cho một bảng bất kỳ một cách đa hình
 */
export function getUnifiedTableRows(tableId, options = {}) {
  const table = findUnifiedTable(tableId, options);
  if (!table) return [];
  return table.getRows(options.personnelStore, options.customTableRowsMap || {});
}

/**
 * Lấy danh sách cột cho một bảng bất kỳ một cách đa hình
 */
export function getUnifiedTableColumns(tableId, options = {}) {
  const table = findUnifiedTable(tableId, options);
  if (!table) return [];
  return table.getColumns(options.personnelStore);
}

/**
 * Cấu hình Mặc định cho toàn bộ Bảng trong Hệ thống (Unified Tables)
 */
export const DEFAULT_UNIFIED_DASHBOARDS = [
  {
    id: 'personnel',
    title: 'Cán bộ',
    description: 'Danh sách hồ sơ cán bộ',
    source: 'personnel',
    icon: 'pi-users',
    iconColor: '#0284c7',
    metricCards: [
      { id: 'all', label: 'Toàn bộ cán bộ', condition: 'all', color: 'blue' },
      { id: 'has_trips', label: 'Có chuyến đi', field: 'has_trips', operator: 'has_value', color: 'green' },
      { id: 'has_relatives', label: 'Có thân nhân', field: 'has_relatives', operator: 'has_value', color: 'purple' },
      { id: 'has_issues', label: 'Kỷ luật / Vấn đề', field: 'has_issues', operator: 'has_value', color: 'amber' },
    ],
    columns: [],
  },
  {
    id: 'relatives',
    title: 'Thân nhân',
    description: 'Danh sách thân nhân của cán bộ',
    source: 'relatives',
    icon: 'pi-heart',
    iconColor: '#a855f7',
    metricCards: [
      { id: 'all', label: 'Toàn bộ thân nhân', condition: 'all', color: 'blue' },
      { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
      { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
    ],
    columns: [],
  },
  {
    id: 'trips',
    title: 'Danh sách Chuyến đi',
    description: 'Tổng hợp các chuyến đi nước ngoài của cán bộ và thân nhân',
    source: 'trips',
    icon: 'pi-send',
    iconColor: '#10b981',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
      { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
      { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
      { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
    ],
    columns: [],
  },
];

/**
 * Đảm bảo các bảng chuẩn của hệ thống (personnel, relatives, trips) luôn sẵn sàng trong danh sách cấu hình
 */
export function ensureStandardDashboards(dashboards = []) {
  if (!Array.isArray(dashboards)) dashboards = [];
  const result = [...dashboards];
  DEFAULT_UNIFIED_DASHBOARDS.forEach((defDash) => {
    const existingIdx = result.findIndex((d) => d.id === defDash.id);
    if (existingIdx === -1) {
      result.push({ ...defDash });
    } else {
      if (!result[existingIdx].metricCards || result[existingIdx].metricCards.length === 0) {
        result[existingIdx].metricCards = [...defDash.metricCards];
      }
      if (!result[existingIdx].icon) {
        result[existingIdx].icon = defDash.icon;
      }
      if (!result[existingIdx].iconColor) {
        result[existingIdx].iconColor = defDash.iconColor;
      }
    }
  });
  return result;
}

/**
 * Lấy nhãn hiển thị chuẩn hóa cho một bảng bất kỳ: "Tên bảng"
 */
export function getUnifiedTableLabel(tableId, options = {}) {
  const table = findUnifiedTable(tableId, options);
  if (!table) return 'Dữ liệu';
  return table.title || 'Dữ liệu';
}
