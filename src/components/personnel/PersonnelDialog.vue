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
      <!-- TAB 1: CÁN BỘ (Cá nhân + Khối Chuyến đi nước ngoài của Cán bộ) -->
      <div v-show="activeTab === 0" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <template v-for="(grp, gIdx) in (personnelStore.importMappingPersonnel || [])" :key="gIdx">
          <!-- Nhóm Kỷ luật & Lưu ý chính trị -->
          <div v-if="isNotesGroup(grp, gIdx)">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-exclamation-triangle" style="color: #f59e0b; font-size: 0.95rem;"></i>
              <span>{{ grp.group || 'Lịch sử kỷ luật & Lưu ý chính trị' }}</span>
            </h4>
            <PersonnelNotesForm :form="form" :group="grp" />
          </div>

          <!-- Các nhóm thông tin khác (Khối A, Quá trình công tác, v.v.) -->
          <div v-else>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <i :class="gIdx === 0 ? 'pi pi-user' : 'pi pi-folder'" :style="{ color: gIdx === 0 ? '#16a34a' : '#0284c7', fontSize: '0.95rem' }"></i>
              <span>{{ grp.group || 'Thông tin bổ sung' }}</span>
            </h4>
            <PersonnelBasicForm
              :form="form"
              :departments="personnelStore.departments"
              :group="grp"
            />
          </div>
        </template>

        <!-- Khối Chuyến đi nước ngoài của Cán bộ (Nằm trực tiếp bên trong Tab Cá nhân) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-top: 0.5rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-send" style="color: #0284c7; font-size: 0.95rem;"></i>
            <span>Chuyến đi nước ngoài của Cán bộ ({{ form.trips?.length || 0 }} chuyến)</span>
          </h4>
          <PersonnelTravelForm :form="form" />
        </div>
      </div>

      <!-- TAB 2: THÂN NHÂN (Danh sách thân nhân + Chuyến đi riêng bên trong từng thân nhân) -->
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
        <div style="display: flex; gap: 8px; align-items: center;">
          <span v-if="autoSaveStatus === 'saving'" style="font-size: 0.75rem; color: #0284c7; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="pi pi-spin pi-spinner"></i> Đang lưu...
          </span>
          <span v-else-if="autoSaveStatus === 'saved'" style="font-size: 0.75rem; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-right: 4px;">
            <i class="pi pi-check-circle"></i> Đã lưu thành công
          </span>

          <Button
            v-if="isEdit"
            label="Xuất Hồ sơ PDF"
            icon="pi pi-file-pdf"
            severity="secondary"
            outlined
            size="small"
            @click="isDocxExportOpen = true"
          />
          <Button label="Đóng" severity="secondary" text size="small" @click="visible = false" />
          <Button
            label="Lưu hồ sơ"
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

const isTripsGroup = (grp, idx) => {
  if (!grp) return false;
  if (grp.isMultiple && (grp.columns || []).some((c) => c.id === 'countryName' || c.id === 'decisionNumber' || c.id === 'departureDate')) return true;
  if (grp.group && (grp.group.includes('Chuyến đi') || grp.group.includes('nước ngoài') || grp.group.includes('Khối B'))) return true;
  return false;
};

const isNotesGroup = (grp, idx) => {
  if (!grp) return false;
  if (grp.group && (grp.group.includes('kỷ luật') || grp.group.includes('Lưu ý') || grp.group.includes('Khối C'))) return true;
  if ((grp.columns || []).some((c) => c.format === 'checkbox_text' || c.id === 'politicalVerificationResult')) return true;
  return false;
};

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
    let cd = val.custom_data || {};
    if (typeof cd === 'string') {
      try {
        cd = JSON.parse(cd);
      } catch (e) {
        cd = {};
      }
    }
    const parsedVal = JSON.parse(JSON.stringify(val));
    // Clean out custom_data and recursive keys from parsedVal and cd
    delete parsedVal.custom_data;
    delete cd.custom_data;
    delete parsedVal.rawPerson;
    delete parsedVal.rawRelative;
    delete parsedVal.rawTrip;
    delete parsedVal.uniqueKey;

    form.value = {
      ...cd,
      ...parsedVal,
      trips: Array.isArray(parsedVal.trips) ? parsedVal.trips : (cd.trips || []),
      relatives: Array.isArray(parsedVal.relatives) ? parsedVal.relatives : (cd.relatives || []),
      flags: (typeof parsedVal.flags === 'object' && parsedVal.flags) ? parsedVal.flags : (cd.flags || {}),
      files: Array.isArray(parsedVal.files) ? parsedVal.files : (cd.files || []),
      custom_data: { ...cd, ...parsedVal },
    };
    delete form.value.custom_data.custom_data;
  } else {
    isEdit.value = false;
    form.value = {
      id: null,
      code: '',
      name: '',
      otherName: '',
      birthYear: '',
      gender: 'Nam',
      birthDate: '',
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
  initialJsonSnapshot = JSON.stringify(form.value);
};

const autoSaveStatus = ref('');
let autoSaveTimer = null;
let initialJsonSnapshot = '';

watch(
  () => [props.modelValue, props.initialTab, props.personData],
  ([isOpen, tab, pData]) => {
    if (isOpen) {
      activeTab.value = Number(tab) === 1 ? 1 : 0;
      initFormData(pData || props.personData);
    } else {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveStatus.value = '';
    }
  },
  { immediate: true, deep: true }
);

let isSavingInternal = false;

const triggerAutoSave = () => {
  if (!isEdit.value || !form.value.id || !form.value.name?.trim() || isSavingInternal || saving.value) return;
  const cccdVal = form.value.cccdparent || form.value.cccd || form.value.so_cccd;
  if (!cccdVal || !String(cccdVal).trim()) return;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(async () => {
    if (isSavingInternal || saving.value) return;
    isSavingInternal = true;
    autoSaveStatus.value = 'saving';
    try {
      const saved = await personnelStore.savePerson(form.value);
      initialJsonSnapshot = JSON.stringify(form.value);
      autoSaveStatus.value = 'saved';
      emit('saved', saved);
      setTimeout(() => {
        if (autoSaveStatus.value === 'saved') autoSaveStatus.value = '';
      }, 2500);
    } catch (e) {
      autoSaveStatus.value = '';
    } finally {
      isSavingInternal = false;
    }
  }, 2000);
};

watch(
  () => form.value,
  () => {
    if (!visible.value || !isEdit.value) return;
    const currentJson = JSON.stringify(form.value);
    if (!initialJsonSnapshot) {
      initialJsonSnapshot = currentJson;
      return;
    }
    // Chỉ kích hoạt tự động lưu khi CÓ SỰ THAY ĐỔI thực sự so với snapshot ban đầu
    if (currentJson !== initialJsonSnapshot) {
      triggerAutoSave();
    }
  },
  { deep: true }
);

const handleSave = async () => {
  if (!form.value.name?.trim()) {
    alert('Vui lòng nhập Họ và tên cán bộ!');
    activeTab.value = 0;
    return;
  }
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  if (isSavingInternal || saving.value) {
    // Chờ 300ms nếu auto-save vừa gửi đi
    await new Promise((r) => setTimeout(r, 400));
  }
  saving.value = true;
  isSavingInternal = true;
  autoSaveStatus.value = 'saving';
  try {
    const saved = await personnelStore.savePerson(form.value);
    initialJsonSnapshot = JSON.stringify(form.value);
    autoSaveStatus.value = 'saved';
    emit('saved', saved);
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') autoSaveStatus.value = '';
    }, 2500);
  } catch (e) {
    autoSaveStatus.value = '';
    alert('Lỗi lưu dữ liệu: ' + (e.message || e));
  } finally {
    saving.value = false;
    isSavingInternal = false;
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
