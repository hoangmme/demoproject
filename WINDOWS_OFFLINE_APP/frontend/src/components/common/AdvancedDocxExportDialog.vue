<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="dialogTitle"
    :baseZIndex="16000"
    :style="{ width: '840px', maxWidth: '96vw', zIndex: 16000 }"
    :contentStyle="{ maxHeight: '82vh', overflowY: 'auto' }"
    :breakpoints="{ '640px': '98vw' }"
  >
    <div class="docx-export-container">
      <!-- 1. Phạm vi xuất -->
      <div class="export-box">
        <div class="box-title">
          <i class="pi pi-users" style="color: #0284c7;"></i>
          <span>1. Chọn Phạm vi xuất ({{ mainTableTitle }})</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
          <label
            v-if="targetPerson"
            class="radio-item"
            :class="{ 'radio-active': exportScope === 'single' }"
          >
            <input type="radio" v-model="exportScope" value="single" style="accent-color: #0284c7;" />
            <div>
              <strong style="color: #1e293b;">Chỉ bản ghi hiện tại:</strong>
              <span style="color: #0284c7; margin-left: 4px; font-weight: 600;">
                {{ getTargetPersonDisplayName(targetPerson) }}
                <template v-if="getTargetPersonCode(targetPerson)">
                  ({{ getTargetPersonCode(targetPerson) }})
                </template>
              </span>
            </div>
          </label>

          <label
            v-if="selectedCount > 0"
            class="radio-item"
            :class="{ 'radio-active': exportScope === 'selected' }"
          >
            <input type="radio" v-model="exportScope" value="selected" style="accent-color: #0284c7;" />
            <div>
              <strong style="color: #1e293b;">Các bản ghi được tích chọn:</strong>
              <span style="color: #7c3aed; margin-left: 4px; font-weight: 700;">{{ selectedCount }} bản ghi</span>
            </div>
          </label>

          <label
            class="radio-item"
            :class="{ 'radio-active': exportScope === 'all' }"
          >
            <input type="radio" v-model="exportScope" value="all" style="accent-color: #0284c7;" />
            <div>
              <strong style="color: #1e293b;">Toàn bộ bản ghi trong danh sách:</strong>
              <span style="color: #16a34a; margin-left: 4px; font-weight: 700;">{{ totalPersonnelCount }} bản ghi</span>
            </div>
          </label>
        </div>
      </div>

      <!-- 2. Chọn Kiểu Xuất Hồ Sơ -->
      <div class="export-box">
        <div class="box-title" style="display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-th-large" style="color: #2563eb;"></i>
          <span>2. Chọn kiểu xuất hồ sơ</span>
        </div>

        <!-- Tabs chọn nguồn mẫu -->
        <div style="display: flex; gap: 6px; margin: 8px 0;">
          <button
            type="button"
            class="tpl-src-btn"
            :class="{ 'tpl-src-active': templateSource === 'sample' }"
            @click="setTemplateSource('sample')"
          >
            <i class="pi pi-table"></i> Theo Bảng Dữ Liệu
          </button>
          <button
            type="button"
            class="tpl-src-btn"
            :class="{ 'tpl-src-active': templateSource === 'upload' }"
            @click="setTemplateSource('upload')"
          >
            <i class="pi pi-file-edit"></i> Theo Mẫu có sẵn / Tải lên
          </button>
        </div>

        <!-- Khu vực hiển thị theo nguồn mẫu -->
        <div style="margin-top: 6px;">
          <input
            ref="fileInputRef"
            type="file"
            accept=".docx"
            style="display: none;"
            @change="handleFileUpload"
          />

          <!-- Nguồn 1: Chọn Cấu trúc Cột & Trường dữ liệu theo 3 BẢNG (Cán bộ, Thân nhân, Chuyến đi) -->
          <div v-if="templateSource === 'sample'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 0.76rem; font-weight: 700; color: #475569; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>TÍCH CHỌN CÁC TRƯỜNG DỮ LIỆU THEO BẢNG:</span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-tree-action" @click="selectAllFields">Chọn tất cả</button>
                <button type="button" class="btn-tree-action" @click="deselectAllFields">Bỏ chọn hết</button>
              </div>
            </div>

            <div class="tree-container">
              <!-- BẢNG 1: BẢNG CHÍNH ĐƯỢC XUẤT (Cán bộ / Chuyến đi / Thân nhân / ...) -->
              <div class="tree-table-box">
                <div class="tree-table-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i :class="mainTableIcon" style="color: #2563eb; font-size: 0.95rem;"></i>
                    <span style="font-weight: 700; color: #1e293b; font-size: 0.82rem;">1. Bảng {{ mainTableTitle }} (Hồ sơ chính)</span>
                    <span class="tree-badge-count">({{ selectedFieldIds.length }}/{{ flatMainCols.length }} trường)</span>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn-tree-action" @click="toggleAllMain(true)">Chọn tất cả</button>
                    <button type="button" class="btn-tree-action" @click="toggleAllMain(false)">Bỏ chọn</button>
                  </div>
                </div>
                <div class="tree-fields-inline-wrap" style="padding: 10px 12px;">
                  <label
                    v-for="col in flatMainCols"
                    :key="col.id"
                    class="tree-field-chip"
                    :class="{ 'chip-selected': selectedFieldIds.includes(col.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="col.id"
                      v-model="selectedFieldIds"
                      style="accent-color: #2563eb; cursor: pointer;"
                    />
                    <span>{{ col.label || col.id }}</span>
                  </label>
                </div>
              </div>

              <!-- BẢNG CÁN BỘ LIÊN KẾT (Khi bảng chính không phải cán bộ) -->
              <div v-if="currentTableId !== 'personnel'" class="tree-table-box" style="margin-top: 10px;">
                <div class="tree-table-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;">
                      <input
                        type="checkbox"
                        v-model="includePersonnel"
                        style="accent-color: #2563eb; width: 15px; height: 15px;"
                      />
                      <i class="pi pi-user" style="color: #2563eb; font-size: 0.95rem;"></i>
                      <span style="font-weight: 700; color: #1e40af; font-size: 0.82rem;">2. Bảng {{ personnelTableTitle }} liên quan</span>
                    </label>
                    <span class="tree-badge-count" v-if="includePersonnel">
                      ({{ selectedPersonnelFieldIds.length }}/{{ flatPersonnelCols.length }} trường)
                    </span>
                    <span v-else style="font-size: 0.72rem; color: #94a3b8;">
                      (Bỏ qua cán bộ)
                    </span>
                  </div>
                  <div v-if="includePersonnel" style="display: flex; gap: 6px;">
                    <button type="button" class="btn-tree-action" @click="toggleAllPersonnel(true)">Chọn tất cả</button>
                    <button type="button" class="btn-tree-action" @click="toggleAllPersonnel(false)">Bỏ chọn</button>
                  </div>
                </div>
                <div v-if="includePersonnel" class="tree-fields-inline-wrap" style="padding: 10px 12px;">
                  <label
                    v-for="col in flatPersonnelCols"
                    :key="'p_col_' + col.id"
                    class="tree-field-chip"
                    :class="{ 'chip-selected': selectedPersonnelFieldIds.includes(col.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="col.id"
                      v-model="selectedPersonnelFieldIds"
                      style="accent-color: #2563eb; cursor: pointer;"
                    />
                    <span>{{ col.label || col.id }}</span>
                  </label>
                </div>
              </div>

              <!-- BẢNG THÂN NHÂN LIÊN QUAN (Khi bảng chính không phải thân nhân) -->
              <div v-if="currentTableId !== 'relatives'" class="tree-table-box rel-table-box" style="margin-top: 10px;">
                <div class="tree-table-header rel-table-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;">
                      <input
                        type="checkbox"
                        v-model="includeRelatives"
                        style="accent-color: #7c3aed; width: 15px; height: 15px;"
                      />
                      <i class="pi pi-users" style="color: #7c3aed; font-size: 0.95rem;"></i>
                      <span style="font-weight: 700; color: #6b21a8; font-size: 0.82rem;">{{ currentTableId === 'personnel' ? '2' : '3' }}. Bảng {{ relativeTableTitle }} liên quan</span>
                    </label>
                    <span class="tree-badge-count tree-badge-purple" v-if="includeRelatives">
                      ({{ selectedRelativeFieldIds.length }}/{{ flatRelativeCols.length }} trường)
                    </span>
                    <span v-else style="font-size: 0.72rem; color: #94a3b8;">
                      (Bỏ qua thân nhân)
                    </span>
                  </div>
                  <div v-if="includeRelatives" style="display: flex; gap: 6px;">
                    <button type="button" class="btn-tree-action" @click="toggleAllRelatives(true)">Chọn tất cả</button>
                    <button type="button" class="btn-tree-action" @click="toggleAllRelatives(false)">Bỏ chọn</button>
                  </div>
                </div>
                <div v-if="includeRelatives" class="tree-fields-inline-wrap" style="padding: 10px 12px;">
                  <label
                    v-for="col in flatRelativeCols"
                    :key="'r_col_' + col.id"
                    class="tree-field-chip rel-field-chip"
                    :class="{ 'rel-chip-selected': selectedRelativeFieldIds.includes(col.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="col.id"
                      v-model="selectedRelativeFieldIds"
                      style="accent-color: #7c3aed; cursor: pointer;"
                    />
                    <span>{{ col.label || col.id }}</span>
                  </label>
                </div>
              </div>

              <!-- BẢNG CHUYẾN ĐI (XUẤT NHẬP CẢNH) (Khi bảng chính không phải chuyến đi) -->
              <div v-if="currentTableId !== 'trips'" class="tree-table-box trip-table-box" style="margin-top: 10px;">
                <div class="tree-table-header trip-table-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;">
                      <input
                        type="checkbox"
                        v-model="includeTrips"
                        style="accent-color: #0284c7; width: 15px; height: 15px;"
                      />
                      <i class="pi pi-send" style="color: #0284c7; font-size: 0.95rem;"></i>
                      <span style="font-weight: 700; color: #0369a1; font-size: 0.82rem;">{{ currentTableId === 'personnel' ? '3' : '4' }}. Bảng {{ tripsTableTitle }} (Xuất nhập cảnh)</span>
                    </label>
                    <span class="tree-badge-count" style="background: #e0f2fe; color: #0369a1;" v-if="includeTrips">
                      ({{ selectedTripFieldIds.length }}/{{ flatTripCols.length }} trường)
                    </span>
                    <span v-else style="font-size: 0.72rem; color: #94a3b8;">
                      (Bỏ qua chuyến đi)
                    </span>
                  </div>
                  <div v-if="includeTrips" style="display: flex; gap: 6px;">
                    <button type="button" class="btn-tree-action" @click="toggleAllTrips(true)">Chọn tất cả</button>
                    <button type="button" class="btn-tree-action" @click="toggleAllTrips(false)">Bỏ chọn</button>
                  </div>
                </div>
                <div v-if="includeTrips" class="tree-fields-inline-wrap" style="padding: 10px 12px;">
                  <label
                    v-for="col in flatTripCols"
                    :key="'t_col_' + col.id"
                    class="tree-field-chip trip-field-chip"
                    :class="{ 'chip-selected': selectedTripFieldIds.includes(col.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="col.id"
                      v-model="selectedTripFieldIds"
                      style="accent-color: #0284c7; cursor: pointer;"
                    />
                    <span>{{ col.label || col.id }}</span>
                  </label>
                </div>
              </div>

              <!-- CÁC BẢNG TÙY CHỌN / BẢNG MỚI (DYNAMIC CUSTOM TABLES) -->
              <div
                v-for="(ct, cIdx) in customTables"
                :key="'custom_tbl_' + ct.id"
                class="tree-table-box custom-table-box"
                style="margin-top: 10px;"
              >
                <div class="tree-table-header" style="background: #f0fdf4; border-bottom: 1px solid #bbf7d0;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;">
                      <input
                        type="checkbox"
                        v-model="ct.enabled"
                        style="accent-color: #059669; width: 15px; height: 15px;"
                      />
                      <i class="pi pi-table" style="color: #059669; font-size: 0.95rem;"></i>
                      <span style="font-weight: 700; color: #065f46; font-size: 0.82rem;">{{ 4 + cIdx }}. Bảng {{ ct.title }}</span>
                    </label>
                    <span class="tree-badge-count" style="background: #d1fae5; color: #065f46;" v-if="ct.enabled">
                      ({{ ct.selectedFieldIds.length }}/{{ ct.columns.length }} trường)
                    </span>
                    <span v-else style="font-size: 0.72rem; color: #94a3b8;">
                      (Bỏ qua)
                    </span>
                  </div>
                  <div v-if="ct.enabled" style="display: flex; gap: 6px;">
                    <button type="button" class="btn-tree-action" @click="toggleAllCustomTableFields(ct, true)">Chọn tất cả</button>
                    <button type="button" class="btn-tree-action" @click="toggleAllCustomTableFields(ct, false)">Bỏ chọn</button>
                  </div>
                </div>
                <div v-if="ct.enabled" class="tree-fields-inline-wrap" style="padding: 10px 12px;">
                  <label
                    v-for="col in ct.columns"
                    :key="ct.id + '_' + col.id"
                    class="tree-field-chip"
                    :class="{ 'chip-selected': ct.selectedFieldIds.includes(col.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="col.id"
                      v-model="ct.selectedFieldIds"
                      style="accent-color: #059669; cursor: pointer;"
                    />
                    <span>{{ col.label || col.id }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Nguồn 2: Danh sách Mẫu đã lưu & Tải lên mẫu riêng -->
          <!-- Nguồn 2: Danh sách Mẫu Word (.docx) & Quản lý mẫu chuẩn -->
          <div v-else style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <!-- Header bar quản lý mẫu -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
              <div>
                <div style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i class="pi pi-file-word" style="color: #2563eb;"></i>
                  <span>QUẢN LÝ & CHỌN MẪU WORD (.DOCX):</span>
                </div>
                <div style="font-size: 0.7rem; color: #64748b;">Chọn mẫu để xuất hoặc cài đặt mẫu mặc định cho hệ thống</div>
              </div>

              <div style="display: flex; gap: 6px; align-items: center;">
                <input
                  ref="tplUploadInputRef"
                  type="file"
                  accept=".docx"
                  style="display: none;"
                  @change="handleUploadNewDocxTemplate"
                />
                <Button
                  label="Tải lên Mẫu mới (.docx)"
                  icon="pi pi-cloud-upload"
                  severity="primary"
                  size="small"
                  @click="tplUploadInputRef.click()"
                  style="font-size: 0.74rem; font-weight: 700; padding: 4px 10px;"
                />
                <Button
                  label="Tải Mẫu Chuẩn Gốc"
                  icon="pi pi-download"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="downloadSampleTemplate"
                  style="font-size: 0.74rem; padding: 4px 10px;"
                />
              </div>
            </div>

            <!-- Bảng danh sách các mẫu đã lưu -->
            <div v-if="savedTemplatesList.length > 0" style="border: 1px solid #e2e8f0; border-radius: 6px; background: #ffffff; overflow: hidden; max-height: 220px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 1;">
                  <tr>
                    <th style="padding: 6px 10px; text-align: center; font-weight: 700; color: #475569; width: 45px;">Chọn</th>
                    <th style="padding: 6px 10px; text-align: left; font-weight: 700; color: #475569;">Tên Mẫu Word</th>
                    <th style="padding: 6px 10px; text-align: center; font-weight: 700; color: #475569; width: 130px;">Mặc định</th>
                    <th style="padding: 6px 10px; text-align: center; font-weight: 700; color: #475569; width: 100px;">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="tpl in savedTemplatesList"
                    :key="tpl.id"
                    :style="{ background: selectedSavedTemplateId === tpl.id ? '#eff6ff' : '#ffffff', cursor: 'pointer' }"
                    @click="selectSavedTemplate(tpl)"
                    style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;"
                  >
                    <td style="padding: 6px 10px; text-align: center;" @click.stop>
                      <input
                        type="radio"
                        :value="tpl.id"
                        v-model="selectedSavedTemplateId"
                        @change="selectSavedTemplate(tpl)"
                        style="accent-color: #2563eb; cursor: pointer;"
                      />
                    </td>
                    <td style="padding: 6px 10px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="pi pi-file-word" style="color: #2563eb; font-size: 0.95rem;"></i>
                        <div>
                          <strong style="color: #1e293b;">{{ (tpl.name || '').replace(/\.docx$/i, '') }}</strong>
                          <div style="font-size: 0.68rem; color: #64748b;">{{ tpl.uploadedAt || (tpl.size ? (tpl.size / 1024).toFixed(1) + ' KB' : '') }}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding: 6px 10px; text-align: center;" @click.stop>
                      <span v-if="tpl.isDefault" class="badge-pill badge-blue" style="font-size: 0.68rem; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 9999px;">
                        ⭐ Mặc định
                      </span>
                      <button
                        v-else
                        type="button"
                        @click.stop="setAsDefaultTemplate(tpl.id)"
                        style="font-size: 0.68rem; padding: 2px 6px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; color: #475569; cursor: pointer;"
                        title="Đặt mẫu này làm mặc định khi xuất"
                      >
                        Đặt mặc định
                      </button>
                    </td>
                    <td style="padding: 6px 10px; text-align: center;" @click.stop>
                      <div style="display: flex; justify-content: center; align-items: center; gap: 4px;">
                        <button
                          type="button"
                          @click.stop="downloadSavedTemplate(tpl)"
                          style="background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; color: #0284c7; cursor: pointer;"
                          title="Tải tệp này về máy"
                        >
                          <i class="pi pi-download" style="font-size: 0.72rem;"></i>
                        </button>
                        <button
                          type="button"
                          @click.stop="deleteSavedTemplate(tpl.id)"
                          style="background: none; border: 1px solid #fca5a5; border-radius: 4px; padding: 2px 6px; color: #dc2626; cursor: pointer;"
                          title="Xóa mẫu này"
                        >
                          <i class="pi pi-trash" style="font-size: 0.72rem;"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Khung trống khi chưa có mẫu nào -->
            <div
              v-else
              class="drop-zone"
              @click="tplUploadInputRef.click()"
              style="padding: 20px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; cursor: pointer;"
            >
              <i class="pi pi-cloud-upload" style="font-size: 2rem; color: #3b82f6; margin-bottom: 6px;"></i>
              <div style="font-size: 0.84rem; font-weight: 700; color: #1e293b;">Chưa có Mẫu Word (.docx) nào được tải lên</div>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px;">Bấm vào đây để tải lên tệp mẫu Word chứa các mã tag {tag_id} của bạn</div>
            </div>
          </div>

          <!-- Option checkbox: Ẩn/Hiện tên cột / số thứ tự cột khi xuất PDF -->
          <div style="margin-top: 10px; padding: 6px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; display: flex; align-items: center;">
            <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.76rem; cursor: pointer; color: #475569; user-select: none;">
              <input type="checkbox" v-model="showColumnNumbers" style="accent-color: #0284c7; width: 14px; height: 14px;" />
              <span>Hiển thị số thứ tự / tên cột trong tệp xuất (Mặc định: <strong>Ẩn</strong>)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Khung Tiến độ Xuất hàng loạt ZIP -->
      <div v-if="exporting && progressTotal > 0" class="export-progress-panel">
        <div class="progress-info-row">
          <div class="progress-status-text">
            <i class="pi pi-spin pi-spinner" style="color: #2563eb; margin-right: 6px;"></i>
            <span>Đang tạo tài liệu: <strong>{{ progressCurrent }} / {{ progressTotal }}</strong> hồ sơ {{ mainTableTitle ? mainTableTitle.toLowerCase() : 'bản ghi' }}</span>
          </div>
          <div class="progress-percent-badge">
            {{ Math.round((progressCurrent / progressTotal) * 100) }}%
          </div>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${Math.round((progressCurrent / progressTotal) * 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 0.6rem; padding-top: 0.8rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap;">
        <Button
          label="Đóng"
          size="small"
          @click="visible = false"
          class="btn-close-custom"
          :disabled="exporting || previewingPdf"
        />

        <Button
          v-if="outputFormat === 'pdf'"
          label="Xem trước PDF"
          icon="pi pi-eye"
          size="small"
          severity="info"
          outlined
          :loading="previewingPdf"
          @click="handlePreviewPdf"
          :disabled="!effectiveTemplateBuffer || exporting || previewingPdf"
          style="font-size: 0.82rem; font-weight: 600; padding: 7px 16px; border-radius: 8px;"
        />

        <Button
          :label="getDownloadButtonLabel()"
          :icon="outputFormat === 'pdf' ? 'pi pi-file-pdf' : 'pi pi-download'"
          size="small"
          :loading="exporting"
          @click="handleExport"
          class="btn-download-primary"
          :disabled="!effectiveTemplateBuffer || exporting || previewingPdf"
        />
      </div>
    </div>
  </Dialog>

  <!-- Popup Xem trước PDF -->
  <PdfPreviewDialog
    v-model="showPdfPreview"
    :pdf-blob="previewPdfBlob"
    :title="previewPdfTitle"
    :filename="previewPdfFileName"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import { saveAs } from 'file-saver';
import {
  exportSinglePersonnelDocx,
  exportMultiplePersonnelZip,
  generateSinglePersonnelPdfBlob,
  createDynamicDocxTemplateBlob,
} from '@/utils/docxExport';
import PdfPreviewDialog from '@/components/common/PdfPreviewDialog.vue';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { findUnifiedTable } from '@/utils/tableRegistry';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  targetPerson: { type: Object, default: null },
  selectedPersonnel: { type: Array, default: () => [] },
  allPersonnel: { type: Array, default: () => [] },
  tableId: { type: String, default: 'personnel' },
  columns: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const outputFormat = ref('pdf');
const exportScope = ref('single');
const templateSource = ref('sample'); // 'sample' (Group) | 'upload'

const currentTableId = computed(() => {
  if (props.tableId) return props.tableId;
  const p = props.targetPerson;
  if (p?._tableId) return p._tableId;
  if (p?._recordType === 'trip') return 'trips';
  if (p?._recordType === 'relative') return 'relatives';
  return 'personnel';
});

const getTargetPersonDisplayName = (p) => {
  if (!p) return 'Bản ghi';
  const cols = props.columns?.length > 0 ? props.columns : [];
  const titleCol = cols.find((c) => c.isTitle);
  if (titleCol && (p[titleCol.id] || p.custom_data?.[titleCol.id])) {
    return p[titleCol.id] || p.custom_data?.[titleCol.id];
  }
  const pNameField = personnelStore?.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  const name = p[pNameField] || p.name || p.title || p.countryName || p.relativeName || p.ho_ten || p.fullName;
  if (name) return name;
  return 'Bản ghi';
};

const getTargetPersonCode = (p) => {
  if (!p) return '';
  const cols = props.columns?.length > 0 ? props.columns : [];
  const keyCol = cols.find((c) => c.isKey);
  if (keyCol && (p[keyCol.id] || p.custom_data?.[keyCol.id])) {
    return String(p[keyCol.id] || p.custom_data?.[keyCol.id]);
  }
  return p.code || p.personnelCode || (p.id ? String(p.id) : '');
};

// Dynamic titles cho các bảng chính theo Cài đặt hệ thống
const personnelTableTitle = computed(() => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const p = JSON.parse(local);
      if (p.menuLabelPersonnel && p.menuLabelPersonnel !== 'Bảng dữ liệu chính') return p.menuLabelPersonnel;
    }
  } catch (e) {}
  return 'Cán bộ';
});

const relativeTableTitle = computed(() => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const p = JSON.parse(local);
      if (p.menuLabelRelatives) return p.menuLabelRelatives;
    }
  } catch (e) {}
  return 'Thân nhân';
});

const tripsTableTitle = computed(() => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const p = JSON.parse(local);
      if (p.menuLabelTrips) return p.menuLabelTrips;
    }
  } catch (e) {}
  return 'Chuyến đi';
});

const mainTableTitle = computed(() => {
  const tId = currentTableId.value;
  if (tId === 'trips') return tripsTableTitle.value;
  if (tId === 'relatives') return relativeTableTitle.value;
  if (tId === 'personnel') return personnelTableTitle.value;
  const t = findUnifiedTable(tId, { personnelStore });
  return t?.title || 'Dữ liệu';
});

const mainTableIcon = computed(() => {
  const tId = currentTableId.value;
  if (tId === 'trips') return 'pi pi-send';
  if (tId === 'relatives') return 'pi pi-users';
  if (tId === 'personnel') return 'pi pi-user';
  return 'pi pi-table';
});

const dialogTitle = computed(() => {
  const fmt = outputFormat.value.toUpperCase();
  return `Xuất ${mainTableTitle.value} (${fmt})`;
});

// Group & Field selector state (Dạng phân cấp Tree)
const selectedFieldIds = ref([]);
const selectedPersonnelFieldIds = ref([]);
const selectedRelativeFieldIds = ref([]);
const selectedTripFieldIds = ref([]);

const includePersonnel = ref(true);
const includeRelatives = ref(true);
const includeTrips = ref(true);

const customTables = ref([]);

const loadCustomTables = async () => {
  try {
    let raw = await getAppSettings('custom_dashboards_config');
    if (!raw) {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) raw = JSON.parse(local);
    }
    if (Array.isArray(raw)) {
      const tables = [];
      for (const dash of raw) {
        if (!dash || !dash.id) continue;
        // Bỏ qua các bảng chuẩn đã có sẵn ở Bảng 1, Bảng 2, Bảng 3
        if (
          dash.id === 'trips' ||
          dash.id === 'personnel' ||
          dash.id === 'relatives' ||
          dash.source === 'trips' ||
          dash.source === 'personnel' ||
          dash.source === 'relatives'
        ) {
          continue;
        }
        let cols = [];
        if (Array.isArray(dash.customColumns) && dash.customColumns.length > 0) {
          cols = dash.customColumns.map((c) => ({ id: c.id, label: c.label || c.id }));
        } else if (dash.source === 'blank') {
          cols = [
            { id: 'title', label: 'Tiêu đề / Tên' },
            { id: 'status', label: 'Trạng thái' },
            { id: 'notes', label: 'Ghi chú' },
            { id: 'createdAt', label: 'Ngày tạo' },
          ];
        } else if (Array.isArray(dash.columns) && dash.columns.length > 0) {
          cols = dash.columns.map((c) => (typeof c === 'string' ? { id: c, label: c } : { id: c.id, label: c.label || c.id }));
        }
        if (cols.length > 0) {
          let rows = [];
          if (dash.source === 'blank') {
            try {
              const r = await getAppSettings(`custom_table_rows_${dash.id}`);
              rows = r || JSON.parse(localStorage.getItem(`custom_table_rows_${dash.id}`) || '[]');
            } catch (e) {}
          }
          tables.push({
            id: dash.id,
            title: dash.title || dash.name || ('Bảng ' + (dash.code || dash.id)),
            source: dash.source || 'blank',
            enabled: true,
            columns: cols,
            selectedFieldIds: cols.map((c) => c.id),
            rows,
          });
        }
      }
      customTables.value = tables;
    }
  } catch (e) {
    console.error('Failed to load custom tables for export:', e);
  }
};

const toggleAllCustomTableFields = (ct, selectAll = true) => {
  if (selectAll) {
    ct.selectedFieldIds = ct.columns.map((c) => c.id);
  } else {
    ct.selectedFieldIds = [];
  }
};

const selectedGroupIndices = ref([0, 1, 2, 3, 4, 5]);
const selectedRelativeGroupIndices = ref([0, 1, 2, 3, 4, 5]);

const personnelGroups = computed(() => personnelStore.importMappingPersonnel || []);
const otherPersonnelGroups = computed(() => personnelGroups.value.slice(1));
const relativeGroups = computed(() => personnelStore.importMappingRelative || []);
const tripsGroups = computed(() => personnelStore.importMappingTrips || []);

const flatPersonnelCols = computed(() => {
  const list = [];
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !list.some((x) => x.id === c.id)) {
        list.push(c);
      }
    });
  });
  return list;
});

const flatRelativeCols = computed(() => {
  const list = [];
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !list.some((x) => x.id === c.id)) {
        list.push(c);
      }
    });
  });
  return list;
});

const flatTripCols = computed(() => {
  const list = [];
  (tripsGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && !list.some((x) => x.id === c.id)) {
        list.push(c);
      }
    });
  });
  return list;
});

const flatMainCols = computed(() => {
  if (props.columns && props.columns.length > 0) {
    return props.columns.filter((c) => c.id && c.id !== 'stt');
  }
  if (currentTableId.value === 'trips') return flatTripCols.value;
  if (currentTableId.value === 'relatives') return flatRelativeCols.value;
  return flatPersonnelCols.value;
});

const toggleAllMain = (selectAll = true) => {
  if (selectAll) {
    selectedFieldIds.value = flatMainCols.value.map((c) => c.id);
  } else {
    selectedFieldIds.value = [];
  }
};

const toggleAllPersonnel = (selectAll = true) => {
  if (selectAll) {
    selectedPersonnelFieldIds.value = flatPersonnelCols.value.map((c) => c.id);
  } else {
    selectedPersonnelFieldIds.value = [];
  }
};

const toggleAllRelatives = (selectAll = true) => {
  if (selectAll) {
    selectedRelativeFieldIds.value = flatRelativeCols.value.map((c) => c.id);
  } else {
    selectedRelativeFieldIds.value = [];
  }
};

const toggleAllTrips = (selectAll = true) => {
  if (selectAll) {
    selectedTripFieldIds.value = flatTripCols.value.map((c) => c.id);
  } else {
    selectedTripFieldIds.value = [];
  }
};

const initAllFields = () => {
  selectedFieldIds.value = flatMainCols.value.map((c) => c.id);
  selectedPersonnelFieldIds.value = flatPersonnelCols.value.map((c) => c.id);
  selectedRelativeFieldIds.value = flatRelativeCols.value.map((c) => c.id);
  selectedTripFieldIds.value = flatTripCols.value.map((c) => c.id);
};

const selectAllFields = () => {
  initAllFields();
  includePersonnel.value = true;
  includeRelatives.value = true;
  includeTrips.value = true;
  customTables.value.forEach((ct) => {
    ct.enabled = true;
    ct.selectedFieldIds = ct.columns.map((c) => c.id);
  });
};

const deselectAllFields = () => {
  selectedFieldIds.value = [];
  selectedPersonnelFieldIds.value = [];
  selectedRelativeFieldIds.value = [];
  selectedTripFieldIds.value = [];
  customTables.value.forEach((ct) => {
    ct.enabled = false;
    ct.selectedFieldIds = [];
  });
};

const getGroupTotalCount = (grp) => {
  return (grp.columns || []).filter((c) => c.id && c.id !== 'stt').length;
};

const getGroupSelectedCount = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  return cols.filter((c) => selectedFieldIds.value.includes(c.id)).length;
};

const isGroupAllSelected = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  return cols.every((c) => selectedFieldIds.value.includes(c.id));
};

const isGroupSomeSelected = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  const count = cols.filter((c) => selectedFieldIds.value.includes(c.id)).length;
  return count > 0 && count < cols.length;
};

const toggleGroup = (grp) => {
  const cols = (grp.columns || []).filter((c) => c.id && c.id !== 'stt');
  const allSel = isGroupAllSelected(grp);
  if (allSel) {
    selectedFieldIds.value = selectedFieldIds.value.filter((id) => !cols.some((c) => c.id === id));
  } else {
    const toAdd = cols.map((c) => c.id).filter((id) => !selectedFieldIds.value.includes(id));
    selectedFieldIds.value = [...selectedFieldIds.value, ...toAdd];
  }
};

const getRelGroupTotalCount = (rGrp) => {
  return (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt').length;
};

const getRelGroupSelectedCount = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  return cols.filter((c) => selectedRelativeFieldIds.value.includes(c.id)).length;
};

const isRelGroupAllSelected = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  return cols.every((c) => selectedRelativeFieldIds.value.includes(c.id));
};

const isRelGroupSomeSelected = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  const count = cols.filter((c) => selectedRelativeFieldIds.value.includes(c.id)).length;
  return count > 0 && count < cols.length;
};

const toggleRelGroup = (rGrp) => {
  const cols = (rGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  const allSel = isRelGroupAllSelected(rGrp);
  if (allSel) {
    selectedRelativeFieldIds.value = selectedRelativeFieldIds.value.filter((id) => !cols.some((c) => c.id === id));
  } else {
    const toAdd = cols.map((c) => c.id).filter((id) => !selectedRelativeFieldIds.value.includes(id));
    selectedRelativeFieldIds.value = [...selectedRelativeFieldIds.value, ...toAdd];
  }
};

const getTripGroupTotalCount = (tGrp) => {
  return (tGrp.columns || []).filter((c) => c.id && c.id !== 'stt').length;
};

const getTripGroupSelectedCount = (tGrp) => {
  const cols = (tGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  return cols.filter((c) => selectedTripFieldIds.value.includes(c.id)).length;
};

const isTripGroupAllSelected = (tGrp) => {
  const cols = (tGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  if (cols.length === 0) return false;
  return cols.every((c) => selectedTripFieldIds.value.includes(c.id));
};

const toggleTripGroup = (tGrp) => {
  const cols = (tGrp.columns || []).filter((c) => c.id && c.id !== 'stt');
  const allSel = isTripGroupAllSelected(tGrp);
  if (allSel) {
    selectedTripFieldIds.value = selectedTripFieldIds.value.filter((id) => !cols.some((c) => c.id === id));
  } else {
    const toAdd = cols.map((c) => c.id).filter((id) => !selectedTripFieldIds.value.includes(id));
    selectedTripFieldIds.value = [...selectedTripFieldIds.value, ...toAdd];
  }
};

const getCleanGroupName = (grp, gIdx) => {
  let raw = grp.group || `Nhóm cột ${gIdx + 1}`;
  raw = raw.replace(/^Khối\s+[A-Z0-9]+[:\s-]*/i, '').trim();
  return `Khối ${String.fromCharCode(65 + gIdx)}: ${raw}`;
};

const getCleanRelGroupName = (rGrp, rIdx) => {
  let raw = rGrp.group || `Nhóm thân nhân ${rIdx + 1}`;
  raw = raw.replace(/^Khối\s+TN\s+\d+[:\s-]*/i, '').trim();
  return `Khối TN ${rIdx + 1}: ${raw}`;
};

const getPersonnelColNum = (gIdx, cIdx) => {
  let count = 0;
  for (let i = 0; i < gIdx; i++) {
    const cols = (personnelGroups.value[i]?.columns || []).filter((c) => c.id && c.id !== 'stt');
    count += cols.length;
  }
  return count + cIdx + 1;
};

const getRelativeColNum = (rIdx, cIdx) => {
  let count = 0;
  for (let i = 0; i < rIdx; i++) {
    const cols = (relativeGroups.value[i]?.columns || []).filter((c) => c.id && c.id !== 'stt');
    count += cols.length;
  }
  return count + cIdx + 1;
};

const getCleanFieldLabel = (col, num) => {
  let label = col.label || col.id;
  label = label.replace(/\s*\(\d+\)$/, '').trim();
  return `${label} (${num})`;
};

const fileInputRef = ref(null);
const sampleTemplateBuffer = ref(null);
const customTemplateBuffer = ref(null);
const customTemplateFileName = ref('');

const exporting = ref(false);
const showColumnNumbers = ref(false);
const progressCurrent = ref(0);
const progressTotal = ref(0);

const selectedCount = computed(() => props.selectedPersonnel?.length || 0);
const totalPersonnelCount = computed(() => {
  if (props.allPersonnel && props.allPersonnel.length > 0) return props.allPersonnel.length;
  if (currentTableId.value === 'trips') return personnelStore.tripsList?.length || 0;
  if (currentTableId.value === 'relatives') return personnelStore.relativesList?.length || 0;
  return personnelStore.personnelList.length;
});

const effectiveTemplateBuffer = computed(() => {
  if (templateSource.value === 'upload') {
    if (customTemplateBuffer.value) {
      return customTemplateBuffer.value;
    }
    if (defaultSavedTemplate.value?.base64) {
      return base64ToArrayBuffer(defaultSavedTemplate.value.base64);
    }
  }
  // Khi ở tab 'sample' (Theo Bảng Dữ Liệu):
  // 100% sử dụng mẫu động theo đúng danh mục cột và liên kết được tích chọn
  return sampleTemplateBuffer.value;
});

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
};

const savedTemplatesList = ref([]);
const selectedSavedTemplateId = ref('');

const defaultSavedTemplate = computed(() => {
  return (savedTemplatesList.value || []).find((t) => t.isDefault && t.base64);
});

const selectSavedTemplate = (tpl) => {
  if (!tpl.base64) return;
  selectedSavedTemplateId.value = tpl.id;
  customTemplateBuffer.value = base64ToArrayBuffer(tpl.base64);
  customTemplateFileName.value = tpl.name;
};

const loadSavedTemplate = async () => {
  try {
    const list = await getAppSettings('system_docx_templates', []);
    if (Array.isArray(list) && list.length > 0) {
      savedTemplatesList.value = list;
      const defaultTpl = list.find((t) => t.isDefault && t.base64);
      if (defaultTpl) {
        selectSavedTemplate(defaultTpl);
      }
    }
  } catch (err) { console.warn('Failed to load saved template:', err); }
};

const loadSampleTemplate = async () => {
  try {
    const activeIndices = (personnelGroups.value || []).map((_, i) => i);
    const activeRelIndices = (relativeGroups.value || []).map((_, i) => i);
    const blob = await createDynamicDocxTemplateBlob(
      activeIndices,
      personnelGroups.value,
      includeRelatives.value,
      activeRelIndices,
      relativeGroups.value,
      selectedFieldIds.value,
      selectedRelativeFieldIds.value,
      {
        tableId: currentTableId.value,
        columns: flatMainCols.value,
        includePersonnel: includePersonnel.value,
        selectedPersonnelFieldIds: selectedPersonnelFieldIds.value,
        tableTitles: {
          personnel: personnelTableTitle.value,
          relatives: relativeTableTitle.value,
          trips: tripsTableTitle.value,
          main: mainTableTitle.value,
        },
        showColumnNumbers: showColumnNumbers.value,
        customTables: customTables.value.filter((t) => t.enabled && t.selectedFieldIds.length > 0),
      },
      includeTrips.value,
      selectedTripFieldIds.value,
      tripsGroups.value
    );
    sampleTemplateBuffer.value = await blob.arrayBuffer();
  } catch (e) {
    console.error('Failed to generate dynamic group template:', e);
  }
};

watch(
  () => [
    selectedFieldIds.value,
    includePersonnel.value,
    selectedPersonnelFieldIds.value,
    includeRelatives.value,
    selectedRelativeFieldIds.value,
    includeTrips.value,
    selectedTripFieldIds.value,
    customTables.value,
  ],
  () => {
    loadSampleTemplate();
  },
  { deep: true }
);

watch(() => [props.modelValue], ([isOpen]) => {
  if (isOpen) {
    templateSource.value = 'sample'; // Mặc định luôn mở tab Theo Nhóm Cột (Group)
    if (props.targetPerson) exportScope.value = 'single';
    else if (selectedCount.value > 0) exportScope.value = 'selected';
    else exportScope.value = 'all';
    if (selectedFieldIds.value.length === 0) {
      initAllFields();
    }
    loadCustomTables();
    loadSampleTemplate();
    loadSavedTemplate();
  }
});

const setTemplateSource = (src) => {
  templateSource.value = src;
  if (src === 'upload' && !customTemplateBuffer.value) triggerFileInput();
};

const triggerFileInput = () => fileInputRef.value?.click();

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  customTemplateFileName.value = file.name;
  templateSource.value = 'upload';
  const reader = new FileReader();
  reader.onload = async (event) => {
    customTemplateBuffer.value = event.target.result;
    const b64 = arrayBufferToBase64(event.target.result);
    localStorage.setItem('cached_custom_docx_template', b64);
    localStorage.setItem('cached_custom_docx_name', file.name);
    await saveAppSettings('custom_docx_template', { fileName: file.name, base64: b64 });

    const newTpl = {
      id: 'tpl_' + Date.now(),
      name: file.name,
      size: file.size,
      base64: b64,
      isDefault: false,
      uploadedAt: new Date().toLocaleString('vi-VN'),
    };
    const updated = [...savedTemplatesList.value.filter((t) => t.name !== file.name), newTpl];
    savedTemplatesList.value = updated;
    selectedSavedTemplateId.value = newTpl.id;
    await saveAppSettings('system_docx_templates', updated);
  };
  reader.readAsArrayBuffer(file);
};

const tplUploadInputRef = ref(null);

const handleUploadNewDocxTemplate = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const b64 = arrayBufferToBase64(e.target.result);
      const newTpl = {
        id: 'tpl_' + Date.now(),
        name: file.name,
        size: file.size,
        base64: b64,
        isDefault: (savedTemplatesList.value || []).length === 0,
        uploadedAt: new Date().toLocaleString('vi-VN'),
      };
      const updated = [...(savedTemplatesList.value || []), newTpl];
      savedTemplatesList.value = updated;
      await saveAppSettings('system_docx_templates', updated);
      selectSavedTemplate(newTpl);
    } catch (err) {
      alert('Lỗi lưu mẫu: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = '';
};

const setAsDefaultTemplate = async (templateId) => {
  const updated = (savedTemplatesList.value || []).map((t) => ({
    ...t,
    isDefault: t.id === templateId,
  }));
  savedTemplatesList.value = updated;
  await saveAppSettings('system_docx_templates', updated);
};

const deleteSavedTemplate = async (templateId) => {
  const tpl = (savedTemplatesList.value || []).find((t) => t.id === templateId);
  const name = tpl?.name || 'mẫu này';
  if (!confirm(`Bạn có chắc chắn muốn xóa tệp mẫu "${name}" khỏi hệ thống không?`)) return;
  const updated = (savedTemplatesList.value || []).filter((t) => t.id !== templateId);
  savedTemplatesList.value = updated;
  await saveAppSettings('system_docx_templates', updated);
  if (selectedSavedTemplateId.value === templateId) {
    if (updated.length > 0) {
      selectSavedTemplate(updated[0]);
    } else {
      selectedSavedTemplateId.value = '';
      customTemplateBuffer.value = null;
      customTemplateFileName.value = '';
    }
  }
};

const downloadSavedTemplate = (tpl) => {
  if (!tpl.base64) return;
  const byteCharacters = atob(tpl.base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, tpl.name || 'Mau_Word.docx');
};

const downloadSampleTemplate = async () => {
  try {
    const buf = effectiveTemplateBuffer.value;
    if (!buf) return alert('Chưa có mẫu nào được khởi tạo!');
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, templateSource.value === 'upload' ? (customTemplateFileName.value || 'Mau_Word_tuy_bien.docx') : 'Mau_Word_Theo_Nhom_Cot.docx');
  } catch (e) { alert('Lỗi tạo mẫu Word: ' + e.message); }
};

const getDownloadButtonLabel = () => {
  const isSingle = exportScope.value === 'single' || (exportScope.value === 'selected' && selectedCount.value === 1);

  if (exporting.value && progressTotal.value > 0) {
    const pct = Math.round((progressCurrent.value / progressTotal.value) * 100);
    return `Đang xuất PDF ${progressCurrent.value}/${progressTotal.value} (${pct}%)...`;
  }

  if (isSingle) {
    const targetP = (exportScope.value === 'single' && props.targetPerson)
      ? props.targetPerson
      : (props.selectedPersonnel && props.selectedPersonnel.length > 0 ? props.selectedPersonnel[0] : null);
    const pName = getTargetPersonDisplayName(targetP);
    return `Tải về file PDF: ${pName}`;
  }
  return `Tải file ZIP PDF (${exportScope.value === 'selected' ? selectedCount.value : totalPersonnelCount.value} ${mainTableTitle.value || 'bản ghi'})`;
};

const handleExport = async () => {
  const buf = effectiveTemplateBuffer.value;
  if (!buf) return alert('Vui lòng chọn hoặc tải lên tệp mẫu Word (.docx)');
  exporting.value = true;
  progressCurrent.value = 0;
  try {
    const exportOptions = {
      tableId: currentTableId.value,
      columns: flatMainCols.value,
      selectedGroupIndices: (personnelGroups.value || []).map((_, i) => i),
      includePersonnel: includePersonnel.value,
      selectedPersonnelFieldIds: selectedPersonnelFieldIds.value,
      includeRelatives: includeRelatives.value,
      selectedRelativeGroupIndices: (relativeGroups.value || []).map((_, i) => i),
      selectedFieldIds: selectedFieldIds.value,
      selectedRelativeFieldIds: selectedRelativeFieldIds.value,
      includeTrips: includeTrips.value,
      selectedTripFieldIds: selectedTripFieldIds.value,
      showColumnNumbers: showColumnNumbers.value,
      customTables: customTables.value.filter((t) => t.enabled && t.selectedFieldIds.length > 0).map((t) => ({
        id: t.id,
        title: t.title,
        source: t.source,
        selectedFieldIds: t.selectedFieldIds,
        columns: t.columns,
        rows: t.rows,
      })),
      tableTitles: {
        personnel: personnelTableTitle.value,
        relatives: relativeTableTitle.value,
        trips: tripsTableTitle.value,
        main: mainTableTitle.value,
      },
    };
    const isSingle = exportScope.value === 'single' || (exportScope.value === 'selected' && selectedCount.value === 1);
    const targetP = (exportScope.value === 'single' && props.targetPerson) ? props.targetPerson : (exportScope.value === 'selected' && selectedCount.value === 1 ? props.selectedPersonnel[0] : null);
    if (isSingle && targetP) {
      const pName = getTargetPersonDisplayName(targetP);
      const pCode = getTargetPersonCode(targetP);
      const fileName = `Ho_so_${(pName || 'Ban_ghi').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}${pCode ? '_' + pCode : ''}`;
      await exportSinglePersonnelDocx(buf, targetP, fileName, personnelStore, outputFormat.value, authStore.user, exportOptions);
      visible.value = false;
    } else {
      let list = exportScope.value === 'selected'
        ? props.selectedPersonnel
        : (props.allPersonnel?.length > 0
            ? props.allPersonnel
            : (currentTableId.value === 'trips'
                ? personnelStore.tripsList
                : (currentTableId.value === 'relatives'
                    ? personnelStore.relativesList
                    : personnelStore.personnelList)));
      if (!list?.length) return alert(`Không có dữ liệu ${mainTableTitle.value || 'bản ghi'}!`);
      progressTotal.value = list.length;
      const zipName = `Ho_so_${list.length}_${(currentTableId.value || 'ban_ghi')}.zip`;
      await exportMultiplePersonnelZip(buf, list, zipName, personnelStore, (curr, total) => { progressCurrent.value = curr; progressTotal.value = total; }, outputFormat.value, authStore.user, exportOptions);
      visible.value = false;
    }
  } catch (error) { alert('Lỗi: ' + (error.message || error)); } finally { exporting.value = false; }
};

const showPdfPreview = ref(false);
const previewPdfBlob = ref(null);
const previewPdfTitle = ref('');
const previewPdfFileName = ref('');
const previewingPdf = ref(false);

const handlePreviewPdf = async () => {
  const buf = effectiveTemplateBuffer.value;
  if (!buf) return alert('Vui lòng chọn hoặc tải lên tệp mẫu Word (.docx)');
  const targetP = (exportScope.value === 'single' && props.targetPerson)
    ? props.targetPerson
    : (props.selectedPersonnel?.length > 0
      ? props.selectedPersonnel[0]
      : (props.allPersonnel?.length > 0 ? props.allPersonnel[0] : props.targetPerson));
  if (!targetP) return alert(`Không tìm thấy bản ghi nào để xem trước. Vui lòng kiểm tra lại danh sách ${mainTableTitle.value || 'bản ghi'}.`);

  previewingPdf.value = true;
  try {
    const exportOptions = {
      tableId: currentTableId.value,
      columns: flatMainCols.value,
      selectedGroupIndices: (personnelGroups.value || []).map((_, i) => i),
      includePersonnel: includePersonnel.value,
      selectedPersonnelFieldIds: selectedPersonnelFieldIds.value,
      includeRelatives: includeRelatives.value,
      selectedRelativeGroupIndices: (relativeGroups.value || []).map((_, i) => i),
      selectedFieldIds: selectedFieldIds.value,
      selectedRelativeFieldIds: selectedRelativeFieldIds.value,
      includeTrips: includeTrips.value,
      selectedTripFieldIds: selectedTripFieldIds.value,
      showColumnNumbers: showColumnNumbers.value,
      customTables: customTables.value.filter((t) => t.enabled && t.selectedFieldIds.length > 0).map((t) => ({
        id: t.id,
        title: t.title,
        source: t.source,
        selectedFieldIds: t.selectedFieldIds,
        columns: t.columns,
        rows: t.rows,
      })),
      tableTitles: {
        personnel: personnelTableTitle.value,
        relatives: relativeTableTitle.value,
        trips: tripsTableTitle.value,
        main: mainTableTitle.value,
      },
    };
    const pName = getTargetPersonDisplayName(targetP);
    const pCode = getTargetPersonCode(targetP);
    const blob = await generateSinglePersonnelPdfBlob(buf, targetP, personnelStore, authStore.user, exportOptions);
    previewPdfBlob.value = blob;
    previewPdfTitle.value = `Hồ sơ: ${pName}${pCode ? ' (' + pCode + ')' : ''}`;
    previewPdfFileName.value = `Ho_so_${(pName || 'Ban_ghi').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.pdf`;
    showPdfPreview.value = true;
  } catch (err) {
    console.error('Lỗi tạo bản xem trước PDF:', err);
    alert('Không thể tạo bản xem trước PDF: ' + (err.message || 'Lỗi không xác định'));
  } finally {
    previewingPdf.value = false;
  }
};

onMounted(() => {
  initAllFields();
  loadCustomTables();
  loadSampleTemplate();
  loadSavedTemplate();
});
</script>

<style scoped>
.docx-export-container {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.25rem;
  max-height: calc(82vh - 80px);
  overflow-y: auto;
  scrollbar-width: thin;
}

.tpl-src-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  transition: all 0.15s ease;
}

.tpl-src-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.tpl-src-active {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
}

.export-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
}

.box-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s ease;
}

.radio-item:hover {
  background: #f1f5f9;
}

.radio-active {
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 #f1f5f9;
}
.tree-container::-webkit-scrollbar {
  width: 6px;
}
.tree-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.tree-container::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
}

.btn-tree-action {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.btn-tree-action:hover {
  color: #1d4ed8;
}

.tree-root-header {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tree-header-personnel {
  background: #eff6ff;
  color: #1e40af;
}
.tree-header-relative {
  background: #faf5ff;
  color: #6b21a8;
}

.tree-badge-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.tree-badge-purple {
  color: #7c3aed;
  background: #faf5ff;
}

.tree-group-box {
  margin-left: 12px; /* Thụt vô Group A, B */
  border-left: 2px solid #bfdbfe;
  padding-left: 8px;
  margin-bottom: 6px;
}
.rel-group-box {
  border-left-color: #e9d5ff;
}

.tree-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #1e293b;
  padding: 3px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.tree-group-header:hover {
  background: #e2e8f0;
}
.tree-table-box {
  background: #ffffff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}
.rel-table-box {
  border-color: #e9d5ff;
}
.trip-table-box {
  border-color: #bae6fd;
}
.tree-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 10px;
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
}
.rel-table-header {
  background: #faf5ff;
  border-bottom-color: #f3e8ff;
}
.trip-table-header {
  background: #f0f9ff;
  border-bottom-color: #e0f2fe;
}

.tree-fields-inline-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  padding: 8px 10px;
  background: #ffffff;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}
.tree-fields-inline-wrap::-webkit-scrollbar {
  width: 5px;
}
.tree-fields-inline-wrap::-webkit-scrollbar-track {
  background: #f8fafc;
}
.tree-fields-inline-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.tree-field-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.74rem;
  color: #334155;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.1s ease;
  user-select: none;
}
.tree-field-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}
.chip-selected {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
  font-weight: 600;
}
.rel-field-chip:hover {
  background: #faf5ff;
  border-color: #d8b4fe;
}
.rel-chip-selected {
  background: #faf5ff;
  border-color: #e9d5ff;
  color: #7e22ce;
  font-weight: 600;
}

.drop-zone {
  border: 2px dashed #93c5fd;
  border-radius: 8px;
  padding: 1.25rem 1rem;
  text-align: center;
  background: #f0f9ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drop-zone:hover {
  background: #e0f2fe;
  border-color: #2563eb;
}

.file-loaded-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
}

.btn-close-custom {
  background: #ffffff !important;
  color: #475569 !important;
  border: 1px solid #cbd5e1 !important;
  font-weight: 600 !important;
  padding: 7px 16px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
}

.btn-close-custom:hover {
  background: #f1f5f9 !important;
  color: #1e293b !important;
  border-color: #94a3b8 !important;
}

.btn-download-primary {
  background: #2563eb !important;
  color: #ffffff !important;
  border: 1px solid #2563eb !important;
  font-weight: 700 !important;
  padding: 7px 20px !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35) !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.btn-download-primary:hover:not(:disabled) {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45) !important;
}

.btn-download-primary:disabled {
  background: #94a3b8 !important;
  border-color: #94a3b8 !important;
  color: #ffffff !important;
  opacity: 0.65 !important;
  box-shadow: none !important;
  cursor: not-allowed !important;
}

.export-progress-panel {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
}

.progress-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-status-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
}

.progress-percent-badge {
  font-size: 0.78rem;
  font-weight: 800;
  color: #2563eb;
  background: #ffffff;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: #dbeafe;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.25s ease;
}
</style>
