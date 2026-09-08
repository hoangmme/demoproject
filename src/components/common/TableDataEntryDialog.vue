<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '560px', maxWidth: '95vw' }"
    :header="step === 1 ? '➕ Nhập liệu Bản ghi Mới - Chọn Bảng Dữ Liệu' : '🔗 Chọn Cán bộ Chủ quản Liên Kết'"
    :closable="true"
    @hide="resetState"
  >
    <!-- BƯỚC 1: CHỌN BẢNG DỮ LIỆU -->
    <div v-if="step === 1" style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
      <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
        Chọn bảng bạn muốn thêm bản ghi mới. Hệ thống sẽ tự động điều hướng hoặc mở form nhập liệu tương ứng:
      </div>

      <!-- Ô tìm kiếm bảng -->
      <div class="search-box-wrap" style="position: relative;">
        <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.8rem;"></i>
        <InputText
          v-model="searchTableQuery"
          placeholder="Tìm tên bảng, mã bảng [CB-01, TN-02, TB-xx]..."
          style="width: 100%; padding-left: 30px; font-size: 0.8rem; height: 34px;"
        />
      </div>

      <!-- Danh sách bảng khả dụng -->
      <div class="tables-grid" style="display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; padding-right: 2px;">
        <div
          v-for="table in filteredTables"
          :key="table.id"
          class="table-select-card"
          @click="handleSelectTable(table)"
        >
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
            <div class="table-card-icon" :style="{ background: getTableColor(table).bg, color: getTableColor(table).color }">
              <i :class="table.icon || 'pi pi-table'"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="table-card-code" :style="{ background: getTableColor(table).badgeBg, color: getTableColor(table).badgeColor }">
                  {{ table.code }}
                </span>
                <strong style="font-size: 0.86rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ table.title }}
                </strong>
              </div>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                {{ getTableSubInfo(table) }}
              </div>
            </div>
          </div>
          <i class="pi pi-chevron-right" style="color: #94a3b8; font-size: 0.8rem;"></i>
        </div>
      </div>
    </div>

    <!-- BƯỚC 2: CHỌN CÁN BỘ LIÊN KẾT (NẾU CHỌN THÂN NHÂN HOẶC CHUYẾN ĐI) -->
    <div v-else-if="step === 2" style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="table-card-code" :style="{ background: getTableColor(selectedTable).badgeBg, color: getTableColor(selectedTable).badgeColor }">
            {{ selectedTable?.code }}
          </span>
          <span style="font-weight: 700; font-size: 0.84rem; color: #1e3a8a;">
            {{ selectedTable?.title }}
          </span>
        </div>
        <button
          type="button"
          @click="step = 1"
          style="background: none; border: none; font-size: 0.74rem; color: #2563eb; font-weight: 600; cursor: pointer;"
        >
          ← Đổi bảng khác
        </button>
      </div>

      <div style="font-size: 0.76rem; color: #475569;">
        Bản ghi này cần liên kết với một Cán bộ trong hệ thống. Vui lòng chọn hồ sơ Cán bộ chủ quản:
      </div>

      <!-- Tìm kiếm Cán bộ -->
      <div style="position: relative;">
        <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.8rem;"></i>
        <InputText
          v-model="searchPersonQuery"
          placeholder="Tìm tên cán bộ, CCCD, chức vụ, phòng ban..."
          style="width: 100%; padding-left: 30px; font-size: 0.8rem; height: 34px;"
        />
      </div>

      <!-- Danh sách Cán bộ -->
      <div style="display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; padding-right: 2px;">
        <div
          v-for="person in filteredPersonnel"
          :key="person.id"
          class="person-select-item"
          @click="handleSelectParentPersonnel(person)"
        >
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0;">
              {{ (person.name || 'CB').charAt(0).toUpperCase() }}
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="font-size: 0.84rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
                {{ person.name }}
              </strong>
              <div style="font-size: 0.7rem; color: #64748b; display: flex; gap: 8px; flex-wrap: wrap;">
                <span v-if="person.position">Chức vụ: {{ person.position }}</span>
                <span v-if="person.departmentId">Đơn vị: {{ person.departmentId }}</span>
                <span v-if="person.cccd || person.cccdparent">CCCD: {{ person.cccd || person.cccdparent }}</span>
              </div>
            </div>
          </div>
          <Button
            label="Chọn"
            size="small"
            outlined
            severity="primary"
            style="font-size: 0.72rem; padding: 3px 8px;"
          />
        </div>

        <div v-if="filteredPersonnel.length === 0" style="text-align: center; padding: 20px; color: #94a3b8; font-size: 0.78rem;">
          Không tìm thấy cán bộ nào phù hợp.
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 0.72rem; color: #94a3b8;">
          {{ step === 1 ? `${filteredTables.length} bảng dữ liệu` : `${filteredPersonnel.length} cán bộ khả dụng` }}
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
import { ref, computed } from 'vue';
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
const searchPersonQuery = ref('');

const allTables = computed(() => {
  return getUnifiedTableDefinitions(personnelStore);
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

const filteredPersonnel = computed(() => {
  const list = personnelStore.personnelList || [];
  const q = searchPersonQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) => {
    return (p.name && p.name.toLowerCase().includes(q)) ||
      (p.position && p.position.toLowerCase().includes(q)) ||
      (p.departmentId && p.departmentId.toLowerCase().includes(q)) ||
      (p.cccd && String(p.cccd).toLowerCase().includes(q)) ||
      (p.cccdparent && String(p.cccdparent).toLowerCase().includes(q));
  });
});

const getTableColor = (table) => {
  if (!table) return { bg: '#f1f5f9', color: '#475569', badgeBg: '#f1f5f9', badgeColor: '#475569' };
  if (table.code === 'CB-01') return { bg: '#e0f2fe', color: '#0284c7', badgeBg: '#dbeafe', badgeColor: '#1d4ed8' };
  if (table.code === 'TN-02') return { bg: '#f3e8ff', color: '#9333ea', badgeBg: '#fae8ff', badgeColor: '#86198f' };
  if (table.code === 'CD-03') return { bg: '#dcfce7', color: '#16a34a', badgeBg: '#d1fae5', badgeColor: '#065f46' };
  return { bg: '#fef3c7', color: '#d97706', badgeBg: '#fef9c3', badgeColor: '#854d0e' };
};

const getTableSubInfo = (table) => {
  if (table.code === 'CB-01') return `${personnelStore.personnelList.length} cán bộ · Bảng hồ sơ gốc`;
  if (table.code === 'TN-02') return `${personnelStore.relativesList.length} thân nhân · Cần liên kết Cán bộ`;
  if (table.code === 'CD-03') return 'Theo dõi xuất nhập cảnh · Cần liên kết Cán bộ';
  return 'Bảng chuyên đề / tùy chỉnh tự tạo';
};

const handleSelectTable = (table) => {
  selectedTable.value = table;
  if (table.source === 'relatives' || table.source === 'trips') {
    step.value = 2;
  } else if (table.source === 'personnel') {
    visible.value = false;
    emit('open-create-personnel');
    router.push('/personnel?action=new_personnel');
  } else {
    // Custom table (TB-xx)
    visible.value = false;
    router.push(`${table.route}?action=new_record`);
  }
};

const handleSelectParentPersonnel = (person) => {
  visible.value = false;
  if (selectedTable.value?.source === 'relatives') {
    emit('open-create-relative', person);
    router.push(`/personnel?tab=thannhan&action=new_relative&personnelId=${person.id}`);
  } else if (selectedTable.value?.source === 'trips') {
    emit('open-create-trip', person);
    router.push(`/trips?action=new_trip&personnelId=${person.id}`);
  }
};

const resetState = () => {
  step.value = 1;
  selectedTable.value = null;
  searchTableQuery.value = '';
  searchPersonQuery.value = '';
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
