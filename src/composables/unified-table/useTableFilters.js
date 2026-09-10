import { ref, computed, watch, unref } from 'vue';

export function useTableFilters({
  route,
  topicId,
  currentSourceList,
  topicBaselineList,
  firstVisibleCard,
  firstVisibleCardIdx,
  activeMetricCards,
  activeMetricCardIdx,
  activeMetricCardId,
  visibleColumns,
  personnelStore,
  saveAppSettings,
  getCellValue,
  isSharedCardAllType,
  isSameCard,
  matchSharedCardCondition,
  extractRowFieldValue,
  parseDateObj,
}) {
  const searchQuery = ref('');
  const statusFilter = ref('all');
  const timeFilterYear = ref('all');
  const selectedCountry = ref('');
  const selectedDepartment = ref('');
  const selectedFunding = ref('');
  const customFilterField = ref('');
  const customFilterValue = ref('');

  const resolveList = (target) => {
    if (typeof target === 'function') return target() || [];
    return unref(target) || [];
  };

  // Dropdown filter options
  const availableYears = computed(() => {
    const set = new Set();
    const list = resolveList(currentSourceList);
    list.forEach((t) => {
      const d = parseDateObj ? parseDateObj(t.departureDate) : null;
      if (d) set.add(d.getFullYear());
    });
    return Array.from(set).sort((a, b) => b - a);
  });

  // Filtered List
  const filteredList = computed(() => {
    const baselineCard = unref(firstVisibleCard);
    const activeCards = resolveList(activeMetricCards);
    const activeIdx = unref(activeMetricCardIdx);
    const activeId = unref(activeMetricCardId);

    // 1. Xác định thẻ mục tiêu lọc (từ route query hoặc state)
    let targetCard = null;
    const qCard = route?.query?.card || activeId;
    if (qCard) {
      targetCard = activeCards.find((c) => (c.id && c.id === qCard) || c.label === qCard);
    }
    if (!targetCard) {
      const currentIdx =
        activeIdx === -1 || activeIdx === 0
          ? unref(firstVisibleCardIdx)
          : activeIdx;
      targetCard = activeCards[currentIdx];
    }

    const isTargetBaseline = !targetCard || targetCard === baselineCard || isSameCard(targetCard, baselineCard);
    const shouldInheritBaseline = !isTargetBaseline && targetCard?.inheritBaseline !== false;

    const bList = resolveList(topicBaselineList);
    const sList = resolveList(currentSourceList);

    let list = [];
    if (isTargetBaseline) {
      list = [...bList];
    } else {
      const baseSource = shouldInheritBaseline ? bList : sList;
      list = isSharedCardAllType(targetCard)
        ? [...baseSource]
        : baseSource.filter((t) => matchSharedCardCondition(t, targetCard, personnelStore));
    }

    // 2. Đếm / Hiển thị Unique (kế thừa tính unique từ thẻ baseline hoặc cột có tick isUnique)
    const activeCols = resolveList(visibleColumns);
    const uniqueCol = activeCols.find((c) => c.isUnique);

    const isUniqueCount =
      targetCard?.isUnique ||
      (shouldInheritBaseline && !!baselineCard?.isUnique) ||
      (targetCard === baselineCard && !!baselineCard?.isUnique) ||
      Boolean(uniqueCol);

    if (isUniqueCount) {
      const uColId = uniqueCol?.id || targetCard?.uniqueKeyCol || targetCard?.uniqueField || baselineCard?.uniqueKeyCol;
      const pKeyField = uColId || (personnelStore?.getPersonnelKeyField
        ? personnelStore.getPersonnelKeyField()
        : 'cccdparent');
      const seenKeys = new Set();
      list = list.filter((item) => {
        let keyVal;
        if (uColId) {
          keyVal = typeof extractRowFieldValue === 'function'
            ? extractRowFieldValue(item, uColId, personnelStore)
            : item[uColId];
          if (!keyVal && typeof getCellValue === 'function') {
            keyVal = getCellValue(item, uColId);
          }
        } else {
          keyVal =
            item[pKeyField] ??
            item.cccdparent ??
            item.parentCccd ??
            item.rawPerson?.[pKeyField] ??
            item.rawPerson?.custom_data?.[pKeyField] ??
            item.personnelId ??
            item.id;
        }
        if (keyVal !== undefined && keyVal !== null && String(keyVal).trim() !== '' && String(keyVal).trim() !== '-') {
          const strKey = String(keyVal).trim().toLowerCase();
          if (seenKeys.has(strKey)) return false;
          seenKeys.add(strKey);
          item._isUniqueRow = true;
          return true;
        }
        item._isUniqueRow = true;
        return true;
      });
    }

    // 3. Lọc theo Drill-down trường động (filterField & filterValue)
    const fField = route?.query?.filterField || customFilterField.value;
    const fVal = route?.query?.filterValue || customFilterValue.value;
    if (fField && fVal) {
      const targetStr = String(fVal).trim().toLowerCase();
      list = list.filter((row) => {
        const cellVal = extractRowFieldValue(row, fField, personnelStore);
        const strVal = String(cellVal || '').trim().toLowerCase();
        return strVal === targetStr || strVal.includes(targetStr);
      });
    }

    // 4. Lọc theo ô tìm kiếm nhanh (searchQuery) - 100% ĐỘNG THEO TẤT CẢ CỘT ĐANG HIỂN THỊ
    const q = String(searchQuery.value || '').trim().toLowerCase();
    if (q) {
      const cols = resolveList(visibleColumns);
      list = list.filter((item) => {
        if (cols.length > 0) {
          const matchedVisible = cols.some((col) => {
            const colId = typeof col === 'object' && col !== null ? (col.id || col.field) : col;
            const val = typeof getCellValue === 'function' ? getCellValue(item, colId) : item[colId];
            return (
              val !== undefined &&
              val !== null &&
              val !== '' &&
              val !== '-' &&
              String(val).toLowerCase().includes(q)
            );
          });
          if (matchedVisible) return true;
        }
        // Đồng thời kiểm tra trên các trường định danh cơ bản của chính bản ghi (Tên, Mã, CCCD)
        const primaryFields = [
          item.name,
          item.personnelName,
          item.relativeName,
          item.code,
          item.personnelCode,
          item.cccd,
          item.cccdparent,
          item.parentCccd,
          item.cccdthannhan,
          item.cccdchuyendi,
        ];
        return primaryFields.some(
          (f) => f !== undefined && f !== null && f !== '' && f !== '-' && String(f).toLowerCase().includes(q)
        );
      });
    }

    return list;
  });

  // ==================== LƯU VÀ TẢI BỘ LỌC VÀO DATABASE ====================
  let filterSaveDebounceTimer = null;
  const saveTopicFilterState = async () => {
    const tid = unref(topicId);
    if (!tid) return;
    const filterKey = `child_dashboard_filter_${tid}`;
    const filterData = {
      searchQuery: searchQuery.value,
    };
    try {
      localStorage.setItem(filterKey, JSON.stringify(filterData));
      await saveAppSettings(filterKey, filterData);
    } catch (e) {
      console.warn('Lỗi khi lưu bộ lọc chuyên đề vào DB:', e);
    }
  };

  const triggerAutoSaveFilter = () => {
    if (filterSaveDebounceTimer) clearTimeout(filterSaveDebounceTimer);
    filterSaveDebounceTimer = setTimeout(() => {
      saveTopicFilterState();
    }, 400);
  };

  const loadTopicFilterState = async () => {
    const tid = unref(topicId);
    if (!tid) return;
    activeMetricCardIdx.value = -1;
    statusFilter.value = 'all';
    timeFilterYear.value = 'all';
    selectedCountry.value = '';
    selectedDepartment.value = '';
    selectedFunding.value = '';
    customFilterField.value = '';
    customFilterValue.value = '';
  };

  watch([searchQuery], () => {
    triggerAutoSaveFilter();
  });

  return {
    searchQuery,
    statusFilter,
    timeFilterYear,
    selectedCountry,
    selectedDepartment,
    selectedFunding,
    customFilterField,
    customFilterValue,
    availableYears,
    filteredList,
    saveTopicFilterState,
    triggerAutoSaveFilter,
    loadTopicFilterState,
  };
}
