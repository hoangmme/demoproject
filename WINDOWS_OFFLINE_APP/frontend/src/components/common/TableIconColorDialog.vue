<template>
  <Dialog
    :visible="visible"
    modal
    :header="`🎨 Tùy Chỉnh Biểu Tượng & Màu Sắc Bảng`"
    :style="{ width: '520px', maxWidth: '95vw' }"
    @update:visible="val => $emit('update:visible', val)"
  >
    <div style="display: flex; flex-direction: column; gap: 16px; padding: 6px 0;">
      <!-- Live Preview Card -->
      <div
        style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 12px; border: 1.5px solid; transition: all 0.2s ease;"
        :style="{
          borderColor: (selectedColor || '#0284c7') + '40',
          background: (selectedColor || '#0284c7') + '0c',
        }"
      >
        <div
          style="width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1.5px solid; transition: all 0.2s ease;"
          :style="{
            borderColor: (selectedColor || '#0284c7') + '50',
            background: (selectedColor || '#0284c7') + '1a',
            color: selectedColor || '#0284c7',
          }"
        >
          <i :class="['pi', selectedIcon || 'pi-table']" style="font-size: 1.45rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            Xem trước hiển thị
          </div>
          <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-top: 2px;">
            {{ tableTitle || 'Bảng dữ liệu' }}
          </div>
        </div>
      </div>

      <!-- Section 1: Chọn Màu sắc (Icon Color) -->
      <div>
        <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 8px;">
          1. Chọn Màu sắc nhận diện:
        </label>
        
        <!-- Preset Color Swatches -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
          <button
            v-for="color in PRESET_COLORS"
            :key="color.hex"
            type="button"
            class="color-swatch-btn"
            :class="{ 'swatch-active': selectedColor.toLowerCase() === color.hex.toLowerCase() }"
            :style="{ background: color.hex }"
            :title="color.name"
            @click="selectedColor = color.hex"
          >
            <i v-if="selectedColor.toLowerCase() === color.hex.toLowerCase()" class="pi pi-check" style="color: #ffffff; font-size: 0.75rem; font-weight: 800;"></i>
          </button>
        </div>

        <!-- Custom Color Picker Input -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <input
            type="color"
            v-model="selectedColor"
            style="width: 36px; height: 32px; padding: 0; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; background: transparent;"
          />
          <InputText
            v-model="selectedColor"
            placeholder="#0284c7"
            style="width: 120px; font-size: 0.82rem; height: 32px; font-family: monospace;"
          />
          <span style="font-size: 0.72rem; color: #64748b;">(Mã màu Hex tùy chọn)</span>
        </div>
      </div>

      <!-- Section 2: Chọn Biểu tượng (Icon) -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155;">
            2. Chọn Biểu tượng (Icon):
          </label>
          <div style="position: relative; width: 180px;">
            <i class="pi pi-search" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: #94a3b8;"></i>
            <input
              v-model="iconSearch"
              placeholder="Tìm icon..."
              style="width: 100%; height: 28px; font-size: 0.76rem; padding: 2px 8px 2px 26px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
            />
          </div>
        </div>

        <!-- Icon Grid -->
        <div class="icon-picker-grid">
          <button
            v-for="item in filteredIcons"
            :key="item.icon"
            type="button"
            class="icon-picker-btn"
            :class="{ 'icon-active': selectedIcon === item.icon }"
            :style="selectedIcon === item.icon ? { borderColor: selectedColor, color: selectedColor, background: selectedColor + '15' } : {}"
            :title="item.label"
            @click="selectedIcon = item.icon"
          >
            <i :class="['pi', item.icon]" style="font-size: 1.15rem;"></i>
            <span class="icon-label-sub">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
        <Button label="Hủy" severity="secondary" text size="small" @click="$emit('update:visible', false)" />
        <Button label="Lưu thay đổi" icon="pi pi-check" severity="primary" size="small" :loading="saving" @click="handleSave" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { ensureStandardDashboards, DEFAULT_UNIFIED_DASHBOARDS } from '@/utils/tableRegistry';

const props = defineProps({
  visible: { type: Boolean, default: false },
  tableId: { type: String, required: true },
  tableTitle: { type: String, default: 'Bảng dữ liệu' },
  currentIcon: { type: String, default: 'pi-table' },
  currentColor: { type: String, default: '#0284c7' },
});

const emit = defineEmits(['update:visible', 'saved']);

const PRESET_COLORS = [
  { name: 'Xanh biển (Blue)', hex: '#0284c7' },
  { name: 'Xanh hoàng gia', hex: '#2563eb' },
  { name: 'Tím đậm (Purple)', hex: '#9333ea' },
  { name: 'Tím sáng (Violet)', hex: '#a855f7' },
  { name: 'Xanh lá (Emerald)', hex: '#10b981' },
  { name: 'Xanh lục (Green)', hex: '#16a34a' },
  { name: 'Xanh rêu (Olive)', hex: '#889962' },
  { name: 'Hổ phách (Amber)', hex: '#f59e0b' },
  { name: 'Cam (Orange)', hex: '#f97316' },
  { name: 'Đỏ (Red)', hex: '#ef4444' },
  { name: 'Hồng (Pink)', hex: '#ec4899' },
  { name: 'Xanh ngọc (Cyan)', hex: '#06b6d4' },
  { name: 'Chàm (Indigo)', hex: '#6366f1' },
  { name: 'Xám Slate', hex: '#64748b' },
];

const AVAILABLE_ICONS = [
  { icon: 'pi-users', label: 'Cán bộ', keywords: 'can bo nguoi dung user users' },
  { icon: 'pi-user', label: 'Cá nhân', keywords: 'ca nhan user nguoi' },
  { icon: 'pi-heart', label: 'Thân nhân', keywords: 'than nhan gia dinh heart tinh cam' },
  { icon: 'pi-send', label: 'Chuyến đi', keywords: 'chuyen di xuat ngoai send di chuyen' },
  { icon: 'pi-table', label: 'Bảng dữ liệu', keywords: 'bang table spreadsheet' },
  { icon: 'pi-id-card', label: 'Hồ sơ CCCD', keywords: 'cccd id card the can cuoc' },
  { icon: 'pi-briefcase', label: 'Công tác', keywords: 'cong tac briefcase cap tui viec' },
  { icon: 'pi-building', label: 'Cơ quan', keywords: 'co quan building don vi to chuc' },
  { icon: 'pi-shield', label: 'Bảo mật', keywords: 'bao mat shield an ninh chinh tri' },
  { icon: 'pi-folder', label: 'Thư mục', keywords: 'thu muc folder chuyen de' },
  { icon: 'pi-file', label: 'Văn bản', keywords: 'van ban file tai lieu' },
  { icon: 'pi-bookmark', label: 'Dấu trang', keywords: 'bookmark quan trong luu' },
  { icon: 'pi-star', label: 'Nổi bật', keywords: 'star ngoi sao uu tien' },
  { icon: 'pi-chart-bar', label: 'Biểu đồ', keywords: 'bieu do chart bar thong ke' },
  { icon: 'pi-chart-pie', label: 'Thống kê', keywords: 'pie chart ti le' },
  { icon: 'pi-tag', label: 'Thẻ phân loại', keywords: 'tag the phan loai' },
  { icon: 'pi-tags', label: 'Nhiều thẻ', keywords: 'tags the' },
  { icon: 'pi-globe', label: 'Quốc tế', keywords: 'globe toan cau nuoc ngoai' },
  { icon: 'pi-map-marker', label: 'Địa điểm', keywords: 'dia diem map marker vi tri' },
  { icon: 'pi-calendar', label: 'Lịch trình', keywords: 'lich calendar thoi gian' },
  { icon: 'pi-check-square', label: 'Nhiệm vụ', keywords: 'nhiem vu check square hoan thanh' },
  { icon: 'pi-list', label: 'Danh sách', keywords: 'list danh sach hang' },
  { icon: 'pi-bell', label: 'Thông báo', keywords: 'bell chuong canh bao' },
  { icon: 'pi-flag', label: 'Quốc kỳ / Cờ', keywords: 'flag co quoc ky' },
  { icon: 'pi-compass', label: 'Điều hướng', keywords: 'compass la ban dinh huong' },
  { icon: 'pi-database', label: 'Dữ liệu gốc', keywords: 'database kho luu tru' },
];

const selectedIcon = ref(props.currentIcon || 'pi-table');
const selectedColor = ref(props.currentColor || '#0284c7');
const iconSearch = ref('');
const saving = ref(false);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      selectedIcon.value = props.currentIcon || 'pi-table';
      selectedColor.value = props.currentColor || '#0284c7';
      iconSearch.value = '';
    }
  }
);

const filteredIcons = computed(() => {
  const q = iconSearch.value.trim().toLowerCase();
  if (!q) return AVAILABLE_ICONS;
  return AVAILABLE_ICONS.filter((item) =>
    item.icon.toLowerCase().includes(q) ||
    item.label.toLowerCase().includes(q) ||
    item.keywords.toLowerCase().includes(q)
  );
});

const handleSave = async () => {
  saving.value = true;
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    let list = local ? JSON.parse(local) : [...DEFAULT_UNIFIED_DASHBOARDS];
    list = ensureStandardDashboards(list);

    const idx = list.findIndex((d) => d.id === props.tableId);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        icon: selectedIcon.value,
        iconColor: selectedColor.value,
      };
    } else {
      list.push({
        id: props.tableId,
        title: props.tableTitle,
        icon: selectedIcon.value,
        iconColor: selectedColor.value,
      });
    }

    localStorage.setItem('custom_dashboards_config', JSON.stringify(list));
    await saveAppSettings('custom_dashboards_config', list);

    // Phát sự kiện toàn hệ thống
    window.dispatchEvent(new CustomEvent('custom-dashboards-updated', { detail: list }));

    emit('saved', {
      tableId: props.tableId,
      icon: selectedIcon.value,
      iconColor: selectedColor.value,
    });
    emit('update:visible', false);
  } catch (e) {
    console.error('Lỗi khi lưu biểu tượng bảng:', e);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.color-swatch-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  padding: 0;
}
.color-swatch-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
.color-swatch-btn.swatch-active {
  transform: scale(1.15);
  box-shadow: 0 0 0 2.5px #0f172a, 0 2px 6px rgba(0, 0, 0, 0.25);
}

.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.icon-picker-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  color: #475569;
  transition: all 0.15s ease;
}
.icon-picker-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}
.icon-picker-btn.icon-active {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.icon-label-sub {
  font-size: 0.65rem;
  color: #64748b;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
