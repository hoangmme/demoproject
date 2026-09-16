<template>
  <Dialog
    :visible="visible"
    @update:visible="val => $emit('update:visible', val)"
    modal
    :closable="!importing"
    :dismissableMask="false"
    :style="{ width: currentStep === 2 ? '95vw' : '850px', maxWidth: '1400px' }"
    :header="false"
    class="import-wizard-dialog"
  >
    <div class="wizard-container">
      <!-- 1. WIZARD HEADER & STEPPER -->
      <div class="wizard-header">
        <div class="wizard-title-bar">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-prefix">NX-10</span>
            <h2 class="wizard-title">Nhập dữ liệu từ Excel</h2>
          </div>
          <button v-if="!importing" class="btn-close-wizard" @click="closeWizard" title="Đóng">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Stepper -->
        <div class="stepper-bar">
          <div class="step-item" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
            <span class="step-circle"><i v-if="currentStep > 1" class="pi pi-check"></i><template v-else>1</template></span>
            <span class="step-label">Chọn tệp</span>
          </div>
          <div class="step-divider" :class="{ completed: currentStep > 1 }"></div>

          <div class="step-item" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
            <span class="step-circle"><i v-if="currentStep > 2" class="pi pi-check"></i><template v-else>2</template></span>
            <span class="step-label">Xem trước và sửa</span>
          </div>
          <div class="step-divider" :class="{ completed: currentStep > 2 }"></div>

          <div class="step-item" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
            <span class="step-circle"><i v-if="currentStep > 3" class="pi pi-check"></i><template v-else>3</template></span>
            <span class="step-label">Xác nhận</span>
          </div>
          <div class="step-divider" :class="{ completed: currentStep > 3 }"></div>

          <div class="step-item" :class="{ active: currentStep === 4, completed: currentStep === 4 }">
            <span class="step-circle"><i v-if="currentStep === 4" class="pi pi-check"></i><template v-else>4</template></span>
            <span class="step-label">Kết quả</span>
          </div>
        </div>
      </div>

      <!-- 2. WIZARD BODY -->
      <div class="wizard-body">
        <!-- ========================================================================= -->
        <!-- BƯỚC 1: CHỌN TỆP & THIẾT LẬP IMPORT -->
        <!-- ========================================================================= -->
        <div v-if="currentStep === 1" class="step-content step-1-content">
          <!-- 1A. Chọn Bảng Đích -->
          <div class="form-section">
            <label class="section-label">1. Chọn loại dữ liệu cần nhập:</label>
            <div class="target-type-selector">
              <div
                class="target-card"
                :class="{ selected: targetEntity === 'personnel' }"
                @click="targetEntity = 'personnel'"
              >
                <div class="target-icon bg-blue"><i class="pi pi-user"></i></div>
                <div class="target-info">
                  <div class="target-title">Hồ sơ Cán bộ (Cá nhân)</div>
                  <div class="target-sub">Thông tin cá nhân, chức vụ, đơn vị, CCCD</div>
                </div>
                <i v-if="targetEntity === 'personnel'" class="pi pi-check-circle check-icon"></i>
              </div>

              <div
                class="target-card"
                :class="{ selected: targetEntity === 'relative' }"
                @click="targetEntity = 'relative'"
              >
                <div class="target-icon bg-green"><i class="pi pi-users"></i></div>
                <div class="target-info">
                  <div class="target-title">Hồ sơ Thân nhân</div>
                  <div class="target-sub">Quan hệ thân nhân có liên kết CCCD Cán bộ</div>
                </div>
                <i v-if="targetEntity === 'relative'" class="pi pi-check-circle check-icon"></i>
              </div>

              <div
                class="target-card"
                :class="{ selected: targetEntity === 'trips' }"
                @click="targetEntity = 'trips'"
              >
                <div class="target-icon bg-purple"><i class="pi pi-send"></i></div>
                <div class="target-info">
                  <div class="target-title">Hồ sơ Chuyến đi nước ngoài</div>
                  <div class="target-sub">Ngày xuất/nhập cảnh, Quyết định, Quốc gia</div>
                </div>
                <i v-if="targetEntity === 'trips'" class="pi pi-check-circle check-icon"></i>
              </div>
            </div>
          </div>

          <!-- 1B. Chọn Chế độ giải quyết xung đột / trùng khóa -->
          <div class="form-section">
            <label class="section-label">2. Chọn chế độ xử lý khi dữ liệu đã tồn tại trong hệ thống:</label>
            <div class="mode-selector-grid">
              <div
                class="mode-card"
                :class="{ selected: importMode === 'upsert' }"
                @click="importMode = 'upsert'"
              >
                <div class="mode-header">
                  <span class="mode-badge badge-recommended">Khuyên dùng</span>
                  <span class="mode-title">🔄 Cập nhật & Thêm mới (Giữ dữ liệu cũ)</span>
                </div>
                <p class="mode-desc">
                  Nếu bản ghi đã tồn tại theo các cột so khớp: <strong>Giữ nguyên các trường cũ</strong>, chỉ cập nhật hoặc bổ sung các trường mới có giá trị trong file Excel. Chưa có thì tạo mới.
                </p>
              </div>

              <div
                class="mode-card"
                :class="{ selected: importMode === 'skip' }"
                @click="importMode = 'skip'"
              >
                <div class="mode-header">
                  <span class="mode-title">➕ Chỉ thêm mới (Bỏ qua nếu đã có)</span>
                </div>
                <p class="mode-desc">
                  Nếu bản ghi đã tồn tại theo các cột so khớp: <strong>Bỏ qua không cập nhật</strong>. Chỉ tạo mới các bản ghi chưa từng có.
                </p>
              </div>

              <div
                class="mode-card"
                :class="{ selected: importMode === 'replace' }"
                @click="importMode = 'replace'"
              >
                <div class="mode-header">
                  <span class="mode-title">⚡ Ghi đè thay thế hoàn toàn</span>
                </div>
                <p class="mode-desc">
                  Nếu bản ghi đã có: <strong>Ghi đè toàn bộ</strong> các trường dữ liệu bằng dữ liệu mới từ file Excel.
                </p>
              </div>
            </div>
          </div>

          <!-- 1C. Chọn Cột So Khớp / Nhận diện Trùng lặp (Dynamic Matching Columns - Zero Hardcode) -->
          <div class="form-section">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <label class="section-label" style="margin: 0;">3. Chọn (các) cột dùng để so khớp / nhận diện bản ghi đã tồn tại:</label>
              <span style="font-size: 0.72rem; color: #64748b;">(Tick chọn cột theo ý muốn, hệ thống sẽ đối chiếu theo các cột này)</span>
            </div>

            <!-- A. Bảng Cán bộ -->
            <div v-if="targetEntity === 'personnel'" class="match-keys-box">
              <div class="match-keys-hint">
                <i class="pi pi-info-circle text-blue-600"></i>
                <span>Chọn (các) cột để đối chiếu xem Cán bộ đã có trong hệ thống hay chưa (chọn nhiều cột thì bản ghi phải trùng tất cả các cột đã chọn):</span>
              </div>
              <div class="match-chips-grid">
                <label
                  v-for="col in targetColumns"
                  :key="col.id"
                  class="match-chip-item"
                  :class="{ selected: selectedMatchKeysPersonnel.includes(col.id) }"
                >
                  <input
                    type="checkbox"
                    :value="col.id"
                    v-model="selectedMatchKeysPersonnel"
                  />
                  <span class="chip-label">{{ col.label }}</span>
                  <span v-if="col.isKey" class="chip-badge-key">Khóa chính</span>
                  <span class="chip-id">({{ col.id }})</span>
                </label>
              </div>
            </div>

            <!-- B. Bảng Thân nhân -->
            <div v-else-if="targetEntity === 'relative'" class="match-keys-box">
              <div class="match-link-row">
                <span class="match-link-label">🔗 Cột trong file liên kết Cán bộ chủ quản:</span>
                <select v-model="selectedMatchParentKeyRelative" class="match-select">
                  <option v-for="col in targetColumns" :key="col.id" :value="col.id">
                    {{ col.label }} ({{ col.id }})
                  </option>
                </select>
              </div>

              <div class="match-keys-hint">
                <i class="pi pi-info-circle text-blue-600"></i>
                <span>Chọn (các) cột nhận diện Thân nhân để đối chiếu trùng lặp trong hồ sơ cán bộ:</span>
              </div>
              <div class="match-chips-grid">
                <label
                  v-for="col in targetColumns"
                  :key="col.id"
                  class="match-chip-item"
                  :class="{ selected: selectedMatchKeysRelative.includes(col.id) }"
                >
                  <input
                    type="checkbox"
                    :value="col.id"
                    v-model="selectedMatchKeysRelative"
                  />
                  <span class="chip-label">{{ col.label }}</span>
                  <span v-if="col.isKey" class="chip-badge-key">Khóa chính</span>
                  <span class="chip-id">({{ col.id }})</span>
                </label>
              </div>
            </div>

            <!-- C. Bảng Chuyến đi -->
            <div v-else-if="targetEntity === 'trips'" class="match-keys-box">
              <div class="match-link-row">
                <span class="match-link-label">🔗 Cột trong file liên kết Người đi (Cán bộ hoặc Thân nhân):</span>
                <select v-model="selectedMatchPersonKeyTrips" class="match-select">
                  <option v-for="col in targetColumns" :key="col.id" :value="col.id">
                    {{ col.label }} ({{ col.id }})
                  </option>
                </select>
              </div>

              <div class="match-keys-hint">
                <i class="pi pi-info-circle text-blue-600"></i>
                <span>Chọn (các) cột nhận diện Chuyến đi để đối chiếu trùng lặp (ví dụ: Ngày đi + Quốc gia, hoặc Số QĐ):</span>
              </div>
              <div class="match-chips-grid">
                <label
                  v-for="col in targetColumns"
                  :key="col.id"
                  class="match-chip-item"
                  :class="{ selected: selectedMatchKeysTrips.includes(col.id) }"
                >
                  <input
                    type="checkbox"
                    :value="col.id"
                    v-model="selectedMatchKeysTrips"
                  />
                  <span class="chip-label">{{ col.label }}</span>
                  <span v-if="col.isKey" class="chip-badge-key">Khóa chính</span>
                  <span class="chip-id">({{ col.id }})</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 1D. Dropzone Chọn tệp -->
          <div class="form-section">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <label class="section-label" style="margin: 0;">4. Tải lên tệp Excel (.xlsx, .xls):</label>
              <div class="template-quick-buttons">
                <Button
                  :label="`Tải mẫu ${targetEntity === 'personnel' ? 'Cán bộ' : targetEntity === 'relative' ? 'Thân nhân' : 'Chuyến đi'}`"
                  icon="pi pi-download"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="downloadCurrentTemplate"
                  style="font-size: 0.75rem; padding: 4px 10px;"
                />
                <Button
                  label="Mẫu 3 Sheet"
                  icon="pi pi-file-excel"
                  size="small"
                  severity="help"
                  text
                  @click="downloadAllInOneTemplateAction"
                  style="font-size: 0.75rem; padding: 4px 10px;"
                  title="Tải tệp mẫu tổng hợp chứa đầy đủ 3 Sheet: Cán bộ, Thân nhân, Chuyến đi"
                />
              </div>
            </div>
            <div class="template-guide-box">
              <i class="pi pi-info-circle text-blue-600"></i>
              <span>Mẫu chuẩn có <strong>Header kép 2 dòng</strong> (Dòng 1: Tên cột tiếng Việt, Dòng 2: Mã ID). Hệ thống sẽ tự nhận diện chuẩn xác 100%!</span>
            </div>
            <div
              class="excel-dropzone"
              :class="{ 'has-file': !!selectedFileName, 'is-dragging': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onFileDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx, .xls, .csv"
                style="display: none;"
                @change="onFileSelected"
              />

              <template v-if="!selectedFileName">
                <div class="dropzone-icon"><i class="pi pi-file-excel"></i></div>
                <div class="dropzone-text">Kéo thả tệp Excel vào đây, hoặc <span class="browse-link">Bấm để chọn tệp</span></div>
                <div class="dropzone-hint">Hỗ trợ định dạng .xlsx, .xls, .csv theo mẫu cấu hình cột của hệ thống</div>
              </template>

              <template v-else>
                <div class="file-loaded-box">
                  <i class="pi pi-file-excel file-icon"></i>
                  <div class="file-details">
                    <div class="file-name">{{ selectedFileName }}</div>
                    <div class="file-meta">
                      {{ availableSheets.length }} Sheet phát hiện • Đã đọc {{ rawSheetRows.length }} dòng
                    </div>
                  </div>
                  <Button
                    icon="pi pi-refresh"
                    text
                    rounded
                    severity="secondary"
                    title="Chọn tệp khác"
                    @click.stop="$refs.fileInput.click()"
                  />
                </div>
              </template>
            </div>

            <!-- Sheet Picker if multi-sheet -->
            <div v-if="availableSheets.length > 1" class="sheet-tabs-container">
              <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">Chọn Sheet làm việc:</span>
              <div class="sheet-pills">
                <button
                  v-for="s in availableSheets"
                  :key="s"
                  type="button"
                  class="sheet-pill-btn"
                  :class="{ active: selectedSheet === s }"
                  @click="onSelectSheet(s)"
                >
                  <i class="pi pi-table"></i> {{ s }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- BƯỚC 2: XEM TRƯỚC VÀ SỬA TRỰC TIẾP (INLINE EDITING GRID) -->
        <!-- ========================================================================= -->
        <div v-else-if="currentStep === 2" class="step-content step-2-content">
          <!-- Header Bar -->
          <div class="preview-stats-bar">
            <div class="stats-counter">
              <span class="stat-total">Đọc được <strong>{{ parsedRows.length }}</strong> dòng</span>
              <span class="stat-separator">•</span>
              <span class="stat-issues" :class="{ 'has-error': issueRowCount > 0 }">
                <strong>{{ issueRowCount }}</strong> dòng cần xem lại
              </span>
            </div>

            <div class="preview-controls">
              <label class="filter-checkbox-label">
                <input type="checkbox" v-model="onlyShowIssues" />
                <span>Chỉ hiện dòng cần xem lại</span>
              </label>

              <button
                v-if="issueRowCount > 0"
                type="button"
                class="btn-export-issues"
                @click="downloadErrorReport"
              >
                <i class="pi pi-download"></i> Tải danh sách lỗi
              </button>
            </div>
          </div>

          <!-- Interactive Grid Table -->
          <div class="preview-grid-wrapper">
            <table class="preview-grid-table">
              <thead>
                <tr>
                  <th style="width: 65px; text-align: center;">DÒNG</th>
                  <th
                    v-for="col in targetColumns"
                    :key="col.id"
                    :style="{ minWidth: (col.tableWidth || col.width || '150px') }"
                  >
                    {{ col.label || col.id }}
                  </th>
                  <th style="min-width: 240px; color: #b91c1c; font-weight: 700;">VẤN ĐỀ PHÁT HIỆN</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rIdx) in displayRows"
                  :key="rIdx"
                  :class="{ 'row-has-issue': row.issues && row.issues.length > 0 }"
                >
                  <!-- Row Number with Warning Indicator -->
                  <td class="col-row-idx">
                    <span :class="['row-num-badge', { 'is-issue': row.issues && row.issues.length > 0 }]">
                      {{ rIdx + 1 }}{{ row.issues && row.issues.length > 0 ? ' !' : '' }}
                    </span>
                  </td>

                  <!-- Editable Cells -->
                  <td
                    v-for="col in targetColumns"
                    :key="col.id"
                    class="editable-cell"
                    :class="{ 'cell-invalid': isCellInvalid(row, col.id) }"
                  >
                    <input
                      type="text"
                      :value="row.data[col.id] || ''"
                      @input="e => onCellChange(row, col.id, e.target.value)"
                      class="cell-input"
                      :placeholder="col.label"
                    />
                  </td>

                  <!-- Issue description column -->
                  <td class="col-issue-desc">
                    <div v-if="row.issues && row.issues.length > 0" class="issue-pill-list">
                      <span
                        v-for="(iss, iIdx) in row.issues"
                        :key="iIdx"
                        class="issue-pill"
                        :title="iss"
                      >
                        {{ iss }}
                      </span>
                    </div>
                    <span v-else class="text-valid"><i class="pi pi-check"></i> Hợp lệ</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- BƯỚC 3: XÁC NHẬN (CONFIRMATION & SUMMARY) -->
        <!-- ========================================================================= -->
        <div v-else-if="currentStep === 3" class="step-content step-3-content">
          <div class="confirm-hero-card">
            <div class="confirm-icon"><i class="pi pi-verified"></i></div>
            <div class="confirm-header-info">
              <h3 class="confirm-title">Sẵn sàng nhập dữ liệu vào hệ thống</h3>
              <p class="confirm-sub">
                Đích nạp: <strong>{{ getTargetEntityLabel(targetEntity) }}</strong> • Chế độ: <strong>{{ getImportModeLabel(importMode) }}</strong>
              </p>
            </div>
          </div>

          <!-- Hiển thị chi tiết tiêu chí so khớp đã chọn (Zero-Hardcode) -->
          <div class="match-summary-card">
            <div style="font-size: 0.78rem; font-weight: 700; color: #1e293b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-sliders-h" style="color: #2563eb;"></i>
              Tiêu chí so khớp / nhận diện bản ghi đã tồn tại:
            </div>
            <div style="font-size: 0.74rem; color: #475569; display: flex; flex-direction: column; gap: 4px;">
              <div v-if="targetEntity === 'personnel'">
                • Cột đối chiếu Cán bộ: <strong style="color: #1e40af;">{{ selectedMatchKeysPersonnelLabels.join(', ') || 'Chưa chọn' }}</strong>
              </div>
              <div v-else-if="targetEntity === 'relative'">
                • Cột liên kết Cán bộ: <strong style="color: #1e40af;">{{ getColumnLabelById(selectedMatchParentKeyRelative) }}</strong>
                <br />
                • Cột nhận diện Thân nhân: <strong style="color: #1e40af;">{{ selectedMatchKeysRelativeLabels.join(', ') || 'Chưa chọn' }}</strong>
              </div>
              <div v-else-if="targetEntity === 'trips'">
                • Cột liên kết Người đi: <strong style="color: #1e40af;">{{ getColumnLabelById(selectedMatchPersonKeyTrips) }}</strong>
                <br />
                • Cột nhận diện Chuyến đi: <strong style="color: #1e40af;">{{ selectedMatchKeysTripsLabels.join(', ') || 'Chưa chọn' }}</strong>
              </div>
            </div>
          </div>

          <!-- Summary Metric Cards Grid -->
          <div class="summary-metrics-grid">
            <div class="summary-card card-total">
              <div class="summary-num">{{ parsedRows.length }}</div>
              <div class="summary-label">Tổng số dòng đọc được</div>
            </div>

            <div class="summary-card card-valid">
              <div class="summary-num">{{ validRows.length }}</div>
              <div class="summary-label">Bản ghi hợp lệ sẽ nạp</div>
            </div>

            <div class="summary-card card-create">
              <div class="summary-num">{{ planCounts.toCreate }}</div>
              <div class="summary-label">Bản ghi sẽ Thêm mới</div>
            </div>

            <div class="summary-card card-update">
              <div class="summary-num">{{ planCounts.toUpdate }}</div>
              <div class="summary-label">Bản ghi sẽ Cập nhật</div>
            </div>

            <div class="summary-card card-skip">
              <div class="summary-num">{{ invalidRows.length }}</div>
              <div class="summary-label">Bản ghi bỏ qua (Lỗi chưa sửa)</div>
            </div>
          </div>

          <div v-if="invalidRows.length > 0" class="warning-alert-box">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <strong>Lưu ý:</strong> Có <strong>{{ invalidRows.length }}</strong> dòng còn lỗi (thiếu CCCD hoặc ngày sai). Các dòng này sẽ được bỏ qua an toàn mà không làm gián đoạn việc nạp các dòng hợp lệ.
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- BƯỚC 4: KẾT QUẢ IMPORT -->
        <!-- ========================================================================= -->
        <div v-else-if="currentStep === 4" class="step-content step-4-content">
          <div class="result-card">
            <div class="result-icon-success">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3 class="result-title">Nhập dữ liệu thành công!</h3>
            <p class="result-desc">
              Dữ liệu đã được nạp và đồng bộ hoàn tất vào hệ thống.
            </p>

            <div class="result-stats-box">
              <div class="result-stat-item">
                <span class="rs-label">Đã thêm mới thành công:</span>
                <span class="rs-val rs-green">+{{ resultReport.created }} kết quả</span>
              </div>
              <div class="result-stat-item">
                <span class="rs-label">Đã cập nhật dữ liệu:</span>
                <span class="rs-val rs-blue">{{ resultReport.updated }} kết quả</span>
              </div>
              <div v-if="resultReport.skipped > 0" class="result-stat-item">
                <span class="rs-label">Đã bỏ qua (dòng lỗi):</span>
                <span class="rs-val rs-orange">{{ resultReport.skipped }} dòng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. WIZARD FOOTER (ACTIONS) -->
      <div class="wizard-footer">
        <div class="footer-hint">
          <template v-if="currentStep === 2">
            Bước 2 trong 4 - sửa các dòng có vấn đề ngay trong bảng
          </template>
          <template v-else-if="currentStep === 3">
            Bước 3 trong 4 - kiểm tra kỹ các thông số trước khi tiến hành nạp
          </template>
        </div>

        <div class="footer-buttons">
          <Button
            v-if="currentStep > 1 && currentStep < 4"
            label="Quay lại"
            icon="pi pi-arrow-left"
            outlined
            severity="secondary"
            :disabled="importing"
            @click="prevStep"
          />

          <Button
            v-if="currentStep === 1"
            label="Tiếp tục"
            icon="pi pi-arrow-right"
            iconPos="right"
            severity="primary"
            :disabled="!selectedFileName || rawSheetRows.length < 2"
            @click="goToStep2"
          />

          <Button
            v-else-if="currentStep === 2"
            label="Tiếp tục"
            icon="pi pi-arrow-right"
            iconPos="right"
            severity="primary"
            :disabled="validRows.length === 0"
            @click="goToStep3"
          />

          <Button
            v-else-if="currentStep === 3"
            label="Xác nhận & Nạp dữ liệu"
            icon="pi pi-check"
            severity="success"
            :loading="importing"
            @click="executeImport"
          />

          <Button
            v-else-if="currentStep === 4"
            label="Hoàn tất & Về danh sách"
            icon="pi pi-check"
            severity="primary"
            @click="finishAndClose"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import {
  readExcelWorkbook,
  exportToExcel,
  getSubOptionsList,
  downloadPersonnelTemplate,
  downloadRelativeTemplate,
  downloadTripsTemplate,
  downloadAllInOneTemplate,
} from '@/utils/excel';
import { formatExcelDate, parseDateValue } from '@/utils/formatters';
import { createPersonnel, updatePersonnel } from '@/api/personnel';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  defaultTarget: {
    type: String,
    default: 'personnel', // 'personnel' | 'relative' | 'trips'
  },
});

const emit = defineEmits(['update:visible', 'imported']);

const personnelStore = usePersonnelStore();

// Step Tracking
const currentStep = ref(1);
const importing = ref(false);

// Step 1: Config
const targetEntity = ref('personnel'); // 'personnel' | 'relative' | 'trips'
const importMode = ref('upsert'); // 'upsert' | 'replace' | 'skip'
const selectedFileName = ref('');
const isDragging = ref(false);
const availableSheets = ref([]);
const selectedSheet = ref('');
const rawWorkbookData = ref({});
const rawSheetRows = ref([]);

// Step 2: Parsed Rows & Inline Editing
const parsedRows = ref([]);
const onlyShowIssues = ref(false);

// Step 4: Results
const resultReport = ref({
  created: 0,
  updated: 0,
  skipped: 0,
});

watch(
  () => props.defaultTarget,
  (val) => {
    if (val) targetEntity.value = val;
  },
  { immediate: true }
);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentStep.value = 1;
      selectedFileName.value = '';
      availableSheets.value = [];
      selectedSheet.value = '';
      rawWorkbookData.value = {};
      rawSheetRows.value = [];
      parsedRows.value = [];
      targetEntity.value = props.defaultTarget || 'personnel';
      importMode.value = 'upsert';
    }
  }
);

// Target Columns Definition based on store mappings
const targetColumns = computed(() => {
  let groups = [];
  if (targetEntity.value === 'personnel') {
    groups = personnelStore.importMappingPersonnel || [];
  } else if (targetEntity.value === 'relative') {
    groups = personnelStore.importMappingRelative || [];
  } else if (targetEntity.value === 'trips') {
    groups = personnelStore.importMappingTrips || [];
  }

  const list = [];
  groups.forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({
          id: c.id,
          label: c.label || c.id,
          format: c.format || 'text',
          isKey: Boolean(c.isKey || c.isIdentifier || c.isPrimaryKey),
          group: g.group || '',
          tableWidth: c.tableWidth || c.width || '150px',
        });
      }
    });
  });
  return list;
});

// Dynamic Matching Columns State (Zero-Hardcode: Người dùng tự do chọn cột so khớp)
const selectedMatchKeysPersonnel = ref([]);
const selectedMatchParentKeyRelative = ref('');
const selectedMatchKeysRelative = ref([]);
const selectedMatchPersonKeyTrips = ref('');
const selectedMatchKeysTrips = ref([]);

// Tự động khởi tạo gợi ý cột so khớp ban đầu từ cấu hình bảng
const initDefaultMatchKeys = () => {
  const cols = targetColumns.value || [];
  if (cols.length === 0) return;

  if (targetEntity.value === 'personnel') {
    const pKey = personnelStore.getPersonnelKeyField();
    const keyCol = cols.find(c => c.isKey || c.id === pKey) || cols[0];
    if (keyCol && (!selectedMatchKeysPersonnel.value || selectedMatchKeysPersonnel.value.length === 0)) {
      selectedMatchKeysPersonnel.value = [keyCol.id];
    }
  } else if (targetEntity.value === 'relative') {
    const parentKey = personnelStore.getRelativeParentKeyField();
    const parentCol = cols.find(c => c.id === parentKey || c.id === 'cccdparent' || c.id.toLowerCase().includes('parent')) || cols[0];
    if (parentCol && !selectedMatchParentKeyRelative.value) {
      selectedMatchParentKeyRelative.value = parentCol.id;
    }

    const rKey = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';
    const relKeyCol = cols.find(c => c.isKey || c.id === rKey || c.id === 'cccdthannhan') || cols[1] || cols[0];
    if (relKeyCol && (!selectedMatchKeysRelative.value || selectedMatchKeysRelative.value.length === 0)) {
      selectedMatchKeysRelative.value = [relKeyCol.id];
    }
  } else if (targetEntity.value === 'trips') {
    const tripKey = personnelStore.getTripKeyField();
    const tripCol = cols.find(c => c.id === tripKey || c.id === 'cccdchuyendi' || c.id.toLowerCase().includes('cccd')) || cols[0];
    if (tripCol && !selectedMatchPersonKeyTrips.value) {
      selectedMatchPersonKeyTrips.value = tripCol.id;
    }

    if (!selectedMatchKeysTrips.value || selectedMatchKeysTrips.value.length === 0) {
      const defaultTripsCols = [];
      const depCol = cols.find(c => c.id === 'departureDate' || c.id.toLowerCase().includes('departure') || c.id.toLowerCase().includes('ngay_di'));
      const ctryCol = cols.find(c => c.id === 'countryName' || c.id.toLowerCase().includes('country') || c.id.toLowerCase().includes('quoc_gia'));
      if (depCol) defaultTripsCols.push(depCol.id);
      if (ctryCol) defaultTripsCols.push(ctryCol.id);
      if (defaultTripsCols.length === 0 && cols.length > 1) {
        defaultTripsCols.push(cols[1].id);
      }
      selectedMatchKeysTrips.value = defaultTripsCols;
    }
  }
};

watch(
  () => [targetEntity.value, targetColumns.value],
  () => {
    initDefaultMatchKeys();
  },
  { immediate: true, deep: true }
);

const getColumnLabelById = (colId) => {
  const c = (targetColumns.value || []).find((col) => col.id === colId);
  return c ? `${c.label} (${c.id})` : colId;
};

const selectedMatchKeysPersonnelLabels = computed(() => {
  return (selectedMatchKeysPersonnel.value || []).map(id => getColumnLabelById(id));
});

const selectedMatchKeysRelativeLabels = computed(() => {
  return (selectedMatchKeysRelative.value || []).map(id => getColumnLabelById(id));
});

const selectedMatchKeysTripsLabels = computed(() => {
  return (selectedMatchKeysTrips.value || []).map(id => getColumnLabelById(id));
});

const getRecordValue = (rec, colId) => {
  if (!rec || !colId) return '';
  if (rec[colId] !== undefined && rec[colId] !== null) return rec[colId];
  if (rec.custom_data && rec.custom_data[colId] !== undefined && rec.custom_data[colId] !== null) {
    return rec.custom_data[colId];
  }
  return '';
};

// Hàm so khớp bản ghi tổng quát (Dynamic Matching Function - Zero Hardcode)
const isRecordMatched = (existingRecord, excelRowData, matchKeyColIds) => {
  if (!existingRecord || !excelRowData || !matchKeyColIds || matchKeyColIds.length === 0) return false;
  return matchKeyColIds.every((colId) => {
    const rawVal = excelRowData[colId];
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return false;
    const existVal = getRecordValue(existingRecord, colId);
    if (existVal === undefined || existVal === null || String(existVal).trim() === '') return false;

    const str1 = String(rawVal).trim().toLowerCase();
    const str2 = String(existVal).trim().toLowerCase();
    return str1 === str2;
  });
};

const findParentPersonnel = (parentKeyVal) => {
  if (!parentKeyVal || String(parentKeyVal).trim() === '') return null;
  const targetVal = String(parentKeyVal).trim().toLowerCase();
  const pKeyField = personnelStore.getPersonnelKeyField();
  return (personnelStore.personnelList || []).find((p) => {
    const candidates = [
      getRecordValue(p, pKeyField),
      getRecordValue(p, selectedMatchParentKeyRelative.value),
      p.cccd,
      p.code,
      p.id,
    ];
    return candidates.some((c) => c && String(c).trim().toLowerCase() === targetVal);
  });
};

const findTripPerson = (personKeyVal) => {
  if (!personKeyVal || String(personKeyVal).trim() === '') return { person: null, matchedRelative: null };
  const targetVal = String(personKeyVal).trim().toLowerCase();
  const pKeyField = personnelStore.getPersonnelKeyField();
  const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';

  // 1. Tìm trong danh sách cán bộ
  const foundPerson = (personnelStore.personnelList || []).find((p) => {
    const candidates = [
      getRecordValue(p, pKeyField),
      getRecordValue(p, selectedMatchPersonKeyTrips.value),
      p.cccd,
      p.code,
      p.id,
    ];
    return candidates.some((c) => c && String(c).trim().toLowerCase() === targetVal);
  });
  if (foundPerson) return { person: foundPerson, matchedRelative: null };

  // 2. Tìm trong thân nhân của các cán bộ
  for (const p of (personnelStore.personnelList || [])) {
    const rels = Array.isArray(p.relatives) ? p.relatives : [];
    const matchedRel = rels.find((r) => {
      const candidates = [
        getRecordValue(r, rKeyField),
        getRecordValue(r, selectedMatchPersonKeyTrips.value),
        r.cccd,
        r.id,
      ];
      return candidates.some((c) => c && String(c).trim().toLowerCase() === targetVal);
    });
    if (matchedRel) {
      return { person: p, matchedRelative: matchedRel };
    }
  }

  return { person: null, matchedRelative: null };
};

watch(
  () => [
    selectedMatchKeysPersonnel.value,
    selectedMatchParentKeyRelative.value,
    selectedMatchKeysRelative.value,
    selectedMatchPersonKeyTrips.value,
    selectedMatchKeysTrips.value,
  ],
  () => {
    if (parsedRows.value && parsedRows.value.length > 0) {
      parsedRows.value.forEach((r) => validateRowItem(r));
    }
  },
  { deep: true }
);

// Normalizer
const normalizeKey = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/\[cột\s*\d+(\s*-\s*\d+)?\]/gi, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
};

// File Selection Handler
const onFileSelected = (e) => {
  const file = e.target.files?.[0];
  if (file) handleFileLoad(file);
};

const onFileDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files?.[0];
  if (file) handleFileLoad(file);
};

// Tải tệp mẫu Excel chuẩn cho bảng đang chọn
const downloadCurrentTemplate = () => {
  if (targetEntity.value === 'personnel') {
    downloadPersonnelTemplate(personnelStore.importMappingPersonnel);
  } else if (targetEntity.value === 'relative') {
    downloadRelativeTemplate(personnelStore.importMappingRelative);
  } else if (targetEntity.value === 'trips') {
    downloadTripsTemplate(personnelStore.importMappingTrips);
  }
};

const downloadAllInOneTemplateAction = () => {
  downloadAllInOneTemplate(
    personnelStore.importMappingPersonnel,
    personnelStore.importMappingRelative,
    personnelStore.importMappingTrips
  );
};

const handleFileLoad = async (file) => {
  selectedFileName.value = file.name;
  try {
    const res = await readExcelWorkbook(file);
    availableSheets.value = res.sheetNames || [];
    rawWorkbookData.value = res.sheetsData || {};
    if (availableSheets.value.length > 0) {
      selectedSheet.value = availableSheets.value[0];
      onSelectSheet(selectedSheet.value);
    }
  } catch (err) {
    alert('Lỗi đọc tệp Excel: ' + (err.message || err));
  }
};

const onSelectSheet = (s) => {
  selectedSheet.value = s;
  // Tự động nhận diện bảng đích từ tên Sheet nếu phù hợp
  const normS = normalizeKey(s);
  if (normS.includes('thannhan') || normS.includes('than_nhan')) {
    targetEntity.value = 'relative';
  } else if (normS.includes('chuyendi') || normS.includes('chuyen_di')) {
    targetEntity.value = 'trips';
  } else if (normS.includes('canbo') || normS.includes('can_bo') || normS.includes('hosocanbo')) {
    targetEntity.value = 'personnel';
  }
  if (rawWorkbookData.value && rawWorkbookData.value[s]) {
    rawSheetRows.value = (rawWorkbookData.value[s] || []).filter((r) => r && r.length > 0);
  }
};

// Step Navigation
const goToStep2 = () => {
  buildParsedRows();
  currentStep.value = 2;
};

const goToStep3 = () => {
  currentStep.value = 3;
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const closeWizard = () => {
  emit('update:visible', false);
};

const finishAndClose = () => {
  emit('imported');
  emit('update:visible', false);
};

// Build Parsed Rows from raw Sheet Rows (Hỗ trợ tự động Header kép 2 dòng & Header đơn 1 dòng)
const buildParsedRows = () => {
  const rawRows = rawSheetRows.value || [];
  if (rawRows.length < 2) {
    parsedRows.value = [];
    return;
  }

  const entityCols = targetColumns.value || [];
  if (entityCols.length === 0) {
    parsedRows.value = [];
    return;
  }

  const row0 = rawRows[0] || [];
  const row1 = rawRows[1] || [];

  // Tạo map tra cứu cột đích
  const entityColById = new Map();
  const entityColByNormId = new Map();
  const entityColByNormLabel = new Map();

  let currentColIdx = 0;
  entityCols.forEach((c) => {
    currentColIdx++;
    entityColById.set(c.id, c);
    entityColByNormId.set(normalizeKey(c.id), c);
    entityColByNormLabel.set(normalizeKey(c.label), c);
    entityColByNormLabel.set(normalizeKey(`[Cột ${currentColIdx}] ${c.label}`), c);
    entityColByNormLabel.set(normalizeKey(`cột ${currentColIdx}`), c);
  });

  // 1. Phán đoán xem Dòng 2 có phải là dòng ID kỹ thuật không (chuẩn Header kép 2 dòng)
  const knownCoreIds = new Set([
    'stt', 'name', 'fullname', 'cccd', 'cccdparent', 'cccdthannhan', 'cccdchuyendi',
    'birthdate', 'birthyear', 'gender', 'departmentname', 'departmentid', 'position',
    'relativename', 'relation', 'relationshipname', 'departuredate', 'arrivaldate',
    'countryname', 'decisionnumber', 'decisiondate', 'fundingname', 'purpose', 'passportnumber', 'notes'
  ]);
  entityCols.forEach(c => {
    if (c.id) knownCoreIds.add(String(c.id).toLowerCase());
  });

  let idMatchCount = 0;
  let nonBlankCount = 0;
  row1.forEach(cell => {
    if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
      nonBlankCount++;
      const normCell = normalizeKey(cell);
      if (knownCoreIds.has(normCell) || entityColByNormId.has(normCell)) {
        idMatchCount++;
      }
    }
  });

  const is2HeaderMode = (idMatchCount >= 2) || (nonBlankCount > 0 && (idMatchCount / nonBlankCount) >= 0.25);
  const dataStartIdx = is2HeaderMode ? 2 : 1;
  const headerLabels = row0;
  const headerIds = is2HeaderMode ? row1 : row0;

  // 2. Xác định ánh xạ từng cột Excel sang entityCol
  const mappedCols = [];
  const isFirstColStt = (row) => {
    if (!row || row.length === 0) return false;
    const n = normalizeKey(row[0]);
    return n === 'stt' || n.includes('stt') || n === 'c1' || n === 'cot1';
  };

  const firstColIsStt = isFirstColStt(headerIds) || isFirstColStt(headerLabels);
  let sequentialTargetIdx = 0;

  const numCols = Math.max(headerLabels.length, headerIds.length);
  for (let cIdx = 0; cIdx < numCols; cIdx++) {
    if (cIdx === 0 && firstColIsStt) {
      mappedCols.push(null); // Bỏ qua cột STT
      continue;
    }

    let matched = null;
    const rawId = headerIds[cIdx];
    const rawLabel = headerLabels[cIdx];

    if (is2HeaderMode) {
      // Ưu tiên 1: So khớp chính xác 100% bằng ID kỹ thuật ở Dòng 2
      if (rawId !== undefined && rawId !== null) {
        const idStr = String(rawId).trim();
        const normId = normalizeKey(idStr);
        matched = entityColById.get(idStr) || entityColByNormId.get(normId);
      }
      // Ưu tiên 2: Nếu Dòng 2 không khớp, thử so khớp theo Nhãn tiếng Việt ở Dòng 1
      if (!matched && rawLabel !== undefined && rawLabel !== null) {
        const normLabel = normalizeKey(rawLabel);
        matched = entityColByNormLabel.get(normLabel);
      }
    } else {
      // Chế độ 1 Header: So khớp theo Nhãn tiếng Việt hoặc ID
      if (rawLabel !== undefined && rawLabel !== null) {
        const normCell = normalizeKey(rawLabel);
        matched = entityColByNormLabel.get(normCell) || entityColByNormId.get(normCell);
        if (!matched) {
          const colNumMatch = String(rawLabel).match(/\[\s*c[ộo]t\s*(\d+)\s*\]/i);
          if (colNumMatch) {
            const num = Number(colNumMatch[1]);
            if (entityCols[num - 1]) matched = entityCols[num - 1];
          }
        }
      }
    }

    // Fallback thứ tự cột nếu chưa map được
    if (!matched && sequentialTargetIdx < entityCols.length) {
      matched = entityCols[sequentialTargetIdx];
      sequentialTargetIdx++;
    } else if (matched) {
      const foundIdx = entityCols.findIndex((c) => c.id === matched.id);
      if (foundIdx >= 0) {
        sequentialTargetIdx = foundIdx + 1;
      }
    }

    mappedCols.push(matched || null);
  }

  // 3. Đọc dữ liệu từ dataStartIdx trở đi
  const parsed = [];

  for (let rIdx = dataStartIdx; rIdx < rawRows.length; rIdx++) {
    const rawRow = rawRows[rIdx];
    if (!rawRow || rawRow.length === 0 || !rawRow.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '')) {
      continue;
    }

    const rowObj = {};
    entityCols.forEach((c) => {
      rowObj[c.id] = '';
    });

    mappedCols.forEach((matchedCol, cIdx) => {
      if (!matchedCol) return;
      const cellVal = rawRow[cIdx];
      if (cellVal === undefined || cellVal === null) return;
      const valStr = typeof cellVal === 'number' ? String(cellVal) : String(cellVal).trim();
      if (valStr === '') return;

      let finalVal = valStr;
      if (
        matchedCol.format === 'date' ||
        matchedCol.id.toLowerCase().includes('date') ||
        matchedCol.id.toLowerCase().includes('year') ||
        matchedCol.id.toLowerCase().includes('sinh')
      ) {
        finalVal = formatExcelDate(cellVal);
      } else if (
        matchedCol.id.toLowerCase().includes('cccd') ||
        matchedCol.id.toLowerCase().includes('cmnd') ||
        matchedCol.id.toLowerCase().includes('dinhdanh')
      ) {
        if (typeof cellVal === 'number') {
          const integerStr = String(Math.trunc(cellVal));
          finalVal = integerStr.length <= 12 && integerStr.length >= 9 ? integerStr.padStart(12, '0') : integerStr;
        } else {
          finalVal = String(finalVal).replace(/\.0+$/, '').trim();
        }
      }
      rowObj[matchedCol.id] = finalVal;
    });

    const rowItem = {
      excelRowIndex: rIdx + 1, // Số thứ tự dòng thực tế trong file Excel (1-based)
      data: rowObj,
      issues: [],
    };

    validateRowItem(rowItem);
    parsed.push(rowItem);
  }

  parsedRows.value = parsed;
};

// Validate Row Item (Dựa trên các cột so khớp mà người dùng đã tick chọn)
const validateRowItem = (rowItem) => {
  const data = rowItem.data || {};
  const issues = [];

  if (targetEntity.value === 'personnel') {
    // 1. Kiểm tra các cột so khớp đã chọn
    if (!selectedMatchKeysPersonnel.value || selectedMatchKeysPersonnel.value.length === 0) {
      issues.push('Chưa chọn cột so khớp cán bộ');
    } else {
      selectedMatchKeysPersonnel.value.forEach((colId) => {
        const val = data[colId];
        if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') {
          issues.push(`Thiếu cột so khớp: ${getColumnLabelById(colId)}`);
        }
      });
    }

    // Họ tên cán bộ (nếu có trường name trong cấu hình)
    const nameCol = (targetColumns.value || []).find((c) => c.id === 'name' || c.id === 'fullName' || c.id === 'ho_va_ten');
    if (nameCol && !selectedMatchKeysPersonnel.value.includes(nameCol.id)) {
      const name = data[nameCol.id];
      if (!name || String(name).trim() === '') {
        issues.push(`Thiếu ${nameCol.label}`);
      }
    }
  } else if (targetEntity.value === 'relative') {
    // 1. Kiểm tra cột liên kết Cán bộ chủ quản
    const parentColId = selectedMatchParentKeyRelative.value;
    if (!parentColId || data[parentColId] === undefined || data[parentColId] === null || String(data[parentColId]).trim() === '' || String(data[parentColId]).trim() === '-') {
      issues.push(`Thiếu Cột liên kết Cán bộ: ${getColumnLabelById(parentColId || 'Chưa chọn')}`);
    }

    // 2. Kiểm tra các cột so khớp Thân nhân
    if (!selectedMatchKeysRelative.value || selectedMatchKeysRelative.value.length === 0) {
      issues.push('Chưa chọn cột so khớp thân nhân');
    } else {
      selectedMatchKeysRelative.value.forEach((colId) => {
        const val = data[colId];
        if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') {
          issues.push(`Thiếu cột so khớp: ${getColumnLabelById(colId)}`);
        }
      });
    }

    // Tên thân nhân (nếu có cột relativeName trong cấu hình)
    const relNameCol = (targetColumns.value || []).find((c) => c.id === 'relativeName' || c.id === 'name');
    if (relNameCol && !selectedMatchKeysRelative.value.includes(relNameCol.id)) {
      const relName = data[relNameCol.id];
      if (!relName || String(relName).trim() === '') {
        issues.push(`Thiếu ${relNameCol.label}`);
      }
    }
  } else if (targetEntity.value === 'trips') {
    // 1. Kiểm tra cột liên kết Người đi
    const personColId = selectedMatchPersonKeyTrips.value;
    if (!personColId || data[personColId] === undefined || data[personColId] === null || String(data[personColId]).trim() === '' || String(data[personColId]).trim() === '-') {
      issues.push(`Thiếu Cột liên kết Người đi: ${getColumnLabelById(personColId || 'Chưa chọn')}`);
    }

    // 2. Kiểm tra các cột so khớp Chuyến đi
    if (!selectedMatchKeysTrips.value || selectedMatchKeysTrips.value.length === 0) {
      issues.push('Chưa chọn cột so khớp chuyến đi');
    } else {
      selectedMatchKeysTrips.value.forEach((colId) => {
        const val = data[colId];
        if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') {
          issues.push(`Thiếu cột so khớp: ${getColumnLabelById(colId)}`);
        }
      });
    }
  }

  // Validate dates
  targetColumns.value.forEach((col) => {
    if (col.format === 'date' || col.id.toLowerCase().includes('date') || col.id.toLowerCase().includes('year')) {
      const val = data[col.id];
      if (val && String(val).trim() !== '' && String(val).trim() !== '-') {
        const parsedD = parseDateValue(val);
        if (!parsedD || isNaN(new Date(parsedD).getTime())) {
          issues.push(`Cột ${col.label} không đúng định dạng ngày`);
        }
      }
    }
  });

  // Kiểm tra các cột được cấu hình Bắt buộc (col.required === true)
  (targetColumns.value || []).forEach((col) => {
    if (col.required) {
      const val = data[col.id];
      if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') {
        issues.push(`Thiếu trường bắt buộc: ${col.label || col.id}`);
      }
    }
  });

  rowItem.issues = issues;
};

// Check if specific cell is invalid (highlight đỏ trong Step 2 preview)
const isCellInvalid = (row, colId) => {
  const val = row.data[colId];
  const isEmpty = val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-';

  if (targetEntity.value === 'personnel') {
    if (selectedMatchKeysPersonnel.value.includes(colId) && isEmpty) return true;
    if ((colId === 'name' || colId === 'ho_va_ten') && isEmpty) return true;
  } else if (targetEntity.value === 'relative') {
    if (colId === selectedMatchParentKeyRelative.value && isEmpty) return true;
    if (selectedMatchKeysRelative.value.includes(colId) && isEmpty) return true;
  } else if (targetEntity.value === 'trips') {
    if (colId === selectedMatchPersonKeyTrips.value && isEmpty) return true;
    if (selectedMatchKeysTrips.value.includes(colId) && isEmpty) return true;
  }

  // Check required
  const colDef = targetColumns.value.find((c) => c.id === colId);
  if (colDef && colDef.required && isEmpty) return true;

  // Check date cell
  if (colDef && (colDef.format === 'date' || colId.toLowerCase().includes('date'))) {
    if (val && String(val).trim() !== '' && String(val).trim() !== '-') {
      const parsedD = parseDateValue(val);
      if (!parsedD || isNaN(new Date(parsedD).getTime())) return true;
    }
  }

  return false;
};

// Inline Cell Change
const onCellChange = (row, colId, newVal) => {
  row.data[colId] = newVal;
  validateRowItem(row);
};

// Display Rows (Filtered by onlyShowIssues)
const displayRows = computed(() => {
  if (onlyShowIssues.value) {
    return (parsedRows.value || []).filter((r) => r.issues && r.issues.length > 0);
  }
  return parsedRows.value || [];
});

const issueRowCount = computed(() => {
  return (parsedRows.value || []).filter((r) => r.issues && r.issues.length > 0).length;
});

const validRows = computed(() => {
  return (parsedRows.value || []).filter((r) => !r.issues || r.issues.length === 0);
});

const invalidRows = computed(() => {
  return (parsedRows.value || []).filter((r) => r.issues && r.issues.length > 0);
});

// Calculate Plan Counts for Step 3 (Hoàn toàn linh hoạt theo tiêu chí so khớp người dùng chọn)
const planCounts = computed(() => {
  let toCreate = 0;
  let toUpdate = 0;

  if (targetEntity.value === 'personnel') {
    validRows.value.forEach((r) => {
      const isMatch = (personnelStore.personnelList || []).some((p) =>
        isRecordMatched(p, r.data, selectedMatchKeysPersonnel.value)
      );
      if (isMatch) {
        toUpdate++;
      } else {
        toCreate++;
      }
    });
  } else if (targetEntity.value === 'relative') {
    validRows.value.forEach((rowItem) => {
      const rowData = rowItem.data || {};
      const parentPerson = findParentPersonnel(rowData[selectedMatchParentKeyRelative.value]);

      if (!parentPerson) {
        toCreate++;
        return;
      }

      const currentRels = Array.isArray(parentPerson.relatives) ? parentPerson.relatives : [];
      const exists = currentRels.some((r) =>
        isRecordMatched(r, rowData, selectedMatchKeysRelative.value)
      );

      if (exists) {
        toUpdate++;
      } else {
        toCreate++;
      }
    });
  } else if (targetEntity.value === 'trips') {
    validRows.value.forEach((rowItem) => {
      const rowData = rowItem.data || {};
      const { person: resolvedPerson } = findTripPerson(rowData[selectedMatchPersonKeyTrips.value]);

      if (resolvedPerson) {
        const currentTrips = Array.isArray(resolvedPerson.trips) ? resolvedPerson.trips : [];
        if (currentTrips.some((t) => isRecordMatched(t, rowData, selectedMatchKeysTrips.value))) {
          toUpdate++;
        } else {
          toCreate++;
        }
      } else {
        const currentStandalone = Array.isArray(personnelStore.standaloneTrips) ? personnelStore.standaloneTrips : [];
        if (currentStandalone.some((t) => isRecordMatched(t, rowData, selectedMatchKeysTrips.value))) {
          toUpdate++;
        } else {
          toCreate++;
        }
      }
    });
  }

  return { toCreate, toUpdate };
});

// Download Error Report
const downloadErrorReport = () => {
  const errors = invalidRows.value.map((r) => ({
    'DÒNG EXCEL': r.excelRowIndex,
    ...r.data,
    'VẤN ĐỀ PHÁT HIỆN': r.issues.join('; '),
  }));
  exportToExcel(errors, `Danh_sach_dong_loi_${targetEntity.value}`, 'Dòng lỗi');
};

// Execute Import (Step 3 -> Step 4) - Hoàn toàn linh hoạt theo tiêu chí so khớp đã chọn
const executeImport = async () => {
  importing.value = true;
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = invalidRows.value.length;

  try {
    const rowsToImport = validRows.value;
    let localPersonnelList = [...(personnelStore.personnelList || [])];

    if (targetEntity.value === 'personnel') {
      for (const rowItem of rowsToImport) {
        const rowData = { ...rowItem.data };
        const existIdx = localPersonnelList.findIndex((p) =>
          isRecordMatched(p, rowData, selectedMatchKeysPersonnel.value)
        );

        if (existIdx >= 0) {
          const existingPerson = localPersonnelList[existIdx];
          if (importMode.value === 'skip') {
            skippedCount++;
            continue;
          }

          if (importMode.value === 'replace') {
            const replacedPayload = {
              ...existingPerson,
              ...rowData,
              custom_data: { ...rowData },
            };
            await updatePersonnel(existingPerson.id, replacedPayload);
            localPersonnelList[existIdx] = replacedPayload;
            updatedCount++;
          } else {
            // Upsert
            const mergedCustom = { ...(existingPerson.custom_data || {}), ...rowData };
            const mergedPayload = {
              ...existingPerson,
              ...rowData,
              custom_data: mergedCustom,
            };
            await updatePersonnel(existingPerson.id, mergedPayload);
            localPersonnelList[existIdx] = mergedPayload;
            updatedCount++;
          }
        } else {
          // Tạo mới cán bộ
          const nextIndex = localPersonnelList.length + createdCount + 1;
          const assignedCode = rowData.code || ('CB-' + String(nextIndex).padStart(5, '0'));
          const newId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
          const newPayload = {
            id: newId,
            ...rowData,
            code: assignedCode,
            trips: [],
            relatives: [],
            flags: {},
            custom_data: { ...rowData },
          };
          await createPersonnel(newPayload);
          localPersonnelList.push(newPayload);
          createdCount++;
        }
      }
    } else if (targetEntity.value === 'relative') {
      for (const rowItem of rowsToImport) {
        const rowData = { ...rowItem.data };
        const parentKeyVal = rowData[selectedMatchParentKeyRelative.value];
        const parentIdx = localPersonnelList.findIndex((p) => {
          const pKeyField = personnelStore.getPersonnelKeyField();
          const targetVal = String(parentKeyVal || '').trim().toLowerCase();
          const candidates = [
            getRecordValue(p, pKeyField),
            getRecordValue(p, selectedMatchParentKeyRelative.value),
            p.cccd,
            p.code,
            p.id,
          ];
          return candidates.some((c) => c && String(c).trim().toLowerCase() === targetVal);
        });

        if (parentIdx < 0) {
          skippedCount++;
          continue;
        }

        const parentPerson = localPersonnelList[parentIdx];
        const currentRels = Array.isArray(parentPerson.relatives) ? [...parentPerson.relatives] : [];
        const existingRelIdx = currentRels.findIndex((r) =>
          isRecordMatched(r, rowData, selectedMatchKeysRelative.value)
        );

        const parentCccd = getRecordValue(parentPerson, personnelStore.getPersonnelKeyField()) || parentPerson.cccd || '';

        if (existingRelIdx >= 0) {
          if (importMode.value === 'skip') {
            skippedCount++;
            continue;
          }
          if (importMode.value === 'replace') {
            currentRels[existingRelIdx] = {
              id: currentRels[existingRelIdx].id,
              personnelId: parentPerson.id,
              parentName: parentPerson.name,
              parentCccd: parentCccd,
              ...rowData,
              custom_data: { ...rowData },
            };
            updatedCount++;
          } else {
            // Upsert
            const mergedCustom = { ...(currentRels[existingRelIdx].custom_data || {}), ...rowData };
            currentRels[existingRelIdx] = {
              ...currentRels[existingRelIdx],
              ...rowData,
              custom_data: mergedCustom,
            };
            updatedCount++;
          }
        } else {
          // Tạo mới thân nhân
          const newRelId = 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
          const relPayload = {
            id: newRelId,
            personnelId: parentPerson.id,
            parentName: parentPerson.name,
            parentCccd: parentCccd,
            ...rowData,
            custom_data: { ...rowData },
          };
          currentRels.push(relPayload);
          createdCount++;
        }

        const updatedParent = {
          ...parentPerson,
          relatives: currentRels,
          custom_data: {
            ...(parentPerson.custom_data || {}),
            relatives: currentRels,
          },
        };
        await updatePersonnel(parentPerson.id, updatedParent);
        localPersonnelList[parentIdx] = updatedParent;
      }
    } else if (targetEntity.value === 'trips') {
      let localStandalone = [...(personnelStore.standaloneTrips || [])];

      for (const rowItem of rowsToImport) {
        const rowData = { ...rowItem.data };
        const personKeyVal = rowData[selectedMatchPersonKeyTrips.value];
        const targetVal = String(personKeyVal || '').trim().toLowerCase();
        const pKeyField = personnelStore.getPersonnelKeyField();
        const rKeyField = personnelStore.getRelativeKeyField ? personnelStore.getRelativeKeyField() : 'cccdthannhan';

        let resolvedPersonIdx = localPersonnelList.findIndex((p) => {
          const candidates = [
            getRecordValue(p, pKeyField),
            getRecordValue(p, selectedMatchPersonKeyTrips.value),
            p.cccd,
            p.code,
            p.id,
          ];
          return candidates.some((c) => c && String(c).trim().toLowerCase() === targetVal);
        });

        let matchedRelative = null;
        if (resolvedPersonIdx < 0) {
          for (let pIdx = 0; pIdx < localPersonnelList.length; pIdx++) {
            const p = localPersonnelList[pIdx];
            const rels = Array.isArray(p.relatives) ? p.relatives : [];
            const r = rels.find((rel) => {
              const candidates = [
                getRecordValue(rel, rKeyField),
                getRecordValue(rel, selectedMatchPersonKeyTrips.value),
                rel.cccd,
                rel.id,
              ];
              return candidates.some((c) => c && String(c).trim().toLowerCase() === targetVal);
            });
            if (r) {
              resolvedPersonIdx = pIdx;
              matchedRelative = r;
              break;
            }
          }
        }

        let resolvedName = rowData.personnelName || rowData.name || '';
        const isRelativeTrip = Boolean(matchedRelative);

        if (resolvedPersonIdx >= 0) {
          const resolvedPerson = localPersonnelList[resolvedPersonIdx];
          if (!resolvedName) {
            resolvedName = matchedRelative ? (matchedRelative.relativeName || matchedRelative.name) : resolvedPerson.name;
          }

          const currentTrips = Array.isArray(resolvedPerson.trips) ? [...resolvedPerson.trips] : [];
          const existingTripIdx = currentTrips.findIndex((t) =>
            isRecordMatched(t, rowData, selectedMatchKeysTrips.value)
          );

          if (existingTripIdx >= 0) {
            if (importMode.value === 'skip') {
              skippedCount++;
              continue;
            }
            if (importMode.value === 'replace') {
              currentTrips[existingTripIdx] = {
                id: currentTrips[existingTripIdx].id,
                personnelId: resolvedPerson.id,
                personnelName: resolvedName,
                cccd: personKeyVal || '',
                isRelative: isRelativeTrip,
                ...rowData,
                custom_data: { ...rowData },
              };
              updatedCount++;
            } else {
              // Upsert
              const mergedCustom = { ...(currentTrips[existingTripIdx].custom_data || {}), ...rowData };
              currentTrips[existingTripIdx] = {
                ...currentTrips[existingTripIdx],
                ...rowData,
                custom_data: mergedCustom,
              };
              updatedCount++;
            }
          } else {
            const newTripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
            const tripPayload = {
              id: newTripId,
              personnelId: resolvedPerson.id,
              personnelName: resolvedName,
              cccd: personKeyVal || '',
              isRelative: isRelativeTrip,
              ...rowData,
              custom_data: { ...rowData },
            };
            currentTrips.push(tripPayload);
            createdCount++;
          }

          const updatedParent = {
            ...resolvedPerson,
            trips: currentTrips,
            custom_data: {
              ...(resolvedPerson.custom_data || {}),
              trips: currentTrips,
            },
          };
          await updatePersonnel(resolvedPerson.id, updatedParent);
          localPersonnelList[resolvedPersonIdx] = updatedParent;
        } else {
          // Lưu chuyến đi độc lập
          const existingTripIdx = localStandalone.findIndex((t) =>
            isRecordMatched(t, rowData, selectedMatchKeysTrips.value)
          );

          if (existingTripIdx >= 0) {
            if (importMode.value === 'skip') {
              skippedCount++;
              continue;
            }
            if (importMode.value === 'replace') {
              const updatedTrip = {
                id: localStandalone[existingTripIdx].id,
                personnelId: '',
                personnelName: resolvedName,
                cccd: personKeyVal || '',
                isRelative: false,
                ...rowData,
                custom_data: { ...rowData },
              };
              await personnelStore.addStandaloneTrip(updatedTrip);
              localStandalone[existingTripIdx] = updatedTrip;
              updatedCount++;
            } else {
              const mergedCustom = { ...(localStandalone[existingTripIdx].custom_data || {}), ...rowData };
              const updatedTrip = {
                ...localStandalone[existingTripIdx],
                ...rowData,
                custom_data: mergedCustom,
              };
              await personnelStore.addStandaloneTrip(updatedTrip);
              localStandalone[existingTripIdx] = updatedTrip;
              updatedCount++;
            }
          } else {
            const newTripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
            const tripPayload = {
              id: newTripId,
              personnelId: '',
              personnelName: resolvedName,
              cccd: personKeyVal || '',
              isRelative: false,
              ...rowData,
              custom_data: { ...rowData },
            };
            await personnelStore.addStandaloneTrip(tripPayload);
            localStandalone.push(tripPayload);
            createdCount++;
          }
        }
      }
    }

    // Refresh store
    await personnelStore.fetchPersonnel();

    resultReport.value = {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    };

    currentStep.value = 4;
  } catch (err) {
    alert('Lỗi trong quá trình nạp dữ liệu: ' + (err.message || err));
  } finally {
    importing.value = false;
  }
};

const getTargetEntityLabel = (target) => {
  if (target === 'personnel') return 'Hồ sơ Cán bộ (Cá nhân)';
  if (target === 'relative') return 'Hồ sơ Thân nhân';
  if (target === 'trips') return 'Hồ sơ Chuyến đi nước ngoài';
  return target;
};

const getImportModeLabel = (mode) => {
  if (mode === 'upsert') return 'Cập nhật & Thêm mới (Giữ dữ liệu cũ)';
  if (mode === 'replace') return 'Ghi đè thay thế hoàn toàn';
  if (mode === 'skip') return 'Chỉ thêm mới (Bỏ qua nếu đã có)';
  return mode;
};
</script>

<style scoped>
.import-wizard-dialog :deep(.p-dialog-content) {
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
}

.wizard-container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  max-height: 850px;
  background: #ffffff;
}

/* 1. Header & Stepper */
.wizard-header {
  padding: 16px 24px 12px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.wizard-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.badge-prefix {
  background: #2563eb;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.wizard-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-close-wizard {
  background: transparent;
  border: none;
  font-size: 1rem;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.btn-close-wizard:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Stepper */
.stepper-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  transition: all 0.2s ease;
}
.step-item.active {
  opacity: 1;
}
.step-item.completed {
  opacity: 0.9;
}

.step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-item.active .step-circle {
  background: #2563eb;
  color: #ffffff;
}
.step-item.completed .step-circle {
  background: #16a34a;
  color: #ffffff;
}

.step-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
}

.step-divider {
  flex: 1;
  max-width: 60px;
  height: 2px;
  background: #e2e8f0;
}
.step-divider.completed {
  background: #16a34a;
}

/* 2. Body Content */
.wizard-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* Step 1 Styles */
.step-1-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #1e293b;
}

.target-type-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.target-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}
.target-card:hover {
  border-color: #93c5fd;
  background: #f8fafc;
}
.target-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.target-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.bg-blue { background: #dbeafe; color: #1d4ed8; }
.bg-green { background: #dcfce7; color: #15803d; }
.bg-purple { background: #f3e8ff; color: #7e22ce; }

.target-info {
  flex: 1;
  min-width: 0;
}
.target-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
}
.target-sub {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 2px;
}
.check-icon {
  color: #2563eb;
  font-size: 1.1rem;
}

/* Mode selector */
.mode-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}

.mode-card {
  padding: 12px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}
.mode-card:hover {
  border-color: #cbd5e1;
}
.mode-card.selected {
  border-color: #16a34a;
  background: #f0fdf4;
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.badge-recommended {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.mode-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
}
.mode-desc {
  font-size: 0.73rem;
  color: #64748b;
  margin: 0;
  line-height: 1.35;
}

.template-quick-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Match Keys Selector (Step 1) */
.match-keys-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
}
.match-keys-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: #64748b;
  margin-bottom: 8px;
}
.match-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 0.78rem;
}
.match-link-label {
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}
.match-select {
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.78rem;
  background: #ffffff;
  color: #1e293b;
  outline: none;
}
.match-select:focus {
  border-color: #3b82f6;
}
.match-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.match-chip-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 0.76rem;
  color: #334155;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}
.match-chip-item:hover {
  border-color: #93c5fd;
  background: #f0f9ff;
}
.match-chip-item.selected {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1e40af;
  font-weight: 600;
}
.chip-label {
  line-height: 1.2;
}
.chip-badge-key {
  font-size: 0.65rem;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
}
.chip-id {
  font-size: 0.68rem;
  color: #94a3b8;
}
.match-summary-card {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 4px;
}

.template-guide-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.74rem;
  color: #1e40af;
  line-height: 1.35;
}

/* Dropzone */
.excel-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 28px 20px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}
.excel-dropzone:hover, .excel-dropzone.is-dragging {
  border-color: #2563eb;
  background: #eff6ff;
}
.excel-dropzone.has-file {
  border-style: solid;
  border-color: #93c5fd;
  background: #f0fdf4;
  padding: 14px 18px;
}

.dropzone-icon {
  font-size: 2.2rem;
  color: #16a34a;
  margin-bottom: 8px;
}
.dropzone-text {
  font-size: 0.88rem;
  color: #334155;
  font-weight: 600;
}
.browse-link {
  color: #2563eb;
  text-decoration: underline;
}
.dropzone-hint {
  font-size: 0.74rem;
  color: #94a3b8;
  margin-top: 4px;
}

.file-loaded-box {
  display: flex;
  align-items: center;
  gap: 12px;
}
.file-icon {
  font-size: 1.8rem;
  color: #16a34a;
}
.file-details {
  flex: 1;
  text-align: left;
}
.file-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}
.file-meta {
  font-size: 0.74rem;
  color: #64748b;
  margin-top: 2px;
}

/* Sheet Pills */
.sheet-tabs-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.sheet-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.sheet-pill-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sheet-pill-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

/* Step 2 Styles (Preview Grid) */
.step-2-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.stats-counter {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-total { color: #334155; }
.stat-separator { color: #cbd5e1; }
.stat-issues { color: #64748b; }
.stat-issues.has-error {
  color: #dc2626;
  font-weight: 700;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.filter-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}

.btn-export-issues {
  background: #ffffff;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-export-issues:hover {
  background: #fee2e2;
}

.preview-grid-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 520px;
}

.preview-grid-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.78rem;
}

.preview-grid-table th {
  position: sticky;
  top: 0;
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
  padding: 8px 10px;
  border-bottom: 2px solid #cbd5e1;
  text-align: left;
  z-index: 10;
  white-space: nowrap;
}

.preview-grid-table td {
  padding: 4px 6px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.preview-grid-table tr:hover td {
  background: #f8fafc;
}

.preview-grid-table tr.row-has-issue td {
  background: #fff5f5;
}

.col-row-idx {
  text-align: center;
}
.row-num-badge {
  font-weight: 700;
  color: #64748b;
  font-size: 0.75rem;
}
.row-num-badge.is-issue {
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 6px;
  border-radius: 4px;
}

.editable-cell {
  padding: 2px 4px !important;
}

.cell-input {
  width: 100%;
  height: 28px;
  padding: 2px 6px;
  font-size: 0.78rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #1e293b;
  outline: none;
  transition: all 0.15s ease;
}
.cell-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.cell-invalid .cell-input {
  border-color: #ef4444;
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
}

.issue-pill-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.issue-pill {
  font-size: 0.7rem;
  color: #b91c1c;
  font-weight: 600;
  line-height: 1.25;
}
.text-valid {
  color: #16a34a;
  font-size: 0.72rem;
  font-weight: 600;
}

/* Step 3 Styles */
.step-3-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.confirm-hero-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 16px 20px;
}
.confirm-icon {
  font-size: 2rem;
  color: #2563eb;
}
.confirm-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e3a8a;
}
.confirm-sub {
  margin: 4px 0 0 0;
  font-size: 0.78rem;
  color: #1e40af;
}

.summary-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid #e2e8f0;
}
.summary-num {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.2;
}
.summary-label {
  font-size: 0.74rem;
  color: #64748b;
  margin-top: 4px;
  font-weight: 600;
}

.card-total { background: #f8fafc; .summary-num { color: #334155; } }
.card-valid { background: #f0fdf4; border-color: #bbf7d0; .summary-num { color: #16a34a; } }
.card-create { background: #eff6ff; border-color: #bfdbfe; .summary-num { color: #2563eb; } }
.card-update { background: #fefce8; border-color: #fef08a; .summary-num { color: #ca8a04; } }
.card-skip { background: #fef2f2; border-color: #fecaca; .summary-num { color: #dc2626; } }

.warning-alert-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  line-height: 1.35;
}

/* Step 4 Styles */
.step-4-content {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.result-card {
  text-align: center;
  max-width: 500px;
  width: 100%;
}
.result-icon-success {
  font-size: 3.5rem;
  color: #16a34a;
  margin-bottom: 12px;
}
.result-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.result-desc {
  font-size: 0.84rem;
  color: #64748b;
  margin: 6px 0 20px 0;
}

.result-stats-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.result-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
}
.rs-label { color: #475569; font-weight: 500; }
.rs-val { font-weight: 700; }
.rs-green { color: #16a34a; }
.rs-blue { color: #2563eb; }
.rs-orange { color: #ea580c; }

/* 3. Footer */
.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-wrap: wrap;
  gap: 10px;
}

.footer-hint {
  font-size: 0.78rem;
  color: #64748b;
  font-style: italic;
}

.footer-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
