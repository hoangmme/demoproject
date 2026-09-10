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
    code: '',
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
              ...c,
              id: c.id,
              label: c.label || c.id,
              group: coreTripsTitle,
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
      const colMap = computeColumnIndexMap(store?.importMappingTrips || []);
      const allCols = [];
      const seen = new Set();
      (store?.importMappingTrips || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            allCols.push({
              id: c.id,
              rawId: c.id,
              label: c.label || c.id,
              colIndex: colMap[c.id] ? colMap[c.id].replace(/^Cột\s+/, '') : null,
              isVirtual: false,
              format: c.format,
              formulaType: c.formulaType,
              options: c.options,
            });
          }
        });
      });
      return allCols.length > 0 ? [{ name: coreTripsTitle, columns: allCols }] : [];
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
              ...c,
              id: c.id,
              label: c.label || c.id,
              group: corePersonnelTitle,
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
      const allCols = [];
      const seen = new Set();
      (store?.importMappingPersonnel || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            allCols.push({
              id: c.id,
              rawId: c.id,
              label: c.label || c.id,
              colIndex: colMap[c.id] ? colMap[c.id].replace(/^Cột\s+/, '') : null,
              isVirtual: false,
              format: c.format,
              formulaType: c.formulaType,
              options: c.options,
            });
          }
        });
      });
      return allCols.length > 0 ? [{ name: corePersonnelTitle, columns: allCols }] : [];
    },
  };

  // Bảng 3: Thân nhân
  const relativesTable = {
    id: 'relatives',
    code: '',
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
              ...c,
              id: c.id,
              label: c.label || c.id,
              group: coreRelativesTitle,
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
      const colMap = computeColumnIndexMap(store?.importMappingRelative || []);
      const allCols = [];
      const seen = new Set();
      (store?.importMappingRelative || []).forEach((g) => {
        (g.columns || []).forEach((c) => {
          if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
            seen.add(c.id);
            allCols.push({
              id: c.id,
              rawId: c.id,
              label: c.label || c.id,
              colIndex: colMap[c.id] ? colMap[c.id].replace(/^Cột\s+/, '') : null,
              isVirtual: false,
              format: c.format,
              formulaType: c.formulaType,
              options: c.options,
            });
          }
        });
      });
      return allCols.length > 0 ? [{ name: coreRelativesTitle, columns: allCols }] : [];
    },
  };

  // Các Bảng Tùy chỉnh / Người dùng tạo (Custom Tables)
  const customList = (customDashboards || [])
    .filter((d) => d && d.id && d.id !== 'trips' && d.id !== 'personnel' && d.id !== 'relatives')
    .map((ct, idx) => {
      const title = ct.title || `Bảng ${idx + 1}`;
      return {
        id: ct.id,
        code: ct.code || '',
        title: title,
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
              ...c,
              id: c.id,
              label: c.label || c.id,
              group: title,
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
              name: title,
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
      { id: 'relatives_abroad', label: 'Có thân nhân đi nước ngoài', field: 'so_chuyen_di_than_nhan', operator: 'gte', value: '1', color: 'teal' },
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

/**
 * Kiểm tra xem chuỗi cấu hình linkTable (có thể chứa nhiều bảng phân tách bằng dấu phẩy) có khớp với tableId hoặc tableSource không
 */
export function checkTableMatchesLink(linkTableStr, tableId, tableSource) {
  if (!linkTableStr) return false;
  const parts = String(linkTableStr).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const tId = String(tableId || '').trim().toLowerCase();
  const tSrc = String(tableSource || '').trim().toLowerCase();
  return (tId && parts.includes(tId)) || (tSrc && parts.includes(tSrc));
}

/**
 * Lấy ID cột khóa chính của bảng (cột có isKey: true, hoặc khóa cấu hình hệ thống)
 */
export function getTableKeyColId(table, store) {
  if (!table) return 'id';
  const cols = table.getColumns ? table.getColumns(store) : (table.columns || []);
  const keyCol = cols.find((c) => c.isKey);
  if (keyCol) return keyCol.id;
  if (table.id === 'personnel' || table.source === 'personnel') {
    return store?.getPersonnelKeyField ? store.getPersonnelKeyField() : 'cccdparent';
  }
  if (table.id === 'relatives' || table.source === 'relatives') {
    return store?.getRelativeKeyField ? store.getRelativeKeyField() : 'cccdthannhan';
  }
  if (table.id === 'trips' || table.source === 'trips') {
    return store?.getTripKeyField ? store.getTripKeyField() : 'cccdchuyendi';
  }
  return 'id';
}

/**
 * Lấy các dòng dữ liệu liên kết giữa 2 bảng hoàn toàn động dựa trên cấu hình Khóa & Liên kết Bảng (isKey, linkTable, linkColumn)
 */
export function getLinkedRowsByConfig(curRecord, curTableId, targetTableId, store) {
  if (!curRecord || !curTableId || !targetTableId || !store) return [];

  const curTable = findUnifiedTable(curTableId, { personnelStore: store });
  const targetTable = findUnifiedTable(targetTableId, { personnelStore: store });
  if (!curTable || !targetTable) return [];

  const curId = curTable.id || curTable.source;
  const targetId = targetTable.id || targetTable.source;
  const curCols = curTable.getColumns ? curTable.getColumns(store) : (curTable.columns || []);
  const targetCols = targetTable.getColumns ? targetTable.getColumns(store) : (targetTable.columns || []);
  const targetRows = targetTable.getRows ? targetTable.getRows(store) : [];

  // Core table specialized relations
  if (curId === 'personnel' && targetId === 'trips') {
    const pKeyCol = getTableKeyColId(curTable, store);
    const pKeyVal = String(curRecord[pKeyCol] ?? curRecord.cccd ?? curRecord.code ?? curRecord.id ?? '').trim().toLowerCase();
    const pId = String(curRecord.id ?? curRecord.code ?? '').trim();
    
    // Also find relatives to include their trips
    const relRows = getLinkedRowsByConfig(curRecord, 'personnel', 'relatives', store);
    const relKeys = new Set(relRows.map((r) => String(r.cccdthannhan || r.cccd || r.id || '').trim().toLowerCase()).filter(Boolean));
    const relIds = new Set(relRows.map((r) => String(r.id || '').trim()).filter(Boolean));

    const seen = new Set();
    const res = [];
    targetRows.forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      if (seen.has(uKey)) return;
      const tVal = String(t.cccdchuyendi || t.cccd || '').trim().toLowerCase();
      const matchOfficer = (pId && t.personnelId && String(t.personnelId).trim() === pId) || (pKeyVal && tVal && tVal === pKeyVal);
      const matchRel = (t.relativeId && relIds.has(String(t.relativeId).trim())) || (tVal && relKeys.has(tVal));
      if (matchOfficer || matchRel) {
        seen.add(uKey);
        res.push(t);
      }
    });
    return res;
  }

  if (curId === 'trips' && targetId === 'personnel') {
    if (curRecord.rawPerson) return [curRecord.rawPerson];
    if (store.findParentPersonForTrip) {
      const p = store.findParentPersonForTrip(curRecord);
      if (p) return [p];
    }
    const tVal = String(curRecord.cccdchuyendi || curRecord.cccd || '').trim().toLowerCase();
    const pId = String(curRecord.personnelId || '').trim();
    const p = targetRows.find((pers) => {
      if (pId && (String(pers.id).trim() === pId || String(pers.code).trim() === pId)) return true;
      if (tVal) {
        const val = String(pers.cccd || pers.id || '').trim().toLowerCase();
        if (val && val === tVal) return true;
      }
      return false;
    });
    if (p) return [p];
  }

  if (curId === 'relatives' && targetId === 'personnel') {
    if (curRecord.rawPerson) return [curRecord.rawPerson];
    if (store.findParentPersonForRelative) {
      const p = store.findParentPersonForRelative(curRecord);
      if (p) return [p];
    }
    const parentVal = String(curRecord.cccdparent || curRecord.parentCccd || '').trim().toLowerCase();
    const pId = String(curRecord.personnelId || '').trim();
    const p = targetRows.find((pers) => {
      if (pId && (String(pers.id).trim() === pId || String(pers.code).trim() === pId)) return true;
      if (parentVal) {
        const val = String(pers.cccd || pers.id || '').trim().toLowerCase();
        if (val && val === parentVal) return true;
      }
      return false;
    });
    if (p) return [p];
  }

  // 1. Cột ở targetTable có linkTable trỏ tới curTable (Target -> Current)
  const fkColInTarget = targetCols.find(
    (c) => checkTableMatchesLink(c.linkTable, curId, curTable?.source)
  );
  if (fkColInTarget) {
    const curKeyColId = fkColInTarget.linkColumn || getTableKeyColId(curTable, store);
    const curVal = String(curRecord[curKeyColId] ?? curRecord.custom_data?.[curKeyColId] ?? curRecord.id ?? curRecord.code ?? '').trim().toLowerCase();
    if (curVal) {
      return targetRows.filter((r) => {
        const val = String(r[fkColInTarget.id] ?? r.custom_data?.[fkColInTarget.id] ?? '').trim().toLowerCase();
        return val && val === curVal;
      });
    }
  }

  // 2. Cột ở curTable có linkTable trỏ tới targetTable (Current -> Target)
  const fkColInCur = curCols.find(
    (c) => checkTableMatchesLink(c.linkTable, targetId, targetTable?.source)
  );
  if (fkColInCur) {
    const targetKeyColId = fkColInCur.linkColumn || getTableKeyColId(targetTable, store);
    const curVal = String(curRecord[fkColInCur.id] ?? curRecord.custom_data?.[fkColInCur.id] ?? '').trim().toLowerCase();
    if (curVal) {
      return targetRows.filter((r) => {
        const val = String(r[targetKeyColId] ?? r.custom_data?.[targetKeyColId] ?? r.id ?? r.code ?? '').trim().toLowerCase();
        return val && val === curVal;
      });
    }
  }

  // 3. Mảng dữ liệu con nếu đã được nạp trực tiếp trên bản ghi
  if (Array.isArray(curRecord[targetId])) return curRecord[targetId];
  if (Array.isArray(curRecord.custom_data?.[targetId])) return curRecord.custom_data[targetId];

  return [];
}
