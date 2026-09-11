import { ref, computed, unref } from 'vue';

export function useTableColumns({
  topicId,
  currentDashboardId,
  currentDashboardConfig,
  customDashboards,
  activeMetricCards,
  activeMetricCardIdx,
  allAvailableColumnsList,
  visibleColumns,
  route,
  personnelStore,
  getAppSettings,
  saveAppSettings,
  ensureStandardDashboards,
  persistTableMapping,
  openAddColumnDialogWithTarget,
}) {
  const resolveList = (target) => {
    if (typeof target === 'function') return target() || [];
    return unref(target) || [];
  };

  // ===== TẬP CỘT ĐƯỢC CHỌN (SELECTED COLUMNS) =====
  const getInitialSelectedCols = () => {
    try {
      const tid = unref(topicId) || 'default';
      const localKey = `child_dashboard_cols_${tid}`;
      let fallbackLocal = null;
      if (tid === 'trips') fallbackLocal = localStorage.getItem('trips_dashboard_columns');
      else if (tid === 'personnel') fallbackLocal = localStorage.getItem('personnel_active_columns');
      else if (tid === 'relatives') fallbackLocal = localStorage.getItem('relative_active_columns');

      const local = localStorage.getItem(localKey) || fallbackLocal;
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((id) => id !== 'status' && id !== 'tripStatus');
        }
      }
    } catch (e) {}
    return [];
  };

  const selectedColIds = ref(getInitialSelectedCols());

  const getCurrentCardId = () => {
    const cards = resolveList(activeMetricCards);
    const cIdx = unref(activeMetricCardIdx) <= 0 ? 0 : unref(activeMetricCardIdx);
    const targetCard = cards[cIdx];
    return targetCard?.id || (cIdx === 0 ? 'all' : `card_${cIdx}`);
  };

  const getCurrentCardColKey = () => {
    const tid = unref(topicId) || 'default';
    const cid = getCurrentCardId();
    return `unified_table_active_cols_${tid}_${cid}`;
  };

  const onColumnsChange = async (newCols) => {
    const cols = Array.isArray(newCols) ? newCols : selectedColIds.value;
    selectedColIds.value = [...cols];
    const tid = unref(topicId) || 'default';
    const cid = getCurrentCardId();
    const cardIdx = unref(activeMetricCardIdx) <= 0 ? 0 : unref(activeMetricCardIdx);
    const currentKey = `unified_table_active_cols_${tid}_${cid}`;

    // 1. Lưu ngay vào localStorage tức thì (khóa độc lập cho Bảng chính)
    try {
      localStorage.setItem(currentKey, JSON.stringify(selectedColIds.value));
      if (cardIdx === 0) {
        localStorage.setItem(`unified_table_active_cols_${tid}`, JSON.stringify(selectedColIds.value));
      }
    } catch (e) {}

    // 2. Lưu vào customDashboards (in-memory + DB)
    let dashboards = customDashboards.value ? [...customDashboards.value] : [];
    let idx = dashboards.findIndex((d) => String(d.id) === String(tid));
    if (idx === -1) {
      dashboards = ensureStandardDashboards(dashboards);
      idx = dashboards.findIndex((d) => String(d.id) === String(tid));
    }

    if (idx !== -1) {
      if (!dashboards[idx].metricCards || dashboards[idx].metricCards.length === 0) {
        dashboards[idx].metricCards = [...resolveList(activeMetricCards)];
      }
      if (cardIdx === 0) {
        dashboards[idx].columns = [...selectedColIds.value];
      }
      if (dashboards[idx].metricCards[cardIdx]) {
        dashboards[idx].metricCards[cardIdx].columns = [...selectedColIds.value];
      }
      customDashboards.value = dashboards;
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
        await saveAppSettings('custom_dashboards_config', dashboards);
      } catch (e) {}
    }

    // 3. Lưu bất đồng bộ vào DB settings theo khóa độc lập của bảng chính
    try {
      await saveAppSettings(currentKey, selectedColIds.value);
      if (cardIdx === 0) {
        await saveAppSettings(`unified_table_active_cols_${tid}`, selectedColIds.value);
      }
    } catch (e) {}
  };

  const loadColumnsForCurrentCard = async () => {
    const tid = unref(topicId) || 'default';
    const cards = resolveList(activeMetricCards);
    const cardIdx = unref(activeMetricCardIdx) <= 0 ? 0 : unref(activeMetricCardIdx);
    const currentCard = cards[cardIdx];
    const cid = currentCard?.id || (cardIdx === 0 ? 'all' : `card_${cardIdx}`);
    const currentKey = `unified_table_active_cols_${tid}_${cid}`;

    const sanitizeRelCols = (cols) => {
      if (unref(currentDashboardConfig)?.source === 'relatives' && Array.isArray(cols)) {
        return cols.map((id) => (id === 'countryName' ? 'countryNameTN' : id));
      }
      return cols;
    };

    // 1. Kiểm tra columns trực tiếp trên thẻ (in-memory / customDashboards)
    if (currentCard?.columns && Array.isArray(currentCard.columns) && currentCard.columns.length > 0) {
      const valid = sanitizeRelCols(
        currentCard.columns.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey')
      );
      if (valid.length > 0) {
        selectedColIds.value = valid;
        return;
      }
    }

    // Nếu là card đầu tiên (all): kiểm tra dashboards[idx].columns
    if (
      cardIdx === 0 &&
      unref(currentDashboardConfig)?.columns &&
      Array.isArray(unref(currentDashboardConfig).columns) &&
      unref(currentDashboardConfig).columns.length > 0
    ) {
      const valid = sanitizeRelCols(
        unref(currentDashboardConfig).columns.filter(
          (id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'
        )
      );
      if (valid.length > 0) {
        selectedColIds.value = valid;
        return;
      }
    }

    // 2. Kiểm tra cache localStorage: Ưu tiên khóa riêng của Bảng chính, sau đó fallback an toàn
    const keysToCheck = [
      currentKey,
      `unified_table_active_cols_${tid}`,
      `child_dashboard_cols_${tid}_${cid}`,
      `child_dashboard_cols_${tid}_all`,
      `child_dashboard_cols_${tid}`,
    ];
    if (cardIdx === 0) {
      if (tid === 'trips') keysToCheck.push('trips_dashboard_columns');
      else if (tid === 'personnel') keysToCheck.push('personnel_active_columns');
      else if (tid === 'relatives') keysToCheck.push('relative_active_columns');
    }

    for (const k of keysToCheck) {
      try {
        const local = localStorage.getItem(k);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = sanitizeRelCols(
              parsed.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey')
            );
            if (valid.length > 0) {
              selectedColIds.value = valid;
              return;
            }
          }
        }
      } catch (e) {}
    }

    // 3. Kiểm tra DB settings
    for (const k of keysToCheck) {
      try {
        const dbCols = await getAppSettings(k, null);
        if (dbCols && Array.isArray(dbCols) && dbCols.length > 0) {
          const valid = sanitizeRelCols(
            dbCols.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey')
          );
          if (valid.length > 0) {
            selectedColIds.value = valid;
            try {
              localStorage.setItem(k, JSON.stringify(valid));
            } catch (e) {}
            return;
          }
        }
      } catch (e) {}
    }

    // 4. Nếu view con chưa từng cấu hình cột: kế thừa từ view 0
    if (cardIdx > 0) {
      for (const k of [`child_dashboard_cols_${tid}_all`, `child_dashboard_cols_${tid}`]) {
        try {
          const local = localStorage.getItem(k);
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const valid = sanitizeRelCols(
                parsed.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey')
              );
              if (valid.length > 0) {
                selectedColIds.value = valid;
                return;
              }
            }
          }
        } catch (e) {}
      }
    }

    // 5. Mặc định toàn bộ cột khả dụng
    const allIds = resolveList(allAvailableColumnsList)
      .map((c) => c.id)
      .filter((id) => id !== '_primaryKey' && id !== 'status' && id !== 'tripStatus');
    if (allIds.length > 0) {
      selectedColIds.value = sanitizeRelCols(allIds);
    }
  };

  const initTopicColumns = async () => {
    await loadColumnsForCurrentCard();
  };

  // ===== ĐỘNG CƠ ĐỘ RỘNG CỘT 2 TẦNG CHUẨN LARK BASE (COLUMN WIDTH ENGINE) =====
  const colWidthMode = ref('auto'); // 'auto' | 'fixed'
  const colWidthPx = ref(160); // Mặc định 160px
  const resizedColWidths = ref({}); // Map { [colId]: number } chứa độ rộng các cột đã kéo tay

  const hasCustomDraggedWidths = computed(() => {
    return Object.keys(resizedColWidths.value || {}).length > 0;
  });

  const getColWidthStorageKey = () => {
    const tid = unref(topicId) || unref(currentDashboardConfig)?.id || (route?.path?.replace('/', '') || 'default');
    return `table_col_widths_v2_${tid}`;
  };

  const loadColWidthSettings = () => {
    try {
      const key = getColWidthStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        colWidthMode.value = parsed.mode === 'fixed' ? 'fixed' : 'auto';
        colWidthPx.value = Number(parsed.px) || 160;
        resizedColWidths.value = parsed.resized && typeof parsed.resized === 'object' ? parsed.resized : {};
        return;
      }
    } catch (e) {}
    colWidthMode.value = 'auto';
    colWidthPx.value = 160;
    resizedColWidths.value = {};
  };

  const saveColWidthSettings = async () => {
    try {
      const key = getColWidthStorageKey();
      const payload = {
        mode: colWidthMode.value,
        px: colWidthPx.value,
        resized: resizedColWidths.value,
      };
      localStorage.setItem(key, JSON.stringify(payload));
      await saveAppSettings(key, payload);
    } catch (e) {}
  };

  const onColWidthSettingChange = async ({ mode, px }) => {
    if (mode) colWidthMode.value = mode;
    if (px) colWidthPx.value = Number(px) || 160;
    await saveColWidthSettings();
  };

  const onResetDraggedWidths = async () => {
    resizedColWidths.value = {};
    await saveColWidthSettings();
  };

  const onColumnResizeEnd = async (event) => {
    try {
      const thEl = event.element;
      if (!thEl) return;

      let colId = thEl.getAttribute('data-column-id');
      if (!colId) {
        const parent = thEl.parentElement;
        if (parent) {
          const thIndex = Array.from(parent.children).indexOf(thEl);
          const vCols = resolveList(visibleColumns);
          const targetCol = vCols[thIndex - 2];
          if (targetCol) colId = targetCol.id;
        }
      }

      if (!colId) return;

      const newWidth = Math.round(thEl.getBoundingClientRect?.().width || thEl.offsetWidth);
      if (newWidth > 40) {
        resizedColWidths.value = {
          ...resizedColWidths.value,
          [colId]: newWidth,
        };
        colWidthMode.value = 'auto';
        await saveColWidthSettings();
      }
    } catch (e) {
      console.error('Error onColumnResizeEnd:', e);
    }
  };

  const getColWidthStyle = (col) => {
    if (!col) return {};

    if (colWidthMode.value === 'fixed') {
      const px = Math.max(60, Number(colWidthPx.value) || 160);
      return {
        width: `${px}px`,
        minWidth: `${px}px`,
        maxWidth: `${px}px`,
      };
    }

    const draggedWidth = resizedColWidths.value?.[col.id];
    if (draggedWidth && Number(draggedWidth) > 40) {
      const px = Math.round(Number(draggedWidth));
      return {
        width: `${px}px`,
        minWidth: `${px}px`,
      };
    }

    if (col.format === 'checkbox_file_loop' || col.format === 'checkbox_file') {
      return {
        minWidth: '240px',
        width: 'auto',
      };
    }

    return {
      minWidth: '150px',
      width: 'auto',
    };
  };

  // ===== CONTEXT MENU CHO HEADER CỘT =====
  const isChildColMenuVisible = ref(false);
  const selectedChildMenuCol = ref(null);
  const childColMenuPosition = ref({ x: 0, y: 0 });
  const isKeyLinkDialogOpen = ref(false);
  const addChildColTargetIndex = ref(-1);

  const openChildColMenu = (event, col) => {
    const thElem =
      event.currentTarget.closest('th') ||
      event.currentTarget.closest('.table-col-header-wrap') ||
      event.currentTarget;
    const thRect = thElem.getBoundingClientRect();
    const menuWidth = 360;
    const menuHeight = 520;
    const x = Math.max(10, Math.min(thRect.left, window.innerWidth - menuWidth - 20));
    let y = thRect.bottom + 4;
    if (y + menuHeight > window.innerHeight) {
      y = Math.max(10, window.innerHeight - menuHeight - 10);
    }
    childColMenuPosition.value = { x, y };
    selectedChildMenuCol.value = col;
    isChildColMenuVisible.value = true;
  };

  const handleChildColMenuFromSelector = ({ event, col }) => {
    openChildColMenu(event, col);
  };

  const getTargetMappingRef = () => {
    const src = unref(currentDashboardConfig)?.source || 'trips';
    if (src === 'blank') {
      const tid = unref(topicId);
      const cDash = customDashboards.value.find((d) => d.id === tid);
      return {
        key: 'custom_dashboards_config',
        mapping: [{ group: 'Cột bảng', columns: cDash?.customColumns || [] }],
        isBlank: true,
        cDash,
        src,
      };
    }
    if (src === 'relatives')
      return { key: 'import_mapping_relative', mapping: personnelStore.importMappingRelative, src };
    if (src === 'personnel')
      return { key: 'import_mapping_personnel', mapping: personnelStore.importMappingPersonnel, src };
    return { key: 'import_mapping_trips', mapping: personnelStore.importMappingTrips, src };
  };

  const customParentLabels = ref({});
  const getParentColLabel = (defaultLabel) => {
    const tid = unref(topicId);
    if (tid && customParentLabels.value[tid]) return customParentLabels.value[tid];
    return defaultLabel;
  };

  const loadCustomParentLabel = async () => {
    try {
      const tid = unref(topicId);
      if (!tid) return;
      const local = localStorage.getItem('parent_col_label_' + tid);
      if (local) {
        customParentLabels.value = { ...customParentLabels.value, [tid]: local };
        return;
      }
      const val = await getAppSettings('parent_col_label_' + tid, null);
      if (val) customParentLabels.value = { ...customParentLabels.value, [tid]: val };
    } catch (e) {}
  };

  const onChildRenameColumn = async ({ colId, newLabel }) => {
    const tid = unref(topicId);
    if (colId === '_parentPersonnelName') {
      customParentLabels.value = { ...customParentLabels.value, [tid]: newLabel };
      try {
        localStorage.setItem('parent_col_label_' + tid, newLabel);
        await saveAppSettings('parent_col_label_' + tid, newLabel);
      } catch (e) {}
      return;
    }
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.label = newLabel;
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.label = newLabel;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnRequired = async ({ colId, required }) => {
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.required = Boolean(required);
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.required = Boolean(required);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnIncludeExport = async ({ colId, includeInExport }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.includeInExport = Boolean(includeInExport);
    }
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.includeInExport = Boolean(includeInExport);
        try {
          customDashboards.value = JSON.parse(JSON.stringify(customDashboards.value));
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.includeInExport = Boolean(includeInExport);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, JSON.parse(JSON.stringify(mapping)));
    }
  };

  const onChildChangeColumnShowInDetail = async ({ colId, showInDetail }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.showInDetail = Boolean(showInDetail);
    }
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.showInDetail = Boolean(showInDetail);
        try {
          customDashboards.value = JSON.parse(JSON.stringify(customDashboards.value));
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.showInDetail = Boolean(showInDetail);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, JSON.parse(JSON.stringify(mapping)));
    }
  };

  const onChildChangeColumnCollapseDuplicates = async ({ colId, collapseDuplicates }) => {
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.collapseDuplicates = Boolean(collapseDuplicates);
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.collapseDuplicates = Boolean(collapseDuplicates);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnUnique = async ({ colId, isUnique }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.isUnique = Boolean(isUnique);
    }
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      (cDash.customColumns || []).forEach((c) => {
        if (c.id === colId) c.isUnique = Boolean(isUnique);
        else if (isUnique) c.isUnique = false;
      });
      try {
        customDashboards.value = JSON.parse(JSON.stringify(customDashboards.value));
        localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
        await saveAppSettings('custom_dashboards_config', customDashboards.value);
      } catch (e) {}
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.isUnique = Boolean(isUnique);
          found = true;
        } else if (isUnique) {
          c.isUnique = false;
        }
      }
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeBoldFirstLine = async ({ colId, boldFirstLine, firstLineColor }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.boldFirstLine = Boolean(boldFirstLine);
      selectedChildMenuCol.value.firstLineColor = firstLineColor || '#0369a1';
    }
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.boldFirstLine = Boolean(boldFirstLine);
        col.firstLineColor = firstLineColor || '#0369a1';
        try {
          customDashboards.value = JSON.parse(JSON.stringify(customDashboards.value));
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.boldFirstLine = Boolean(boldFirstLine);
          c.firstLineColor = firstLineColor || '#0369a1';
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnKey = async ({ colId, isKey }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.isKey = Boolean(isKey);
    }
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      (cDash.customColumns || []).forEach((c) => {
        if (c.id === colId) c.isKey = Boolean(isKey);
        else if (isKey) c.isKey = false;
      });
      try {
        customDashboards.value = JSON.parse(JSON.stringify(customDashboards.value));
        localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
        await saveAppSettings('custom_dashboards_config', customDashboards.value);
      } catch (e) {}
      return;
    }
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.isKey = Boolean(isKey);
        } else if (isKey) {
          c.isKey = false;
        }
      }
    }
    await persistTableMapping(src, JSON.parse(JSON.stringify(mapping)));
    if (isKey && personnelStore.saveKeyConfig) {
      const cfg = { ...(personnelStore.systemKeyConfig || {}) };
      if (src === 'personnel') cfg.personnelKeyField = colId;
      else if (src === 'relatives') cfg.relativeKeyField = colId;
      else if (src === 'trips') cfg.tripKeyField = colId;
      await personnelStore.saveKeyConfig(cfg);
    }
  };

  const onChildChangeColumnLinkTable = async ({ colId, linkTable, linkColumn }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.linkTable = linkTable || '';
      selectedChildMenuCol.value.linkColumn = linkColumn || '';
    }
    const { mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.linkTable = linkTable || '';
        col.linkColumn = linkColumn || '';
        try {
          customDashboards.value = JSON.parse(JSON.stringify(customDashboards.value));
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.linkTable = linkTable || '';
          c.linkColumn = linkColumn || '';
          break;
        }
      }
    }
    await persistTableMapping(src, JSON.parse(JSON.stringify(mapping)));
    if (src === 'relatives' && linkTable === 'personnel' && personnelStore.saveKeyConfig) {
      const cfg = { ...(personnelStore.systemKeyConfig || {}) };
      cfg.relativeParentKeyField = colId;
      await personnelStore.saveKeyConfig(cfg);
    }
  };

  const onChildChangeColumnFormat = async ({ colId, newFormat }) => {
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.format = newFormat;
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.format = newFormat;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnLookup = async (payload) => {
    const {
      colId,
      lookupTarget,
      lookupLinkCol,
      lookupField,
      lookupFields,
      lookupConditions,
      lookupLogicOp,
      lookupDisplay,
      lookupJoinSeparator,
      lookupFormat,
    } = payload;
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const c = (cDash.customColumns || []).find((col) => col.id === colId);
      if (c) {
        c.format = 'lookup';
        c.lookupTarget = lookupTarget;
        c.lookupLinkCol = lookupLinkCol;
        c.lookupField = lookupField;
        if (lookupFields !== undefined) c.lookupFields = lookupFields;
        if (lookupConditions !== undefined) c.lookupConditions = lookupConditions;
        if (lookupLogicOp !== undefined) c.lookupLogicOp = lookupLogicOp;
        if (lookupDisplay !== undefined) c.lookupDisplay = lookupDisplay;
        if (lookupJoinSeparator !== undefined) c.lookupJoinSeparator = lookupJoinSeparator;
        if (lookupFormat !== undefined) c.lookupFormat = lookupFormat;
        await persistTableMapping('blank', customDashboards.value);
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.format = 'lookup';
          c.lookupTarget = lookupTarget;
          c.lookupLinkCol = lookupLinkCol;
          c.lookupField = lookupField;
          if (lookupFields !== undefined) c.lookupFields = lookupFields;
          if (lookupConditions !== undefined) c.lookupConditions = lookupConditions;
          if (lookupLogicOp !== undefined) c.lookupLogicOp = lookupLogicOp;
          if (lookupDisplay !== undefined) c.lookupDisplay = lookupDisplay;
          if (lookupJoinSeparator !== undefined) c.lookupJoinSeparator = lookupJoinSeparator;
          if (lookupFormat !== undefined) c.lookupFormat = lookupFormat;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnRollup = async (payload) => {
    const {
      colId,
      rollupTarget,
      rollupLinkCol,
      rollupField,
      rollupFunction,
      rollupOp,
      rollupScope,
      rollupTargetCol,
      rollupSourceCol,
      rollupConditions,
      rollupLogicOp,
      rollupFormat,
    } = payload;
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const c = (cDash.customColumns || []).find((col) => col.id === colId);
      if (c) {
        c.format = 'rollup';
        c.rollupTarget = rollupTarget;
        c.rollupLinkCol = rollupLinkCol || rollupSourceCol;
        c.rollupField = rollupField;
        c.rollupFunction = rollupFunction || rollupOp || 'count';
        c.rollupOp = rollupOp || rollupFunction || 'count';
        if (rollupScope !== undefined) c.rollupScope = rollupScope;
        if (rollupTargetCol !== undefined) c.rollupTargetCol = rollupTargetCol;
        if (rollupSourceCol !== undefined) c.rollupSourceCol = rollupSourceCol;
        if (rollupConditions !== undefined) c.rollupConditions = rollupConditions;
        if (rollupLogicOp !== undefined) c.rollupLogicOp = rollupLogicOp;
        if (rollupFormat !== undefined) c.rollupFormat = rollupFormat;
        await persistTableMapping('blank', customDashboards.value);
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.format = 'rollup';
          c.rollupTarget = rollupTarget;
          c.rollupLinkCol = rollupLinkCol || rollupSourceCol;
          c.rollupField = rollupField;
          c.rollupFunction = rollupFunction || rollupOp || 'count';
          c.rollupOp = rollupOp || rollupFunction || 'count';
          if (rollupScope !== undefined) c.rollupScope = rollupScope;
          if (rollupTargetCol !== undefined) c.rollupTargetCol = rollupTargetCol;
          if (rollupSourceCol !== undefined) c.rollupSourceCol = rollupSourceCol;
          if (rollupConditions !== undefined) c.rollupConditions = rollupConditions;
          if (rollupLogicOp !== undefined) c.rollupLogicOp = rollupLogicOp;
          if (rollupFormat !== undefined) c.rollupFormat = rollupFormat;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  const onChildChangeColumnOptions = async ({ colId, options }) => {
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      selectedChildMenuCol.value.options = options;
    }
    const colInVisible = (visibleColumns.value || []).find((c) => c.id === colId);
    if (colInVisible) colInVisible.options = options;
    const colInAll = (allAvailableColumnsList.value || []).find((c) => c.id === colId);
    if (colInAll) colInAll.options = options;

    const cardsList = resolveList(activeMetricCards);
    const cIdx = unref(activeMetricCardIdx);
    if (cIdx >= 0 && cardsList?.[cIdx]?.columns) {
      const colInCard = cardsList[cIdx].columns.find((c) => c.id === colId);
      if (colInCard) colInCard.options = options;
    }

    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        col.options = options;
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          c.options = options;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found && Array.isArray(mapping) && mapping.length > 0) {
      const existingCol = (allAvailableColumnsList.value || []).find((c) => c.id === colId);
      if (existingCol) {
        mapping[0].columns = mapping[0].columns || [];
        mapping[0].columns.push({ ...existingCol, options });
        found = true;
      }
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
    if (cDash && Array.isArray(cDash.customColumns)) {
      const cInDash = cDash.customColumns.find((c) => c.id === colId);
      if (cInDash) {
        cInDash.options = options;
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
    }
  };

  const onChildChangeColumnFormWidth = async ({ colId, formWidth }) => {
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    let found = false;

    if (isBlank && cDash) {
      if (Array.isArray(cDash.customColumns)) {
        for (const c of cDash.customColumns) {
          if (c.id === colId) {
            c.formWidth = String(formWidth);
            c.width = String(formWidth);
            found = true;
            break;
          }
        }
      }
      if (Array.isArray(cDash.columns)) {
        for (const c of cDash.columns) {
          if (c.id === colId) {
            c.formWidth = String(formWidth);
            c.width = String(formWidth);
            found = true;
            break;
          }
        }
      }
      if (found) {
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
          window.dispatchEvent(new CustomEvent('custom-dashboards-updated'));
        } catch (e) {}
      }
    } else {
      for (const g of mapping || []) {
        for (const c of g.columns || []) {
          if (c.id === colId) {
            c.formWidth = String(formWidth);
            c.width = String(formWidth);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) {
        await persistTableMapping(src, mapping);
      }
    }

    if (found) {
      alert('Đã cập nhật độ rộng form chi tiết cho cột này!');
    }
  };

  const onChildChangeColumnSuggest = async ({ colId, suggestEnabled, suggestTarget, suggestSearchCol, suggestFillCol, suggestConfigByTable }) => {
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    let found = false;

    if (isBlank && cDash) {
      const allCols = [...(cDash.customColumns || []), ...(cDash.columns || [])];
      for (const c of allCols) {
        if (c.id === colId) {
          c.suggestEnabled = suggestEnabled;
          c.suggestTarget = suggestTarget;
          c.suggestSearchCol = suggestSearchCol;
          c.suggestFillCol = suggestFillCol;
          if (suggestConfigByTable !== undefined) {
            c.suggestConfigByTable = suggestConfigByTable;
          }
          found = true;
          break;
        }
      }
      if (found) {
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
          window.dispatchEvent(new CustomEvent('custom-dashboards-updated'));
        } catch (e) {}
      }
    } else {
      for (const g of mapping || []) {
        for (const c of g.columns || []) {
          if (c.id === colId) {
            c.suggestEnabled = suggestEnabled;
            c.suggestTarget = suggestTarget;
            c.suggestSearchCol = suggestSearchCol;
            c.suggestFillCol = suggestFillCol;
            if (suggestConfigByTable !== undefined) {
              c.suggestConfigByTable = suggestConfigByTable;
            }
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) {
        await persistTableMapping(src, mapping);
      }
    }
  };

  const onChildDeleteColumnFromTable = async (colId) => {
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    let found = false;

    if (isBlank && cDash) {
      if (Array.isArray(cDash.customColumns)) {
        const initLen = cDash.customColumns.length;
        cDash.customColumns = cDash.customColumns.filter((c) => c.id !== colId);
        if (cDash.customColumns.length < initLen) found = true;
      }
      if (Array.isArray(cDash.columns)) {
        const initLen = cDash.columns.length;
        cDash.columns = cDash.columns.filter((c) => c.id !== colId);
        if (cDash.columns.length < initLen) found = true;
      }
      if (found) {
        selectedColIds.value = selectedColIds.value.filter((id) => id !== colId);
        await onColumnsChange();
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
          window.dispatchEvent(new CustomEvent('custom-dashboards-updated'));
        } catch (e) {}
        alert('Đã xóa cột thành công khỏi bảng!');
      }
      return;
    }

    for (const g of mapping || []) {
      if (Array.isArray(g.columns)) {
        const initLen = g.columns.length;
        g.columns = g.columns.filter((c) => c.id !== colId);
        if (g.columns.length < initLen) {
          found = true;
          break;
        }
      }
    }
    if (found) {
      selectedColIds.value = selectedColIds.value.filter((id) => id !== colId);
      await onColumnsChange();
      await persistTableMapping(src, mapping);
      alert('Đã xóa cột thành công!');
    }
  };

  const onChildHideColumn = async (colId) => {
    selectedColIds.value = selectedColIds.value.filter((id) => id !== colId);
    await onColumnsChange();
  };

  const onInsertChildColLeft = (col) => {
    const { isBlank, cDash, mapping } = getTargetMappingRef();
    if (isBlank && cDash) {
      const idx = (cDash.customColumns || []).findIndex((c) => c.id === col.id);
      addChildColTargetIndex.value = idx !== -1 ? idx : 0;
    } else {
      for (const g of mapping || []) {
        const found = (g.columns || []).findIndex((c) => c.id === col.id);
        if (found !== -1) {
          addChildColTargetIndex.value = found;
          break;
        }
      }
    }
    if (typeof openAddColumnDialogWithTarget === 'function') {
      openAddColumnDialogWithTarget(addChildColTargetIndex.value);
    }
  };

  const onInsertChildColRight = (col) => {
    const { isBlank, cDash, mapping } = getTargetMappingRef();
    if (isBlank && cDash) {
      const idx = (cDash.customColumns || []).findIndex((c) => c.id === col.id);
      addChildColTargetIndex.value = idx !== -1 ? idx + 1 : -1;
    } else {
      for (const g of mapping || []) {
        const found = (g.columns || []).findIndex((c) => c.id === col.id);
        if (found !== -1) {
          addChildColTargetIndex.value = found + 1;
          break;
        }
      }
    }
    if (typeof openAddColumnDialogWithTarget === 'function') {
      openAddColumnDialogWithTarget(addChildColTargetIndex.value);
    }
  };

  const onDuplicateChildCol = async (col) => {
    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    const baseId = String(col.id).replace(/_copy(_\d+)?$/, '');
    let counter = 1;
    let copyId = `${baseId}_copy`;
    const existingIds = new Set(resolveList(allAvailableColumnsList).map((c) => c.id));
    while (existingIds.has(copyId)) {
      counter++;
      copyId = `${baseId}_copy_${counter}`;
    }
    const copyCol = {
      ...col,
      id: copyId,
      label: (col.label || col.id) + ' (Bản sao)',
    };
    delete copyCol.isVirtual;
    delete copyCol.isPrimaryField;

    if (isBlank && cDash) {
      const idx = (cDash.customColumns || []).findIndex((c) => c.id === col.id);
      if (idx !== -1) {
        cDash.customColumns.splice(idx + 1, 0, copyCol);
      } else {
        cDash.customColumns.push(copyCol);
      }
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
        await saveAppSettings('custom_dashboards_config', customDashboards.value);
      } catch (e) {}
    } else {
      let inserted = false;
      for (const g of mapping || []) {
        const idx = (g.columns || []).findIndex((c) => c.id === col.id);
        if (idx !== -1) {
          g.columns.splice(idx + 1, 0, copyCol);
          inserted = true;
          break;
        }
      }
      if (!inserted && mapping && mapping[0]) {
        mapping[0].columns.push(copyCol);
      }
      await persistTableMapping(src, mapping);
    }

    const curIdx = selectedColIds.value.indexOf(col.id);
    if (curIdx !== -1) {
      selectedColIds.value.splice(curIdx + 1, 0, copyId);
    } else {
      selectedColIds.value.push(copyId);
    }
    await onColumnsChange(selectedColIds.value);
    alert(`Đã nhân bản cột thành công: "${copyCol.label}"!`);
  };

  const onChildChangeFormulaType = async (payload) => {
    const { colId, ...formulaProps } = payload || {};
    if (selectedChildMenuCol.value && selectedChildMenuCol.value.id === colId) {
      Object.assign(selectedChildMenuCol.value, formulaProps);
    }
    const colInVisible = (visibleColumns.value || []).find((c) => c.id === colId);
    if (colInVisible) Object.assign(colInVisible, formulaProps);
    const colInAll = (allAvailableColumnsList.value || []).find((c) => c.id === colId);
    if (colInAll) Object.assign(colInAll, formulaProps);

    const cardsList = resolveList(activeMetricCards);
    const cIdx = unref(activeMetricCardIdx);
    if (cIdx >= 0 && cardsList?.[cIdx]?.columns) {
      const colInCard = cardsList[cIdx].columns.find((c) => c.id === colId);
      if (colInCard) Object.assign(colInCard, formulaProps);
    }

    const { key, mapping, isBlank, cDash, src } = getTargetMappingRef();
    if (isBlank && cDash) {
      const col = (cDash.customColumns || []).find((c) => c.id === colId);
      if (col) {
        Object.assign(col, formulaProps);
        try {
          localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
          await saveAppSettings('custom_dashboards_config', customDashboards.value);
        } catch (e) {}
      }
      return;
    }
    let found = false;
    for (const g of mapping || []) {
      for (const c of g.columns || []) {
        if (c.id === colId) {
          Object.assign(c, formulaProps);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      await persistTableMapping(src, mapping);
    }
  };

  // ===== NAME COLUMN CONFIG (Cột tên liên kết Cán bộ) =====
  const NAME_COL_IDS = new Set(['_parentPersonnelName']);
  const isNameColumn = (colId) => NAME_COL_IDS.has(colId);

  const isChildPrimaryKey = (colId) => {
    if (unref(currentDashboardConfig)?.source === 'blank') {
      const tid = unref(topicId);
      const cDash = customDashboards.value?.find((d) => d.id === tid);
      return cDash?.customColumns?.[0]?.id === colId;
    }
    return false;
  };

  const availableParentFields = computed(() => {
    const fields = [
      { key: 'name', label: 'Họ và tên' },
      { key: 'cccdCB', label: 'CCCD' },
      { key: 'position', label: 'Chức vụ' },
      { key: 'department', label: 'Đơn vị' },
    ];
    const customDynamic = [];
    (personnelStore.importMappingPersonnel || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (!c.id) return;
        const exists = fields.some((f) => f.key === c.id);
        if (!exists && c.id !== 'stt' && c.id !== 'name' && c.id !== 'cccdCB') {
          customDynamic.push({
            key: c.id,
            label: c.label || c.id,
          });
        }
      });
    });
    return [...fields, ...customDynamic];
  });

  const DEFAULT_NAME_COL_FIELDS = { name: true, cccdCB: true, position: true, department: true };
  const nameColFields = ref({ ...DEFAULT_NAME_COL_FIELDS });

  const activeParentFieldsList = computed(() => {
    return availableParentFields.value.filter((f) => nameColFields.value[f.key]);
  });

  const getParentColPrefix = () => {
    const src = unref(currentDashboardConfig)?.source;
    if (src === 'relatives') return 'Cán bộ';
    return 'Cán bộ';
  };

  const getPersonFieldValue = (data, fieldKey) => {
    const person = data.rawPerson || data;
    if (!person) return '-';
    if (fieldKey === 'name') return person.name || person.ho_ten || '-';
    if (fieldKey === 'cccdCB') return person.cccdCB || person.cccd || '-';
    if (fieldKey === 'position') return person.positionName || person.position || person.chuc_vu || '-';
    if (fieldKey === 'department') return person.departmentName || person.departmentId || person.don_vi || '-';
    return person[fieldKey] || person.custom_data?.[fieldKey] || '-';
  };

  const showNameColConfig = ref(false);
  const nameColConfigPos = ref({});

  const toggleNameColConfig = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    nameColConfigPos.value = {
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(10, Math.min(rect.left, window.innerWidth - 300))}px`,
    };
    showNameColConfig.value = !showNameColConfig.value;
  };

  const toggleNameColField = async (key) => {
    nameColFields.value[key] = !nameColFields.value[key];
    try {
      localStorage.setItem('name_col_fields_config', JSON.stringify(nameColFields.value));
      await saveAppSettings('name_col_fields_config', nameColFields.value);
    } catch (e) {}
  };

  const loadNameColConfig = async () => {
    try {
      const local = localStorage.getItem('name_col_fields_config');
      if (local) {
        nameColFields.value = { ...DEFAULT_NAME_COL_FIELDS, ...JSON.parse(local) };
        return;
      }
      const val = await getAppSettings('name_col_fields_config', null);
      if (val) nameColFields.value = { ...DEFAULT_NAME_COL_FIELDS, ...val };
    } catch (e) {}
  };

  const showColIndex = ref(localStorage.getItem('app_show_col_index') !== 'false');
  const onColIndexChanged = (e) => {
    showColIndex.value = e.target.checked;
    localStorage.setItem('app_show_col_index', showColIndex.value ? 'true' : 'false');
  };

  return {
    selectedColIds,
    getCurrentCardId,
    getCurrentCardColKey,
    onColumnsChange,
    loadColumnsForCurrentCard,
    initTopicColumns,
    colWidthMode,
    colWidthPx,
    resizedColWidths,
    hasCustomDraggedWidths,
    loadColWidthSettings,
    saveColWidthSettings,
    onColWidthSettingChange,
    onResetDraggedWidths,
    onColumnResizeEnd,
    getColWidthStyle,
    isChildColMenuVisible,
    selectedChildMenuCol,
    childColMenuPosition,
    isKeyLinkDialogOpen,
    addChildColTargetIndex,
    openChildColMenu,
    handleChildColMenuFromSelector,
    getTargetMappingRef,
    customParentLabels,
    getParentColLabel,
    loadCustomParentLabel,
    onChildRenameColumn,
    onChildChangeColumnRequired,
    onChildChangeColumnIncludeExport,
    onChildChangeColumnShowInDetail,
    onChildChangeColumnCollapseDuplicates,
    onChildChangeColumnUnique,
    onChildChangeBoldFirstLine,
    onChildChangeColumnFormat,
    onChildChangeColumnLookup,
    onChildChangeColumnRollup,
    onChildChangeColumnOptions,
    onChildChangeColumnFormWidth,
    onChildChangeColumnSuggest,
    onChildDeleteColumnFromTable,
    onChildHideColumn,
    onInsertChildColLeft,
    onInsertChildColRight,
    onDuplicateChildCol,
    onChildChangeFormulaType,
    onChildChangeColumnKey,
    onChildChangeColumnLinkTable,
    NAME_COL_IDS,
    isNameColumn,
    isChildPrimaryKey,
    availableParentFields,
    nameColFields,
    activeParentFieldsList,
    getParentColPrefix,
    getPersonFieldValue,
    showNameColConfig,
    nameColConfigPos,
    toggleNameColConfig,
    toggleNameColField,
    loadNameColConfig,
    showColIndex,
    onColIndexChanged,
  };
}
