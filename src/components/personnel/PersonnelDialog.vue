<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="isEdit ? `Chỉnh sửa Hồ sơ: ${form.name || ''}` : 'Thêm mới Hồ sơ Cán bộ'"
    :style="{ width: '85vw', maxWidth: '1100px' }"
    :breakpoints="{ '960px': '95vw', '640px': '100vw' }"
  >
    <div style="margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;">
        <Button
          :label="'1. Thông tin Cá nhân (' + (form.name || 'Chưa đặt') + ')'"
          icon="pi pi-user"
          :severity="activeTab === 0 ? 'primary' : 'secondary'"
          :text="activeTab !== 0"
          size="small"
          @click="activeTab = 0"
        />
        <Button
          :label="'2. Đi nước ngoài (' + (form.trips?.length || 0) + ')'"
          icon="pi pi-globe"
          :severity="activeTab === 1 ? 'primary' : 'secondary'"
          :text="activeTab !== 1"
          size="small"
          @click="activeTab = 1"
        />
        <Button
          :label="'3. Thân nhân (' + (form.relatives?.length || 0) + ')'"
          icon="pi pi-heart"
          :severity="activeTab === 2 ? 'primary' : 'secondary'"
          :text="activeTab !== 2"
          size="small"
          @click="activeTab = 2"
        />
        <Button
          label="4. Lịch sử & Lưu ý"
          icon="pi pi-shield"
          :severity="activeTab === 3 ? 'primary' : 'secondary'"
          :text="activeTab !== 3"
          size="small"
          @click="activeTab = 3"
        />
      </div>
    </div>

    <!-- Tab Contents -->
    <div style="max-height: 65vh; overflow-y: auto; padding-right: 6px;">
      <PersonnelBasicForm
        v-show="activeTab === 0"
        :form="form"
        :departments="personnelStore.departments"
        :mapping="personnelStore.importMappingPersonnel"
      />
      <PersonnelTravelForm
        v-show="activeTab === 1"
        :form="form"
      />
      <PersonnelFamilyForm
        v-show="activeTab === 2"
        :form="form"
      />
      <PersonnelNotesForm
        v-show="activeTab === 3"
        :form="form"
      />
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  personData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const activeTab = ref(0);
const saving = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isEdit = computed(() => Boolean(form.value.id));

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

watch(
  () => props.personData,
  (val) => {
    if (val) {
      form.value = JSON.parse(JSON.stringify(val));
      if (!form.value.trips) form.value.trips = [];
      if (!form.value.relatives) form.value.relatives = [];
      if (!form.value.flags) form.value.flags = {};
      if (!form.value.custom_data) form.value.custom_data = {};
      if (!form.value.files) form.value.files = [];
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
      };
    }
    activeTab.value = 0;
  },
  { immediate: true }
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
