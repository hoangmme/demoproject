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
  const {
    personnelStore,
    customDashboards = [],
    systemBranding = {},
  } = options;

  const corePersonnelTitle = systemBranding?.menuLabelPersonnel || 'Cán bộ';
  const coreRelativesTitle = systemBranding?.menuLabelRelatives || 'Thân nhân';
  const coreTripsTitle = systemBranding?.menuLabelTrips || 'Chuyến đi';

  // Bảng 1: Chuyến đi [CD-03]
  const tripsTable = {
    id: 'trips',
    code: 'CD-03',
    title: coreTripsTitle,
    icon: 'pi-send',
    source: 'trips',
    isCore: true,
    route: '/trips',
    getRows: (store) => (store ? buildTopicSourceList('trips', store) : []),
    getColumns: (store) => {
      const cols = [];
      const seen = new Set();
      // Cột liên kết Cán bộ
      cols.push({
        id: '_parentPersonnelName',
        label: 'Cán bộ (Họ và tên)',
        group: 'Liên kết',
        format: 'text',
        width: '180px',
        isVirtual: true,
      });
      seen.add('_parentPersonnelName');

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

  // Bảng 2: Cán bộ [CB-01]
  const personnelTable = {
    id: 'personnel',
    code: 'CB-01',
    title: corePersonnelTitle,
    icon: 'pi-users',
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

  // Bảng 3: Thân nhân [TN-02]
  const relativesTable = {
    id: 'relatives',
    code: 'TN-02',
    title: coreRelativesTitle,
    icon: 'pi-heart',
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
 * Lấy nhãn hiển thị chuẩn hóa cho một bảng bất kỳ: "[Mã] Tên bảng"
 */
export function getUnifiedTableLabel(tableId, options = {}) {
  const table = findUnifiedTable(tableId, options);
  if (!table) return 'Dữ liệu';
  return table.code ? `[${table.code}] ${table.title}` : table.title;
}
