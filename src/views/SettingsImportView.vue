<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: #1f2937;">Cấu hình Cột & Mẫu Import/Export</h3>
          <p style="font-size: 0.82rem; color: #6b7280; margin-top: 2px;">
            Quản lý thứ tự cột (STT), mã trường (ID), nhãn hiển thị và định dạng dữ liệu (Text, Ngày tháng, Số, Lựa chọn...) cho toàn hệ thống.
          </p>
        </div>

        <Button
          label="Lưu Cấu hình"
          icon="pi pi-check"
          severity="success"
          size="small"
          :loading="saving"
          @click="saveConfig"
        />
      </div>

      <!-- Tabs between Personnel and Relatives -->
      <div style="display: flex; gap: 8px; margin-bottom: 1.25rem;">
        <Button
          label="Mẫu Hồ sơ Cán bộ"
          icon="pi pi-user"
          :severity="activeTab === 'personnel' ? 'primary' : 'secondary'"
          :text="activeTab !== 'personnel'"
          size="small"
          @click="activeTab = 'personnel'"
        />
        <Button
          label="Mẫu Thân nhân"
          icon="pi pi-users"
          :severity="activeTab === 'relative' ? 'primary' : 'secondary'"
          :text="activeTab !== 'relative'"
          size="small"
          @click="activeTab = 'relative'"
        />
      </div>

      <!-- Columns List -->
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">
        <div v-for="(group, gIdx) in currentGroups" :key="gIdx" style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #ffffff;">
          <div style="padding: 0.65rem 1rem; background: #f3f4f6; font-weight: 700; font-size: 0.85rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <span>{{ group.group || 'Nhóm trường' }} ({{ group.columns?.length || 0 }} cột)</span>
          </div>

          <div style="padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 8px;">
            <div
              v-for="(col, cIdx) in group.columns"
              :key="cIdx"
              style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; font-size: 0.8rem;"
            >
              <!-- Column Order + Field ID + Field Label -->
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
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
                  style="width: 145px; font-size: 0.75rem;"
                />
                <Select
                  v-model="col.width"
                  :options="widthOptions"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  appendTo="body"
                  placeholder="Độ rộng"
                  style="width: 110px; font-size: 0.75rem;"
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

            <!-- Add column button (Single + only) -->
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
  { label: 'Ngày tháng (Date)', value: 'date' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Lựa chọn (Select)', value: 'select' },
  { label: 'Tệp đính kèm (File)', value: 'file' },
  { label: 'Đúng / Sai (Boolean)', value: 'boolean' },
];

const widthOptions = [
  { label: 'Nhỏ (110px)', value: '110px' },
  { label: 'Vừa (160px)', value: '160px' },
  { label: 'Lớn (200px)', value: '200px' },
  { label: 'Rộng (260px)', value: '260px' },
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

const addColumn = (gIdx) => {
  const customId = 'custom_' + Date.now();
  currentGroups.value[gIdx].columns.push({
    id: customId,
    label: 'Cột mới ' + (currentGroups.value[gIdx].columns.length + 1),
    format: 'text',
    width: '160px',
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
