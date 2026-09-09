import { ref } from 'vue';

export function useTableViews({
  currentDashboardId,
  customDashboards,
  activeMetricCardIdx,
  selectedColIds,
  onColumnsChange,
  saveAppSettings,
  ensureStandardDashboards,
}) {
  // Lark Tab Setup Menu
  const activeTabMenuKey = ref(null);
  const toggleTabMenu = (type, idx) => {
    const key = `${type}_${idx}`;
    activeTabMenuKey.value = activeTabMenuKey.value === key ? null : key;
  };
  const closeTabMenu = () => {
    activeTabMenuKey.value = null;
  };
  const handleGlobalTabMenuClick = (e) => {
    if (
      e?.target &&
      (e.target.closest('.lark-tab-actions') ||
        e.target.closest('.btn-tab-setup') ||
        e.target.closest('.lark-tab-dropdown-menu'))
    ) {
      return;
    }
    closeTabMenu();
  };

  // View Manager Dialog State
  const isViewManagerOpen = ref(false);
  const viewManagerMode = ref('create'); // 'create' | 'edit'
  const selectedViewForEdit = ref(null);
  const selectedViewIdx = ref(-1);

  const openAddViewDialog = () => {
    viewManagerMode.value = 'create';
    selectedViewForEdit.value = {
      id: 'view_' + Date.now(),
      label: '',
      color: 'blue',
      logicOp: 'AND',
      conditions: [],
      columns: [...selectedColIds.value],
    };
    selectedViewIdx.value = -1;
    isViewManagerOpen.value = true;
  };

  const openEditViewDialog = (card, cIdx) => {
    viewManagerMode.value = 'edit';
    const tableId = currentDashboardId.value;
    const cardId = card?.id || (cIdx <= 0 ? 'all' : `card_${cIdx}`);

    // Lấy danh sách cột riêng của view này
    let existingCols = null;
    if (card?.columns && Array.isArray(card.columns) && card.columns.length > 0) {
      existingCols = card.columns;
    } else {
      try {
        const local = localStorage.getItem(`child_dashboard_cols_${tableId}_${cardId}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) existingCols = parsed;
        }
      } catch (e) {}
    }
    if (!existingCols || existingCols.length === 0) {
      existingCols = [...selectedColIds.value];
    }

    selectedViewForEdit.value = {
      ...card,
      columns: [...existingCols],
    };
    selectedViewIdx.value = cIdx;
    isViewManagerOpen.value = true;
  };

  const handleSaveView = async (savedData) => {
    const tableId = currentDashboardId.value;
    let dashboards = customDashboards.value ? [...customDashboards.value] : [];
    let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

    if (idx === -1) {
      dashboards = ensureStandardDashboards(dashboards);
      idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
    }

    if (idx === -1) return;

    const currentDash = { ...dashboards[idx] };
    const defaultCards = [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
      { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
      { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
      { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
    ];
    const cards = currentDash.metricCards ? [...currentDash.metricCards] : [...defaultCards];

    const targetCols =
      savedData.columns && Array.isArray(savedData.columns) && savedData.columns.length > 0
        ? [...savedData.columns]
        : [...selectedColIds.value];

    let targetCardId = null;
    const currentActiveIdx = activeMetricCardIdx.value <= 0 ? 0 : activeMetricCardIdx.value;

    if (
      viewManagerMode.value === 'edit' &&
      selectedViewIdx.value >= 0 &&
      selectedViewIdx.value < cards.length
    ) {
      cards[selectedViewIdx.value] = {
        ...cards[selectedViewIdx.value],
        ...savedData,
        columns: targetCols,
      };
      targetCardId = cards[selectedViewIdx.value].id;
      if (selectedViewIdx.value === 0) {
        currentDash.columns = [...targetCols];
      }
      if (currentActiveIdx === selectedViewIdx.value) {
        selectedColIds.value = [...targetCols];
      }
    } else {
      const newCard = {
        ...savedData,
        id: savedData.id || 'view_' + Date.now(),
        columns: targetCols,
      };
      cards.push(newCard);
      activeMetricCardIdx.value = cards.length - 1;
      selectedColIds.value = [...targetCols];
      targetCardId = newCard.id;
    }

    currentDash.metricCards = cards;
    dashboards[idx] = currentDash;
    customDashboards.value = dashboards;

    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
      await saveAppSettings('custom_dashboards_config', dashboards);

      if (targetCardId) {
        const cardKey = `child_dashboard_cols_${tableId}_${targetCardId}`;
        localStorage.setItem(cardKey, JSON.stringify(targetCols));
        await saveAppSettings(cardKey, targetCols);

        if (selectedViewIdx.value === 0 || targetCardId === 'all') {
          localStorage.setItem(`child_dashboard_cols_${tableId}`, JSON.stringify(targetCols));
          localStorage.setItem(`child_dashboard_cols_${tableId}_all`, JSON.stringify(targetCols));
          await saveAppSettings(`child_dashboard_cols_${tableId}`, targetCols);
          await saveAppSettings(`child_dashboard_cols_${tableId}_all`, targetCols);
          if (tableId === 'trips') await saveAppSettings('trips_dashboard_columns', targetCols);
          else if (tableId === 'personnel') await saveAppSettings('personnel_active_columns', targetCols);
          else if (tableId === 'relatives') await saveAppSettings('relative_active_columns', targetCols);
        }
      }
    } catch (e) {
      console.error('Error saving view:', e);
    }

    isViewManagerOpen.value = false;
  };

  const deleteView = async (card, cIdx) => {
    if (cIdx <= 0) {
      alert('Không thể xóa Chế độ xem mặc định (Toàn bộ)');
      return;
    }
    const label = card?.label || 'này';
    if (!confirm(`Bạn có chắc muốn xóa Chế độ xem "${label}"?`)) return;

    const tableId = currentDashboardId.value;
    let dashboards = customDashboards.value ? [...customDashboards.value] : [];
    let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

    if (idx === -1) {
      dashboards = ensureStandardDashboards(dashboards);
      idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
    }
    if (idx === -1) return;

    const currentDash = { ...dashboards[idx] };
    const cards = currentDash.metricCards ? [...currentDash.metricCards] : [];
    if (cIdx < cards.length) {
      cards.splice(cIdx, 1);
      currentDash.metricCards = cards;
      dashboards[idx] = currentDash;
      customDashboards.value = dashboards;

      if (activeMetricCardIdx.value >= cards.length) {
        activeMetricCardIdx.value = Math.max(0, cards.length - 1);
      }

      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
        await saveAppSettings('custom_dashboards_config', dashboards);
      } catch (e) {
        console.error('Error deleting view:', e);
      }
    }
    isViewManagerOpen.value = false;
  };

  const duplicateView = async (card, cIdx) => {
    if (!card) return;
    const tableId = currentDashboardId.value;
    let dashboards = customDashboards.value ? [...customDashboards.value] : [];
    let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

    if (idx === -1) {
      dashboards = ensureStandardDashboards(dashboards);
      idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
    }
    if (idx === -1) return;

    const currentDash = { ...dashboards[idx] };
    const cards = currentDash.metricCards ? [...currentDash.metricCards] : [];

    const newCard = JSON.parse(JSON.stringify(card));
    newCard.id = 'view_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    newCard.label = (newCard.label || 'Chế độ xem') + ' (Bản sao)';

    cards.splice(cIdx + 1, 0, newCard);
    currentDash.metricCards = cards;
    dashboards[idx] = currentDash;
    customDashboards.value = dashboards;
    activeMetricCardIdx.value = cIdx + 1;

    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
      await saveAppSettings('custom_dashboards_config', dashboards);
    } catch (e) {
      console.error('Error duplicating view:', e);
    }
  };

  const moveView = async (cIdx, direction) => {
    const targetIdx = cIdx + direction;
    const tableId = currentDashboardId.value;
    let dashboards = customDashboards.value ? [...customDashboards.value] : [];
    let idx = dashboards.findIndex((d) => String(d.id) === String(tableId));

    if (idx === -1) {
      dashboards = ensureStandardDashboards(dashboards);
      idx = dashboards.findIndex((d) => String(d.id) === String(tableId));
    }
    if (idx === -1) return;

    const currentDash = { ...dashboards[idx] };
    const cards = currentDash.metricCards ? [...currentDash.metricCards] : [];
    if (targetIdx < 0 || targetIdx >= cards.length) return;

    const temp = cards[cIdx];
    cards[cIdx] = cards[targetIdx];
    cards[targetIdx] = temp;

    currentDash.metricCards = cards;
    dashboards[idx] = currentDash;
    customDashboards.value = dashboards;

    if (activeMetricCardIdx.value === cIdx) {
      activeMetricCardIdx.value = targetIdx;
    } else if (activeMetricCardIdx.value === targetIdx) {
      activeMetricCardIdx.value = cIdx;
    }

    try {
      localStorage.setItem('custom_dashboards_config', JSON.stringify(dashboards));
      await saveAppSettings('custom_dashboards_config', dashboards);
    } catch (e) {
      console.error('Error reordering views:', e);
    }
  };

  return {
    activeTabMenuKey,
    toggleTabMenu,
    closeTabMenu,
    handleGlobalTabMenuClick,
    isViewManagerOpen,
    viewManagerMode,
    selectedViewForEdit,
    selectedViewIdx,
    openAddViewDialog,
    openEditViewDialog,
    handleSaveView,
    deleteView,
    duplicateView,
    moveView,
  };
}
