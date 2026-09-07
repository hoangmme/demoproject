<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <span style="font-size: 0.85rem; font-weight: 600; color: #374151;">
        Danh sách thân nhân liên quan ({{ relatives.length }} người)
      </span>
      <Button
        label="Thêm Thân nhân"
        icon="pi pi-plus"
        size="small"
        severity="success"
        @click="addRelative"
        style="font-size: 0.8rem;"
      />
    </div>

    <!-- Notice if filtering to single relative -->
    <div
      v-if="targetRelativeCode && relatives.length > 1"
      style="display: flex; justify-content: space-between; align-items: center; background: #e0f2fe; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.8rem; color: #0369a1; border-left: 4px solid #0284c7;"
    >
      <span><i class="pi pi-user"></i> Đang xem chi tiết thân nhân <b>{{ targetRelativeCode }}</b></span>
      <button
        type="button"
        @click="showAllRelatives = !showAllRelatives"
        style="background: none; border: none; color: #0284c7; font-weight: 700; cursor: pointer; text-decoration: underline; font-size: 0.78rem;"
      >
        {{ showAllRelatives ? 'Chỉ xem thân nhân này' : `Xem toàn bộ (${relatives.length} thân nhân)` }}
      </button>
    </div>

    <div v-if="displayedRelatives.length === 0" style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; font-size: 0.85rem;">
      Chưa có thân nhân liên quan nào được ghi nhận. Nhấp <b>"+ Thêm Thân nhân"</b> để bổ sung.
    </div>

    <div
      v-for="(rel, idx) in displayedRelatives"
      :key="rel.id || idx"
      :id="`relative-card-${rel.code || ('TN-' + String(idx + 1).padStart(5, '0'))}`"
      class="relative-card-box"
      style="margin-bottom: 1.25rem; border: 1.5px solid #e9d5ff; border-left: 4px solid #9333ea; border-radius: 8px; overflow: hidden; background: #faf5ff; box-shadow: 0 1px 4px rgba(147, 51, 234, 0.06);"
    >
      <!-- Header of relative card -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #f3e8ff; border-bottom: 1px solid #e9d5ff;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-code" style="background: #9333ea; color: #ffffff;">
            {{ getRelativeCode(rel, idx) }}
          </span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #581c87;">
            {{ getRelativeHeaderTitle(rel) }}
          </span>
        </div>
        <Button
          label="Xóa thân nhân này"
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          @click="removeRelative(idx)"
          style="padding: 2px 8px; font-size: 0.75rem;"
        />
      </div>

      <!-- Dynamic Content of relative card based on importMappingRelative -->
      <div style="padding: 1rem;">
        <!-- Thẻ tóm tắt thông tin Cán bộ liên quan -->
        <div v-if="getParentPersonnelInfo(rel)" style="background: #ffffff; border: 1px solid #e9d5ff; border-left: 4px solid #0284c7; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div>
            <div style="font-size: 0.7rem; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
              <i class="pi pi-user"></i>
              <span>Cán bộ liên quan</span>
            </div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #0f172a;">
              {{ getParentPersonnelInfo(rel).name }}
            </div>
            <div style="font-size: 0.78rem; color: #475569;">
              {{ getParentPersonnelInfo(rel).position }} <span v-if="getParentPersonnelInfo(rel).departmentName">· {{ getParentPersonnelInfo(rel).departmentName }}</span>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: #64748b; font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
            CCCD: <strong>{{ getParentPersonnelInfo(rel).cccd || '-' }}</strong>
          </div>
        </div>

        <template v-if="relativeGroups.length > 0">
          <div v-for="(group, gIdx) in relativeGroups" :key="gIdx" style="margin-bottom: 1rem;">
            <div v-if="relativeGroups.length > 1" style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
              {{ group.group }}
            </div>
            <div class="form-grid">
              <div
                v-for="col in filterRelativeColumns(group.columns)"
                :key="col.id"
                :class="'field-item ' + getColClass(col.width)"
              >
                <label class="field-label" :title="col.label">
                  <span v-if="colIndexMap[col.id]" class="col-num-badge">{{ colIndexMap[col.id] }}</span>
                  <span class="label-text">{{ col.label }}</span>
                </label>
                <DynamicField
                  :modelValue="getRelativeFieldValue(rel, col.id)"
                  @update:modelValue="(val) => setRelativeFieldValue(rel, col.id, val)"
                  :col="col"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Chuyến đi xuất nhập cảnh của thân nhân này -->
        <div style="margin-top: 1.25rem; background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(2, 132, 199, 0.06);">
          <div style="font-size: 0.92rem; font-weight: 700; color: #0369a1; margin-bottom: 0.75rem; border-bottom: 1px solid #bae6fd; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-send" style="color: #0284c7; font-size: 0.95rem;"></i>
            <span>Chuyến đi nước ngoài của Thân nhân này ({{ (rel.trips || []).length }} chuyến)</span>
          </div>
          <PersonnelTravelForm :form="rel" :isRelative="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import DynamicField from '@/components/common/DynamicField.vue';
import PersonnelTravelForm from '@/components/personnel/PersonnelTravelForm.vue';
import { computeColumnIndexMap } from '@/utils/formatters';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  targetRelativeCode: {
    type: String,
    default: '',
  },
});

const personnelStore = usePersonnelStore();
const showAllRelatives = ref(false);

const relatives = computed({
  get: () => {
    if (!props.form.relatives) props.form.relatives = [];
    return props.form.relatives;
  },
  set: (val) => {
    props.form.relatives = val;
  },
});

const displayedRelatives = computed(() => {
  if (props.targetRelativeCode && !showAllRelatives.value) {
    const codeClean = String(props.targetRelativeCode).trim().toLowerCase();
    const target = relatives.value.filter((r, idx) => {
      const rCode = String(r.code || '').trim().toLowerCase();
      const rIdxCode = ('tn-' + String(idx + 1).padStart(5, '0')).toLowerCase();
      const rIdCode = ('tn-' + String(r.id || '').slice(-5).padStart(5, '0')).toLowerCase();
      const rId = String(r.id || '').trim().toLowerCase();
      const rCccd = String(r.cccd || r.custom_data?.cccdthannhan || r.cccdthannhan || '').trim().toLowerCase();
      return rCode === codeClean || rIdxCode === codeClean || rIdCode === codeClean || rId === codeClean || rCccd === codeClean;
    });
    if (target.length > 0) return target;
  }
  return relatives.value;
});

const getRelativeCode = (rel, idx) => {
  if (rel.code && String(rel.code).startsWith('TN-')) return rel.code;
  if (props.targetRelativeCode && displayedRelatives.value.length === 1) return props.targetRelativeCode;
  const globalIdx = (personnelStore.relativesList || []).findIndex(
    (item) => (rel.id && item.id === rel.id) || (rel.cccd && item.cccd === rel.cccd)
  );
  if (globalIdx !== -1) {
    return 'TN-' + String(globalIdx + 1).padStart(5, '0');
  }
  const localIdx = relatives.value.indexOf(rel);
  return 'TN-' + String((localIdx !== -1 ? localIdx : idx) + 1).padStart(5, '0');
};

const relativeGroups = computed(() => {
  return personnelStore.importMappingRelative || [];
});

const colIndexMap = computed(() => {
  return computeColumnIndexMap(personnelStore.importMappingRelative);
});

const filterRelativeColumns = (cols) => {
  const ignore = new Set(['stt', 'code', 'parentPersonnelName', 'parentPosition', 'parentDepartment', 'parentPersonnelCccd', 'parentCccd', 'cccdparent']);
  return (cols || []).filter((c) => !ignore.has(c.id) && !c.hidden && c.format !== 'formula');
};

const getRelativeFieldValue = (rel, colId) => {
  if (rel[colId] !== undefined && rel[colId] !== null && rel[colId] !== '') return rel[colId];
  if (rel.custom_data && rel.custom_data[colId] !== undefined && rel.custom_data[colId] !== null) return rel.custom_data[colId];
  return '';
};

const getParentPersonnelInfo = (rel) => {
  // 1. First check props.form (if opened inside personnel detail)
  if (props.form && (props.form.name || props.form.cccd || props.form.cccdparent)) {
    return {
      name: props.form.name || props.form.fullName || 'Chưa đặt tên',
      position: props.form.positionName || props.form.position || 'Cán bộ',
      departmentName: props.form.departmentName || '',
      cccd: props.form.cccd || props.form.cccdparent || '',
    };
  }
  // 2. Otherwise lookup by rel.cccdparent or rel.parentPersonnelCccd from personnelStore
  const parentKey = rel.cccdparent || rel.parentPersonnelCccd || rel.parentCccd || rel.custom_data?.cccdparent;
  if (parentKey) {
    const found = personnelStore.findPersonByCccd(parentKey);
    if (found) {
      return {
        name: found.name || found.fullName || 'Chưa đặt tên',
        position: found.positionName || found.position || 'Cán bộ',
        departmentName: found.departmentName || '',
        cccd: found.cccd || found.cccdparent || parentKey,
      };
    }
  }
  if (rel.parentName || rel.parentPersonnelName) {
    return {
      name: rel.parentName || rel.parentPersonnelName,
      position: rel.parentPosition || '',
      departmentName: rel.parentDepartment || '',
      cccd: parentKey || '',
    };
  }
  return null;
};

const setRelativeFieldValue = (rel, colId, val) => {
  rel[colId] = val;
  if (!rel.custom_data) rel.custom_data = {};
  rel.custom_data[colId] = val;

  if (colId === 'cccdparent' || colId === 'parentCccd') {
    const found = personnelStore.findPersonByCccd(val);
    if (found) {
      rel.parentName = found.name;
      rel.parentPersonnelName = found.name;
      rel.parentPosition = found.positionName || found.position;
      rel.parentDepartment = found.departmentName;
      rel.personnelId = found.id;
    }
  }
};

const getColClass = (w) => {
  const cleanW = String(w || '25').replace('%', '');
  if (cleanW === '100') return 'col-12';
  if (cleanW === '75') return 'col-9';
  if (cleanW === '50') return 'col-6';
  if (cleanW === '33') return 'col-4';
  return 'col-3';
};

const getRelativeHeaderTitle = (rel) => {
  if (!rel) return 'Chưa đặt tên';
  // 1. Tên mối quan hệ
  const relShipCols = (personnelStore.importMappingRelative || []).flatMap(g => g.columns || []).filter(c => c.id.includes('quan_he') || c.id.includes('relationship') || c.label.toLowerCase().includes('quan hệ'));
  let ship = '';
  for (const c of relShipCols) {
    const v = rel[c.id] ?? rel.custom_data?.[c.id];
    if (v && String(v).trim() !== '') { ship = String(v).trim(); break; }
  }
  if (!ship) ship = rel.relationshipName || rel.relationship || '';

  // 2. Họ và tên thân nhân
  const nameCols = (personnelStore.importMappingRelative || []).flatMap(g => g.columns || []).filter(c => c.id.includes('ten') || c.id.includes('name') || c.label.toLowerCase().includes('họ và tên') || c.label.toLowerCase().includes('họ tên'));
  let name = '';
  for (const c of nameCols) {
    if (c.id === 'parentPersonnelName' || c.id === 'parentName') continue;
    const v = rel[c.id] ?? rel.custom_data?.[c.id];
    if (v && String(v).trim() !== '') { name = String(v).trim(); break; }
  }
  if (!name) name = rel.relativeName || rel.name || 'Chưa đặt tên';

  // 3. Quốc gia / nơi đến nếu có
  const countryCols = (personnelStore.importMappingRelative || []).flatMap(g => g.columns || []).filter(c => c.id.includes('quoc_gia') || c.id.includes('country') || c.label.toLowerCase().includes('quốc gia'));
  let country = '';
  for (const c of countryCols) {
    const v = rel[c.id] ?? rel.custom_data?.[c.id];
    if (v && String(v).trim() !== '') { country = String(v).trim(); break; }
  }
  if (!country) country = rel.countryName || '';

  const prefix = ship ? `[${ship}] ` : '';
  const suffix = country ? ` (${country})` : '';
  return `${prefix}${name}${suffix}`;
};

const addRelative = () => {
  const nextIdx = relatives.value.length + 1;
  const newCode = 'TN-' + String(nextIdx).padStart(5, '0');
  const parentCccd = props.form.cccdparent || '';
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';

  const newRel = {
    code: newCode,
    personnelId: props.form.id || '',
    personnelName: props.form.name || '',
    cccdparent: parentCccd,
    [rKeyField]: '',
    custom_data: {
      cccdparent: parentCccd,
    },
  };

  // Khởi tạo động toàn bộ các cột từ importMappingRelative
  (personnelStore.importMappingRelative || []).forEach(g => {
    (g.columns || []).forEach(c => {
      if (c.id && newRel[c.id] === undefined) {
        newRel[c.id] = '';
        newRel.custom_data[c.id] = '';
      }
    });
  });

  relatives.value.push(newRel);
};

const removeRelative = (index) => {
  relatives.value.splice(index, 1);
};

// Auto scroll to target relative card and highlight it
watch(
  () => props.targetRelativeCode,
  (code) => {
    if (code === 'NEW_RELATIVE') {
      addRelative();
      return;
    }
    if (code) {
      nextTick(() => {
        setTimeout(() => {
          const el = document.getElementById(`relative-card-${code}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-relative-card');
            setTimeout(() => {
              el.classList.remove('highlight-relative-card');
            }, 3000);
          }
        }, 150);
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.relative-card-box {
  transition: all 0.3s ease;
}

.highlight-relative-card {
  border: 2px solid #0284c7 !important;
  box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.25) !important;
  background: #f0f9ff !important;
}
</style>
