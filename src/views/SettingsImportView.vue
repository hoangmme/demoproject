<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: #1f2937;">Cấu hình Cột & Mẫu Import/Export</h3>
          <p style="font-size: 0.82rem; color: #6b7280; margin-top: 2px;">
            Ghép nối đúng thứ tự cột trong file Excel mẫu với các trường hệ thống và kiểu định dạng (Văn bản, Ngày tháng, Hộp kiểm có điều kiện, List dữ liệu...).
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <Button
            label="Thêm Nhóm mới"
            icon="pi pi-plus"
            severity="secondary"
            size="small"
            @click="addGroup"
          />
          <Button
            label="Lưu Cấu hình"
            icon="pi pi-check"
            severity="success"
            size="small"
            :loading="saving"
            @click="saveConfig"
          />
        </div>
      </div>

      <!-- Tabs between Personnel and Relatives -->
      <div style="display: flex; gap: 8px; margin-bottom: 1.25rem;">
        <Button
          label="Cấu hình Mẫu Cán bộ (Cá nhân)"
          icon="pi pi-user"
          :severity="activeTab === 'personnel' ? 'primary' : 'secondary'"
          :text="activeTab !== 'personnel'"
          size="small"
          @click="activeTab = 'personnel'"
        />
        <Button
          label="Cấu hình Mẫu Thân nhân"
          icon="pi pi-users"
          :severity="activeTab === 'relative' ? 'primary' : 'secondary'"
          :text="activeTab !== 'relative'"
          size="small"
          @click="activeTab = 'relative'"
        />
      </div>

      <!-- Columns List -->
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">
        <div v-for="(group, gIdx) in currentGroups" :key="gIdx" style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Group Header -->
          <div style="padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
              <InputText
                v-model="group.group"
                placeholder="Tên Nhóm (VD: Khối A: Thông tin cơ bản)"
                size="small"
                style="font-weight: 700; font-size: 0.9rem; flex: 1; max-width: 400px;"
              />
              <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; color: #6b21a8; cursor: pointer;">
                <input type="checkbox" v-model="group.isMultiple" style="accent-color: #6b21a8;" />
                <span>Cho phép lặp lại (Nhập nhiều lần)</span>
              </label>
            </div>

            <Button
              label="Xóa Nhóm"
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="removeGroup(gIdx)"
              style="font-size: 0.75rem;"
            />
          </div>

          <!-- Group Columns List -->
          <div style="padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 10px;">
            <div
              v-for="(col, cIdx) in group.columns"
              :key="cIdx"
              style="display: flex; flex-direction: column; gap: 6px; padding: 8px 12px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; font-size: 0.8rem;"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <!-- Column Order + Field ID + Field Label -->
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px;">
                  <span class="badge-pill badge-green" style="font-weight: 700; font-size: 0.72rem; min-width: 58px; justify-content: center;">
                    Cột {{ getGlobalColIndex(gIdx, cIdx) }}
                  </span>
                  <span style="font-family: monospace; color: #4b5563; font-size: 0.75rem; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; min-width: 90px; text-align: center;">
                    {{ col.id }}
                  </span>
                  <InputText v-model="col.label" placeholder="Tên nhãn hiển thị" size="small" style="font-size: 0.8rem; flex: 1;" />
                </div>

                <!-- Format & Width Settings -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <Select
                    v-model="col.format"
                    :options="formatOptions"
                    optionLabel="label"
                    optionValue="value"
                    size="small"
                    appendTo="body"
                    placeholder="Định dạng"
                    style="width: 175px; font-size: 0.75rem;"
                  />
                  <Select
                    v-model="col.width"
                    :options="widthOptions"
                    optionLabel="label"
                    optionValue="value"
                    size="small"
                    appendTo="body"
                    placeholder="Độ rộng"
                    style="width: 120px; font-size: 0.75rem;"
                  />
                  <Button
                    v-if="col.id && col.id.startsWith('custom_')"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    @click="removeColumn(gIdx, cIdx)"
                    style="padding: 2px 4px;"
                  />
                </div>
              </div>

              <!-- Options Config (for Checkbox, Checkbox_Text, Dropdown) -->
              <div
                v-if="col.format === 'checkbox' || col.format === 'checkbox_text' || col.format === 'dropdown'"
                style="padding-left: 66px; display: flex; align-items: center; gap: 8px;"
              >
                <i class="pi pi-list" style="font-size: 0.75rem; color: #6b7280;"></i>
                <InputText
                  v-model="col.options"
                  placeholder="Danh sách tùy chọn (cách nhau bởi dấu phẩy, VD: Tự túc, Học bổng, Mời làm việc...)"
                  size="small"
                  style="font-size: 0.75rem; width: 100%;"
                />
              </div>
            </div>

            <!-- Add column button -->
            <div style="margin-top: 6px;">
              <Button
                label="Thêm Cột Tùy chỉnh vào nhóm này"
                icon="pi pi-plus"
                size="small"
                text
                severity="primary"
                @click="addColumn(gIdx)"
                style="font-size: 0.78rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { saveAppSettings } from '@/api/settings';

const personnelStore = usePersonnelStore();

const activeTab = ref('personnel');
const saving = ref(false);

const personnelGroups = ref([]);
const relativeGroups = ref([]);

const formatOptions = [
  { label: 'Văn bản (Text)', value: 'text' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Ngày tháng (Date)', value: 'date' },
  { label: 'List Dữ liệu (Text Loop)', value: 'text_loop' },
  { label: 'Hộp kiểm (Nhiều lựa chọn)', value: 'checkbox' },
  { label: 'Hộp kiểm + Nhập Text (Có điều kiện)', value: 'checkbox_text' },
  { label: 'Dropdown (Lựa chọn đơn)', value: 'dropdown' },
  { label: 'Tệp đính kèm (File/Ảnh/PDF)', value: 'file' },
];

const widthOptions = [
  { label: 'Rộng: 25%', value: '25' },
  { label: 'Rộng: 33%', value: '33' },
  { label: 'Rộng: 50%', value: '50' },
  { label: 'Rộng: 75%', value: '75' },
  { label: 'Rộng: 100%', value: '100' },
];

onMounted(async () => {
  await personnelStore.loadSettings();
  personnelGroups.value = JSON.parse(JSON.stringify(personnelStore.importMappingPersonnel || []));
  relativeGroups.value = JSON.parse(JSON.stringify(personnelStore.importMappingRelative || []));
});

const currentGroups = computed(() => {
  return activeTab.value === 'personnel' ? personnelGroups.value : relativeGroups.value;
});

const getGlobalColIndex = (groupIndex, columnIndex) => {
  const groups = currentGroups.value;
  let count = 0;
  for (let i = 0; i < groupIndex; i++) {
    count += (groups[i]?.columns?.length || 0);
  }
  return count + columnIndex + 1;
};

const addGroup = () => {
  currentGroups.value.push({
    group: 'Nhóm trường mới ' + (currentGroups.value.length + 1),
    isMultiple: false,
    columns: [],
  });
};

const removeGroup = (gIndex) => {
  if (!confirm(`Bạn có chắc muốn xóa nhóm "${currentGroups.value[gIndex]?.group}" cùng tất cả cột bên trong không?`)) return;
  currentGroups.value.splice(gIndex, 1);
};

const addColumn = (gIdx) => {
  const customId = 'custom_' + Date.now();
  currentGroups.value[gIdx].columns.push({
    id: customId,
    label: 'Cột mới ' + (currentGroups.value[gIdx].columns.length + 1),
    format: 'text',
    width: '25',
    options: '',
  });
};

const removeColumn = (gIdx, cIdx) => {
  currentGroups.value[gIdx].columns.splice(cIdx, 1);
};

const saveConfig = async () => {
  saving.value = true;
  try {
    if (activeTab.value === 'personnel') {
      await saveAppSettings('mapping_config_personnel', personnelGroups.value);
      await saveAppSettings('importMappingPersonnel', personnelGroups.value);
      personnelStore.importMappingPersonnel = personnelGroups.value;
    } else {
      await saveAppSettings('mapping_config_relative', relativeGroups.value);
      await saveAppSettings('importMappingRelative', relativeGroups.value);
      personnelStore.importMappingRelative = relativeGroups.value;
    }
    alert('Đã lưu cấu hình cột thành công!');
  } catch (err) {
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    saving.value = false;
  }
};
</script>
