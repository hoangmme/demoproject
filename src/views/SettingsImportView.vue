<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        <div>
          <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
            Cấu hình Mẫu Cột & Import Biểu mẫu
          </h3>
          <p style="font-size: 0.8rem; color: #6b7280;">
            Tùy chỉnh các trường dữ liệu, độ rộng cột, định dạng tệp và thêm cột mở rộng.
          </p>
        </div>
        <Button
          label="Lưu Cấu hình"
          icon="pi pi-check"
          severity="success"
          size="small"
          :loading="saving"
          @click="saveMapping"
          style="font-size: 0.8rem;"
        />
      </div>

      <!-- Tab Buttons -->
      <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
        <Button
          label="Mẫu Cá nhân (Cán bộ)"
          :severity="activeTab === 'personnel' ? 'primary' : 'secondary'"
          :text="activeTab !== 'personnel'"
          size="small"
          @click="activeTab = 'personnel'"
        />
        <Button
          label="Mẫu Thân nhân"
          :severity="activeTab === 'relative' ? 'primary' : 'secondary'"
          :text="activeTab !== 'relative'"
          size="small"
          @click="activeTab = 'relative'"
        />
      </div>

      <!-- Columns List -->
      <div style="max-height: 60vh; overflow-y: auto;">
        <div v-for="(group, gIdx) in currentGroups" :key="gIdx" style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 0.6rem 1rem; background: #f3f4f6; font-weight: 700; font-size: 0.85rem; color: #1f2937; border-bottom: 1px solid #e5e7eb;">
            {{ group.group || 'Nhóm trường' }}
          </div>

          <div style="padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 8px;">
            <div
              v-for="(col, cIdx) in group.columns"
              :key="cIdx"
              style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 10px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px; font-size: 0.8rem;"
            >
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <span style="font-family: monospace; color: #6b7280; font-size: 0.75rem;">[{{ col.id }}]</span>
                <InputText v-model="col.label" size="small" style="font-size: 0.8rem; flex: 1;" />
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <Select
                  v-model="col.format"
                  :options="formatOptions"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  appendTo="body"
                  placeholder="Định dạng"
                  style="width: 140px; font-size: 0.75rem;"
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

            <!-- Add column button -->
            <div style="margin-top: 6px;">
              <Button
                label="+ Thêm Cột Tùy chỉnh vào nhóm này"
                icon="pi pi-plus"
                size="small"
                text
                @click="addColumn(gIdx)"
                style="font-size: 0.75rem;"
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

const formatOptions = [
  { label: 'Văn bản (Text)', value: 'text' },
  { label: 'Ngày tháng (Date)', value: 'date' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Tệp đính kèm (File)', value: 'file' },
  { label: 'Hộp kiểm (Checkbox)', value: 'checkbox_text' },
];

const widthOptions = [
  { label: '25% (4 cột)', value: '25%' },
  { label: '33% (3 cột)', value: '33%' },
  { label: '50% (2 cột)', value: '50%' },
  { label: '100% (1 cột)', value: '100%' },
];

onMounted(async () => {
  await personnelStore.loadSettings();
});

const currentGroups = computed(() => {
  return activeTab.value === 'personnel'
    ? personnelStore.importMappingPersonnel
    : personnelStore.importMappingRelative;
});

const addColumn = (gIdx) => {
  const customId = `custom_${Date.now()}`;
  currentGroups.value[gIdx].columns.push({
    id: customId,
    label: 'Cột tùy chỉnh mới',
    format: 'text',
    width: '25%',
  });
};

const removeColumn = (gIdx, cIdx) => {
  currentGroups.value[gIdx].columns.splice(cIdx, 1);
};

const saveMapping = async () => {
  saving.value = true;
  try {
    if (activeTab.value === 'personnel') {
      await saveAppSettings('importMappingPersonnel', personnelStore.importMappingPersonnel);
    } else {
      await saveAppSettings('importMappingRelative', personnelStore.importMappingRelative);
    }
    alert('Đã lưu cấu hình biểu mẫu thành công!');
  } catch (e) {
    alert('Lỗi lưu cấu hình: ' + (e.message || e));
  } finally {
    saving.value = false;
  }
};
</script>
