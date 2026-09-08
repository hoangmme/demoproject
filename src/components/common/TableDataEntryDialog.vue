<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '560px', maxWidth: '95vw' }"
    header="➕ Nhập liệu Bản ghi Mới - Chọn Bảng Dữ Liệu"
    :closable="true"
    @hide="resetState"
  >
    <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
      <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
        Chọn bảng bạn muốn thêm bản ghi mới. Hệ thống sẽ tự động mở form nhập liệu động tương ứng với cấu hình cột của bảng đó:
      </div>

      <!-- Ô tìm kiếm bảng -->
      <div class="search-box-wrap" style="position: relative;">
        <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.8rem;"></i>
        <InputText
          v-model="searchTableQuery"
          placeholder="Tìm tên bảng dữ liệu..."
          style="width: 100%; padding-left: 30px; font-size: 0.8rem; height: 34px;"
        />
      </div>

      <!-- Danh sách bảng khả dụng -->
      <div class="tables-grid" style="display: flex; flex-direction: column; gap: 8px; max-height: 380px; overflow-y: auto; padding-right: 2px;">
        <div
          v-for="table in filteredTables"
          :key="table.id"
          class="table-select-card"
          @click="handleSelectTable(table)"
        >
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
            <div class="table-card-icon" :style="{ background: getTableColor(table).bg, color: getTableColor(table).color }">
              <i :class="table.icon ? (table.icon.startsWith('pi-') ? `pi ${table.icon}` : table.icon) : 'pi pi-table'"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="font-size: 0.88rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
                {{ table.title }}
              </strong>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                {{ getTableSubInfo(table) }}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.72rem; color: #0284c7; font-weight: 600;">+ Thêm</span>
            <i class="pi pi-chevron-right" style="color: #94a3b8; font-size: 0.75rem;"></i>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 0.72rem; color: #94a3b8;">
          {{ filteredTables.length }} bảng dữ liệu khả dụng
        </span>
        <Button
          label="Đóng"
          severity="secondary"
          size="small"
          text
          @click="visible = false"
          style="font-size: 0.78rem;"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { getUnifiedTableDefinitions } from '@/utils/tableRegistry';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'open-create-personnel', 'open-create-relative', 'open-create-trip']);

const router = useRouter();
const personnelStore = usePersonnelStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const step = ref(1);
const selectedTable = ref(null);
const searchTableQuery = ref('');
const customDashboards = ref([]);

const loadDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) customDashboards.value = parsed;
    }
  } catch (e) {}
};
loadDashboards();

onMounted(() => {
  window.addEventListener('custom-dashboards-updated', (e) => {
    if (e.detail && Array.isArray(e.detail)) customDashboards.value = e.detail;
    else loadDashboards();
  });
});

const allTables = computed(() => {
  return getUnifiedTableDefinitions({
    personnelStore,
    customDashboards: customDashboards.value,
  });
});

const filteredTables = computed(() => {
  const q = searchTableQuery.value.trim().toLowerCase();
  if (!q) return allTables.value;
  return allTables.value.filter((t) => {
    return (t.title && t.title.toLowerCase().includes(q)) ||
      (t.code && t.code.toLowerCase().includes(q)) ||
      (t.source && t.source.toLowerCase().includes(q));
  });
});


const getTableColor = (table) => {
  const hex = table?.iconColor || '#0284c7';
  return {
    bg: `${hex}18`,
    color: hex,
    badgeBg: `${hex}22`,
    badgeColor: hex,
  };
};

const getTableSubInfo = (table) => {
  if (table.source === 'personnel') return `${personnelStore.personnelList?.length || 0} kết quả`;
  if (table.source === 'relatives') return `${personnelStore.relativesList?.length || 0} kết quả`;
  if (table.source === 'trips') return `${personnelStore.tripsList?.length || 0} kết quả`;
  const count = table.getRows ? (table.getRows(personnelStore)?.length || 0) : 0;
  if (table.source === 'blank') return `Bảng tự tạo (${count} kết quả)`;
  return `Bảng chuyên đề (${count} kết quả)`;
};

const handleSelectTable = (table) => {
  visible.value = false;
  selectedTable.value = table;
  if (table.route) {
    router.push(`${table.route}?action=new_record`);
  } else if (table.id === 'trips' || table.source === 'trips') {
    router.push('/trips?action=new_record');
  } else if (table.id === 'relatives' || table.source === 'relatives') {
    router.push('/relatives?action=new_record');
  } else if (table.id === 'personnel' || table.source === 'personnel') {
    router.push('/personnel?action=new_record');
  }
};

const resetState = () => {
  selectedTable.value = null;
  searchTableQuery.value = '';
};
</script>

<style scoped>
.table-select-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.table-select-card:hover {
  background: #f8fafc;
  border-color: #0284c7;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}
.table-card-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.table-card-code {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
}
.person-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
}
.person-select-item:hover {
  background: #f0f9ff;
  border-color: #bae6fd;
}
</style>
