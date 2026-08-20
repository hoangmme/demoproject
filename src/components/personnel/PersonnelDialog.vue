<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogHeader"
    :style="{ width: '85vw', maxWidth: '1100px' }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <!-- 2 Main Tabs: Cá nhân & Thân nhân -->
    <div style="margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; padding-bottom: 8px;">
      <Button
        :label="'1. Thông tin Cán bộ (Cá nhân)'"
        icon="pi pi-user"
        :severity="activeTab === 0 ? 'primary' : 'secondary'"
        :text="activeTab !== 0"
        size="small"
        @click="activeTab = 0"
      />
      <Button
        :label="'2. Danh sách Thân nhân (' + (form.relatives?.length || 0) + ')'"
        icon="pi pi-users"
        :severity="activeTab === 1 ? 'primary' : 'secondary'"
        :text="activeTab !== 1"
        size="small"
        @click="activeTab = 1"
      />
    </div>

    <!-- Fixed Height Tab Contents Area to prevent jumping -->
    <div style="height: 540px; max-height: 65vh; overflow-y: auto; padding-right: 8px;">
      <!-- TAB 1: CÁN BỘ (Cá nhân, Đi nước ngoài, Kỷ luật & Lưu ý) -->
      <div v-show="activeTab === 0" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px;">
            A. THÔNG TIN CHUNG & CƯ TRÚ
          </h4>
          <PersonnelBasicForm
            :form="form"
            :departments="personnelStore.departments"
            :mapping="personnelStore.importMappingPersonnel"
          />
        </div>

        <div>
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px;">
            B. LỊCH SỬ ĐI NƯỚC NGOÀI ({{ form.trips?.length || 0 }} chuyến)
          </h4>
          <PersonnelTravelForm :form="form" />
        </div>

        <div>
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px;">
            C. LỊCH SỬ KỶ LUẬT & LƯU Ý CHÍNH TRỊ
          </h4>
          <PersonnelNotesForm :form="form" />
        </div>
      </div>

      <!-- TAB 2: THÂN NHÂN -->
      <div v-show="activeTab === 1">
        <PersonnelFamilyForm :form="form" :targetRelativeCode="targetRelativeCode" />
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
        <div>
          <Button
            v-if="isEdit && authStore.isAdmin"
            label="Xóa hồ sơ"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="handleDelete"
          />
        </div>
        <div style="display: flex; gap: 8px;">
          <Button
            v-if="isEdit"
            label="Xuất PDF / Word"
            icon="pi pi-file-pdf"
            severity="secondary"
            outlined
            size="small"
            @click="isDocxExportOpen = true"
          />
          <Button label="Hủy" severity="secondary" text size="small" @click="visible = false" />
          <Button
            label="Lưu toàn bộ Hồ sơ"
            icon="pi pi-check"
            severity="success"
            size="small"
            :loading="saving"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Advanced DOCX Export Dialog for current Person -->
  <AdvancedDocxExportDialog
    v-model="isDocxExportOpen"
    :targetPerson="form"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import PersonnelBasicForm from './PersonnelBasicForm.vue';
import PersonnelTravelForm from './PersonnelTravelForm.vue';
import PersonnelFamilyForm from './PersonnelFamilyForm.vue';
import PersonnelNotesForm from './PersonnelNotesForm.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';

const isDocxExportOpen = ref(false);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  personData: {
    type: Object,
    default: null,
  },
  initialTab: {
    type: Number,
    default: 0,
  },
  targetRelativeCode: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const activeTab = ref(Number(props.initialTab) === 1 ? 1 : 0);
const saving = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isEdit = computed(() => Boolean(form.value.id));

const isRelativeDetail = computed(() => Boolean(props.targetRelativeCode));

const dialogHeader = computed(() => {
  if (props.targetRelativeCode) {
    return `Chi tiết Thân nhân (${props.targetRelativeCode}) - Cán bộ: ${form.value.name || 'Hồ sơ liên quan'}`;
  }
  return isEdit.value ? `Chỉnh sửa Hồ sơ: ${form.value.name || ''}` : 'Thêm mới Hồ sơ Cán bộ';
});

const form = ref({
  id: null,
  code: '',
  name: '',
  otherName: '',
  birthYear: '',
  ethnicity: 'Kinh',
  religion: 'Không',
  hometown: '',
  departmentId: null,
  position: '',
  thuongTru: '',
  tamTru: '',
  cccd: '',
  passportPersonal: '',
  passportOfficial: '',
  tcctResult: '',
  trips: [],
  relatives: [],
  flags: {},
  custom_data: {},
  files: [],
});

const initFormData = (val) => {
  if (val) {
    const cd = val.custom_data || {};
    const parsedVal = JSON.parse(JSON.stringify(val));
    form.value = {
      ...cd,
      ...parsedVal,
      position: parsedVal.position || parsedVal.positionName || cd.positionName || cd.position || '',
      positionName: parsedVal.positionName || parsedVal.position || cd.position || cd.positionName || '',
      departmentName: parsedVal.departmentName || (parsedVal.departmentId ? personnelStore.getDepartmentName(parsedVal.departmentId) : '') || cd.departmentName || '',
      hcCaNhan: parsedVal.hcCaNhan || parsedVal.passportPersonal || cd.hcCaNhan || cd.passportPersonal || '',
      hcCongVu: parsedVal.hcCongVu || parsedVal.passportOfficial || cd.hcCongVu || cd.passportOfficial || '',
      kqThamTra: parsedVal.kqThamTra || parsedVal.tcctResult || cd.kqThamTra || cd.tcctResult || '',
      trips: Array.isArray(parsedVal.trips) ? parsedVal.trips : (cd.trips || []),
      relatives: Array.isArray(parsedVal.relatives) ? parsedVal.relatives : (cd.relatives || []),
      flags: (typeof parsedVal.flags === 'object' && parsedVal.flags) ? parsedVal.flags : (cd.flags || {}),
      files: Array.isArray(parsedVal.files) ? parsedVal.files : (cd.files || []),
      custom_data: { ...cd, ...parsedVal },
    };
  } else {
    form.value = {
      id: null,
      code: '',
      name: '',
      otherName: '',
      birthYear: '',
      ethnicity: 'Kinh',
      religion: 'Không',
      hometown: '',
      departmentId: null,
      departmentName: '',
      position: '',
      positionName: '',
      thuongTru: '',
      tamTru: '',
      cccd: '',
      hcCaNhan: '',
      hcCongVu: '',
      kqThamTra: '',
      passportPersonal: '',
      passportOfficial: '',
      tcctResult: '',
      trips: [],
      relatives: [],
      flags: {},
      custom_data: {},
      files: [],
    };
  }
};

watch(
  () => [props.modelValue, props.initialTab, props.personData],
  ([isOpen, tab, pData]) => {
    if (isOpen) {
      activeTab.value = Number(tab) === 1 ? 1 : 0;
      initFormData(pData || props.personData);
    }
  },
  { immediate: true, deep: true }
);

const handleSave = async () => {
  if (!form.value.name?.trim()) {
    alert('Vui lòng nhập Họ và tên cán bộ!');
    activeTab.value = 0;
    return;
  }
  saving.value = true;
  try {
    const saved = await personnelStore.savePerson(form.value);
    alert('Lưu hồ sơ cán bộ thành công!');
    emit('saved', saved);
    visible.value = false;
  } catch (e) {
    alert('Lỗi lưu dữ liệu: ' + (e.message || e));
  } finally {
    saving.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ cán bộ: "${form.value.name}" không?`)) return;
  try {
    await personnelStore.deletePerson(form.value);
    emit('deleted', form.value);
    visible.value = false;
  } catch (e) {
    alert('Lỗi xóa hồ sơ: ' + (e.message || e));
  }
};
</script>
