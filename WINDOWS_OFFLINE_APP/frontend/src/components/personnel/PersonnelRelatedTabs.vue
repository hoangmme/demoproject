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

    <!-- Tab Contents Area -->
    <div class="related-tabs-content">
      <!-- TAB 1: THÂN NHÂN LIÊN KẾT (Dành cho hồ sơ Cán bộ) -->
      <div v-if="currentTab === 'relatives'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="pane-title-area">
            <span class="pane-title">Danh sách Thân nhân ({{ relatedRelatives.length }})</span>
            <span class="pane-subtitle">Các thân nhân có quan hệ gia đình gắn với cán bộ này</span>
          </div>
          <Button
            label="Thêm Thân nhân"
            icon="pi pi-plus"
            size="small"
            severity="success"
            @click="openAddRelative"
            class="pane-add-btn"
          />
        </div>

        <!-- Bảng danh sách thân nhân -->
        <div v-if="relatedRelatives.length > 0" class="mini-table-wrapper">
          <table class="custom-mini-table">
            <thead>
              <tr>
                <th style="width: 50px;" class="col-center">STT</th>
                <th style="width: 130px;">Mối quan hệ</th>
                <th>Họ và tên thân nhân</th>
                <th style="width: 90px;" class="col-center">Năm sinh</th>
                <th style="width: 140px;">Số CCCD / Định danh</th>
                <th>Nơi ở / Quốc gia</th>
                <th style="width: 120px;" class="col-center">Chuyến đi TN</th>
                <th style="width: 90px;" class="col-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rel, idx) in relatedRelatives" :key="rel.id || rel.code || idx">
                <td class="col-center idx-cell">{{ idx + 1 }}</td>
                <td>
                  <span class="rel-badge">{{ rel.relationshipName || rel.relationship || 'Thân nhân' }}</span>
                </td>
                <td>
                  <strong class="rel-name">{{ rel.relativeName || rel.name || '-' }}</strong>
                </td>
                <td class="col-center text-muted">{{ rel.birthYear || '-' }}</td>
                <td>
                  <code class="cccd-code">{{ rel.cccdthannhan || rel.cccd || '-' }}</code>
                </td>
                <td class="text-muted">{{ rel.countryName || rel.currentAddress || '-' }}</td>
                <td class="col-center">
                  <span class="trip-count-pill" :class="{ 'has-trips': getRelativeTripCount(rel) > 0 }">
                    <i class="pi pi-send"></i>
                    {{ getRelativeTripCount(rel) }} chuyến
                  </span>
                </td>
                <td class="col-center">
                  <div class="table-actions">
                    <button
                      type="button"
                      class="btn-action-icon edit"
                      title="Chỉnh sửa thân nhân"
                      @click="openEditRelative(rel)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-action-icon delete"
                      title="Xóa thân nhân này"
                      @click="deleteRelative(rel)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state-box">
          <i class="pi pi-users empty-icon"></i>
          <p class="empty-text">Chưa có thông tin thân nhân nào được liên kết với cán bộ này.</p>
          <Button
            label="Thêm Thân nhân đầu tiên"
            icon="pi pi-plus"
            size="small"
            severity="info"
            outlined
            @click="openAddRelative"
          />
        </div>
      </div>

      <!-- TAB 2: CÁN BỘ CHỦ QUẢN (Dành cho hồ sơ Thân nhân) -->
      <div v-else-if="currentTab === 'parent'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="pane-title-area">
            <span class="pane-title">Hồ sơ Cán bộ liên quan</span>
            <span class="pane-subtitle">Thông tin cán bộ chủ quản mà thân nhân này trực thuộc</span>
          </div>
        </div>

        <div v-if="parentPerson" class="parent-profile-card">
          <div class="parent-avatar-box">
            <i class="pi pi-user parent-avatar-icon"></i>
          </div>
          <div class="parent-details">
            <h4 class="parent-name">{{ parentPerson.name || parentPerson.fullName || 'Cán bộ' }}</h4>
            <div class="parent-meta-grid">
              <div class="meta-item">
                <span class="meta-label">CCCD Cán bộ:</span>
                <code class="cccd-code">{{ parentPersonCccd || '-' }}</code>
              </div>
              <div class="meta-item">
                <span class="meta-label">Mã Cán bộ:</span>
                <span class="meta-val">{{ parentPerson.code || parentPerson.id || '-' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Đơn vị / Phòng ban:</span>
                <span class="meta-val">{{ parentPersonDepartment || '-' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Chức vụ:</span>
                <span class="meta-val">{{ parentPerson.position || parentPerson.positionName || '-' }}</span>
              </div>
            </div>
            <div class="parent-card-actions">
              <Button
                label="Xem chi tiết hồ sơ Cán bộ này"
                icon="pi pi-external-link"
                size="small"
                severity="info"
                outlined
                @click="$emit('switchRecord', parentPerson)"
              />
            </div>
          </div>
        </div>

        <div v-else class="empty-state-box">
          <i class="pi pi-info-circle empty-icon"></i>
          <p class="empty-text">Chưa liên kết được hồ sơ cán bộ chủ quản. Vui lòng kiểm tra lại trường CCCD Cán bộ (cccdparent).</p>
        </div>
      </div>

      <!-- TAB 3: CHUYẾN ĐI NƯỚC NGOÀI (Cho cả Cán bộ và Thân nhân) -->
      <div v-else-if="currentTab === 'trips'" class="tab-pane">
        <div class="pane-toolbar">
          <div class="pane-title-area">
            <span class="pane-title">Lịch sử Chuyến đi Nước ngoài ({{ displayTrips.length }})</span>
            <span class="pane-subtitle">
              {{ recordSource === 'personnel' ? 'Bao gồm chuyến đi của Cán bộ và chuyến đi của Thân nhân' : 'Toàn bộ chuyến đi của thân nhân này' }}
            </span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- Phân loại chuyến đi khi xem Cán bộ -->
            <div v-if="recordSource === 'personnel' && relatedRelatives.length > 0" class="trip-filter-pills">
              <button
                type="button"
                class="filter-pill"
                :class="{ active: tripFilterType === 'all' }"
                @click="tripFilterType = 'all'"
              >
                Tất cả ({{ relatedTrips.length }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ active: tripFilterType === 'personnel' }"
                @click="tripFilterType = 'personnel'"
              >
                Cán bộ ({{ countPersonnelTrips }})
              </button>
              <button
                type="button"
                class="filter-pill"
                :class="{ active: tripFilterType === 'relative' }"
                @click="tripFilterType = 'relative'"
              >
                Thân nhân ({{ countRelativeTrips }})
              </button>
            </div>

            <Button
              label="Thêm Chuyến đi"
              icon="pi pi-plus"
              size="small"
              severity="success"
              @click="openAddTrip"
              class="pane-add-btn"
            />
          </div>
        </div>

        <!-- Bảng danh sách chuyến đi -->
        <div v-if="displayTrips.length > 0" class="mini-table-wrapper">
          <table class="custom-mini-table">
            <thead>
              <tr>
                <th style="width: 45px;" class="col-center">STT</th>
                <th v-if="recordSource === 'personnel'" style="width: 170px;">Người xuất cảnh</th>
                <th style="width: 140px;">Quốc gia đến</th>
                <th style="width: 100px;" class="col-center">Ngày đi</th>
                <th style="width: 100px;" class="col-center">Ngày về</th>
                <th style="width: 130px;" class="col-center">Trạng thái</th>
                <th style="width: 120px;">Số Quyết định</th>
                <th>Mục đích chuyến đi</th>
                <th style="width: 90px;" class="col-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, idx) in displayTrips" :key="t.uniqueKey || t.id || idx">
                <td class="col-center idx-cell">{{ idx + 1 }}</td>
                <td v-if="recordSource === 'personnel'">
                  <span v-if="t._isPersonnelTrip" class="person-type-tag person">
                    <i class="pi pi-user"></i> Cán bộ
                  </span>
                  <span v-else class="person-type-tag relative">
                    <i class="pi pi-heart"></i>
                    {{ t._relativeInfo?.relativeName || t.relativeName || 'Thân nhân' }}
                    <small v-if="t._relativeInfo?.relationshipName">({{ t._relativeInfo.relationshipName }})</small>
                  </span>
                </td>
                <td>
                  <strong style="color: #0369a1;">{{ t.countryName || t.quoc_gia_xuat_canh || t.country || '-' }}</strong>
                </td>
                <td class="col-center">{{ formatDate(t.departureDate || t.ngay_xuat_canh) }}</td>
                <td class="col-center">{{ formatDate(t.arrivalDate || t.ngay_nhap_canh) }}</td>
                <td class="col-center">
                  <span :class="getTripPresenceBadgeClass(t)">
                    {{ getTripPresenceLabel(t) }}
                  </span>
                </td>
                <td><small>{{ t.decisionNumber || t.so_quyet_dinh || '-' }}</small></td>
                <td class="text-muted">{{ t.purpose || t.muc_dich || '-' }}</td>
                <td class="col-center">
                  <div class="table-actions">
                    <button
                      type="button"
                      class="btn-action-icon edit"
                      title="Chỉnh sửa chuyến đi"
                      @click="openEditTrip(t)"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-action-icon delete"
                      title="Xóa chuyến đi này"
                      @click="deleteTrip(t)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state-box">
          <i class="pi pi-send empty-icon"></i>
          <p class="empty-text">Chưa có chuyến đi nước ngoài nào trong danh sách này.</p>
          <Button
            label="Thêm Chuyến đi mới"
            icon="pi pi-plus"
            size="small"
            severity="info"
            outlined
            @click="openAddTrip"
          />
        </div>
      </div>
    </div>

    <!-- DIALOG CON: THÊM / SỬA THÂN NHÂN -->
    <Dialog
      v-model:visible="isRelativeFormOpen"
      modal
      :header="editingRelative?.id ? 'Chỉnh sửa Thân nhân' : 'Thêm Thân nhân mới'"
      :style="{ width: '560px' }"
      :baseZIndex="20000"
    >
      <div class="sub-dialog-form">
        <div class="form-row-2">
          <div class="sub-field">
            <label>Mối quan hệ <span style="color: red;">*</span></label>
            <select v-model="relForm.relationshipName" class="sub-input">
              <option value="">-- Chọn mối quan hệ --</option>
              <option value="Con đẻ">Con đẻ</option>
              <option value="Vợ">Vợ</option>
              <option value="Chồng">Chồng</option>
              <option value="Bố đẻ">Bố đẻ</option>
              <option value="Mẹ đẻ">Mẹ đẻ</option>
              <option value="Anh ruột">Anh ruột</option>
              <option value="Chị ruột">Chị ruột</option>
              <option value="Em ruột">Em ruột</option>
              <option value="Con nuôi">Con nuôi</option>
              <option value="Bố chồng/vợ">Bố chồng/vợ</option>
              <option value="Mẹ chồng/vợ">Mẹ chồng/vợ</option>
            </select>
          </div>
          <div class="sub-field">
            <label>Họ và tên thân nhân <span style="color: red;">*</span></label>
            <input v-model="relForm.relativeName" type="text" class="sub-input" placeholder="Nhập họ và tên..." />
          </div>
        </div>

        <div class="form-row-2">
          <div class="sub-field">
            <label>Năm sinh</label>
            <input v-model="relForm.birthYear" type="number" class="sub-input" placeholder="VD: 1995" />
          </div>
          <div class="sub-field">
            <label>CCCD / Định danh thân nhân</label>
            <input v-model="relForm.cccdthannhan" type="text" class="sub-input" placeholder="Số định danh thân nhân..." />
          </div>
        </div>

        <div class="form-row-2">
          <div class="sub-field">
            <label>Số Hộ chiếu</label>
            <input v-model="relForm.passportNumber" type="text" class="sub-input" placeholder="Số hộ chiếu..." />
          </div>
          <div class="sub-field">
            <label>Quốc gia lưu trú / định cư</label>
            <input v-model="relForm.countryName" type="text" class="sub-input" placeholder="Tên quốc gia..." />
          </div>
        </div>

        <div class="sub-field">
          <label>Nơi ở hiện nay</label>
          <input v-model="relForm.currentAddress" type="text" class="sub-input" placeholder="Địa chỉ nơi ở..." />
        </div>

        <div class="sub-field">
          <label>Nghề nghiệp / Nơi làm việc</label>
          <input v-model="relForm.occupation" type="text" class="sub-input" placeholder="Nơi làm việc..." />
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isRelativeFormOpen = false" />
        <Button label="Lưu Thân nhân" icon="pi pi-check" severity="success" size="small" :loading="isSavingSub" @click="saveRelativeForm" />
      </template>
    </Dialog>

    <!-- DIALOG CON: THÊM / SỬA CHUYẾN ĐI -->
    <Dialog
      v-model:visible="isTripFormOpen"
      modal
      :header="editingTrip?.id ? 'Chỉnh sửa Chuyến đi' : 'Thêm Chuyến đi mới'"
      :style="{ width: '580px' }"
      :baseZIndex="20000"
    >
      <div class="sub-dialog-form">
        <!-- Người thực hiện chuyến đi -->
        <div class="sub-field" v-if="recordSource === 'personnel'">
          <label>Người thực hiện chuyến đi <span style="color: red;">*</span></label>
          <select v-model="tripTargetPersonType" class="sub-input">
            <option value="personnel">👤 Chính Cán bộ này ({{ currentRecord.name }})</option>
            <option
              v-for="r in relatedRelatives"
              :key="r.id || r.cccdthannhan"
              :value="'rel_' + (r.id || r.cccdthannhan)"
            >
              👥 Thân nhân: {{ r.relativeName || r.name }} ({{ r.relationshipName || 'Thân nhân' }})
            </option>
          </select>
        </div>

        <div class="form-row-2">
          <div class="sub-field">
            <label>Quốc gia / Nơi đến <span style="color: red;">*</span></label>
            <input v-model="tripForm.countryName" type="text" class="sub-input" placeholder="VD: Nhật Bản, Hàn Quốc..." />
          </div>
          <div class="sub-field">
            <label>Mục đích</label>
            <input v-model="tripForm.purpose" type="text" class="sub-input" placeholder="Công tác, Du lịch..." />
          </div>
        </div>

        <div class="form-row-2">
          <div class="sub-field">
            <label>Ngày xuất cảnh (DD/MM/YYYY)</label>
            <input v-model="tripForm.departureDate" type="text" class="sub-input" placeholder="DD/MM/YYYY" />
          </div>
          <div class="sub-field">
            <label>Ngày nhập cảnh (DD/MM/YYYY)</label>
            <input v-model="tripForm.arrivalDate" type="text" class="sub-input" placeholder="DD/MM/YYYY" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="sub-field">
            <label>Số Quyết định duyệt</label>
            <input v-model="tripForm.decisionNumber" type="text" class="sub-input" placeholder="VD: 1234/QĐ-UBND" />
          </div>
          <div class="sub-field">
            <label>Ngày Quyết định (DD/MM/YYYY)</label>
            <input v-model="tripForm.decisionDate" type="text" class="sub-input" placeholder="DD/MM/YYYY" />
          </div>
        </div>

        <div class="sub-field">
          <label>Nguồn kinh phí</label>
          <select v-model="tripForm.fundingName" class="sub-input">
            <option value="">-- Chọn nguồn kinh phí --</option>
            <option value="Ngân sách nhà nước">Ngân sách nhà nước</option>
            <option value="Tài trợ">Tài trợ</option>
            <option value="Tự túc">Tự túc</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isTripFormOpen = false" />
        <Button label="Lưu Chuyến đi" icon="pi pi-check" severity="success" size="small" :loading="isSavingSub" @click="saveTripForm" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { usePersonnelStore } from '@/stores/personnel';
import { formatDate, computeTripPresence } from '@/utils/formatters';

const props = defineProps({
  currentRecord: {
    type: Object,
    required: true,
  },
  recordSource: {
    type: String,
    default: 'personnel', // 'personnel' | 'relatives' | 'trips' | 'blank'
  },
  modelValue: {
    type: String,
    default: 'info',
  },
});

const emit = defineEmits(['update:modelValue', 'refresh', 'switchRecord']);
const personnelStore = usePersonnelStore();

const currentTab = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const tripFilterType = ref('all'); // 'all' | 'personnel' | 'relative'
const isSavingSub = ref(false);

// Sub Dialog States
const isRelativeFormOpen = ref(false);
const editingRelative = ref(null);
const relForm = ref({});

const isTripFormOpen = ref(false);
const editingTrip = ref(null);
const tripTargetPersonType = ref('personnel');
const tripForm = ref({});

// Danh sách thân nhân của Cán bộ này
const relatedRelatives = computed(() => {
  if (props.recordSource !== 'personnel') return [];
  const pId = String(props.currentRecord.id || props.currentRecord.code || '').trim();
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const pCccd = String(props.currentRecord[pKeyField] || props.currentRecord.cccd || props.currentRecord.cccdparent || '').trim().toLowerCase();

  const rels = [];
  const seen = new Set();

  const directRels = Array.isArray(props.currentRecord.relatives) ? props.currentRecord.relatives : [];
  directRels.forEach((r, idx) => {
    const key = r.id || r.code || r.cccdthannhan || `rel_direct_${idx}`;
    if (!seen.has(key)) {
      seen.add(key);
      rels.push(r);
    }
  });

  (personnelStore.relativesList || []).forEach((r) => {
    const rKey = r.id || r.code || r.cccdthannhan;
    if (seen.has(rKey)) return;

    const matchId = pId && r.personnelId && (String(r.personnelId).trim() === pId);
    const matchCccd = pCccd && r.cccdparent && (String(r.cccdparent).trim().toLowerCase() === pCccd);
    if (matchId || matchCccd) {
      seen.add(rKey);
      rels.push(r);
    }
  });

  return rels;
});

// Cán bộ chủ quản (khi xem Thân nhân)
const parentPerson = computed(() => {
  if (props.recordSource !== 'relatives') return null;
  const pId = props.currentRecord.personnelId;
  const pCccd = props.currentRecord.cccdparent || props.currentRecord.parentCccd;

  return (personnelStore.personnelList || []).find((p) => {
    if (pId && (String(p.id).trim() === String(pId).trim() || String(p.code).trim() === String(pId).trim())) return true;
    if (pCccd) {
      const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
      const c = String(p[pKeyField] || p.cccd || p.cccdparent || '').trim().toLowerCase();
      if (c && c === String(pCccd).trim().toLowerCase()) return true;
    }
    return false;
  }) || props.currentRecord.rawPerson || null;
});

const parentPersonCccd = computed(() => {
  if (!parentPerson.value) return '';
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  return parentPerson.value[pKeyField] || parentPerson.value.cccd || parentPerson.value.cccdparent || '';
});

const parentPersonDepartment = computed(() => {
  if (!parentPerson.value) return '';
  return parentPerson.value.departmentName || (parentPerson.value.departmentId && personnelStore.getDepartmentName(parentPerson.value.departmentId)) || '';
});

// Toàn bộ chuyến đi liên quan (của Cán bộ hoặc của Thân nhân)
const relatedTrips = computed(() => {
  if (props.recordSource === 'personnel') {
    const pId = String(props.currentRecord.id || props.currentRecord.code || '').trim();
    const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
    const pCccd = String(props.currentRecord[pKeyField] || props.currentRecord.cccd || props.currentRecord.cccdparent || '').trim().toLowerCase();

    const relCccdSet = new Set(
      relatedRelatives.value.map((r) => String(r.cccdthannhan || r.cccd || '').trim().toLowerCase()).filter(Boolean)
    );
    const relIdSet = new Set(
      relatedRelatives.value.map((r) => String(r.id || '').trim()).filter(Boolean)
    );

    const trips = [];
    const seen = new Set();

    (personnelStore.tripsList || []).forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      if (seen.has(uKey)) return;

      const tCccd = String(t.cccdchuyendi || t.cccd || t.cccdparent || t.cccdthannhan || '').trim().toLowerCase();
      const matchPersonId = pId && t.personnelId && String(t.personnelId).trim() === pId;
      const matchPersonCccd = pCccd && tCccd && tCccd === pCccd && !t.isRelative;

      const matchRelId = t.relativeId && relIdSet.has(String(t.relativeId).trim());
      const matchRelCccd = tCccd && relCccdSet.has(tCccd);

      if (matchPersonId || matchPersonCccd || matchRelId || matchRelCccd) {
        seen.add(uKey);
        const isPers = !t.isRelative && (matchPersonId || matchPersonCccd);
        trips.push({
          ...t,
          _isPersonnelTrip: isPers,
          _relativeInfo: isPers ? null : (relatedRelatives.value.find((r) => (r.id && r.id === t.relativeId) || (tCccd && String(r.cccdthannhan || r.cccd).trim().toLowerCase() === tCccd)) || null),
        });
      }
    });

    return trips;
  }

  if (props.recordSource === 'relatives') {
    const relId = String(props.currentRecord.id || props.currentRecord.code || '').trim();
    const relCccd = String(props.currentRecord.cccdthannhan || props.currentRecord.cccd || '').trim().toLowerCase();

    const trips = [];
    const seen = new Set();

    (personnelStore.tripsList || []).forEach((t, idx) => {
      const uKey = t.uniqueKey || t.id || `trip_${idx}`;
      if (seen.has(uKey)) return;

      const tCccd = String(t.cccdchuyendi || t.cccd || t.cccdthannhan || '').trim().toLowerCase();
      const matchId = relId && t.relativeId && String(t.relativeId).trim() === relId;
      const matchCccd = relCccd && tCccd && tCccd === relCccd;

      if (matchId || matchCccd) {
        seen.add(uKey);
        trips.push(t);
      }
    });

    return trips;
  }

  return [];
});

const countPersonnelTrips = computed(() => relatedTrips.value.filter((t) => t._isPersonnelTrip).length);
const countRelativeTrips = computed(() => relatedTrips.value.filter((t) => !t._isPersonnelTrip).length);

const displayTrips = computed(() => {
  if (props.recordSource !== 'personnel') return relatedTrips.value;
  if (tripFilterType.value === 'personnel') {
    return relatedTrips.value.filter((t) => t._isPersonnelTrip);
  }
  if (tripFilterType.value === 'relative') {
    return relatedTrips.value.filter((t) => !t._isPersonnelTrip);
  }
  return relatedTrips.value;
});

// Danh sách các tab hiển thị
const availableTabs = computed(() => {
  const tabs = [
    {
      id: 'info',
      label: props.recordSource === 'personnel' ? 'Thông tin Cán bộ' : (props.recordSource === 'relatives' ? 'Thông tin Thân nhân' : 'Thông tin chi tiết'),
      icon: 'pi pi-id-card',
    },
  ];

  if (props.recordSource === 'personnel') {
    tabs.push({
      id: 'relatives',
      label: 'Thân nhân liên kết',
      icon: 'pi pi-users',
      count: relatedRelatives.value.length,
    });
    tabs.push({
      id: 'trips',
      label: 'Chuyến đi nước ngoài',
      icon: 'pi pi-send',
      count: relatedTrips.value.length,
    });
  } else if (props.recordSource === 'relatives') {
    tabs.push({
      id: 'parent',
      label: 'Cán bộ chủ quản',
      icon: 'pi pi-user',
    });
    tabs.push({
      id: 'trips',
      label: 'Chuyến đi của thân nhân',
      icon: 'pi pi-send',
      count: relatedTrips.value.length,
    });
  }

  return tabs;
});

const getRelativeTripCount = (rel) => {
  const rId = String(rel.id || rel.code || '').trim();
  const rCccd = String(rel.cccdthannhan || rel.cccd || '').trim().toLowerCase();
  return (personnelStore.tripsList || []).filter((t) => {
    if (rId && t.relativeId && String(t.relativeId).trim() === rId) return true;
    const tCccd = String(t.cccdchuyendi || t.cccd || t.cccdthannhan || '').trim().toLowerCase();
    return rCccd && tCccd && rCccd === tCccd;
  }).length;
};

const getTripPresenceLabel = (t) => {
  const p = computeTripPresence(t);
  return p.label || 'Bình thường';
};

const getTripPresenceBadgeClass = (t) => {
  const p = computeTripPresence(t);
  if (p.isOverdue) return 'presence-badge overdue';
  if (p.isAbroad) return 'presence-badge abroad';
  return 'presence-badge completed';
};

// CRUD Thân nhân
const openAddRelative = () => {
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const pCccd = props.currentRecord[pKeyField] || props.currentRecord.cccd || props.currentRecord.cccdparent || '';
  editingRelative.value = null;
  relForm.value = {
    personnelId: props.currentRecord.id || '',
    parentName: props.currentRecord.name || '',
    cccdparent: pCccd,
    relationshipName: '',
    relativeName: '',
    birthYear: '',
    cccdthannhan: '',
    passportNumber: '',
    countryName: '',
    currentAddress: '',
    occupation: '',
  };
  isRelativeFormOpen.value = true;
};

const openEditRelative = (rel) => {
  editingRelative.value = rel;
  relForm.value = { ...rel };
  isRelativeFormOpen.value = true;
};

const saveRelativeForm = async () => {
  if (!relForm.value.relativeName?.trim()) {
    alert('Vui lòng nhập Họ và tên thân nhân!');
    return;
  }
  if (!relForm.value.relationshipName) {
    alert('Vui lòng chọn Mối quan hệ!');
    return;
  }
  isSavingSub.value = true;
  try {
    const payload = {
      ...relForm.value,
      _recordType: 'relative',
    };
    await personnelStore.saveRecord(payload);
    await personnelStore.fetchPersonnel();
    isRelativeFormOpen.value = false;
    emit('refresh');
  } catch (e) {
    alert('Lỗi lưu thân nhân: ' + (e.message || e));
  } finally {
    isSavingSub.value = false;
  }
};

const deleteRelative = async (rel) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa thân nhân: "${rel.relativeName || rel.name}" không?`)) return;
  try {
    await personnelStore.deleteRelative(rel);
    await personnelStore.fetchPersonnel();
    emit('refresh');
  } catch (e) {
    alert('Lỗi xóa thân nhân: ' + (e.message || e));
  }
};

// CRUD Chuyến đi
const openAddTrip = () => {
  const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
  const pCccd = props.currentRecord[pKeyField] || props.currentRecord.cccd || props.currentRecord.cccdparent || '';
  editingTrip.value = null;
  tripTargetPersonType.value = 'personnel';
  tripForm.value = {
    personnelId: props.recordSource === 'personnel' ? props.currentRecord.id : (props.currentRecord.personnelId || ''),
    relativeId: props.recordSource === 'relatives' ? props.currentRecord.id : '',
    cccdchuyendi: props.recordSource === 'personnel' ? pCccd : (props.currentRecord.cccdthannhan || ''),
    countryName: '',
    departureDate: '',
    arrivalDate: '',
    decisionNumber: '',
    decisionDate: '',
    fundingName: '',
    purpose: '',
    isRelative: props.recordSource === 'relatives',
  };
  isTripFormOpen.value = true;
};

const openEditTrip = (trip) => {
  editingTrip.value = trip;
  tripTargetPersonType.value = trip.isRelative && trip.relativeId ? `rel_${trip.relativeId}` : 'personnel';
  tripForm.value = { ...trip };
  isTripFormOpen.value = true;
};

const saveTripForm = async () => {
  if (!tripForm.value.countryName?.trim()) {
    alert('Vui lòng nhập Quốc gia / Nơi đến!');
    return;
  }
  isSavingSub.value = true;
  try {
    let payload = {
      ...tripForm.value,
      _recordType: 'trip',
    };

    if (props.recordSource === 'personnel') {
      if (tripTargetPersonType.value === 'personnel') {
        const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
        payload.isRelative = false;
        payload.personnelId = props.currentRecord.id;
        payload.cccdchuyendi = props.currentRecord[pKeyField] || props.currentRecord.cccd || props.currentRecord.cccdparent || '';
        delete payload.relativeId;
      } else if (tripTargetPersonType.value.startsWith('rel_')) {
        const targetRelId = tripTargetPersonType.value.replace('rel_', '');
        const targetRel = relatedRelatives.value.find((r) => String(r.id) === targetRelId || String(r.cccdthannhan) === targetRelId);
        payload.isRelative = true;
        payload.personnelId = props.currentRecord.id;
        payload.relativeId = targetRel?.id || targetRelId;
        payload.relativeName = targetRel?.relativeName || targetRel?.name || '';
        payload.cccdchuyendi = targetRel?.cccdthannhan || targetRel?.cccd || '';
      }
    }

    await personnelStore.saveRecord(payload);
    await personnelStore.fetchPersonnel();
    isTripFormOpen.value = false;
    emit('refresh');
  } catch (e) {
    alert('Lỗi lưu chuyến đi: ' + (e.message || e));
  } finally {
    isSavingSub.value = false;
  }
};

const deleteTrip = async (trip) => {
  if (!confirm(`Bạn có chắc muốn xóa chuyến đi: "${trip.countryName || trip.id}" không?`)) return;
  try {
    await personnelStore.deleteTrip(trip);
    await personnelStore.fetchPersonnel();
    emit('refresh');
  } catch (e) {
    alert('Lỗi xóa chuyến đi: ' + (e.message || e));
  }
};
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
  padding: 8px 4px 12px 4px;
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
}

.pane-subtitle {
  font-size: 0.74rem;
  color: #64748b;
}

.trip-filter-pills {
  display: inline-flex;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.filter-pill {
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
}

.filter-pill.active {
  background: #ffffff;
  color: #0284c7;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.mini-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.custom-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  text-align: left;
}

.custom-mini-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.custom-mini-table td {
  padding: 9px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.custom-mini-table tbody tr:hover {
  background: #f8fafc;
}

.col-center {
  text-align: center;
}

.idx-cell {
  font-weight: 600;
  color: #94a3b8;
}

.rel-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.rel-name {
  color: #0f172a;
}

.cccd-code {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #334155;
}

.trip-count-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
}

.trip-count-pill.has-items {
  background: #e0f2fe;
  color: #0369a1;
}

.table-actions {
  display: inline-flex;
  gap: 4px;
}

.btn-action-icon {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
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
  padding: 32px 16px;
  text-align: center;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 2rem;
  color: #94a3b8;
}

.empty-text {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.parent-profile-card {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  align-items: center;
}

.parent-avatar-box {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.parent-avatar-icon {
  font-size: 2rem;
}

.parent-details {
  flex: 1;
}

.parent-name {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.parent-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px 16px;
  font-size: 0.82rem;
  margin-bottom: 12px;
}

.meta-label {
  color: #64748b;
  margin-right: 6px;
}

.meta-val {
  font-weight: 600;
  color: #1e293b;
}

.person-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
}

.person-type-tag.person {
  background: #e0f2fe;
  color: #0369a1;
}

.person-type-tag.relative {
  background: #f3e8ff;
  color: #7e22ce;
}

.presence-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
}

.presence-badge.completed {
  background: #dcfce7;
  color: #15803d;
}

.presence-badge.abroad {
  background: #fef3c7;
  color: #b45309;
}

.presence-badge.overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.sub-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sub-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-field label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
}

.sub-input {
  width: 100%;
  height: 34px;
  padding: 4px 10px;
  font-size: 0.82rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  outline: none;
}

.sub-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}
</style>
