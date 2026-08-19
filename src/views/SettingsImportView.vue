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

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
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
                    placeholder="Rộng: 25%"
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

const normalizeGroupColumns = (groups) => {
  (groups || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (!c.width) c.width = '25';
    });
  });
  return groups;
};

onMounted(async () => {
  await personnelStore.loadSettings();
  personnelGroups.value = normalizeGroupColumns(JSON.parse(JSON.stringify(personnelStore.importMappingPersonnel || [])));
  relativeGroups.value = normalizeGroupColumns(JSON.parse(JSON.stringify(personnelStore.importMappingRelative || [])));
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

const resetToDefault = () => {
  if (!confirm('Bạn có chắc muốn khôi phục danh sách cột về Mặc định Chuẩn gốc của Hệ thống? (Các cột tùy chỉnh thêm sau sẽ được làm mới)')) return;

  if (activeTab.value === 'personnel') {
    personnelGroups.value = [
      {
        group: 'Khối A: Thông tin cơ bản',
        isMultiple: false,
        columns: [
          { id: 'stt', label: 'TT', format: 'number', width: '25' },
          { id: 'name', label: 'Họ và tên', format: 'text', width: '25' },
          { id: 'otherName', label: 'Tên khác', format: 'text', width: '25' },
          { id: 'birthYear', label: 'Ngày tháng năm sinh', format: 'date', width: '25' },
          { id: 'ethnicity', label: 'Dân tộc', format: 'text', width: '25' },
          { id: 'religion', label: 'Tôn giáo', format: 'text', width: '25' },
          { id: 'hometown', label: 'Quê quán', format: 'text', width: '25' },
          { id: 'departmentName', label: 'Đơn vị công tác', format: 'text', width: '50' },
          { id: 'positionName', label: 'Chức vụ', format: 'text', width: '50' },
          { id: 'thuongTru', label: 'Thường trú', format: 'text', width: '50' },
          { id: 'tamTru', label: 'Tạm trú', format: 'text', width: '50' },
          { id: 'cccd', label: 'Số CCCD', format: 'text', width: '25' },
          { id: 'hcCaNhan', label: 'HC Cá nhân', format: 'text', width: '25' },
          { id: 'hcCongVu', label: 'HC Công vụ', format: 'text', width: '25' },
          { id: 'kqThamTra', label: 'Kết quả thẩm tra', format: 'text', width: '100' },
        ],
      },
      {
        group: 'Khối B: Chuyến đi nước ngoài',
        isMultiple: true,
        columns: [
          { id: 'decisionNumber', label: 'Số Quyết định', format: 'text', width: '25' },
          { id: 'decisionDate', label: 'Ngày Quyết định', format: 'date', width: '25' },
          { id: 'decisionIssuer', label: 'Cơ quan ban hành', format: 'text', width: '50' },
          { id: 'departureDate', label: 'Ngày Xuất cảnh', format: 'date', width: '25' },
          { id: 'arrivalDate', label: 'Ngày Nhập cảnh', format: 'date', width: '25' },
          { id: 'countryName', label: 'Quốc gia', format: 'text', width: '25' },
          { id: 'tripCount', label: 'Số lần', format: 'number', width: '25' },
          { id: 'purpose', label: 'Mục đích chuyến đi', format: 'text', width: '33' },
          { id: 'fundingName', label: 'Nguồn kinh phí', format: 'checkbox_text', width: '33', options: 'Ngân sách, Tự túc, Học bổng, Tài trợ, Khác' },
          { id: 'sponsorUnit', label: 'Đơn vị chọn cử / tài trợ', format: 'text', width: '33' },
          { id: 'trainingTime', label: 'Thời gian đào tạo', format: 'text', width: '50' },
          { id: 'trainingPlace', label: 'Nơi đào tạo', format: 'text', width: '50' },
          { id: 'report', label: 'Đã nộp Báo cáo kết quả', format: 'checkbox', width: '50' },
          { id: 'nopHC', label: 'Đã nộp lại Hộ chiếu công vụ', format: 'checkbox', width: '50' },
        ],
      },
      {
        group: 'Khối C: Thông tin Lưu ý & Kỷ luật',
        isMultiple: false,
        columns: [
          { id: 'trongYeu', label: 'Vấn đề về tiêu chuẩn chính trị ("tự diễn biến", "tự chuyển hóa")', format: 'checkbox_text', width: '100' },
          { id: 'thamNhung', label: 'Đang trong quá trình điều tra, thanh tra hoặc liên quan vụ việc phức tạp', format: 'checkbox_text', width: '100' },
          { id: 'loiKeo', label: 'Có vấn đề khác về lý lịch (khai man, che dấu lý lịch, bằng cấp...)', format: 'checkbox_text', width: '100' },
          { id: 'klDang', label: 'Hình thức kỷ luật Đảng', format: 'checkbox_text', width: '50' },
          { id: 'klChinhQuyen', label: 'Hình thức kỷ luật Chính quyền', format: 'checkbox_text', width: '50' },
          { id: 'vpChuaPhep', label: 'Đi nước ngoài khi chưa được cấp phép', format: 'checkbox_text', width: '50' },
          { id: 'vpNuocNgoai', label: 'Vi phạm pháp luật ở nước ngoài / trong nước', format: 'checkbox_text', width: '50' },
          { id: 'vpQuaHan', label: 'Ở lại nước ngoài quá thời gian quy định', format: 'checkbox_text', width: '50' },
          { id: 'dienQuanLy', label: 'Đối tượng thuộc diện quản lý đặc biệt', format: 'checkbox_text', width: '50' },
          { id: 'receivedGiftOver50M', label: 'Được tặng tiền, hàng giá trị từ 50 triệu trở lên', format: 'checkbox_text', width: '33' },
          { id: 'rentHouseToForeigner', label: 'Cho người nước ngoài thuê nhà, đất', format: 'checkbox_text', width: '33' },
          { id: 'workInForeignCompany', label: 'Làm việc tại công ty có vốn đầu tư nước ngoài (FDI)', format: 'checkbox_text', width: '33' },
          { id: 'marriedToForeigner', label: 'Kết hôn với người nước ngoài', format: 'checkbox_text', width: '50' },
          { id: 'files', label: 'Tệp đính kèm Hồ sơ (Đơn giải trình, Kết luận...)', format: 'file', width: '100' },
        ],
      },
    ];
  }
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
