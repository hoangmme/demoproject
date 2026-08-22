<template>
  <div class="app-content">
    <!-- Breadcrumb & Top Bar -->
    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span>Tra cứu</span>
      <span>/</span>
      <span style="color: #0f172a; font-weight: 600;">{{ currentDashboardConfig.title || 'Danh sách chuyến đi' }}</span>
    </div>

    <!-- Header Section with Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge-code-cd">{{ currentDashboardConfig.code || 'CD-03' }}</span>
        <div>
          <h1 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
            {{ currentDashboardConfig.title || 'Danh sách chuyến đi' }}
            <span style="font-size: 0.85rem; font-weight: 500; color: #64748b;">· {{ filteredList.length }} bản ghi</span>
          </h1>
        </div>
      </div>

      <div style="display: flex; gap: 8px; align-items: center;">
        <!-- Column Picker -->
        <button
          type="button"
          class="btn-action-outline"
          @click="isColumnPickerOpen = true"
          title="Tùy chọn ẩn / hiện cột"
        >
          <i class="pi pi-table"></i>
          <span>Chọn cột hiển thị ({{ selectedColIds.length }}/{{ allAvailableColumnsList.length }})</span>
        </button>

        <!-- Export Excel -->
        <button
          type="button"
          class="btn-action-outline"
          @click="exportExcel"
          title="Xuất bảng dữ liệu ra tệp Excel"
        >
          <i class="pi pi-file-excel" style="color: #16a34a;"></i>
          <span>Xuất Excel</span>
        </button>

        <!-- Export PDF / Word (Same module as PersonnelView) -->
        <Button
          label="Xuất Hồ sơ (PDF / Word)"
          icon="pi pi-file-pdf"
          size="small"
          severity="danger"
          @click="openAdvancedDocxExport"
          style="font-size: 0.85rem;"
        />
      </div>
    </div>

    <!-- Quick Metric Pill Cards (Top Row) -->
    <div style="display: flex; gap: 12px; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <div
        v-for="(card, cIdx) in activeMetricCards"
        :key="card.id || cIdx"
        class="quick-stat-card"
        :class="{ 'stat-active': activeMetricCardId === (card.id || card.label || cIdx) }"
        @click="toggleMetricCardFilter(card, cIdx)"
        style="cursor: pointer;"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span :class="['dot-indicator', `dot-${card.color || 'blue'}`]"></span>
          <span class="stat-name">{{ card.label }}</span>
        </div>
        <span :class="['stat-number', `num-${card.color || 'blue'}`]">{{ getCardMetricValue(card) }}</span>
      </div>
    </div>

    <!-- Filter Bar Container -->
    <div class="app-card" style="padding: 12px 16px; margin-bottom: 1rem;">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <!-- Search -->
        <div style="position: relative; flex: 1; min-width: 240px;">
          <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm trong danh sách: họ tên, đơn vị, số quyết định, quốc gia..."
            style="width: 100%; padding-left: 30px; font-size: 0.82rem; height: 34px;"
          />
        </div>

        <!-- Year / Time Filter -->
        <div style="min-width: 150px;">
          <select v-model="timeFilterYear" class="filter-select">
            <option value="all">Khoảng thời gian: Tất cả</option>
            <option v-for="y in availableYears" :key="y" :value="y">Năm {{ y }}</option>
          </select>
        </div>

        <!-- Country Filter -->
        <div style="min-width: 140px;">
          <select v-model="selectedCountry" class="filter-select">
            <option value="">Quốc gia: Tất cả</option>
            <option v-for="c in availableCountries" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <!-- Department Filter -->
        <div style="min-width: 150px;">
          <select v-model="selectedDepartment" class="filter-select">
            <option value="">Đơn vị: Tất cả</option>
            <option v-for="d in availableDepartments" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <!-- Funding Source Filter -->
        <div style="min-width: 140px;">
          <select v-model="selectedFunding" class="filter-select">
            <option value="">Kinh phí: Tất cả</option>
            <option v-for="f in availableFundings" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>

        <!-- Reset button -->
        <Button
          v-if="hasActiveFilters"
          label="Xóa bộ lọc"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          size="small"
          @click="resetFilters"
          style="font-size: 0.78rem; height: 34px; padding: 0 10px;"
        />
      </div>
    </div>

    <!-- Main Data Table Area -->
    <div class="app-card" style="padding: 0; overflow: hidden;">
      <div style="overflow-x: auto; max-height: calc(100vh - 360px); min-height: 380px;">
        <table class="trips-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  style="accent-color: #1e3a8a;"
                />
              </th>
              <th style="width: 45px; text-align: center;">STT</th>

              <th
                v-for="col in visibleColumns"
                :key="col.id"
                :style="getColumnHeaderStyle(col)"
                @click="sortBy(col.id)"
                class="sortable-header"
              >
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                  <span>{{ col.label }}</span>
                  <i
                    v-if="sortKey === col.id"
                    :class="sortOrder === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
                    style="font-size: 0.75rem; color: #1e3a8a;"
                  ></i>
                </div>
              </th>

              <th style="width: 80px; text-align: center;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedList.length === 0">
              <td :colspan="visibleColumns.length + 3" style="text-align: center; padding: 3rem; color: #94a3b8;">
                <i class="pi pi-inbox" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                Không tìm thấy chuyến đi nào phù hợp với bộ lọc.
              </td>
            </tr>

            <tr
              v-for="(trip, idx) in paginatedList"
              :key="trip.uniqueKey || idx"
              :class="{ 'row-selected': selectedTripKeys.includes(trip.uniqueKey) }"
              @click="toggleSelectTrip(trip.uniqueKey)"
            >
              <!-- Checkbox -->
              <td style="text-align: center;" @click.stop>
                <input
                  type="checkbox"
                  :value="trip.uniqueKey"
                  v-model="selectedTripKeys"
                  style="accent-color: #1e3a8a;"
                />
              </td>

              <!-- STT -->
              <td style="text-align: center; color: #64748b; font-weight: 600;">
                {{ (currentPage - 1) * pageSize + idx + 1 }}
              </td>

              <!-- Dynamic Visible Columns -->
              <td
                v-for="col in visibleColumns"
                :key="col.id"
                :style="{ textAlign: col.align || 'left' }"
              >
                <!-- 1. Họ và tên (Cán bộ / Thân nhân) -->
                <template v-if="col.id === 'personnelName' || col.id === 'name'">
                  <div style="font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                    <span>{{ trip.personnelName || trip.name || 'Chưa rõ' }}</span>
                    <span v-if="trip.isRelative" class="badge-role-tn">Thân nhân</span>
                  </div>
                  <div v-if="trip.personnelCode" style="font-size: 0.72rem; color: #64748b;">
                    {{ trip.personnelCode }}
                  </div>
                </template>

                <!-- 2. Trạng thái Đi / Về (Status Badge) -->
                <template v-else-if="col.id === 'status' || col.id === 'tripStatus'">
                  <span :class="getStatusBadgeClass(trip)">
                    <span class="status-dot"></span>
                    {{ getStatusLabel(trip) }}
                  </span>
                </template>

                <!-- 3. Ngày nhập cảnh (Hiển thị ngày hoặc Badge Đang ở nước ngoài) -->
                <template v-else-if="col.id === 'arrivalDate'">
                  <span v-if="trip.arrivalDate" style="color: #0f172a; font-weight: 600;">
                    {{ formatDisplayDate(trip.arrivalDate) }}
                  </span>
                  <span v-else-if="trip.isOverdue" class="status-pill status-overdue">
                    Quá hạn {{ trip.overdueDays }} ngày
                  </span>
                  <span v-else class="status-pill status-abroad">
                    Đang ở nước ngoài
                  </span>
                </template>

                <!-- 4. Ngày xuất cảnh -->
                <template v-else-if="col.id === 'departureDate' || col.id === 'approvedDepartureDate'">
                  <span>{{ formatDisplayDate(trip[col.id] || trip.departureDate) }}</span>
                </template>

                <!-- 5. Số quyết định -->
                <template v-else-if="col.id === 'decisionNumber' || col.id === 'decision'">
                  <span v-if="trip.decisionNumber" class="code-badge-decision">
                    {{ trip.decisionNumber }}
                  </span>
                  <span v-else style="color: #94a3b8;">-</span>
                </template>

                <!-- 6. Quốc gia -->
                <template v-else-if="col.id === 'countryName' || col.id === 'country'">
                  <span style="font-weight: 600; color: #1e293b;">
                    {{ trip.countryName || trip.country || '-' }}
                  </span>
                </template>

                <!-- 7. Nguồn kinh phí -->
                <template v-else-if="col.id === 'fundingName' || col.id === 'funding'">
                  <span class="badge-funding">
                    {{ trip.fundingName || trip.funding || '-' }}
                  </span>
                </template>

                <!-- Default text -->
                <template v-else>
                  <span>{{ getCellValue(trip, col.id) }}</span>
                </template>
              </td>

              <!-- Action button -->
              <td style="text-align: center;" @click.stop>
                <Button
                  icon="pi pi-user-edit"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  @click="openPersonnelDetail(trip)"
                  v-tooltip.top="'Xem hồ sơ chi tiết'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-top: 1px solid #e2e8f0; background: #fafafa; font-size: 0.8rem; color: #64748b;">
        <div>
          Hiển thị <b>{{ paginatedList.length }}</b> / <b>{{ filteredList.length }}</b> chuyến đi
          <span v-if="selectedTripKeys.length > 0" style="margin-left: 12px; color: #1e3a8a; font-weight: 600;">
            (Đã chọn {{ selectedTripKeys.length }} chuyến)
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <select v-model="pageSize" style="font-size: 0.78rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1;">
            <option :value="15">15 dòng / trang</option>
            <option :value="30">30 dòng / trang</option>
            <option :value="50">50 dòng / trang</option>
            <option :value="100">100 dòng / trang</option>
          </select>

          <Button
            icon="pi pi-angle-left"
            size="small"
            text
            :disabled="currentPage === 1"
            @click="currentPage--"
          />
          <span>Trang <b>{{ currentPage }}</b> / {{ totalPages || 1 }}</span>
          <Button
            icon="pi pi-angle-right"
            size="small"
            text
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          />
        </div>
      </div>
    </div>

    <!-- Modal Chọn cột hiển thị -->
    <Dialog
      v-model:visible="isColumnPickerOpen"
      modal
      :header="`Chọn cột hiển thị (${selectedColIds.length} / ${allAvailableColumnsList.length} cột)`"
      :style="{ width: '680px' }"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 0.8rem; color: #64748b;">
          Đánh dấu chọn các cột thông tin từ toàn bộ <b>{{ allAvailableColumnsList.length }} cột</b> để xuất hiện trên bảng dữ liệu:
        </span>
        <div style="display: flex; gap: 6px;">
          <Button label="Chọn tất cả" size="small" text severity="primary" @click="selectedColIds = allAvailableColumnsList.map(c => c.id)" style="font-size: 0.75rem; padding: 2px 6px;" />
          <Button label="Bỏ chọn" size="small" text severity="secondary" @click="selectedColIds = []" style="font-size: 0.75rem; padding: 2px 6px;" />
          <Button label="Mặc định (10 cột)" size="small" text severity="info" @click="resetDefaultColumns" style="font-size: 0.75rem; padding: 2px 6px;" />
        </div>
      </div>

      <div style="margin-bottom: 8px;">
        <InputText
          v-model="columnSearchQuery"
          placeholder="🔍 Tìm nhanh tên cột..."
          size="small"
          style="width: 100%; font-size: 0.8rem;"
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 380px; overflow-y: auto; padding: 4px; border: 1px solid #f1f5f9; border-radius: 8px; background: #f8fafc;">
        <label
          v-for="col in filteredPickerColumns"
          :key="col.id"
          style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; cursor: pointer; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff;"
        >
          <input
            type="checkbox"
            :value="col.id"
            v-model="selectedColIds"
            style="accent-color: #1e3a8a;"
          />
          <span style="font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="col.label">
            {{ col.label }}
          </span>
        </label>
      </div>

      <template #footer>
        <Button label="Khôi phục Mặc định" severity="secondary" text size="small" @click="resetDefaultColumns" />
        <Button label="Đóng & Áp dụng" severity="primary" size="small" @click="saveColumnSelection" />
      </template>
    </Dialog>

    <!-- Dedicated Add / Edit Trip Dialog -->
    <Dialog
      v-model:visible="isTripFormDialogOpen"
      modal
      :header="editingTripItem ? 'Chỉnh sửa Chuyến đi' : 'Thêm Chuyến đi Nước ngoài Mới'"
      :style="{ width: '680px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <!-- 1. Chọn đối tượng đi: Cán bộ hay Thân nhân -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
            1. ĐỐI TƯỢNG ĐI NƯỚC NGOÀI:
          </label>
          <div style="display: flex; gap: 18px; align-items: center;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #1e293b;">
              <input type="radio" value="personnel" v-model="tripTargetType" style="accent-color: #1e3a8a;" />
              <span>👤 Cán bộ (Cá nhân)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #7c3aed;">
              <input type="radio" value="relative" v-model="tripTargetType" style="accent-color: #7c3aed;" />
              <span>👥 Thân nhân của Cán bộ</span>
            </label>
          </div>
        </div>

        <!-- 2. Chọn Cán bộ / Thân nhân cụ thể hoặc nhập CCCD -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            2. CHỌN {{ tripTargetType === 'personnel' ? 'CÁN BỘ' : 'THÂN NHÂN' }} LIÊN QUAN: <span style="color: red;">*</span>
          </label>
          <select v-if="tripTargetType === 'personnel'" v-model="selectedTargetKey" class="filter-select" style="width: 100%; font-size: 0.82rem;" @change="onTargetPersonChange">
            <option value="">-- Chọn Cán bộ từ danh sách --</option>
            <option v-for="p in personnelStore.personnelList" :key="p.id" :value="p.cccd || p.cccdparent || p.id">
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>

          <select v-else v-model="selectedTargetKey" class="filter-select" style="width: 100%; font-size: 0.82rem;" @change="onTargetRelativeChange">
            <option value="">-- Chọn Thân nhân từ danh sách --</option>
            <option v-for="r in personnelStore.relativesList" :key="r.id || r.code" :value="r.cccd || r.cccdthannhan || r.code || r.id">
              {{ r.relativeName || r.name }} ({{ r.relationshipName }} của {{ r.parentName || r.parentPersonnelName }}) - CCCD: {{ r.cccd || r.cccdthannhan || '-' }}
            </option>
          </select>
        </div>

        <!-- Thẻ tóm tắt thông tin đối tượng được chọn (Matching upload style) -->
        <div v-if="selectedTargetSummary" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 0.7rem; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            {{ tripTargetType === 'personnel' ? 'Cán bộ liên quan' : 'Thân nhân liên quan' }}
          </div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #0f172a;">
            {{ selectedTargetSummary.name }}
          </div>
          <div style="font-size: 0.8rem; color: #334155; margin: 2px 0;">
            {{ selectedTargetSummary.sub }}
          </div>
          <div style="font-size: 0.74rem; color: #64748b; font-family: monospace;">
            CCCD: <strong>{{ selectedTargetSummary.cccd }}</strong>
          </div>
        </div>

        <!-- 3. Thông tin chuyến đi -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Quốc gia / Nơi đến: <span style="color: red;">*</span>
            </label>
            <InputText v-model="tripFormData.countryName" placeholder="VD: Nhật Bản, Hoa Kỳ, Pháp..." size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Nguồn kinh phí:
            </label>
            <select v-model="tripFormData.fundingName" class="filter-select" style="width: 100%; font-size: 0.82rem;">
              <option value="Ngân sách nhà nước">Ngân sách nhà nước</option>
              <option value="Tài trợ">Tài trợ</option>
              <option value="Tự túc">Tự túc</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Ngày xuất cảnh (Ngày đi):
            </label>
            <InputText v-model="tripFormData.departureDate" placeholder="DD/MM/YYYY" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Ngày nhập cảnh (Ngày về thực tế / dự kiến):
            </label>
            <InputText v-model="tripFormData.arrivalDate" placeholder="DD/MM/YYYY" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Số quyết định duyệt:
            </label>
            <InputText v-model="tripFormData.decisionNumber" placeholder="VD: 1234/QĐ-CATP" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
              Số Hộ chiếu:
            </label>
            <InputText v-model="tripFormData.passportNumber" placeholder="VD: B1234567" size="small" style="width: 100%; font-size: 0.82rem;" />
          </div>
        </div>

        <div>
          <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            Mục đích chuyến đi:
          </label>
          <InputText v-model="tripFormData.purpose" placeholder="VD: Công tác, Hội thảo, Du lịch, Thăm thân nhân..." size="small" style="width: 100%; font-size: 0.82rem;" />
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isTripFormDialogOpen = false" />
        <Button label="Lưu Chuyến đi" severity="success" size="small" icon="pi pi-check" @click="saveTripForm" />
      </template>
    </Dialog>

    <!-- Personnel Edit / Add Dialog -->
    <PersonnelDialog
      v-model="isPersonnelDialogOpen"
      :personData="activePersonData"
      @saved="handlePersonnelSaved"
    />

    <!-- Advanced Word / PDF Export Dialog -->
    <AdvancedDocxExportDialog
      v-model="isExportDocxDialogOpen"
      :selectedCount="selectedPersonnelForExport.length"
      :customPersonnelList="selectedPersonnelForExport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings } from '@/api/settings';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import { formatDate, parseDateObj } from '@/utils/formatters';
import * as XLSX from 'xlsx';

const route = useRoute();
const personnelStore = usePersonnelStore();
const isExportDocxDialogOpen = ref(false);

const openAdvancedDocxExport = () => {
  isExportDocxDialogOpen.value = true;
};

const selectedPersonnelForExport = computed(() => {
  if (selectedTripKeys.value.length > 0) {
    const selectedKeysSet = new Set(selectedTripKeys.value);
    const matchedPIds = new Set();
    unifiedTripsList.value.forEach((t) => {
      if (selectedKeysSet.has(t.uniqueKey) && t.personnelId) {
        matchedPIds.add(t.personnelId);
      }
    });
    return (personnelStore.personnelList || []).filter((p) => matchedPIds.has(p.id));
  }
  // Otherwise export all filtered personnel
  const currentPIds = new Set(filteredList.value.map((t) => t.personnelId).filter(Boolean));
  return (personnelStore.personnelList || []).filter((p) => currentPIds.has(p.id));
});

// Dynamic Dashboard Topic State
const customDashboards = ref([]);

const currentDashboardId = computed(() => {
  return route.params.id || (route.path === '/trips' ? 'trips' : 'trips');
});

const currentDashboardConfig = computed(() => {
  const found = customDashboards.value.find((d) => d.id === currentDashboardId.value);
  if (found) return found;
  return {
    id: 'trips',
    code: 'CD-03',
    title: 'Danh sách Chuyến đi',
    source: 'trips',
    icon: 'pi-send',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
      { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
      { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
      { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
    ],
  };
});

const activeMetricCards = computed(() => {
  if (currentDashboardConfig.value.metricCards && currentDashboardConfig.value.metricCards.length > 0) {
    return currentDashboardConfig.value.metricCards;
  }
  return [
    { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
    { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
    { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
    { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
  ];
});

const activeMetricCardId = ref('all');

const matchCardCondition = (item, card) => {
  if (!card) return true;
  // 1. If card has a specific field configured
  if (card.field) {
    const fieldVal = item[card.field] !== undefined && item[card.field] !== null
      ? String(item[card.field]).trim()
      : (item.rawTrip?.[card.field] || item.rawPerson?.[card.field] || item.custom_data?.[card.field] || item.rawPerson?.custom_data?.[card.field] || '');
    
    const op = card.operator || 'has_value';
    if (op === 'has_value') {
      return !!fieldVal;
    }
    if (op === 'equals') {
      return String(fieldVal).toLowerCase() === String(card.value || '').trim().toLowerCase();
    }
    if (op === 'contains') {
      return String(fieldVal).toLowerCase().includes(String(card.value || '').trim().toLowerCase());
    }
  }

  // 2. Fallback to status / trip condition
  const cond = card.condition || card.operator || 'all';
  if (cond === 'completed') return !item.isAbroad && !item.isOverdue;
  if (cond === 'abroad') return item.isAbroad && !item.isOverdue;
  if (cond === 'overdue') return item.isOverdue;
  return true;
};

const getCardMetricValue = (card) => {
  if (!card) return 0;
  return unifiedTripsList.value.filter((item) => matchCardCondition(item, card)).length;
};

const toggleMetricCardFilter = (card, cIdx) => {
  const cardKey = card.id || card.label || cIdx;
  if (activeMetricCardId.value === cardKey) {
    activeMetricCardId.value = 'all';
    statusFilter.value = 'all';
  } else {
    activeMetricCardId.value = cardKey;
    if (card.condition) statusFilter.value = card.condition;
  }
};

// Filters
const searchQuery = ref('');
const statusFilter = ref('all'); // all, completed, abroad, overdue
const timeFilterYear = ref('all');
const selectedCountry = ref('');
const selectedDepartment = ref('');
const selectedFunding = ref('');

// Selection & Sorting & Pagination
const selectedTripKeys = ref([]);
const sortKey = ref('departureDate');
const sortOrder = ref(-1); // -1: desc, 1: asc
const currentPage = ref(1);
const pageSize = ref(30);

// Dialogs
const isColumnPickerOpen = ref(false);
const columnSearchQuery = ref('');
const isPersonnelDialogOpen = ref(false);
const activePersonData = ref(null);

const isTripFormDialogOpen = ref(false);
const editingTripItem = ref(null);
const tripTargetType = ref('personnel'); // 'personnel' | 'relative'
const selectedTargetKey = ref('');
const tripFormData = ref({
  countryName: '',
  departureDate: '',
  arrivalDate: '',
  decisionNumber: '',
  fundingName: 'Ngân sách nhà nước',
  purpose: '',
  passportNumber: '',
});

// Default columns definition
const DEFAULT_TRIP_COLUMNS = [
  { id: 'personnelName', label: 'Họ và tên', width: '180px' },
  { id: 'position', label: 'Chức vụ', width: '150px' },
  { id: 'departmentName', label: 'Đơn vị công tác', width: '180px' },
  { id: 'countryName', label: 'Quốc gia', width: '140px' },
  { id: 'departureDate', label: 'Ngày xuất cảnh', width: '120px' },
  { id: 'arrivalDate', label: 'Ngày nhập cảnh / Trạng thái', width: '160px' },
  { id: 'decisionNumber', label: 'Số quyết định', width: '130px' },
  { id: 'fundingName', label: 'Nguồn kinh phí', width: '140px' },
  { id: 'purpose', label: 'Mục đích chuyến đi', width: '160px' },
  { id: 'status', label: 'Tiến độ Đi - Về', width: '140px' },
];

const allAvailableColumnsList = computed(() => {
  const src = currentDashboardConfig.value?.source || 'trips';
  let rawList = [];

  if (src === 'trips') {
    const base = [...DEFAULT_TRIP_COLUMNS];
    const seen = new Set(base.map((c) => c.id));
    rawList = [...base];

    (personnelStore.importMappingTrips || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          rawList.push({ id: c.id, label: c.label || c.id, width: '150px' });
        }
      });
    });
  } else if (src === 'relatives') {
    const seen = new Set();
    (personnelStore.importMappingRelative || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          rawList.push({ id: c.id, label: c.label || c.id, width: '150px' });
        }
      });
    });
  } else {
    // personnel
    const seen = new Set();
    (personnelStore.importMappingPersonnel || []).forEach((g) => {
      (g.columns || []).forEach((c) => {
        if (c.id && c.id !== 'stt' && !seen.has(c.id)) {
          seen.add(c.id);
          rawList.push({ id: c.id, label: c.label || c.id, width: '150px' });
        }
      });
    });
  }

  return rawList.map((c, idx) => ({
    ...c,
    displayLabel: `(Cột ${idx + 1}) - ${c.label || c.id}`,
  }));
});

const filteredPickerColumns = computed(() => {
  if (!columnSearchQuery.value.trim()) return allAvailableColumnsList.value;
  const q = columnSearchQuery.value.trim().toLowerCase();
  return allAvailableColumnsList.value.filter((c) => (c.displayLabel || c.label || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q));
});

const allColumns = computed(() => allAvailableColumnsList.value);
const selectedColIds = ref(DEFAULT_TRIP_COLUMNS.map((c) => c.id));

const visibleColumns = computed(() => {
  return allAvailableColumnsList.value.filter((c) => selectedColIds.value.includes(c.id));
});

// Build unified list of trips from both Personnel.trips and Relatives
const unifiedTripsList = computed(() => {
  const list = [];
  const pList = personnelStore.personnelList || [];
  const rList = personnelStore.relativesList || [];
  const now = new Date();

  // 1. Cán bộ trips
  pList.forEach((p) => {
    (p.trips || []).forEach((t, tIdx) => {
      const depDate = t.departureDate || t.approvedDepartureDate || '';
      const arrDate = t.arrivalDate || '';
      const appArrDate = t.approvedArrivalDate || '';
      const extDate = t.approvedExtensionDate || '';

      const depObj = parseDateObj(depDate);
      const arrObj = parseDateObj(arrDate);
      const appArrObj = parseDateObj(extDate || appArrDate);

      let isAbroad = false;
      let isOverdue = false;
      let overdueDays = 0;

      if (!arrDate || !arrObj) {
        isAbroad = true;
        if (appArrObj && now > appArrObj) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((now - appArrObj) / (1000 * 60 * 60 * 24)));
        }
      } else if (appArrObj && arrObj > appArrObj) {
        isOverdue = true;
        overdueDays = Math.max(1, Math.floor((arrObj - appArrObj) / (1000 * 60 * 60 * 24)));
      }

      list.push({
        uniqueKey: `cb_${p.id}_${t.id || tIdx}`,
        isRelative: false,
        personnelId: p.id,
        personnelCode: p.code || `CB-${String(p.id).slice(-5)}`,
        personnelName: p.name,
        position: p.position || '',
        departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
        countryName: t.countryName || t.country || '',
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedDepartureDate: t.approvedDepartureDate || depDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        decisionNumber: t.decisionNumber || t.decision || '',
        fundingName: t.fundingName || t.funding || p.funding2 || p.funding || '',
        purpose: t.purpose || t.tripPurpose || t.content || '',
        isAbroad,
        isOverdue,
        overdueDays,
        rawTrip: t,
        rawPerson: p,
      });
    });
  });

  // 2. Thân nhân records with abroad info
  const processedRelatives = new Set();
  pList.forEach((p) => {
    (p.relatives || []).forEach((r, rIdx) => {
      const rKey = r.id || `${p.id}_${r.name || r.relativeName}`;
      if (!processedRelatives.has(rKey)) {
        processedRelatives.add(rKey);
        const cName = r.countryName || r.country || '';
        if (cName && cName !== '-' && cName !== 'Chưa rõ') {
          list.push({
            uniqueKey: `tn_${p.id}_${r.id || rIdx}`,
            isRelative: true,
            personnelId: p.id,
            personnelCode: p.code || '',
            personnelName: r.relativeName || r.name || 'Thân nhân',
            position: `TN của: ${p.name}`,
            departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
            countryName: cName,
            departureDate: r.departureDate || r.startDate || '',
            arrivalDate: r.arrivalDate || r.endDate || '',
            decisionNumber: r.decisionNumber || '-',
            fundingName: r.kinhphiTN || r.fundingName || r.funding || '',
            purpose: r.relationship ? `Quan hệ: ${r.relationship}` : 'Thân nhân ở nước ngoài',
            isAbroad: !r.arrivalDate,
            isOverdue: false,
            overdueDays: 0,
            rawRelative: r,
            rawPerson: p,
          });
        }
      }
    });
  });

  return list;
});

// Aggregated Quick Stats
const tripStats = computed(() => {
  const list = unifiedTripsList.value;
  let completed = 0;
  let abroad = 0;
  let overdue = 0;

  list.forEach((t) => {
    if (t.isOverdue) overdue++;
    else if (t.isAbroad) abroad++;
    else completed++;
  });

  return {
    total: list.length,
    completed,
    abroad,
    overdue,
  };
});

// Dropdown filter options
const availableYears = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    const d = parseDateObj(t.departureDate);
    if (d) set.add(d.getFullYear());
  });
  return Array.from(set).sort((a, b) => b - a);
});

const availableCountries = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    if (t.countryName && t.countryName !== '-') set.add(t.countryName);
  });
  return Array.from(set).sort();
});

const availableDepartments = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    if (t.departmentName) set.add(t.departmentName);
  });
  return Array.from(set).sort();
});

const availableFundings = computed(() => {
  const set = new Set();
  unifiedTripsList.value.forEach((t) => {
    if (t.fundingName && t.fundingName !== '-') set.add(t.fundingName);
  });
  return Array.from(set).sort();
});

// Filtered List
const filteredList = computed(() => {
  let list = [...unifiedTripsList.value];

  // 0. Active Metric Card Filter (Top KPI Pill)
  if (activeMetricCardId.value && activeMetricCardId.value !== 'all') {
    const targetCard = activeMetricCards.value.find((c, idx) => (c.id || c.label || idx) === activeMetricCardId.value);
    if (targetCard) {
      list = list.filter((t) => matchCardCondition(t, targetCard));
    }
  }

  // 1. Status Filter
  if (statusFilter.value === 'completed') {
    list = list.filter((t) => !t.isAbroad && !t.isOverdue);
  } else if (statusFilter.value === 'abroad') {
    list = list.filter((t) => t.isAbroad && !t.isOverdue);
  } else if (statusFilter.value === 'overdue') {
    list = list.filter((t) => t.isOverdue);
  }

  // 2. Year Filter
  if (timeFilterYear.value !== 'all') {
    const targetY = Number(timeFilterYear.value);
    list = list.filter((t) => {
      const d = parseDateObj(t.departureDate);
      return d && d.getFullYear() === targetY;
    });
  }

  // 3. Country Filter
  if (selectedCountry.value) {
    list = list.filter((t) => t.countryName === selectedCountry.value);
  }

  // 4. Department Filter
  if (selectedDepartment.value) {
    list = list.filter((t) => t.departmentName === selectedDepartment.value);
  }

  // 5. Funding Filter
  if (selectedFunding.value) {
    list = list.filter((t) => t.fundingName === selectedFunding.value);
  }

  // 6. Search Query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((t) => {
      return (
        String(t.personnelName || '').toLowerCase().includes(q) ||
        String(t.personnelCode || '').toLowerCase().includes(q) ||
        String(t.departmentName || '').toLowerCase().includes(q) ||
        String(t.countryName || '').toLowerCase().includes(q) ||
        String(t.decisionNumber || '').toLowerCase().includes(q) ||
        String(t.purpose || '').toLowerCase().includes(q) ||
        String(t.fundingName || '').toLowerCase().includes(q)
      );
    });
  }

  // 7. Sort
  list.sort((a, b) => {
    let valA = a[sortKey.value] || '';
    let valB = b[sortKey.value] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return -1 * sortOrder.value;
    if (valA > valB) return 1 * sortOrder.value;
    return 0;
  });

  return list;
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize.value) || 1;
});

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

// Helpers
const formatDisplayDate = (dStr) => {
  if (!dStr) return '-';
  return formatDate(dStr) || dStr;
};

const getCellValue = (trip, colId) => {
  if (trip[colId] !== undefined && trip[colId] !== null && trip[colId] !== '') {
    return trip[colId];
  }
  if (trip.rawTrip && trip.rawTrip[colId] !== undefined && trip.rawTrip[colId] !== null && trip.rawTrip[colId] !== '') {
    return trip.rawTrip[colId];
  }
  if (trip.rawPerson && trip.rawPerson[colId] !== undefined && trip.rawPerson[colId] !== null && trip.rawPerson[colId] !== '') {
    return trip.rawPerson[colId];
  }
  if (trip.rawPerson?.custom_data && trip.rawPerson.custom_data[colId] !== undefined && trip.rawPerson.custom_data[colId] !== null) {
    return trip.rawPerson.custom_data[colId];
  }
  return '-';
};

const getStatusBadgeClass = (trip) => {
  if (trip.isOverdue) return 'status-pill status-overdue';
  if (trip.isAbroad) return 'status-pill status-abroad';
  return 'status-pill status-completed';
};

const getStatusLabel = (trip) => {
  if (trip.isOverdue) return `Quá hạn (${trip.overdueDays} ngày)`;
  if (trip.isAbroad) return 'Đang ở nước ngoài';
  return 'Đã về nước';
};

const getColumnHeaderStyle = (col) => {
  return {
    width: col.width || 'auto',
    textAlign: col.align || 'left',
  };
};

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1;
  } else {
    sortKey.value = key;
    sortOrder.value = 1;
  }
};

const isAllSelected = computed(() => {
  return (
    paginatedList.value.length > 0 &&
    paginatedList.value.every((t) => selectedTripKeys.value.includes(t.uniqueKey))
  );
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const pageKeys = new Set(paginatedList.value.map((t) => t.uniqueKey));
    selectedTripKeys.value = selectedTripKeys.value.filter((k) => !pageKeys.has(k));
  } else {
    paginatedList.value.forEach((t) => {
      if (!selectedTripKeys.value.includes(t.uniqueKey)) {
        selectedTripKeys.value.push(t.uniqueKey);
      }
    });
  }
};

const toggleSelectTrip = (key) => {
  const idx = selectedTripKeys.value.indexOf(key);
  if (idx !== -1) {
    selectedTripKeys.value.splice(idx, 1);
  } else {
    selectedTripKeys.value.push(key);
  }
};

const hasActiveFilters = computed(() => {
  return (
    statusFilter.value !== 'all' ||
    timeFilterYear.value !== 'all' ||
    selectedCountry.value !== '' ||
    selectedDepartment.value !== '' ||
    selectedFunding.value !== '' ||
    searchQuery.value.trim() !== ''
  );
});

const resetFilters = () => {
  statusFilter.value = 'all';
  timeFilterYear.value = 'all';
  selectedCountry.value = '';
  selectedDepartment.value = '';
  selectedFunding.value = '';
  searchQuery.value = '';
  currentPage.value = 1;
};

// Column Picker
const resetDefaultColumns = () => {
  selectedColIds.value = DEFAULT_TRIP_COLUMNS.map((c) => c.id);
};

const saveColumnSelection = () => {
  localStorage.setItem('trips_dashboard_columns', JSON.stringify(selectedColIds.value));
  isColumnPickerOpen.value = false;
};

// Actions
const openPersonnelDetail = (trip) => {
  if (trip.rawPerson) {
    activePersonData.value = JSON.parse(JSON.stringify(trip.rawPerson));
    isPersonnelDialogOpen.value = true;
  }
};

const selectedTargetSummary = computed(() => {
  if (!selectedTargetKey.value) return null;
  if (tripTargetType.value === 'personnel') {
    const p = personnelStore.findPersonByCccd(selectedTargetKey.value);
    if (!p) return null;
    return {
      name: p.name || 'Cán bộ',
      sub: `${p.positionName || p.position || 'Cán bộ'}${p.departmentName ? ' · ' + p.departmentName : ''}`,
      cccd: p.cccd || p.cccdparent || selectedTargetKey.value,
      raw: p,
    };
  } else {
    const r = personnelStore.findRelativeByCccd(selectedTargetKey.value);
    if (!r) return null;
    return {
      name: r.relativeName || r.name || 'Thân nhân',
      sub: `${r.relationshipName || 'Thân nhân'} của ${r.parentName || r.parentPersonnelName || 'Cán bộ'}`,
      cccd: r.cccd || r.cccdthannhan || selectedTargetKey.value,
      raw: r,
    };
  }
});

const onTargetPersonChange = () => {};
const onTargetRelativeChange = () => {};

const openAddTripDialog = () => {
  editingTripItem.value = null;
  selectedTargetKey.value = (personnelStore.personnelList[0]?.cccd || personnelStore.personnelList[0]?.id) || '';
  tripTargetType.value = 'personnel';
  tripFormData.value = {
    countryName: '',
    departureDate: '',
    arrivalDate: '',
    decisionNumber: '',
    fundingName: 'Ngân sách nhà nước',
    purpose: '',
    passportNumber: '',
  };
  isTripFormDialogOpen.value = true;
};

const saveTripForm = async () => {
  if (!selectedTargetSummary.value) {
    alert('Vui lòng chọn Cán bộ hoặc Thân nhân liên quan!');
    return;
  }
  if (!tripFormData.value.countryName || !tripFormData.value.countryName.trim()) {
    alert('Vui lòng nhập Quốc gia / Nơi đến của chuyến đi!');
    return;
  }

  try {
    const newTrip = {
      ...tripFormData.value,
      id: 'trip_' + Date.now(),
    };

    if (tripTargetType.value === 'personnel') {
      const targetPerson = selectedTargetSummary.value.raw;
      const updatedPerson = JSON.parse(JSON.stringify(targetPerson));
      if (!Array.isArray(updatedPerson.trips)) updatedPerson.trips = [];
      updatedPerson.trips.push(newTrip);
      await personnelStore.savePerson(updatedPerson);
    } else {
      const targetRel = selectedTargetSummary.value.raw;
      // Tìm cán bộ cha của thân nhân này
      const parentCccd = targetRel.cccdparent || targetRel.parentCccd || targetRel.parentPersonnelCccd;
      const parentPerson = personnelStore.findPersonByCccd(parentCccd) || (personnelStore.personnelList || []).find((p) => p.id === targetRel.personnelId);
      
      if (parentPerson) {
        const updatedParent = JSON.parse(JSON.stringify(parentPerson));
        if (!Array.isArray(updatedParent.relatives)) updatedParent.relatives = [];
        const relIdx = updatedParent.relatives.findIndex((r) => {
          const rCccd = r.cccd || r.cccdthannhan || r.code || r.id;
          return rCccd === selectedTargetKey.value || r.id === targetRel.id;
        });
        if (relIdx !== -1) {
          if (!Array.isArray(updatedParent.relatives[relIdx].trips)) {
            updatedParent.relatives[relIdx].trips = [];
          }
          updatedParent.relatives[relIdx].trips.push(newTrip);
          await personnelStore.savePerson(updatedParent);
        } else {
          alert('Không tìm thấy thân nhân trong hồ sơ cán bộ tương ứng!');
          return;
        }
      } else {
        alert('Không tìm thấy cán bộ quản lý thân nhân này!');
        return;
      }
    }

    await personnelStore.fetchPersonnel();
    isTripFormDialogOpen.value = false;
    alert('Đã lưu chuyến đi thành công!');
  } catch (err) {
    alert('Lỗi lưu chuyến đi: ' + (err.message || err));
  }
};

const handlePersonnelSaved = async () => {
  await personnelStore.fetchPersonnel();
  isPersonnelDialogOpen.value = false;
};

// Excel Export
const exportExcel = () => {
  const exportData = filteredList.value.map((t, idx) => {
    const row = {
      'STT': idx + 1,
      'Họ và tên': t.personnelName,
      'Đối tượng': t.isRelative ? 'Thân nhân' : 'Cán bộ',
      'Chức vụ': t.position,
      'Đơn vị công tác': t.departmentName,
      'Quốc gia': t.countryName,
      'Ngày xuất cảnh': formatDisplayDate(t.departureDate),
      'Ngày nhập cảnh': formatDisplayDate(t.arrivalDate),
      'Số quyết định': t.decisionNumber,
      'Nguồn kinh phí': t.fundingName,
      'Mục đích': t.purpose,
      'Trạng thái': getStatusLabel(t),
    };
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Chuyến đi');
  XLSX.writeFile(wb, `Danh_sach_chuyen_di_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const loadCustomDashboards = async () => {
  try {
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customDashboards.value = saved;
    } else {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) customDashboards.value = JSON.parse(local);
    }
  } catch (e) {
    console.error('Error loading custom dashboards in ChildDashboardView:', e);
  }
};

onMounted(async () => {
  await loadCustomDashboards();
  if (currentDashboardConfig.value.columns && currentDashboardConfig.value.columns.length > 0) {
    selectedColIds.value = [...currentDashboardConfig.value.columns];
  } else {
    const savedCols = localStorage.getItem('trips_dashboard_columns');
    if (savedCols) {
      try {
        selectedColIds.value = JSON.parse(savedCols);
      } catch (e) {}
    }
  }
});
</script>

<style scoped>
.badge-code-cd {
  background: #1e3a8a;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-action-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-action-outline:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* Quick Stat Cards */
.quick-stat-card {
  flex: 1;
  min-width: 170px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}
.quick-stat-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}
.quick-stat-card.stat-active {
  border-color: #1e3a8a;
  background: #eff6ff;
  box-shadow: 0 1px 3px rgba(30, 58, 138, 0.12);
}

.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot-blue { background: #2563eb; }
.dot-green { background: #16a34a; }
.dot-amber { background: #d97706; }
.dot-red { background: #dc2626; }

.stat-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
}
.stat-number {
  font-size: 1.15rem;
  font-weight: 700;
}
.num-blue { color: #1e3a8a; }
.num-green { color: #15803d; }
.num-amber { color: #b45309; }
.num-red { color: #b91c1c; }

/* Filter Selects */
.filter-select {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  font-size: 0.82rem;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}
.filter-select:focus {
  border-color: #1e3a8a;
}

/* Trips Table */
.trips-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.trips-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.sortable-header {
  cursor: pointer;
  user-select: none;
}
.sortable-header:hover {
  background: #f1f5f9;
}
.trips-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.trips-table tr:hover {
  background: #f8fafc;
}
.trips-table tr.row-selected {
  background: #f0fdf4;
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-completed {
  background: #dcfce7;
  color: #15803d;
}
.status-completed .status-dot {
  background: #16a34a;
}
.status-abroad {
  background: #fef3c7;
  color: #b45309;
}
.status-abroad .status-dot {
  background: #d97706;
}
.status-overdue {
  background: #fee2e2;
  color: #b91c1c;
}
.status-overdue .status-dot {
  background: #dc2626;
}

.badge-role-tn {
  background: #f3e8ff;
  color: #7c3aed;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
.code-badge-decision {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.badge-funding {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
