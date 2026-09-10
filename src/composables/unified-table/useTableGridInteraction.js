import { ref } from 'vue';

export function useTableGridInteraction({
  currentDashboardConfig,
  topicId,
  customTableRows,
  personnelStore,
  saveAppSettings,
  openPersonnelDetail,
}) {
  const editingChildCell = ref(null);

  const startChildInlineEdit = (row, col) => {
    if (
      col.format === 'formula' ||
      col.format === 'file' ||
      col.format === 'text_file_loop' ||
      col.format === 'checkbox_file_loop' ||
      col.id === '_parentPersonnelName'
    ) {
      if (typeof openPersonnelDetail === 'function') {
        openPersonnelDetail(row);
      }
      return;
    }
    const currentVal = row[col.id] ?? row.custom_data?.[col.id] ?? '';
    editingChildCell.value = {
      uniqueKey: row.uniqueKey,
      row: row,
      colId: col.id,
      col: col,
      value: currentVal !== '-' ? currentVal : '',
    };
  };

  const cancelChildInlineEdit = () => {
    editingChildCell.value = null;
  };

  const saveChildInlineEdit = async () => {
    if (!editingChildCell.value) return;
    const { row, colId, value } = editingChildCell.value;
    editingChildCell.value = null;

    const oldVal = row[colId] ?? row.custom_data?.[colId] ?? '';
    if (String(oldVal) === String(value)) return;

    try {
      row[colId] = value;
      if (!row.custom_data) row.custom_data = {};
      if (typeof row.custom_data === 'string') {
        try {
          row.custom_data = JSON.parse(row.custom_data);
        } catch (e) {
          row.custom_data = {};
        }
      }
      row.custom_data[colId] = value;

      const countryAliases = ['quoc_gia_xuat_canh', 'countryName', 'country', 'quoc_gia', 'quoc_gia_den'];
      if (countryAliases.includes(colId)) {
        const trimmed = String(value || '').trim();
        for (const alias of countryAliases) {
          row[alias] = trimmed;
          if (trimmed === '') {
            delete row.custom_data[alias];
          } else {
            row.custom_data[alias] = trimmed;
          }
        }
      }

      if (currentDashboardConfig.value?.source === 'blank') {
        const tid = topicId.value;
        const list = [...(customTableRows.value || [])];
        const idx = list.findIndex((r) => r.id === row.id || r.uniqueKey === row.uniqueKey);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            [colId]: value,
            custom_data: { ...(list[idx].custom_data || {}), [colId]: value },
          };
          customTableRows.value = list;
          try {
            localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(list));
            await saveAppSettings(`custom_table_rows_${tid}`, list);
          } catch (e) {}
        }
        return;
      }

      await personnelStore.saveRecord(row);
      await personnelStore.fetchPersonnel();
    } catch (err) {
      console.error('Lỗi cập nhật nhanh inline trên bảng:', err);
      alert('Lỗi lưu dữ liệu: ' + (err.message || err));
    }
  };

  const getChildColDropdownOptions = (col) => {
    if (!col.options) return [];
    return String(col.options)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return {
    editingChildCell,
    startChildInlineEdit,
    cancelChildInlineEdit,
    saveChildInlineEdit,
    getChildColDropdownOptions,
  };
}
