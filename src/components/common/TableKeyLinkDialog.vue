<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="🔑 Cấu hình Khóa Định Danh & Khóa Liên Kết giữa các Bảng dữ liệu"
    :style="{ width: '680px', maxWidth: '95vw' }"
    :breakpoints="{ '640px': '98vw' }"
  >
    <div style="display: flex; flex-direction: column; gap: 1.25rem; padding: 4px 0;">
      <div style="font-size: 0.78rem; color: #475569; line-height: 1.45; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
        💡 <strong>Khóa Định danh & Liên kết</strong> là nền tảng để các Bảng dữ liệu kết nối, tham chiếu tự động (Lookup) và đối chiếu thông tin với nhau (như Cán bộ, Thân nhân, Chuyến đi, Học sinh, v.v.). Bạn có thể tự do chọn cột bất kỳ làm Khóa định danh duy nhất (Primary Key) hoặc Khóa liên kết.
      </div>

      <!-- Bảng 1: Cán bộ / Hồ sơ chính -->
      <div
        class="key-config-card"
        :class="{ 'card-active-focus': activeSource === 'personnel' }"
        style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;"
      >
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: #fee2e2; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-user" style="color: #dc2626; font-size: 1rem;"></i>
            </div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">
                1. Bảng Cán bộ / Hồ sơ chính
              </div>
              <div style="font-size: 0.72rem; color: #64748b;">
                Khóa định danh duy nhất và các trường thông tin nhận diện cốt lõi
              </div>
            </div>
          </div>
          <span v-if="activeSource === 'personnel'" style="font-size: 0.7rem; font-weight: 700; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe;">
            Bảng hiện tại
          </span>
        </div>

        <div style="margin-bottom: 10px;">
          <label style="font-size: 0.74rem; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">
            🔑 Khóa định danh duy nhất (Primary Unique Key):
          </label>
          <select v-model="form.personnelKeyField" class="dialog-select">
            <option v-for="c in personnelCols" :key="c.id" :value="c.id">
              {{ c.label }} (mã: {{ c.id }})
            </option>
          </select>
          <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">
            Dùng để nhận diện chống trùng lặp hồ sơ và làm móc nối tham chiếu với các bảng khác.
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
          <div>
            <label style="font-size: 0.72rem; font-weight: 600; color: #475569; display: block; margin-bottom: 2px;">
              Cột Họ và tên chính:
            </label>
            <select v-model="form.personnelNameField" class="dialog-select" style="font-size: 0.76rem;">
              <option v-for="c in personnelCols" :key="c.id" :value="c.id">
                {{ c.label }} (mã: {{ c.id }})
              </option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.72rem; font-weight: 600; color: #475569; display: block; margin-bottom: 2px;">
              Cột Chức vụ (hiển thị kèm):
            </label>
            <select v-model="form.personnelPositionField" class="dialog-select" style="font-size: 0.76rem;">
              <option v-for="c in personnelCols" :key="c.id" :value="c.id">
                {{ c.label }} (mã: {{ c.id }})
              </option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.72rem; font-weight: 600; color: #475569; display: block; margin-bottom: 2px;">
              Cột Đơn vị (hiển thị kèm):
            </label>
            <select v-model="form.personnelDepartmentField" class="dialog-select" style="font-size: 0.76rem;">
              <option v-for="c in personnelCols" :key="c.id" :value="c.id">
                {{ c.label }} (mã: {{ c.id }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Bảng 2: Thân nhân liên quan -->
      <div
        class="key-config-card"
        :class="{ 'card-active-focus': activeSource === 'relatives' }"
        style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;"
      >
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: #f3e8ff; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-users" style="color: #9333ea; font-size: 1rem;"></i>
            </div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">
                2. Bảng Thân nhân / Đối tượng phụ
              </div>
              <div style="font-size: 0.72rem; color: #64748b;">
                Móc nối với hồ sơ chính và định danh riêng cho từng thân nhân
              </div>
            </div>
          </div>
          <span v-if="activeSource === 'relatives'" style="font-size: 0.7rem; font-weight: 700; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe;">
            Bảng hiện tại
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">
              🔗 Cột Liên kết hồ sơ chính (Parent Link Key):
            </label>
            <select v-model="form.relativeParentKeyField" class="dialog-select">
              <option v-for="c in relativeCols" :key="c.id" :value="c.id">
                {{ c.label }} (mã: {{ c.id }})
              </option>
            </select>
            <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">
              Cột chứa mã để nối thân nhân với hồ sơ chính (cha/mẹ/cán bộ).
            </div>
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">
              🔑 Khóa Định danh riêng Thân nhân:
            </label>
            <select v-model="form.relativeKeyField" class="dialog-select">
              <option v-for="c in relativeCols" :key="c.id" :value="c.id">
                {{ c.label }} (mã: {{ c.id }})
              </option>
            </select>
            <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">
              Mã định danh cá nhân riêng của từng thân nhân.
            </div>
          </div>
        </div>
      </div>

      <!-- Bảng 3: Chuyến đi -->
      <div
        class="key-config-card"
        :class="{ 'card-active-focus': activeSource === 'trips' }"
        style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;"
      >
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-send" style="color: #16a34a; font-size: 1rem;"></i>
            </div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b;">
                3. Bảng Chuyến đi (Xuất nhập cảnh)
              </div>
              <div style="font-size: 0.72rem; color: #64748b;">
                Móc nối chuyến đi với người đi (Cán bộ hoặc Thân nhân)
              </div>
            </div>
          </div>
          <span v-if="activeSource === 'trips'" style="font-size: 0.7rem; font-weight: 700; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe;">
            Bảng hiện tại
          </span>
        </div>

        <div>
          <label style="font-size: 0.74rem; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">
            🔗 Cột Liên kết người đi (Trip Link Key):
          </label>
          <select v-model="form.tripKeyField" class="dialog-select">
            <option v-for="c in tripCols" :key="c.id" :value="c.id">
              {{ c.label }} (mã: {{ c.id }})
            </option>
          </select>
          <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">
            Cột chứa mã để tự động liên kết chuyến đi vào Cán bộ hoặc Thân nhân tương ứng.
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 0.72rem; color: #64748b;">
          Cấu hình sẽ tự động đồng bộ trên toàn bộ các bảng và trang Cài đặt.
        </span>
        <div style="display: flex; gap: 8px;">
          <Button label="Hủy" class="p-button-text p-button-secondary p-button-sm" @click="dialogVisible = false" />
          <Button label="Lưu Cấu hình Khóa" icon="pi pi-check" class="p-button-primary p-button-sm" :loading="saving" @click="saveConfig" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { saveAppSettings } from '@/api/settings';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  activeSource: {
    type: String,
    default: 'personnel', // 'personnel' | 'relatives' | 'trips' | topic
  },
});

const emit = defineEmits(['update:visible', 'saved']);

const personnelStore = usePersonnelStore();
const saving = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const form = ref({
  personnelKeyField: 'cccdparent',
  personnelNameField: 'name',
  personnelPositionField: 'position',
  personnelDepartmentField: 'departmentName',
  relativeParentKeyField: 'cccdparent',
  relativeKeyField: 'cccdthannhan',
  tripKeyField: 'cccdchuyendi',
});

const loadCurrentConfig = () => {
  const cfg = personnelStore.systemKeyConfig || {};
  form.value = {
    personnelKeyField: cfg.personnelKeyField || 'cccdparent',
    personnelNameField: cfg.personnelNameField || 'name',
    personnelPositionField: cfg.personnelPositionField || 'position',
    personnelDepartmentField: cfg.personnelDepartmentField || 'departmentName',
    relativeParentKeyField: cfg.relativeParentKeyField || 'cccdparent',
    relativeKeyField: cfg.relativeKeyField || 'cccdthannhan',
    tripKeyField: cfg.tripKeyField || 'cccdchuyendi',
  };
};

watch(
  () => props.visible,
  (val) => {
    if (val) loadCurrentConfig();
  },
  { immediate: true }
);

// Danh sách cột khả dụng cho từng bảng
const personnelCols = computed(() => {
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const relativeCols = computed(() => {
  const list = [];
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const tripCols = computed(() => {
  const list = [];
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const saveConfig = async () => {
  saving.value = true;
  try {
    const payload = { ...form.value };
    // Cập nhật Pinia store
    personnelStore.systemKeyConfig = payload;
    // Lưu vào database settings
    await saveAppSettings('system_key_config', payload);
    try {
      localStorage.setItem('system_key_config', JSON.stringify(payload));
    } catch (e) {}

    emit('saved', payload);
    dialogVisible.value = false;
  } catch (err) {
    console.error('Error saving key config:', err);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.dialog-select {
  width: 100%;
  height: 32px;
  padding: 4px 8px;
  font-size: 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #1e293b;
  outline: none;
}
.dialog-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
.key-config-card {
  transition: all 0.2s;
}
.card-active-focus {
  border-color: #93c5fd !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}
</style>
