<template>
  <div class="personnel-related-tabs-container">
    <!-- Tab Navigation Bar -->
    <div class="related-tabs-nav" v-if="availableTabs.length > 1">
      <button
        v-for="t in availableTabs"
        :key="t.id"
        type="button"
        class="tab-nav-btn"
        :class="{ active: currentTab === t.id }"
        @click="currentTab = t.id"
      >
        <i :class="t.icon"></i>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" class="tab-counter-badge" :class="{ 'has-items': t.count > 0 }">
          {{ t.count }}
        </span>
      </button>
    </div>

    <!-- Linked Table Content Area (Direct inline editing, Zero modal nesting) -->
    <div v-if="currentTab !== 'info' && currentLinkedTable" class="tab-pane">
      <!-- Toolbar Header -->
      <div class="pane-toolbar">
        <div class="pane-title-area">
          <span class="pane-title">
            <i :class="currentLinkedTable.icon || 'pi pi-table'" style="color: #0284c7; margin-right: 4px;"></i>
            {{ currentLinkedTable.title }} ({{ currentLinkedRows.length }})
          </span>
          <span class="pane-subtitle">
            Dữ liệu {{ currentLinkedTable.title }} được liên kết với hồ sơ này
          </span>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <Button
            :label="'Thêm ' + currentLinkedTable.title"
            icon="pi pi-plus"
            size="small"
            severity="success"
            @click="openAddNewLinkedRecord"
            class="pane-add-btn"
          />
        </div>
      </div>

      <!-- Record Switcher Pills (If more than 1 linked record) -->
      <div v-if="currentLinkedRows.length > 1" class="record-selector-bar">
        <span class="selector-label">Chọn bản ghi:</span>
        <div class="selector-pills">
          <button
            v-for="(row, idx) in currentLinkedRows"
            :key="row.id || row.uniqueKey || idx"
            type="button"
            class="selector-pill-btn"
            :class="{ active: !isAddingNew && isSameRow(selectedRecord, row) }"
            @click="selectRecordToEdit(row)"
          >
            <i :class="currentLinkedTable.id === 'trips' ? 'pi pi-send' : 'pi pi-user'" style="font-size: 0.72rem;"></i>
            <span>{{ idx + 1 }}/{{ currentLinkedRows.length }}. {{ getRecordDisplayName(row, currentLinkedTable) }}</span>
            <span v-if="row._travelerBadge" class="traveler-tag-pill" :class="{ 'is-pers': row._travelerType === 'personnel', 'is-rel': row._travelerType === 'relative' }">
              {{ row._travelerBadge }}
            </span>
          </button>
          <button
            type="button"
            class="selector-pill-btn add-btn"
            :class="{ active: isAddingNew }"
            @click="openAddNewLinkedRecord"
          >
            <i class="pi pi-plus"></i>
            <span>+ Thêm mới</span>
          </button>
        </div>
      </div>

      <!-- INLINE EDIT / CREATE FORM (Zero modal popup) -->
      <div v-if="selectedRecord || isAddingNew" class="inline-edit-card">
        <div class="edit-card-header">
          <span class="edit-title">
            <i :class="isAddingNew ? 'pi pi-plus-circle' : 'pi pi-pencil'"></i>
            {{ isAddingNew ? ('Thêm mới ' + currentLinkedTable.title) : ('Chỉnh sửa ' + currentLinkedTable.title + ': ' + getRecordDisplayName(selectedRecord, currentLinkedTable)) }}
          </span>
          <div class="header-right-actions">
            <span v-if="saveSuccessBanner" class="save-toast-msg">
              <i class="pi pi-check-circle"></i> Đã lưu thành công!
            </span>
            <Button
              v-if="!isAddingNew && selectedRecord"
              label="Mở toàn màn hình"
              icon="pi pi-external-link"
              size="small"
              severity="info"
              outlined
              @click="$emit('switchRecord', selectedRecord, currentLinkedTable?.id)"
              style="font-size: 0.72rem; padding: 2px 8px; height: 26px;"
            />
          </div>
        </div>

        <!-- Special Person picker if adding Trip under Personnel -->
        <div v-if="isTripUnderPersonnel" class="trip-person-picker">
          <label class="field-label">
            <span class="label-text">Người thực hiện chuyến đi <span style="color: red;">*</span></span>
          </label>
          <select
            v-model="activeSubTripPersonType"
            class="custom-sub-select"
            @change="syncTripPersonToForm"
          >
            <option value="personnel">
              👤 Chính Cán bộ này ({{ currentRecord[personnelNameField] || currentRecord.name || 'Cán bộ' }})
            </option>
            <option
              v-for="r in linkedRelativesForTrip"
              :key="r.id || (relKeyField ? r[relKeyField] : '')"
              :value="'rel_' + (r.id || (relKeyField ? r[relKeyField] : ''))"
            >
              👥 Thân nhân: {{ r[relativeNameField] || r.relativeName || r.name }} ({{ r.relationshipName || 'Thân nhân' }})
            </option>
          </select>
        </div>

        <!-- Dynamic Form Fields of Target Table -->
        <div class="form-grid">
          <template v-for="col in currentLinkedCols" :key="col.id">
            <div class="field-item" :style="getColItemStyle(col.formWidth || col.width)">
              <label class="field-label" :title="col.label">
                <span class="label-text">{{ col.label }}</span>
                <span v-if="col.required" style="color: red; margin-left: 2px;">*</span>
              </label>
              <DynamicField
                v-model="editForm[col.id]"
                :col="col"
              />
            </div>
          </template>
        </div>

        <!-- Form Actions Footer -->
        <div class="edit-card-footer">
          <div class="footer-left">
            <Button
              v-if="!isAddingNew && selectedRecord"
              label="Xóa bản ghi này"
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="handleDeleteLinkedRecord(selectedRecord)"
            />
          </div>
          <div class="footer-right">
            <Button
              v-if="isAddingNew && currentLinkedRows.length > 0"
              label="Hủy"
              severity="secondary"
              text
              size="small"
              @click="cancelAddNew"
            />
            <Button
              :label="isAddingNew ? ('Tạo ' + currentLinkedTable.title) : 'Lưu thay đổi'"
              icon="pi pi-check"
              severity="success"
              size="small"
              :loading="isSaving"
              @click="handleSaveLinkedRecord"
            />
          </div>
        </div>
      </div>

      <!-- Empty State if 0 records and not adding -->
      <div v-else-if="currentLinkedRows.length === 0" class="empty-state-box">
        <i :class="currentLinkedTable.icon || 'pi pi-inbox'" class="empty-icon"></i>
        <p class="empty-text">Chưa có bản ghi {{ currentLinkedTable.title }} nào được liên kết.</p>
        <Button
          :label="'Thêm ' + currentLinkedTable.title + ' đầu tiên'"
          icon="pi pi-plus"
          size="small"
          severity="info"
          outlined
          @click="openAddNewLinkedRecord"
        />
      </div>

      <!-- Mini Table of All Linked Records (Quick Overview) -->
      <div v-if="currentLinkedRows.length > 1" class="mini-table-section">
        <span class="mini-table-title">Danh sách tổng quan ({{ currentLinkedRows.length }} bản ghi):</span>
        <div class="mini-table-wrapper">
          <table class="custom-mini-table">
            <thead>
              <tr>
                <th style="width: 45px;" class="col-center">STT</th>
                <th v-if="currentLinkedTable.id === 'trips' && (currentTable?.id === 'personnel' || props.recordSource === 'personnel')" style="width: 170px;">Người đi</th>
                <th
                  v-for="col in displayOverviewCols"
                  :key="col.id"
                  :style="{ width: col.tableWidth ? col.tableWidth + 'px' : (col.width || '150px'), minWidth: '100px' }"
                >
                  {{ col.label }}
                </th>
                <th style="width: 80px;" class="col-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in currentLinkedRows"
                :key="row.id || row.uniqueKey || idx"
                :class="{ 'row-active': isSameRow(selectedRecord, row) }"
              >
                <td class="col-center idx-cell">{{ idx + 1 }}</td>
                <td v-if="currentLinkedTable.id === 'trips' && (currentTable?.id === 'personnel' || props.recordSource === 'personnel')">
                  <span v-if="row._travelerBadge" class="traveler-tag-pill" :class="{ 'is-pers': row._travelerType === 'personnel', 'is-rel': row._travelerType === 'relative' }">
                    {{ row._travelerBadge }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td v-for="col in displayOverviewCols" :key="col.id">
                  {{ getRecordCellValue(row, col) }}
                </td>
                <td class="col-center">
                  <div class="table-actions">
                    <button
                      type="button"
                      class="btn-action-icon edit"
                      title="Chỉnh sửa bản ghi này"
                      @click="selectRecordToEdit(row)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-action-icon delete"
                      title="Xóa bản ghi này"
                      @click="handleDeleteLinkedRecord(row)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import DynamicField from '@/components/common/DynamicField.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { getUnifiedTableDefinitions, findUnifiedTable } from '@/utils/tableRegistry';
import { formatDate, evaluateFormula, getColItemStyle } from '@/utils/formatters';
import { saveAppSettings } from '@/api/settings';

const props = defineProps({
  currentRecord: {
    type: Object,
    required: true,
  },
  recordSource: {
    type: String,
    default: 'personnel',
  },
  tableId: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: 'info',
  },
  initialRecordId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'refresh', 'switchRecord']);
const personnelStore = usePersonnelStore();

const currentTab = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// Form and selection state
const selectedRecord = ref(null);
const isAddingNew = ref(false);
const editForm = ref({});
const isSaving = ref(false);
const saveSuccessBanner = ref(false);
const activeSubTripPersonType = ref('personnel');

// Dynamic key helpers
const pKeyField = computed(() => (personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : ''));
const relParentKey = computed(() => (personnelStore.getRelativeParentKeyField ? personnelStore.getRelativeParentKeyField() : ''));
const relKeyField = computed(() => (personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'id'));
const tripKeyField = computed(() => (personnelStore.getTripKeyField ? personnelStore.getTripKeyField() : ''));
const personnelNameField = computed(() => (personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name'));
const relativeNameField = computed(() => {
  const rCols = (personnelStore.importMappingRelative || []).flatMap((g) => g.columns || []);
  const nCol = rCols.find((c) => c.id === 'relativeName' || c.id === 'name' || c.label?.toLowerCase().includes('họ và tên') || c.label?.toLowerCase().includes('họ tên'));
  return nCol ? nCol.id : 'relativeName';
});

// All registered tables
const allTables = computed(() => getUnifiedTableDefinitions({ personnelStore }));

// Current active table
const currentTable = computed(() => {
  const tid = props.tableId || props.recordSource || 'personnel';
  return findUnifiedTable(tid, { personnelStore }) || allTables.value.find((t) => t.id === 'personnel') || null;
});

const getTableKeyColId = (table) => {
  if (!table) return 'id';
  const cols = table.getColumns ? table.getColumns(personnelStore) : [];
  const keyCol = cols.find((c) => c.isKey);
  if (keyCol) return keyCol.id;
  if (table.id === 'personnel' || table.source === 'personnel') return pKeyField.value;
  if (table.id === 'relatives' || table.source === 'relatives') return relKeyField.value;
  if (table.id === 'trips' || table.source === 'trips') return tripKeyField.value;
  return 'id';
};

const isColVisible = (c) => {
  if (!c || c.isVirtual || c.id === 'stt') return false;
  if (c.showInDetail === false || c.showInDetail === 'false' || c.showInDetail === 0 || c.showInDetail === '0') return false;
  return true;
};

const checkTableMatchesLink = (linkTableStr, tableId, tableSource) => {
  if (!linkTableStr) return false;
  const parts = String(linkTableStr).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const tId = String(tableId || '').trim().toLowerCase();
  const tSrc = String(tableSource || '').trim().toLowerCase();
  return (tId && parts.includes(tId)) || (tSrc && parts.includes(tSrc));
};

// Compute linked rows for any given table
const getLinkedRows = (targetTable) => {
  if (!targetTable || !props.currentRecord) return [];
  const curTable = currentTable.value;
  const curRecord = props.currentRecord;
  const curId = curTable?.id || props.recordSource || 'personnel';
  const targetId = targetTable.id;

  const targetCols = targetTable.getColumns ? targetTable.getColumns(personnelStore) : [];
  const curCols = curTable?.getColumns ? curTable.getColumns(personnelStore) : [];

  // =========================================================================
  // 1. PERSONNEL -> TRIPS (Aggregates BOTH personal trips AND relatives' trips)
  // =========================================================================
  if (curId === 'personnel' && targetId === 'trips') {
    const allTrips = targetTable.getRows ? targetTable.getRows(personnelStore) : (personnelStore.tripsList || []);
    const pKeyCol = getTableKeyColId(curTable);
    const pKeyVal = pKeyCol && curRecord[pKeyCol] ? String(curRecord[pKeyCol]).trim().toLowerCase() : '';
    const pId = String(curRecord.id || '').trim();

    const tripFkPers = targetCols.find((c) => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                       (tripKeyField.value ? targetCols.find((c) => c.id === tripKeyField.value) : null);

    const res = [];
    const seen = new Set();

    // 1a. Personal trips taken by this Officer (Pure Key Match)
    allTrips.forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      const tVal = tripFkPers && t[tripFkPers.id] ? String(t[tripFkPers.id]).trim().toLowerCase() : '';
      const matchKey = Boolean(pKeyVal && tVal && tVal === pKeyVal);
      const matchPersId = Boolean(pId && t.personnelId && String(t.personnelId).trim() === pId);

      if ((matchKey || matchPersId) && !t.isRelative) {
        if (!seen.has(uKey)) {
          seen.add(uKey);
          res.push({
            ...t,
            _travelerType: 'personnel',
            _travelerBadge: '👤 Cán bộ',
            _travelerName: curRecord[personnelNameField.value] || curRecord.name || 'Cán bộ',
            _isPersonnelTrip: true,
          });
        }
      }
    });

    // 1b. Trips taken by all linked Relatives of this Officer
    const relTable = allTables.value.find((t) => t.id === 'relatives');
    const linkedRelatives = relTable ? getLinkedRows(relTable) : [];
    const tripFkRel = targetCols.find((c) => checkTableMatchesLink(c.linkTable, 'relatives')) ||
                      (tripKeyField.value ? targetCols.find((c) => c.id === tripKeyField.value) : null);

    linkedRelatives.forEach((r) => {
      const rKeyCol = relTable ? getTableKeyColId(relTable) : relKeyField.value;
      const rKeyVal = rKeyCol && r[rKeyCol] ? String(r[rKeyCol]).trim().toLowerCase() : '';
      const rId = String(r.id || '').trim();
      const rDisplayName = r[relativeNameField.value] || r.relativeName || r.name || 'Thân nhân';
      const rRelName = r.relationshipName || r.relationship || '';
      const rBadge = `👥 Thân nhân: ${rDisplayName}${rRelName ? ' (' + rRelName + ')' : ''}`;

      // Include trips stored directly inside relative
      (r.trips || []).forEach((t, idx) => {
        const uKey = t.uniqueKey || t.id || `local_rel_trip_${idx}`;
        if (!seen.has(uKey)) {
          seen.add(uKey);
          res.push({
            ...t,
            _travelerType: 'relative',
            _travelerBadge: rBadge,
            _travelerName: rDisplayName,
            _relativeInfo: r,
            _isPersonnelTrip: false,
          });
        }
      });

      allTrips.forEach((t, idx) => {
        const uKey = t.uniqueKey || t.id || `trip_${idx}`;
        if (seen.has(uKey)) return;
        const tVal = tripFkRel && t[tripFkRel.id] ? String(t[tripFkRel.id]).trim().toLowerCase() : '';
        const matchKey = Boolean(rKeyVal && tVal && tVal === rKeyVal);
        const matchRelId = Boolean(rId && t.relativeId && String(t.relativeId).trim() === rId);

        if (matchKey || matchRelId) {
          seen.add(uKey);
          res.push({
            ...t,
            _travelerType: 'relative',
            _travelerBadge: rBadge,
            _travelerName: rDisplayName,
            _relativeInfo: r,
            _isPersonnelTrip: false,
          });
        }
      });
    });

    return res;
  }

  // =========================================================================
  // 2. PERSONNEL -> RELATIVES (All relatives of this Officer)
  // =========================================================================
  if (curId === 'personnel' && targetId === 'relatives') {
    const allRelatives = targetTable.getRows ? targetTable.getRows(personnelStore) : (personnelStore.relativesList || []);
    const pKeyCol = getTableKeyColId(curTable);
    const pKeyVal = pKeyCol && curRecord[pKeyCol] ? String(curRecord[pKeyCol]).trim().toLowerCase() : '';
    const pId = String(curRecord.id || '').trim();

    const fkRelToPers = targetCols.find((c) => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                        (relParentKey.value ? targetCols.find((c) => c.id === relParentKey.value) : null);

    const res = [];
    const seen = new Set();
    allRelatives.forEach((r, idx) => {
      const uKey = r.id || r.uniqueKey || `rel_${idx}`;
      if (seen.has(uKey)) return;
      const rParentVal = fkRelToPers && r[fkRelToPers.id] ? String(r[fkRelToPers.id]).trim().toLowerCase() : '';
      const matchId = Boolean(pId && r.personnelId && String(r.personnelId).trim() === pId);
      const matchKey = Boolean(pKeyVal && rParentVal && rParentVal === pKeyVal);

      if (matchId || matchKey) {
        seen.add(uKey);
        res.push(r);
      }
    });

    // Also include any local relatives attached directly to curRecord
    (curRecord.relatives || []).forEach((r, idx) => {
      const uKey = r.id || r.uniqueKey || `local_rel_${idx}`;
      if (!seen.has(uKey)) {
        seen.add(uKey);
        res.push(r);
      }
    });

    return res;
  }

  // =========================================================================
  // 3. RELATIVES -> PERSONNEL (Parent Officer)
  // =========================================================================
  if (curId === 'relatives' && targetId === 'personnel') {
    const allPersonnel = targetTable.getRows ? targetTable.getRows(personnelStore) : (personnelStore.personnelList || []);
    const pKeyCol = getTableKeyColId(targetTable);

    const fkRelToPers = curCols.find((c) => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                        (relParentKey.value ? curCols.find((c) => c.id === relParentKey.value) : null);
    const pVal = fkRelToPers && curRecord[fkRelToPers.id] ? String(curRecord[fkRelToPers.id]).trim().toLowerCase() : '';
    const pId = String(curRecord.personnelId || '').trim();

    const p = allPersonnel.find((pers) => {
      if (pId && String(pers.id).trim() === pId) return true;
      if (pVal && pKeyCol) {
        const val = pers[pKeyCol] ? String(pers[pKeyCol]).trim().toLowerCase() : '';
        if (val && val === pVal) return true;
      }
      return false;
    }) || curRecord.rawPerson;

    return p ? [p] : [];
  }

  // =========================================================================
  // 4. RELATIVES -> TRIPS (Trips of this specific Relative)
  // =========================================================================
  if (curId === 'relatives' && targetId === 'trips') {
    const allTrips = targetTable.getRows ? targetTable.getRows(personnelStore) : (personnelStore.tripsList || []);
    const rKeyCol = getTableKeyColId(curTable);
    const rKeyVal = rKeyCol && curRecord[rKeyCol] ? String(curRecord[rKeyCol]).trim().toLowerCase() : '';
    const rId = String(curRecord.id || '').trim();

    const tripFkRel = targetCols.find((c) => checkTableMatchesLink(c.linkTable, 'relatives')) ||
                      (tripKeyField.value ? targetCols.find((c) => c.id === tripKeyField.value) : null);

    const res = [];
    const seen = new Set();

    // 4a. Local trips inside this relative record
    (curRecord.trips || []).forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `rel_trip_${idx}`;
      if (!seen.has(uKey)) {
        seen.add(uKey);
        res.push({
          ...t,
          _travelerType: 'relative',
          _travelerBadge: '👥 Thân nhân',
          _isPersonnelTrip: false,
        });
      }
    });

    // 4b. Trips in allTrips matching this relative
    allTrips.forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      if (seen.has(uKey)) return;

      const tVal = tripFkRel && t[tripFkRel.id] ? String(t[tripFkRel.id]).trim().toLowerCase() : '';
      const matchKey = Boolean(rKeyVal && tVal && tVal === rKeyVal);
      const matchRelId = Boolean(rId && t.relativeId && String(t.relativeId).trim() === rId);

      if (matchKey || matchRelId) {
        seen.add(uKey);
        res.push({
          ...t,
          _travelerType: 'relative',
          _travelerBadge: '👥 Thân nhân',
          _isPersonnelTrip: false,
        });
      }
    });

    return res;
  }

  // =========================================================================
  // 5. TRIPS -> PERSONNEL (Officer who took trip OR parent officer of relative)
  // =========================================================================
  if (curId === 'trips' && targetId === 'personnel') {
    const allPersonnel = targetTable.getRows ? targetTable.getRows(personnelStore) : (personnelStore.personnelList || []);
    const pKeyCol = getTableKeyColId(targetTable);

    const fkTripToPers = curCols.find((c) => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                         (tripKeyField.value ? curCols.find((c) => c.id === tripKeyField.value) : null);
    const tripLinkVal = fkTripToPers && curRecord[fkTripToPers.id] ? String(curRecord[fkTripToPers.id]).trim().toLowerCase() : '';

    // ZERO FALLBACK: If trip linking key is empty, no linked personnel!
    if (!tripLinkVal) return [];

    // 5a. Direct match with Personnel via tripLinkVal (e.g. CCCD Cán bộ)
    const p = allPersonnel.find((pers) => {
      const val = pKeyCol && pers[pKeyCol] ? String(pers[pKeyCol]).trim().toLowerCase() : '';
      return val && val === tripLinkVal;
    });
    if (p) return [p];

    // 5b. Transitive lookup via Relative (if tripLinkVal matched a Relative's CCCD, find that relative's parent officer)
    const relTable = allTables.value.find((t) => t.id === 'relatives');
    const allRelatives = relTable?.getRows ? relTable.getRows(personnelStore) : (personnelStore.relativesList || []);
    const rKeyCol = relTable ? getTableKeyColId(relTable) : relKeyField.value;

    const matchedRel = allRelatives.find((r) => {
      const val = rKeyCol && r[rKeyCol] ? String(r[rKeyCol]).trim().toLowerCase() : '';
      return val && val === tripLinkVal;
    });

    if (matchedRel) {
      const relParentCol = (relTable?.getColumns ? relTable.getColumns(personnelStore) : []).find((c) => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                           (relParentKey.value ? { id: relParentKey.value } : null);
      const parentKeyVal = relParentCol && matchedRel[relParentCol.id] ? String(matchedRel[relParentCol.id]).trim().toLowerCase() : '';

      if (parentKeyVal && pKeyCol) {
        const parentPers = allPersonnel.find((pers) => {
          const val = pers[pKeyCol] ? String(pers[pKeyCol]).trim().toLowerCase() : '';
          return val && val === parentKeyVal;
        });
        if (parentPers) return [parentPers];
      }
    }

    return [];
  }

  // =========================================================================
  // 6. TRIPS -> RELATIVES (Relative who took trip OR relatives of officer)
  // =========================================================================
  if (curId === 'trips' && targetId === 'relatives') {
    const allRelatives = targetTable.getRows ? targetTable.getRows(personnelStore) : (personnelStore.relativesList || []);
    const rKeyCol = getTableKeyColId(targetTable);

    const fkTripToRel = curCols.find((c) => checkTableMatchesLink(c.linkTable, 'relatives')) ||
                        (tripKeyField.value ? curCols.find((c) => c.id === tripKeyField.value) : null);
    const tripLinkVal = fkTripToRel && curRecord[fkTripToRel.id] ? String(curRecord[fkTripToRel.id]).trim().toLowerCase() : '';

    // ZERO FALLBACK: If trip linking key is empty, no linked relatives!
    if (!tripLinkVal) return [];

    // 6a. If tripLinkVal matches a specific relative directly via CCCD
    const r = allRelatives.find((rel) => {
      const val = rKeyCol && rel[rKeyCol] ? String(rel[rKeyCol]).trim().toLowerCase() : '';
      return val && val === tripLinkVal;
    });
    if (r) return [r];

    // 6b. If this trip was taken by an officer (tripLinkVal matched officer), return all relatives of that officer
    const persTable = allTables.value.find((t) => t.id === 'personnel');
    const parentPersList = persTable ? getLinkedRows(persTable) : [];
    if (parentPersList.length > 0) {
      const p = parentPersList[0];
      const pKeyCol = persTable ? getTableKeyColId(persTable) : pKeyField.value;
      const pKeyVal = pKeyCol && p[pKeyCol] ? String(p[pKeyCol]).trim().toLowerCase() : '';
      const fkRelToPers = targetCols.find((c) => checkTableMatchesLink(c.linkTable, 'personnel')) ||
                          (relParentKey.value ? targetCols.find((c) => c.id === relParentKey.value) : null);
      return allRelatives.filter((rel) => {
        const rParentVal = fkRelToPers && rel[fkRelToPers.id] ? String(rel[fkRelToPers.id]).trim().toLowerCase() : '';
        return Boolean(pKeyVal && rParentVal && rParentVal === pKeyVal);
      });
    }

    return [];
  }

  // =========================================================================
  // 7. GENERIC FALLBACK FOR CUSTOM TABLES (Dynamic FK)
  // =========================================================================
  // 7a. Foreign key in targetTable pointing to curTable
  const fkColInTarget = targetCols.find(
    (c) => checkTableMatchesLink(c.linkTable, curId, curTable?.source)
  );
  if (fkColInTarget) {
    const curKeyColId = fkColInTarget.linkColumn || getTableKeyColId(curTable);
    const curVal = String(curRecord[curKeyColId] || curRecord.id || curRecord.code || '').trim().toLowerCase();
    if (curVal) {
      const allRows = targetTable.getRows(personnelStore) || [];
      return allRows.filter((r) => {
        const val = String(r[fkColInTarget.id] || '').trim().toLowerCase();
        return val && val === curVal;
      });
    }
  }

  // 7b. Foreign key in curTable pointing to targetTable
  const fkColInCur = curCols.find(
    (c) => checkTableMatchesLink(c.linkTable, targetId, targetTable.source)
  );
  if (fkColInCur) {
    const targetKeyColId = fkColInCur.linkColumn || getTableKeyColId(targetTable);
    const curVal = String(curRecord[fkColInCur.id] || '').trim().toLowerCase();
    if (curVal) {
      const allRows = targetTable.getRows(personnelStore) || [];
      return allRows.filter((r) => {
        const val = String(r[targetKeyColId] || r.id || r.code || '').trim().toLowerCase();
        return val && val === curVal;
      });
    }
  }

  return [];
};

// Check whether target table is linked to current table
const isTableLinked = (targetTable) => {
  if (!targetTable) return false;
  const curTable = currentTable.value;
  const curId = curTable?.id || props.recordSource || 'personnel';
  const targetId = targetTable.id;
  if (curId === targetId) return false;

  // 1. Automatic reciprocal link for Core 3 Tables: personnel <-> relatives <-> trips
  const coreTables = ['personnel', 'relatives', 'trips'];
  if (coreTables.includes(curId) && coreTables.includes(targetId)) {
    return true;
  }

  // 2. Column link checks (Dynamic foreign keys, lookup, or linkTable)
  const targetCols = targetTable.getColumns ? targetTable.getColumns(personnelStore) : [];
  const curCols = curTable?.getColumns ? curTable.getColumns(personnelStore) : [];

  const fkTarget = targetCols.some((c) => 
    checkTableMatchesLink(c.linkTable, curId, curTable?.source) ||
    (c.format === 'lookup' && checkTableMatchesLink(c.lookupTable || c.linkTable, curId, curTable?.source))
  );
  if (fkTarget) return true;

  const fkCur = curCols.some((c) => 
    checkTableMatchesLink(c.linkTable, targetId, targetTable.source) ||
    (c.format === 'lookup' && checkTableMatchesLink(c.lookupTable || c.linkTable, targetId, targetTable.source))
  );
  if (fkCur) return true;

  // 3. Dynamic row check: If there are linked rows found, auto-link
  try {
    const rows = getLinkedRows(targetTable);
    if (rows && rows.length > 0) return true;
  } catch (e) {
    // ignore
  }

  return false;
};

// Available Tabs
const availableTabs = computed(() => {
  const curId = currentTable.value?.id || props.recordSource || 'personnel';
  const isTrip = curId === 'trips';
  const tabs = [
    {
      id: 'info',
      label: isTrip ? 'Chi tiết Chuyến đi' : (currentTable.value?.title || 'Thông tin chính'),
      icon: isTrip ? 'pi pi-send' : (currentTable.value?.icon || 'pi pi-id-card'),
    },
  ];

  (allTables.value || []).forEach((t) => {
    if (isTableLinked(t)) {
      const rows = getLinkedRows(t);
      let tabLabel = t.title;
      if (t.id === 'personnel' && rows.length === 1) {
        tabLabel = `Cán bộ: ${rows[0].name || rows[0].fullName || rows[0].code || 'Cán bộ'}`;
      } else if (t.id === 'relatives' && rows.length === 1) {
        tabLabel = `Thân nhân: ${rows[0].relativeName || rows[0].name || rows[0].code || 'Thân nhân'}`;
      }
      tabs.push({
        id: t.id,
        label: tabLabel,
        icon: t.icon || 'pi pi-table',
        count: rows.length,
        table: t,
      });
    }
  });

  return tabs;
});

// Currently selected linked table
const currentLinkedTable = computed(() => {
  if (currentTab.value === 'info') return null;
  return availableTabs.value.find((t) => t.id === currentTab.value)?.table || null;
});

// Rows of currently selected linked table
const currentLinkedRows = computed(() => {
  if (!currentLinkedTable.value) return [];
  return getLinkedRows(currentLinkedTable.value);
});

// Columns of currently selected linked table
const currentLinkedCols = computed(() => {
  if (!currentLinkedTable.value) return [];
  return (currentLinkedTable.value.getColumns(personnelStore) || []).filter(isColVisible);
});

const displayOverviewCols = computed(() => {
  return currentLinkedCols.value.slice(0, 6);
});

const isTripUnderPersonnel = computed(() => {
  const curId = currentTable.value?.id || props.recordSource;
  return curId === 'personnel' && currentLinkedTable.value?.id === 'trips';
});

const linkedRelativesForTrip = computed(() => {
  if (!isTripUnderPersonnel.value) return [];
  const relTable = allTables.value.find((t) => t.id === 'relatives');
  return relTable ? getLinkedRows(relTable) : [];
});

const isSameRow = (r1, r2) => {
  if (!r1 || !r2) return false;
  if (r1.id && r2.id && String(r1.id) === String(r2.id)) return true;
  if (r1.uniqueKey && r2.uniqueKey && String(r1.uniqueKey) === String(r2.uniqueKey)) return true;
  return r1 === r2;
};

const isParentPerson = (record) => {
  const curId = currentTable.value?.id || props.recordSource;
  return (curId === 'relatives' || curId === 'trips') && currentLinkedTable.value?.id === 'personnel' && record;
};

const getRecordDisplayName = (record, table) => {
  if (!record) return 'Bản ghi';
  if (table?.id === 'personnel' || table?.source === 'personnel') {
    return record[personnelNameField.value] || record.name || record.fullName || record.code || 'Cán bộ';
  }
  if (table?.id === 'relatives' || table?.source === 'relatives') {
    return record[relativeNameField.value] || record.relativeName || record.name || record.code || 'Thân nhân';
  }
  if (table?.id === 'trips' || table?.source === 'trips') {
    let dest = '';
    if (record.quoc_gia_xuat_canh !== undefined) {
      dest = record.quoc_gia_xuat_canh;
    } else if (record.countryName !== undefined) {
      dest = record.countryName;
    } else if (record.country !== undefined) {
      dest = record.country;
    }
    dest = String(dest || '').trim();
    const date = record.departureDate || record.ngay_xuat_canh || '';
    return dest ? `${dest} (${formatDate(date) || date})` : 'Chuyến đi';
  }
  return record.title || record.name || record.label || record.code || record.id || 'Bản ghi';
};

const getRecordCellValue = (item, col) => {
  if (!item || !col) return '-';
  const val = item[col.id] !== undefined ? item[col.id] : item.custom_data?.[col.id];
  if (col.format === 'formula') {
    const res = evaluateFormula(item, col);
    return res?.label || res?.shortLabel || res || '-';
  }
  if (col.format === 'date') {
    return formatDate(val) || '-';
  }
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const selectRecordToEdit = (row) => {
  selectedRecord.value = row;
  isAddingNew.value = false;
  saveSuccessBanner.value = false;
  editForm.value = { ...(row.custom_data || {}), ...row };

  if (isTripUnderPersonnel.value) {
    if (row._isPersonnelTrip || !row.isRelative) {
      activeSubTripPersonType.value = 'personnel';
    } else {
      const tVal = tripKeyField.value ? String(row[tripKeyField.value] || '').trim() : '';
      const matched = linkedRelativesForTrip.value.find((r) => (row.relativeId && r.id === row.relativeId) || (tVal && relKeyField.value && String(r[relKeyField.value] || '').trim() === tVal));
      activeSubTripPersonType.value = matched ? 'rel_' + (matched.id || (relKeyField.value ? matched[relKeyField.value] : '')) : 'personnel';
    }
  }
};

const openAddNewLinkedRecord = () => {
  isAddingNew.value = true;
  selectedRecord.value = null;
  saveSuccessBanner.value = false;

  const targetTable = currentLinkedTable.value;
  if (!targetTable) return;

  const initialForm = {};
  const curTable = currentTable.value;
  const curRecord = props.currentRecord;
  const curId = curTable?.id || props.recordSource || 'personnel';
  const targetId = targetTable.id;

  const targetCols = targetTable.getColumns ? targetTable.getColumns(personnelStore) : [];
  const curCols = curTable?.getColumns ? curTable.getColumns(personnelStore) : [];

  // 1. Foreign key in targetTable
  const fkColInTarget = targetCols.find((c) => c.linkTable && (c.linkTable === curId || c.linkTable === curTable?.source));
  if (fkColInTarget) {
    const curKeyColId = fkColInTarget.linkColumn || getTableKeyColId(curTable);
    initialForm[fkColInTarget.id] = curRecord[curKeyColId] || curRecord.id || '';
  }

  // 2. Foreign key in curTable
  const fkColInCur = curCols.find((c) => c.linkTable && (c.linkTable === targetId || c.linkTable === targetTable.source));
  if (fkColInCur) {
    const targetKeyColId = fkColInCur.linkColumn || getTableKeyColId(targetTable);
    if (curRecord[fkColInCur.id]) {
      initialForm[targetKeyColId] = curRecord[fkColInCur.id];
    }
  }

  // 3. Built-in defaults
  if (curId === 'personnel' && targetId === 'relatives') {
    initialForm.personnelId = curRecord.id || curRecord.code || '';
    if (relParentKey.value) initialForm[relParentKey.value] = pKeyField.value ? (curRecord[pKeyField.value] || '') : '';
    initialForm.parentName = curRecord[personnelNameField.value] || curRecord.name || '';
  } else if (curId === 'personnel' && targetId === 'trips') {
    initialForm.personnelId = curRecord.id || curRecord.code || '';
    if (tripKeyField.value) initialForm[tripKeyField.value] = pKeyField.value ? (curRecord[pKeyField.value] || '') : '';
    initialForm.fullName = curRecord[personnelNameField.value] || curRecord.name || '';
    activeSubTripPersonType.value = 'personnel';
  } else if (curId === 'relatives' && targetId === 'trips') {
    initialForm.relativeId = curRecord.id || curRecord.code || '';
    if (tripKeyField.value) initialForm[tripKeyField.value] = relKeyField.value ? (curRecord[relKeyField.value] || '') : '';
    initialForm.isRelative = true;
    initialForm.relativeName = curRecord[relativeNameField.value] || curRecord.name || '';
  } else if (curId === 'relatives' && targetId === 'personnel') {
    if (pKeyField.value) initialForm[pKeyField.value] = relParentKey.value ? (curRecord[relParentKey.value] || '') : '';
  }

  editForm.value = initialForm;
};

const cancelAddNew = () => {
  isAddingNew.value = false;
  if (currentLinkedRows.value.length > 0) {
    selectRecordToEdit(currentLinkedRows.value[0]);
  } else {
    selectedRecord.value = null;
  }
};

const syncTripPersonToForm = () => {
  if (!isTripUnderPersonnel.value) return;
  const pType = activeSubTripPersonType.value;
  if (pType === 'personnel') {
    editForm.value.isRelative = false;
    editForm.value.personnelId = props.currentRecord.id;
    if (tripKeyField.value) editForm.value[tripKeyField.value] = pKeyField.value ? (props.currentRecord[pKeyField.value] || '') : '';
    delete editForm.value.relativeId;
    delete editForm.value.relativeName;
  } else if (pType && pType.startsWith('rel_')) {
    const rId = pType.replace('rel_', '');
    const r = linkedRelativesForTrip.value.find((rel) => String(rel.id) === rId || (relKeyField.value && String(rel[relKeyField.value] || '') === rId));
    editForm.value.isRelative = true;
    editForm.value.personnelId = props.currentRecord.id;
    editForm.value.relativeId = r?.id || rId;
    editForm.value.relativeName = r?.[relativeNameField.value] || r?.relativeName || r?.name || '';
    if (tripKeyField.value) editForm.value[tripKeyField.value] = (r && relKeyField.value ? r[relKeyField.value] : '') || '';
  }
};

const handleSaveLinkedRecord = async () => {
  const targetTable = currentLinkedTable.value;
  if (!targetTable) return;

  isSaving.value = true;
  try {
    if (targetTable.id === 'trips' || targetTable.source === 'trips') {
      syncTripPersonToForm();
    }

    const cleanEditForm = { ...editForm.value };
    delete cleanEditForm.custom_data;
    const payload = {
      ...cleanEditForm,
      custom_data: { ...(editForm.value.custom_data || {}), ...cleanEditForm },
    };

    // Sanitize country aliases if cleared
    const countryAliases = ['quoc_gia_xuat_canh', 'countryName', 'country', 'quoc_gia', 'quoc_gia_den'];
    if (editForm.value.quoc_gia_xuat_canh !== undefined && !String(editForm.value.quoc_gia_xuat_canh || '').trim()) {
      for (const alias of countryAliases) {
        payload[alias] = '';
        if (payload.custom_data) delete payload.custom_data[alias];
      }
    } else if (editForm.value.countryName !== undefined && !String(editForm.value.countryName || '').trim()) {
      for (const alias of countryAliases) {
        payload[alias] = '';
        if (payload.custom_data) delete payload.custom_data[alias];
      }
    }

    if (targetTable.id === 'personnel' || targetTable.source === 'personnel') {
      await personnelStore.savePerson(payload);
    } else if (targetTable.id === 'relatives' || targetTable.source === 'relatives') {
      payload._recordType = 'relative';
      await personnelStore.saveRelative(payload);
    } else if (targetTable.id === 'trips' || targetTable.source === 'trips') {
      payload._recordType = 'trip';
      await personnelStore.saveTrip(payload);
    } else {
      // Custom table save
      const tid = targetTable.id;
      payload._tableId = tid;
      let rows = [];
      try {
        const local = localStorage.getItem(`custom_table_rows_${tid}`);
        if (local) rows = JSON.parse(local);
      } catch (e) {}
      if (!Array.isArray(rows)) rows = [];

      if (isAddingNew.value) {
        const newId = payload.id || ('row_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
        payload.id = newId;
        payload.uniqueKey = newId;
        payload.createdAt = payload.createdAt || new Date().toISOString().slice(0, 10);
        rows.push(payload);
      } else {
        const idx = rows.findIndex((r) => String(r.id) === String(payload.id) || String(r.uniqueKey) === String(payload.uniqueKey));
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...payload };
        } else {
          rows.push(payload);
        }
      }
      localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(rows));
      await saveAppSettings(`custom_table_rows_${tid}`, rows);
    }

    await personnelStore.fetchPersonnel();
    emit('refresh');

    saveSuccessBanner.value = true;
    setTimeout(() => {
      saveSuccessBanner.value = false;
    }, 2500);

    isAddingNew.value = false;
    selectedRecord.value = payload;
  } catch (err) {
    alert('Lỗi lưu: ' + (err.message || err));
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteLinkedRecord = async (record) => {
  const targetTable = currentLinkedTable.value;
  if (!targetTable || !record) return;

  const displayName = getRecordDisplayName(record, targetTable);
  if (!confirm(`Bạn có chắc muốn xóa "${displayName}" khỏi ${targetTable.title}?`)) return;

  try {
    if (targetTable.id === 'personnel' || targetTable.source === 'personnel') {
      await personnelStore.deletePerson(record);
    } else if (targetTable.id === 'relatives' || targetTable.source === 'relatives') {
      await personnelStore.deleteRelative(record);
    } else if (targetTable.id === 'trips' || targetTable.source === 'trips') {
      await personnelStore.deleteTrip(record);
    } else {
      const tid = targetTable.id;
      let rows = [];
      try {
        const local = localStorage.getItem(`custom_table_rows_${tid}`);
        if (local) rows = JSON.parse(local);
      } catch (e) {}
      if (Array.isArray(rows)) {
        rows = rows.filter((r) => String(r.id) !== String(record.id) && String(r.uniqueKey) !== String(record.uniqueKey));
        localStorage.setItem(`custom_table_rows_${tid}`, JSON.stringify(rows));
        await saveAppSettings(`custom_table_rows_${tid}`, rows);
      }
    }

    await personnelStore.fetchPersonnel();
    emit('refresh');

    selectedRecord.value = null;
    isAddingNew.value = false;
  } catch (err) {
    alert('Lỗi xóa: ' + (err.message || err));
  }
};

// Automatically select record or open add-new when switching to a linked tab
watch(
  () => [currentTab.value, currentLinkedRows.value.length],
  ([tab, len]) => {
    if (tab === 'info' || !currentLinkedTable.value) {
      selectedRecord.value = null;
      isAddingNew.value = false;
      return;
    }
    if (len === 0) {
      openAddNewLinkedRecord();
    } else if (!isAddingNew.value) {
      let targetRow = null;
      if (props.initialRecordId) {
        targetRow = currentLinkedRows.value.find((r) => String(r.id) === String(props.initialRecordId) || String(r.uniqueKey) === String(props.initialRecordId));
      }
      if (!targetRow && !selectedRecord.value) {
        targetRow = currentLinkedRows.value[0];
      }
      if (targetRow) {
        selectRecordToEdit(targetRow);
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.personnel-related-tabs-container {
  width: 100%;
}
.related-tabs-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 4px;
  margin-bottom: 12px;
}
.tab-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 6px 6px 0 0;
}
.tab-nav-btn:hover {
  color: #0284c7;
  background: #f8fafc;
}
.tab-nav-btn.active {
  color: #0284c7;
  border-bottom-color: #0284c7;
  background: #f0f9ff;
  font-weight: 700;
}
.tab-counter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #475569;
}
.tab-counter-badge.has-items {
  background: #dbeafe;
  color: #1d4ed8;
}
.pane-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 10px 4px;
  gap: 12px;
  flex-wrap: wrap;
}
.pane-title-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pane-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
}
.pane-subtitle {
  font-size: 0.74rem;
  color: #64748b;
}

/* Selector bar */
.record-selector-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.selector-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
}
.selector-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.selector-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}
.selector-pill-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.selector-pill-btn.active {
  background: #0284c7;
  color: #fff;
  border-color: #0284c7;
}
.selector-pill-btn.add-btn {
  border-style: dashed;
  color: #16a34a;
  border-color: #86efac;
}
.selector-pill-btn.add-btn:hover {
  background: #f0fdf4;
  border-color: #22c55e;
}
.selector-pill-btn.add-btn.active {
  background: #16a34a;
  color: #fff;
  border-color: #16a34a;
}

/* Inline Edit Card */
.inline-edit-card {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.edit-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}
.edit-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.save-toast-msg {
  font-size: 0.74rem;
  font-weight: 600;
  color: #16a34a;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.trip-person-picker {
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}
.custom-sub-select {
  width: 100%;
  height: 32px;
  font-size: 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0 8px;
  background: #fff;
  margin-top: 3px;
}
.edit-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.footer-left,
.footer-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Mini Table */
.mini-table-section {
  margin-top: 16px;
}
.mini-table-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: #475569;
  display: block;
  margin-bottom: 6px;
}
.mini-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  max-height: 280px;
}
.custom-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
  text-align: left;
}
.custom-mini-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 7px 10px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.custom-mini-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}
.custom-mini-table tr:hover td {
  background: #f8fafc;
}
.custom-mini-table tr.row-active td {
  background: #eff6ff;
  font-weight: 600;
}
.col-center {
  text-align: center;
}
.idx-cell {
  font-weight: 600;
  color: #94a3b8;
}
.table-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.btn-action-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  transition: all 0.15s ease;
}
.btn-action-icon.edit {
  color: #0284c7;
}
.btn-action-icon.edit:hover {
  background: #e0f2fe;
  border-color: #bae6fd;
}
.btn-action-icon.delete {
  color: #ef4444;
}
.btn-action-icon.delete:hover {
  background: #fee2e2;
  border-color: #fecaca;
}

.empty-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  text-align: center;
  gap: 8px;
  margin-bottom: 16px;
}
.empty-icon {
  font-size: 1.8rem;
  color: #94a3b8;
}
.empty-text {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}
.field-label {
  display: flex;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 2px;
}
.label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.traveler-tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  margin-left: 6px;
  white-space: nowrap;
}
.traveler-tag-pill.is-pers {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}
.traveler-tag-pill.is-rel {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}
</style>
