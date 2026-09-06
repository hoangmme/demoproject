<template>
  <div class="app-content">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <div>
        <h1 style="font-size: 1.35rem; font-weight: 700; color: #1f2937; margin: 0;">
          Cấu hình Cột & Mẫu Dữ liệu Excel
        </h1>
        <p style="font-size: 0.85rem; color: #6b7280; margin: 4px 0 0 0;">
          Tùy chỉnh thứ tự cột, dời vị trí, nhãn hiển thị và định dạng trường thông tin.
        </p>
      </div>

      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <!-- Nút Xuất toàn bộ dữ liệu web thực tế 3 sheet -->
        <Button
          v-if="activeTab === 'personnel' || activeTab === 'relative' || activeTab === 'trips'"
          label="Xuất Dữ Liệu Web (3 Sheet)"
          icon="pi pi-file-excel"
          severity="primary"
          size="small"
          @click="handleExportAllInOneData"
          style="font-size: 0.8rem; font-weight: 700;"
          title="Xuất toàn bộ dữ liệu thực tế đang có trên hệ thống ra 1 file Excel gồm 3 Sheet: Cán bộ, Thân nhân, Chuyến đi"
        />

        <!-- Nút Tải file mẫu Tổng hợp 3 Sheet -->
        <Button
          v-if="activeTab === 'personnel' || activeTab === 'relative' || activeTab === 'trips'"
          label="Tải Mẫu Tổng Hợp (3 Sheet)"
          icon="pi pi-download"
          severity="secondary"
          outlined
          size="small"
          @click="handleExportAllInOneTemplate"
          style="font-size: 0.8rem; font-weight: 600;"
        />

        <!-- Nút Tải file mẫu Excel theo tab hiện tại -->
        <Button
          v-if="activeTab === 'personnel' || activeTab === 'relative' || activeTab === 'trips'"
          :label="`Tải Mẫu Đơn (${getTabName(activeTab)})`"
          icon="pi pi-download"
          severity="secondary"
          outlined
          size="small"
          @click="handleExportCurrentTabExcel(activeTab)"
          style="font-size: 0.8rem;"
        />

        <!-- Nút Mở Công cụ Nhập Bảng & List (/bang-tuy-chinh) -->
        <Button
          label="🛠️ Công cụ Nhập Bảng & List"
          icon="pi pi-external-link"
          severity="help"
          outlined
          size="small"
          @click="openTableHelper"
          style="font-size: 0.8rem; font-weight: 600;"
          title="Mở công cụ hỗ trợ cán bộ/đơn vị soạn thảo Bảng lặp và List dữ liệu để dán vào Excel"
        />

        <!-- Nút Lưu Cấu hình -->
        <Button
          label="Lưu Cấu hình"
          icon="pi pi-save"
          severity="success"
          size="small"
          :loading="saving"
          @click="saveConfig"
          style="font-size: 0.8rem; font-weight: 700;"
        />
      </div>
    </div>

    <!-- Tabs Navigation (Segmented Pill Style) -->
    <div style="display: flex; gap: 6px; background: #f1f5f9; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0; width: fit-content; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'personnel' }"
        @click="activeTab = 'personnel'"
      >
        <i class="pi pi-user"></i>
        <span>Cấu hình Cột Cán bộ (Cá nhân)</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'relative' }"
        @click="activeTab = 'relative'"
      >
        <i class="pi pi-users"></i>
        <span>Cấu hình Cột Thân nhân</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'trips' }"
        @click="activeTab = 'trips'"
      >
        <i class="pi pi-send"></i>
        <span>Cấu hình Cột Chuyến đi</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'dashboard' }"
        @click="activeTab = 'dashboard'"
      >
        <i class="pi pi-send"></i>
        <span>Quản lý Chuyên đề</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'tags' }"
        @click="activeTab = 'tags'"
      >
        <i class="pi pi-tags"></i>
        <span>Bảng Tra cứu Mã Thẻ Tag</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'appendices' }"
        @click="activeTab = 'appendices'"
      >
        <i class="pi pi-file-excel"></i>
        <span>Quản lý Báo cáo Phụ lục</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'general' }"
        @click="activeTab = 'general'"
      >
        <i class="pi pi-image"></i>
        <span>Tùy chỉnh Ảnh Nền Đăng nhập</span>
      </button>
    </div>

    <!-- Main Content: Tab 1, 2, 3 (Cấu hình Cột Cán bộ, Thân nhân, Chuyến đi) -->
    <div v-if="activeTab === 'personnel' || activeTab === 'relative' || activeTab === 'trips'" class="app-card" style="padding: 1.25rem;">
      <!-- Khung Cấu hình Khóa Định Danh & Khóa Liên Kết -->
      <div style="margin-bottom: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px;">
        <!-- Khi ở Tab Cán bộ -->
        <div v-if="activeTab === 'personnel'" style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center;">
                <i class="pi pi-key" style="color: #dc2626; font-size: 1.1rem;"></i>
              </div>
              <div>
                <div style="font-size: 0.86rem; font-weight: 700; color: #1e293b;">
                  Cột Khóa Định danh Duy nhất (Primary Unique Key) của Cán bộ:
                </div>
                <div style="font-size: 0.73rem; color: #64748b; margin-top: 2px;">
                  Dùng để định danh chống trùng lặp cán bộ và làm khóa móc nối liên kết với thân nhân.
                </div>
              </div>
            </div>

            <div style="min-width: 280px;">
              <select v-model="personnelKeyField" class="custom-key-select">
                <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                  {{ col.label }} (mã: {{ col.id }})
                </option>
              </select>
            </div>
          </div>

          <!-- Vai trò cốt lõi: Họ tên, Chức vụ, Đơn vị -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
            <div>
              <span style="font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px;">
                <i class="pi pi-user" style="color: #2563eb;"></i> Cột Họ và tên chính:
              </span>
              <select v-model="personnelNameField" class="custom-key-select" style="margin-top: 4px; font-size: 0.78rem;">
                <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                  {{ col.label }} (mã: {{ col.id }})
                </option>
              </select>
            </div>

            <div>
              <span style="font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px;">
                <i class="pi pi-briefcase" style="color: #059669;"></i> Cột Chức vụ (hiển thị kèm):
              </span>
              <select v-model="personnelPositionField" class="custom-key-select" style="margin-top: 4px; font-size: 0.78rem;">
                <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                  {{ col.label }} (mã: {{ col.id }})
                </option>
              </select>
            </div>

            <div>
              <span style="font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px;">
                <i class="pi pi-building" style="color: #7c3aed;"></i> Cột Đơn vị công tác (hiển thị kèm):
              </span>
              <select v-model="personnelDepartmentField" class="custom-key-select" style="margin-top: 4px; font-size: 0.78rem;">
                <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                  {{ col.label }} (mã: {{ col.id }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Khi ở Tab Thân nhân -->
        <div v-else-if="activeTab === 'relative'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-link" style="color: #0284c7; font-size: 0.95rem;"></i>
              <strong style="color: #1e293b; font-size: 0.82rem;">1. Cột Liên kết Cán bộ liên quan (Parent Link Key):</strong>
            </div>
            <select v-model="relativeParentKeyField" class="custom-key-select">
              <option v-for="col in availableRelativeCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
            <span style="font-size: 0.7rem; color: #64748b;">(Cột chứa số CCCD / Mã định danh của Cán bộ cha/mẹ mà thân nhân trực thuộc)</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-id-card" style="color: #16a34a; font-size: 0.95rem;"></i>
              <strong style="color: #1e293b; font-size: 0.82rem;">2. Cột Định danh riêng Thân nhân (Relative Unique Key):</strong>
            </div>
            <select v-model="relativeKeyField" class="custom-key-select">
              <option v-for="col in availableRelativeCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
            <span style="font-size: 0.7rem; color: #64748b;">(Cột chứa số CCCD / Mã định danh riêng của từng Thân nhân)</span>
          </div>
        </div>

        <!-- Khi ở Tab Chuyến đi -->
        <div v-else style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-link" style="color: #0284c7; font-size: 0.95rem;"></i>
            <strong style="color: #1e293b; font-size: 0.82rem;">Cột Liên kết Đối tượng chuyến đi (Trip Link Key / cccdchuyendi):</strong>
          </div>
          <select v-model="tripKeyField" class="custom-key-select" style="max-width: 480px;">
            <option v-for="col in availableTripCols" :key="col.id" :value="col.id">
              {{ col.label }} (mã: {{ col.id }})
            </option>
          </select>
          <span style="font-size: 0.72rem; color: #64748b;">(Cột trong bảng Chuyến đi chứa số CCCD / Mã định danh của người đi. Hệ thống tự động nhận diện gán vào Cán bộ nếu khớp CCCD Cán bộ, hoặc vào Thân nhân nếu khớp CCCD Thân nhân)</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 0.95rem; font-weight: 700; color: #1f2937;">
          Danh sách Nhóm & Cột dữ liệu ({{ activeTab === 'personnel' ? 'Hồ sơ Cán bộ' : (activeTab === 'relative' ? 'Hồ sơ Thân nhân' : 'Thông tin Chuyến đi') }})
        </span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <Button
            v-if="activeTab === 'trips'"
            label="Tạo 20 Chuyến đi mẫu (10 CB & 10 TN)"
            icon="pi pi-bolt"
            size="small"
            severity="warn"
            :loading="isSeedingData"
            @click="handleSeedTrips"
            style="font-size: 0.8rem;"
          />
          <Button
            label="Thêm Nhóm mới"
            icon="pi pi-plus-circle"
            size="small"
            severity="primary"
            @click="addGroup"
            style="font-size: 0.8rem;"
          />
        </div>
      </div>

      <!-- Columns List -->
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">
        <div v-for="(group, gIdx) in currentGroups" :key="gIdx" style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Group Header -->
          <div style="padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb; border-top-left-radius: 12px; border-top-right-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
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

            <div style="display: flex; align-items: center; gap: 4px;">
              <Button
                icon="pi pi-arrow-up"
                severity="secondary"
                text
                size="small"
                :disabled="gIdx === 0"
                @click="moveGroupUp(gIdx)"
                title="Dời nhóm lên trên"
                style="width: 28px; height: 28px; padding: 0;"
              />
              <Button
                icon="pi pi-arrow-down"
                severity="secondary"
                text
                size="small"
                :disabled="gIdx === currentGroups.length - 1"
                @click="moveGroupDown(gIdx)"
                title="Dời nhóm xuống dưới"
                style="width: 28px; height: 28px; padding: 0;"
              />
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
          </div>

          <!-- Group Columns List -->
          <div style="padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 10px;">
            <div
              v-for="(col, cIdx) in group.columns"
              :key="cIdx"
              style="display: flex; flex-direction: column; gap: 6px; padding: 8px 12px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; font-size: 0.8rem;"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <!-- Move Buttons + Column Badge + Field ID + Field Label -->
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px;">
                  <!-- Move Up / Down Buttons -->
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <button
                      type="button"
                      class="btn-reorder"
                      :disabled="gIdx === 0 && cIdx === 0"
                      @click="moveColumn(gIdx, cIdx, -1)"
                      title="Dời cột lên trên (Ví dụ từ cột 17 lên 16)"
                    >
                      <i class="pi pi-chevron-up" style="font-size: 0.62rem;"></i>
                    </button>
                    <button
                      type="button"
                      class="btn-reorder"
                      :disabled="gIdx === currentGroups.length - 1 && cIdx === group.columns.length - 1"
                      @click="moveColumn(gIdx, cIdx, 1)"
                      title="Dời cột xuống dưới"
                    >
                      <i class="pi pi-chevron-down" style="font-size: 0.62rem;"></i>
                    </button>
                  </div>

                  <span class="badge-pill badge-green" style="font-weight: 700; font-size: 0.72rem; min-width: 68px; justify-content: center;">
                    {{ getColLabelBadge(gIdx, cIdx) }}
                  </span>
                  
                  <!-- Editable/Readable Field ID -->
                  <InputText
                    v-model="col.id"
                    placeholder="Mã ID"
                    size="small"
                    style="font-family: monospace; font-size: 0.75rem; width: 140px; background: #f1f5f9; color: #334155; font-weight: 600;"
                    title="Mã trường hệ thống (ID)"
                  />

                  <InputText
                    v-model="col.label"
                    placeholder="Tên nhãn hiển thị"
                    size="small"
                    style="font-size: 0.8rem; flex: 1;"
                    @blur="onLabelBlur(col)"
                  />
                </div>

                <!-- Format & Width Settings using clean native selects -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <!-- Checkbox Bắt buộc nhập -->
                  <label
                    style="display: flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 600; cursor: pointer; user-select: none; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; white-space: nowrap;"
                    :title="col.required ? 'Đang BẮT BUỘC có dữ liệu mới được lưu file/hồ sơ' : 'Không bắt buộc nhập (Tùy chọn)'"
                  >
                    <input
                      type="checkbox"
                      v-model="col.required"
                      style="accent-color: #dc2626; width: 14px; height: 14px; cursor: pointer;"
                    />
                    <span :style="{ color: col.required ? '#dc2626' : '#64748b', fontWeight: col.required ? '700' : '600' }">
                      {{ col.required ? '★ Bắt buộc' : 'Bắt buộc' }}
                    </span>
                  </label>

                  <!-- Nút tick ẩn khi nhập chuyến đi cho Thân nhân -->
                  <label
                    v-if="activeTab === 'trips'"
                    style="display: flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 600; cursor: pointer; user-select: none; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; white-space: nowrap;"
                    :title="col.hideForRelative ? 'Đang ẨN trường này khi nhập chuyến đi của Thân nhân' : 'Trường này sẽ hiển thị khi nhập chuyến đi của Thân nhân'"
                  >
                    <input
                      type="checkbox"
                      v-model="col.hideForRelative"
                      style="accent-color: #ea580c; width: 14px; height: 14px; cursor: pointer;"
                    />
                    <span :style="{ color: col.hideForRelative ? '#c2410c' : '#475569', fontWeight: col.hideForRelative ? '700' : '600' }">
                      Ẩn với thân nhân
                    </span>
                  </label>

                  <select
                    v-model="col.format"
                    class="custom-col-select"
                    style="width: 175px;"
                    title="Định dạng dữ liệu"
                  >
                    <option v-for="opt in formatOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>

                  <select
                    v-model="col.width"
                    class="custom-col-select"
                    style="width: 110px;"
                    title="Độ rộng hiển thị Form"
                  >
                    <option v-for="w in widthOptions" :key="w.value" :value="w.value">
                      {{ w.label }}
                    </option>
                  </select>

                  <select
                    v-model="col.tableWidth"
                    class="custom-col-select"
                    style="width: 90px; height: 28px; font-size: 0.72rem;"
                    title="Độ rộng cột trong bảng. Để trống = mặc định."
                  >
                    <option value="">Mặc định</option>
                    <option value="auto">Auto</option>
                    <option value="5%">5%</option>
                    <option value="10%">10%</option>
                    <option value="15%">15%</option>
                    <option value="20%">20%</option>
                    <option value="25%">25%</option>
                    <option value="30%">30%</option>
                  </select>

                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    @click="removeColumn(gIdx, cIdx)"
                    style="padding: 2px 4px;"
                    title="Xóa cột này"
                  />
                </div>
              </div>

              <!-- Options Config (for Checkbox, Checkbox_Text, Checkbox_File, Checkbox_File_Loop, Dropdown, Table Loop) -->
              <div
                v-if="col.format === 'checkbox' || col.format === 'checkbox_text' || col.format === 'checkbox_file' || col.format === 'checkbox_file_loop' || col.format === 'dropdown' || col.format === 'table_2col' || col.format === 'table_loop'"
                style="padding-left: 104px; display: flex; flex-direction: column; gap: 4px;"
              >
                <div style="display: flex; align-items: center; gap: 8px;">
                  <i class="pi pi-list" style="font-size: 0.75rem; color: #6b7280;"></i>
                  <InputText
                    v-model="col.options"
                    :placeholder="col.format === 'checkbox_file_loop' ? 'Tùy chọn: Danh sách mục mẫu ban đầu (cách nhau dấu phẩy, VD: Đơn xin phép, Hộ chiếu, Công văn cử đi)' : (col.format === 'table_2col' || col.format === 'table_loop') ? 'Cấu hình các tiêu đề cột (cách nhau bởi dấu phẩy, VD: Từ ngày, Đến ngày, Đơn vị, Chức vụ)' : 'Danh sách tùy chọn (cách nhau bởi dấu phẩy, VD: Ngân sách, Tự túc, Học bổng, Tài trợ)'"
                    size="small"
                    style="font-size: 0.75rem; width: 100%;"
                  />
                </div>

                <!-- Checkbox_file_loop: Cấu hình Chọn duy nhất / Chọn nhiều và xem trước các hộp kiểm -->
                <div v-if="col.format === 'checkbox_file_loop'" style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <input
                      type="checkbox"
                      v-model="col.isSingleSelect"
                      :id="'single_sel_' + (col.id || cIdx)"
                      style="accent-color: #2563eb; cursor: pointer; width: 15px; height: 15px;"
                    />
                    <label :for="'single_sel_' + (col.id || cIdx)" style="font-size: 0.74rem; color: #1e40af; font-weight: 700; cursor: pointer;">
                      🔘 Chọn duy nhất 1 mục (Single Choice - Chỉ tick chọn 1 hộp kiểm)
                    </label>
                  </div>
                  <span style="font-size: 0.7rem; color: #64748b; font-style: italic; padding-left: 21px;">
                    (Nếu không tích tùy chọn trên: Cho phép tick chọn cùng lúc cả 2 hoặc nhiều hộp kiểm)
                  </span>

                  <!-- Xem trước danh sách các hộp kiểm sẽ hiển thị trong Form -->
                  <div v-if="col.options && col.options.trim()" style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 2px; padding-left: 21px;">
                    <span style="font-size: 0.7rem; color: #166534; font-weight: 600;">Các hộp kiểm tạo sẵn trong Form:</span>
                    <span
                      v-for="(opt, oIdx) in col.options.split(',').map(s => s.trim()).filter(Boolean)"
                      :key="oIdx"
                      style="font-size: 0.7rem; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1px 8px; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"
                    >
                      <i :class="col.isSingleSelect ? 'pi pi-circle' : 'pi pi-check-square'" style="font-size: 0.65rem;"></i>
                      {{ opt }}
                    </span>
                  </div>
                </div>
                
                <!-- Sub-columns Excel breakdown preview (Only for checkbox_text) -->
                <div v-if="col.format === 'checkbox_text' && getSubOptions(col).length > 1" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 0.7rem; color: #6b7280; font-weight: 600;">Sẽ xuất ra {{ getSubOptions(col).length }} cột Excel riêng biệt:</span>
                  <span
                    v-for="(subOpt, sIdx) in getSubOptions(col)"
                    :key="sIdx"
                    style="font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-weight: 600;"
                  >
                    Cột +{{ sIdx }}: {{ subOpt }}
                  </span>
                </div>
              </div>

              <!-- Formula Builder Config (When format === 'formula') -->
              <div
                v-if="col.format === 'formula'"
                style="margin-left: 104px; margin-top: 4px; display: flex; flex-direction: column; gap: 8px; background: #f0fdf4; padding: 10px 14px; border-radius: 8px; border: 1px solid #bbf7d0;"
              >
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <i class="pi pi-calculator" style="color: #16a34a; font-size: 0.85rem;"></i>
                    <span style="font-size: 0.78rem; font-weight: 700; color: #166534;">Cấu hình Công thức Tự động:</span>
                  </div>
                  <select v-model="col.formulaType" class="custom-col-select" style="width: auto; min-width: 260px; height: 28px; font-size: 0.75rem; font-weight: 600;">
                    <option value="presence_status">Trạng thái Hiện diện (Trong nước / Nước ngoài)</option>
                    <option value="overdue_status">Quá hạn chưa về</option>
                    <option value="date_delta">So sánh 2 cột ngày (Sớm / Muộn / Đúng lịch)</option>
                    <option value="conditional_check">Kiểm tra điều kiện (Cảnh báo khi thiếu dữ liệu)</option>
                    <option value="depart_before_decision">Đi trước khi có quyết định</option>
                    <option value="trips_count_in_year">Số lần xuất cảnh trong năm</option>
                  </select>
                </div>

                <!-- 1. Trạng thái Hiện diện & Chấp hành thời hạn -->
                <div v-if="!col.formulaType || col.formulaType === 'presence_status'" style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 0.72rem; color: #15803d; line-height: 1.4;">
                    💡 <strong>Nguyên lý:</strong> Tự động tính toán vị trí thực tế kết hợp đối chiếu <strong>Thời gian duyệt về (Deadline)</strong>:
                    <ul style="margin: 2px 0 0 16px; padding: 0;">
                      <li>Nếu đã nhập cảnh &le; Deadline &rarr; <strong>"Đã về nước"</strong>.</li>
                      <li>Nếu đã nhập cảnh &gt; Deadline &rarr; <strong>"Đã về nước (quá hạn X ngày)"</strong>.</li>
                      <li>Nếu đã xuất cảnh, chưa về và Today &le; Deadline &rarr; <strong>"Đang ở nước ngoài: [Quốc gia]"</strong>.</li>
                      <li>Nếu đã xuất cảnh, chưa về và Today &gt; Deadline &rarr; <strong>"Chưa về nước (quá hạn X ngày)"</strong>.</li>
                    </ul>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày Xuất cảnh (Đi):</span>
                      <select v-model="col.formulaDepartureCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định hệ thống (departureDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày Nhập cảnh (Về):</span>
                      <select v-model="col.formulaArrivalCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định hệ thống (arrivalDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Thời gian duyệt về (Deadline):</span>
                      <select v-model="col.formulaApprovedArrivalCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định (approvedArrivalDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Quốc gia (Tùy chọn):</span>
                      <select v-model="col.formulaCountryCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định (countryName) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Đã về nước (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelDomestic"
                        placeholder="Mặc định: Đã về nước"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Đang ở nước ngoài (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelAbroad"
                        placeholder="Mặc định: Đang ở nước ngoài"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Chưa về nước vượt hạn (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelNotReturnedYet"
                        placeholder="Mặc định: Chưa về nước"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Từ khóa khi Quá hạn (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelOverdue"
                        placeholder="Mặc định: quá hạn"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                  </div>
                </div>

                <!-- 2. Quá hạn chưa về -->
                <div v-else-if="col.formulaType === 'overdue_status'" style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 0.72rem; color: #b91c1c; line-height: 1.4;">
                    💡 <strong>Nguyên lý:</strong> So sánh <strong>Ngày nhập cảnh thực tế</strong> với <strong>Thời gian duyệt về (deadline)</strong>. Nếu đã nhập cảnh và đúng hạn → <strong>"Đã nhập cảnh đúng hạn"</strong>. Nếu Today vượt deadline → <strong>"Quá hạn (kèm số ngày)"</strong>. Ngược lại → <strong>"Chưa quá hạn"</strong>.
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày Nhập cảnh (Về) / Ngày về dự kiến:</span>
                      <select v-model="col.formulaArrivalCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định hệ thống (arrivalDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Thời gian duyệt về (Deadline):</span>
                      <select v-model="col.formulaApprovedArrivalCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định (approvedArrivalDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Quá hạn (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelOverdue"
                        placeholder="Mặc định: Quá hạn"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Chưa về nước (Vượt deadline):</span>
                      <input
                        v-model="col.formulaLabelNotReturnedYet"
                        placeholder="Mặc định: Chưa về nước"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Đúng hạn (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelOntime"
                        placeholder="Mặc định: Đúng hạn"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Chưa quá hạn (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelNotYet"
                        placeholder="Mặc định: Chưa quá hạn"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                  </div>
                </div>

                <!-- 3. So sánh 2 cột ngày -->
                <div v-else-if="col.formulaType === 'date_delta'" style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 0.72rem; color: #0369a1; line-height: 1.4;">
                    💡 <strong>Nguyên lý:</strong> So sánh <strong>Cột Ngày A (thực tế)</strong> với <strong>Cột Ngày B (theo QĐ/kế hoạch)</strong>. Nếu A &lt; B → <strong>Sớm</strong>. Nếu A &gt; B → <strong>Muộn</strong>. Bằng nhau → <strong>Đúng lịch</strong>. Kèm số ngày chênh lệch.
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày A (Thực tế):</span>
                      <select v-model="col.formulaColA" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Chọn cột --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày B (Theo QĐ/Kế hoạch):</span>
                      <select v-model="col.formulaColB" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Chọn cột --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Sớm (A &lt; B):</span>
                      <input v-model="col.formulaLabelEarly" placeholder="Mặc định: Sớm" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Muộn (A &gt; B):</span>
                      <input v-model="col.formulaLabelLate" placeholder="Mặc định: Muộn" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi Đúng lịch (A = B):</span>
                      <input v-model="col.formulaLabelOnTime" placeholder="Mặc định: Đúng lịch" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" />
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <input type="checkbox" v-model="col.formulaShowDays" :id="'showDays_' + col.id" style="margin: 0;" />
                      <label :for="'showDays_' + col.id" style="font-size: 0.72rem; color: #475569; cursor: pointer;">Hiển thị số ngày chênh lệch</label>
                    </div>
                  </div>
                </div>

                <!-- 4. Kiểm tra điều kiện -->
                <div v-else-if="col.formulaType === 'conditional_check'" style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 0.72rem; color: #c2410c; line-height: 1.4;">
                    💡 <strong>Nguyên lý:</strong> Nếu <strong>Cột Điều kiện</strong> có giá trị nhưng <strong>Cột Kiểm tra</strong> rỗng → hiển thị <strong>Cảnh báo</strong>. Ví dụ: Nếu Ngày xuất cảnh có nhưng Số quyết định rỗng → "⚠️ Xuất cảnh chưa có QĐ".
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Điều kiện (Phải có giá trị):</span>
                      <select v-model="col.formulaColCondition" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Chọn cột --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Kiểm tra (Phải rỗng → Cảnh báo):</span>
                      <select v-model="col.formulaColCheck" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Chọn cột --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn Cảnh báo:</span>
                      <input v-model="col.formulaLabelWarning" placeholder="Mặc định: ⚠️ Cảnh báo" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn khi OK (Tùy chọn):</span>
                      <input v-model="col.formulaLabelOk" placeholder="Để trống nếu không cần" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" />
                    </div>
                  </div>
                </div>

                <!-- 5. Đi trước khi có quyết định -->
                <div v-else-if="col.formulaType === 'depart_before_decision'" style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 0.72rem; color: #b45309; line-height: 1.4;">
                    💡 <strong>Nguyên lý:</strong> So sánh <strong>Ngày Đi (Xuất cảnh)</strong> với <strong>Ngày Ban Hành (Quyết định)</strong>. Nếu Ngày Đi &lt; Ngày Ban Hành → hiển thị <strong>"Đi trước khi có quyết định"</strong>. Ngược lại hoặc thiếu ngày → để trống.
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày Đi (Xuất cảnh):</span>
                      <select v-model="col.formulaColDep" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định (departureDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày Ban Hành (Quyết định):</span>
                      <select v-model="col.formulaColDecDate" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định (decisionDate) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Nhãn hiển thị (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelWarning"
                        placeholder="Mặc định: Đi trước khi có quyết định"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                  </div>
                </div>

                <!-- 6. Số lần xuất cảnh trong năm -->
                <div v-else-if="col.formulaType === 'trips_count_in_year'" style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="font-size: 0.72rem; color: #7c2d12; line-height: 1.4;">
                    💡 <strong>Nguyên lý:</strong> Tự động tính <strong>tổng số lần xuất cảnh trong cùng 1 năm</strong> của Cán bộ (dựa theo Cột Ngày xuất cảnh). Giá trị hiển thị là số lần (ví dụ: <em>1 lần</em>, <em>2 lần</em>, <em>3 lần</em>...). Sau đó bạn có thể đặt điều kiện lọc trên Thẻ KPI (ví dụ: chọn cột này và toán tử <strong>&gt;= 2</strong> hoặc <strong>&gt; 2</strong>).
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px;">
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Cột Ngày Xuất cảnh (Đi):</span>
                      <select v-model="col.formulaDepartureCol" class="custom-col-select" style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px;">
                        <option value="">-- Mặc định (ngay_xuat_canh) --</option>
                        <option v-for="c in currentActiveFormulaCols" :key="c.id" :value="c.id">
                          Cột {{ c.colIndex }}: {{ c.label }} ({{ c.id }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">Định dạng hiển thị (Tùy chọn):</span>
                      <input
                        v-model="col.formulaLabelFormat"
                        placeholder="Mặc định: {count} lần"
                        style="width: 100%; height: 30px; font-size: 0.75rem; margin-top: 2px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;"
                      />
                    </div>
                  </div>
                </div>
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

    <!-- Main Content: Tab 3 (Quản lý Mẫu Word & Bảng Tra cứu Mã Tag) -->
    <div v-else-if="activeTab === 'tags'" class="app-card" style="padding: 1.25rem;">
      <!-- PHẦN 1: QUẢN LÝ MẪU WORD & MẪU MẶC ĐỊNH CHO GROUP -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-file-word" style="color: #2563eb; font-size: 1.25rem;"></i>
            <div>
              <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0;">1. Quản lý Danh sách Mẫu Word (.docx) & Chọn Mẫu Mặc Định cho Group</h3>
              <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0 0 0;">
                Tải lên các mẫu Word (.docx). Mẫu được đánh dấu <strong>[Mặc định]</strong> sẽ tự động được sử dụng khi xuất hồ sơ theo Nhóm Cột.
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              ref="tplFileInputRef"
              type="file"
              accept=".docx"
              style="display: none;"
              @change="handleUploadDocxTemplate"
            />
            <Button
              label="Tải lên Mẫu Word mới (.docx)"
              icon="pi pi-cloud-upload"
              severity="primary"
              size="small"
              @click="tplFileInputRef.click()"
              style="font-size: 0.8rem; font-weight: 700;"
            />
            <Button
              label="Tải Mẫu Chuẩn Gốc (.docx)"
              icon="pi pi-download"
              severity="secondary"
              outlined
              size="small"
              @click="downloadSampleTemplate"
              style="font-size: 0.8rem;"
            />
          </div>
        </div>

        <!-- Danh sách Mẫu Word đã nạp -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <tr>
                <th style="padding: 8px 12px; text-align: left; font-weight: 700; color: #475569;">Tên Tệp Mẫu Word</th>
                <th style="padding: 8px 12px; text-align: left; font-weight: 700; color: #475569; width: 160px;">Thời gian tải lên</th>
                <th style="padding: 8px 12px; text-align: center; font-weight: 700; color: #475569; width: 170px;">Mẫu Mặc Định Group</th>
                <th style="padding: 8px 12px; text-align: center; font-weight: 700; color: #475569; width: 130px;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Mẫu động hệ thống -->
              <tr style="border-bottom: 1px solid #f1f5f9; background: #faf5ff;">
                <td style="padding: 8px 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="pi pi-bolt" style="color: #7c3aed; font-size: 1.1rem;"></i>
                    <div>
                      <strong style="color: #6b21a8;">Mẫu Tự Động Theo Nhóm Cột (Sinh trực tiếp từ Cấu hình Cột)</strong>
                      <div style="font-size: 0.7rem; color: #9333ea;">Tự động co giãn theo các Group bạn đã tích chọn</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 8px 12px; color: #64748b;">Hệ thống tạo tự động</td>
                <td style="padding: 8px 12px; text-align: center;">
                  <span v-if="!hasCustomDefaultTemplate" class="badge-pill badge-green" style="font-size: 0.72rem; font-weight: 700;">
                    ✓ Đang dùng làm Mặc định
                  </span>
                  <Button
                    v-else
                    label="Đặt làm Mặc định"
                    size="small"
                    text
                    severity="secondary"
                    @click="setSystemAsDefault"
                    style="font-size: 0.72rem; padding: 2px 6px;"
                  />
                </td>
                <td style="padding: 8px 12px; text-align: center;">
                  <Button
                    icon="pi pi-download"
                    size="small"
                    text
                    severity="info"
                    @click="downloadSampleTemplate"
                    title="Tải mẫu chuẩn về máy"
                    style="font-size: 0.75rem; padding: 4px;"
                  />
                </td>
              </tr>

              <!-- Các mẫu người dùng tải lên -->
              <tr
                v-for="tpl in docxTemplates"
                :key="tpl.id"
                style="border-bottom: 1px solid #f1f5f9;"
                :style="{ backgroundColor: tpl.isDefault ? '#eff6ff' : '#ffffff' }"
              >
                <td style="padding: 8px 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="pi pi-file-word" style="color: #2563eb; font-size: 1.1rem;"></i>
                    <div>
                      <strong style="color: #1e293b;">{{ tpl.name }}</strong>
                      <div style="font-size: 0.7rem; color: #64748b;">{{ tpl.size ? (tpl.size / 1024).toFixed(1) + ' KB' : 'Mẫu Word người dùng' }}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 8px 12px; color: #64748b; font-size: 0.74rem;">{{ tpl.uploadedAt || 'Mới tải lên' }}</td>
                <td style="padding: 8px 12px; text-align: center;">
                  <span v-if="tpl.isDefault" class="badge-pill badge-blue" style="font-size: 0.72rem; font-weight: 700;">
                    ⭐ Mặc định cho Group
                  </span>
                  <Button
                    v-else
                    label="Đặt làm Mặc định"
                    size="small"
                    outlined
                    severity="secondary"
                    @click="setAsDefaultTemplate(tpl.id)"
                    style="font-size: 0.72rem; padding: 2px 8px;"
                  />
                </td>
                <td style="padding: 8px 12px; text-align: center;">
                  <div style="display: flex; justify-content: center; align-items: center; gap: 6px;">
                    <Button
                      icon="pi pi-download"
                      label="Tải"
                      size="small"
                      outlined
                      severity="info"
                      @click="downloadSavedTemplate(tpl)"
                      title="Tải tệp này về máy"
                      style="font-size: 0.72rem; padding: 3px 8px;"
                    />
                    <Button
                      icon="pi pi-trash"
                      label="Xóa"
                      size="small"
                      outlined
                      severity="danger"
                      @click="deleteSavedTemplate(tpl.id)"
                      title="Xóa mẫu này khỏi hệ thống"
                      style="font-size: 0.72rem; padding: 3px 8px;"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PHẦN 2: BẢNG TRA CỨU MÃ THẺ TAG WORD (.DOCX) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-tags" style="color: #7c3aed; font-size: 1.1rem;"></i>
            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0;">2. Bảng Tra cứu Toàn bộ Mã Thẻ Tag Word (.docx) & PDF</h3>
          </div>
          <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0 0 0;">
            Tra cứu nhanh và sao chép 1-click các mã thẻ tag để dán vào file mẫu Microsoft Word của bạn.
          </p>
        </div>
      </div>

      <!-- Filters & Category Navigation -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'personnel' }"
            @click="selectedCategory = 'personnel'"
          >
            <i class="pi pi-user"></i> Cán bộ ({{ personnelTagsCount }} cột)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'relatives' }"
            @click="selectedCategory = 'relatives'"
          >
            <i class="pi pi-users"></i> Thân nhân ({{ relativeTagsCount }} cột)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'system' }"
            @click="selectedCategory = 'system'"
          >
            <i class="pi pi-cog"></i> Thẻ Hệ thống & Ngày giờ ({{ systemTagsCount }} thẻ)
          </button>
          <button
            type="button"
            class="cheat-tab-btn"
            :class="{ 'cheat-tab-active': selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            Tất cả ({{ allAvailableTags.length }} thẻ)
          </button>
        </div>

        <div style="min-width: 260px;">
          <InputText
            v-model="tagSearch"
            placeholder="🔍 Tìm mã thẻ, số cột, tên trường..."
            size="small"
            style="width: 100%; font-size: 0.82rem;"
          />
        </div>
      </div>

      <!-- Tags Table Grid -->
      <div style="max-height: 62vh; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead style="background: #f8fafc; position: sticky; top: 0; z-index: 10; border-bottom: 1.5px solid #e2e8f0;">
            <tr>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; width: 100px;">Vị trí Cột</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; width: 120px;">Phân loại</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569;">Tên Trường Dữ liệu</th>
              <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #475569;">Cú pháp Thẻ Tag Word</th>
              <th style="padding: 10px 12px; text-align: center; font-weight: 700; color: #475569; width: 100px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredTags"
              :key="item.tag"
              style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;"
              class="tag-table-row"
            >
              <td style="padding: 10px 12px;">
                <span v-if="item.colNum" class="col-num-badge">{{ item.colNum }}</span>
                <span v-else style="color: #94a3b8; font-size: 0.75rem;">—</span>
              </td>
              <td style="padding: 10px 12px;">
                <span class="tag-badge" :class="'tag-badge-' + item.category">
                  {{ getCategoryLabel(item.category) }}
                </span>
              </td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
                {{ item.label }}
              </td>
              <td style="padding: 10px 12px;">
                <code class="tag-code">{{ item.tag }}</code>
              </td>
              <td style="padding: 10px 12px; text-align: center;">
                <button
                  type="button"
                  class="btn-copy"
                  :class="{ 'btn-copy-success': copiedTag === item.tag }"
                  @click="copyTag(item.tag)"
                >
                  <i :class="copiedTag === item.tag ? 'pi pi-check' : 'pi pi-copy'"></i>
                  <span>{{ copiedTag === item.tag ? 'Đã chép!' : 'Chép' }}</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredTags.length === 0">
              <td colspan="5" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
                Không tìm thấy mã thẻ tag nào phù hợp với từ khóa "{{ tagSearch }}".
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Quick Guide Footer -->
      <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: #eff6ff; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #2563eb; font-size: 0.76rem; color: #1e40af; line-height: 1.45;">
          <strong>💡 Thẻ Lặp Thân nhân:</strong> Đặt <code>&#123;#than_nhan&#125;</code> ở đầu dòng/hàng bảng và <code>&#123;/than_nhan&#125;</code> ở cuối hàng. Hệ thống sẽ tự động nhân bản theo số lượng thân nhân!
        </div>
        <div style="background: #fdf4ff; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #c026d3; font-size: 0.76rem; color: #86198f; line-height: 1.45;">
          <strong>💡 Thẻ Lặp Chuyến đi:</strong> Đặt <code>&#123;#xuatnhapcanh&#125;</code> ở đầu hàng và <code>&#123;/xuatnhapcanh&#125;</code> ở cuối hàng để tự động in danh sách các chuyến đi nước ngoài!
        </div>
      </div>
    </div>

    <!-- Main Content: Tab 4 (Quản lý Phụ lục Báo cáo) -->
    <div v-else-if="activeTab === 'appendices'" class="app-card" style="padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-file-excel" style="color: #16a34a; font-size: 1.2rem;"></i>
            <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0;">Quản lý & Cấu hình Báo cáo Phụ lục (Excel / Web)</h3>
          </div>
          <p style="font-size: 0.75rem; color: #64748b; margin: 4px 0 0 0;">
            Thêm bớt, đổi tên, chọn nguồn dữ liệu và tích chọn các cột hiển thị vào từng Báo cáo Phụ lục tương ứng.
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <Button
            label="Khôi phục Mặc định"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            @click="resetDefaultAppendices"
            style="font-size: 0.78rem;"
          />
          <Button
            label="Thêm Phụ lục Mới"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="addNewAppendix"
            style="font-size: 0.78rem;"
          />
        </div>
      </div>

      <!-- Danh sách Phụ lục (Tab Card / Sidebar Split) -->
      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; align-items: start;">
        <!-- Cột Trái: Danh sách Phụ lục -->
        <div style="display: flex; flex-direction: column; gap: 8px; background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #475569; padding: 4px 6px;">
            DANH SÁCH PHỤ LỤC ({{ customAppendices.length }}):
          </div>

          <div
            v-for="(pl, pIdx) in customAppendices"
            :key="pl.id || pIdx"
            @click="selectedAppendixIdx = pIdx"
            style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent;"
            :style="selectedAppendixIdx === pIdx ? 'background: #ffffff; border-color: #16a34a; box-shadow: 0 2px 6px rgba(0,0,0,0.06);' : 'background: #f1f5f9; color: #475569;'"
          >
            <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1; margin-right: 6px;">
              <strong style="font-size: 0.8rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ pl.code ? `[${pl.code}] ` : '' }}{{ pl.title }}
              </strong>
              <span style="font-size: 0.7rem; color: #64748b;">
                {{ pl.source === 'trips' ? '🌐 Chuyến đi NN' : (pl.source === 'relatives' ? '💜 Thân nhân NN' : '👤 Hồ sơ Cán bộ') }} • {{ (pl.columns || []).length }} cột
              </span>
            </div>

            <button
              v-if="customAppendices.length > 1"
              type="button"
              @click.stop="removeAppendix(pIdx)"
              title="Xóa phụ lục này"
              style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px;"
            >
              <i class="pi pi-trash" style="font-size: 0.75rem;"></i>
            </button>
          </div>
        </div>

        <!-- Cột Phải: Form Chi tiết Phụ lục đang chọn -->
        <div v-if="currentSelectedAppendix" style="display: flex; flex-direction: column; gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
          <!-- Thông tin cơ bản Phụ lục -->
          <div style="display: grid; grid-template-columns: 90px 1fr 145px 165px; gap: 10px;">
            <div>
              <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Mã Phụ lục:</label>
              <InputText v-model="currentSelectedAppendix.code" placeholder="PL1" size="small" style="width: 100%; font-size: 0.8rem;" />
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Tên / Tiêu đề Phụ lục:</label>
              <InputText v-model="currentSelectedAppendix.title" placeholder="Tiêu đề hiển thị..." size="small" style="width: 100%; font-size: 0.8rem;" />
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Icon Menu Sidebar:</label>
              <select v-model="currentSelectedAppendix.icon" class="custom-col-select" style="width: 100%; height: 32px; font-size: 0.78rem;">
                <option value="">-- Mặc định --</option>
                <option value="pi-file-excel">📊 pi-file-excel</option>
                <option value="pi-file">📄 pi-file</option>
                <option value="pi-globe">🌐 pi-globe</option>
                <option value="pi-send">✈️ pi-send</option>
                <option value="pi-table">📋 pi-table</option>
                <option value="pi-chart-bar">📈 pi-chart-bar</option>
                <option value="pi-chart-pie">🥧 pi-chart-pie</option>
                <option value="pi-users">👥 pi-users</option>
                <option value="pi-user">👤 pi-user</option>
                <option value="pi-id-card">🪪 pi-id-card</option>
                <option value="pi-heart">❤️ pi-heart</option>
                <option value="pi-shield">🛡️ pi-shield</option>
                <option value="pi-book">📖 pi-book</option>
                <option value="pi-briefcase">💼 pi-briefcase</option>
                <option value="pi-bookmark">🔖 pi-bookmark</option>
                <option value="pi-folder">📁 pi-folder</option>
                <option value="pi-check-square">✅ pi-check-square</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Nguồn Dữ liệu:</label>
              <select v-model="currentSelectedAppendix.source" class="custom-col-select" style="width: 100%; height: 32px; font-size: 0.78rem;">
                <option value="trips">🌐 Chuyến đi nước ngoài</option>
                <option value="relatives">💜 Thân nhân nước ngoài</option>
                <option value="personnel">👤 Hồ sơ cán bộ (Chung)</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Mô tả / Ghi chú Phụ lục:</label>
            <InputText v-model="currentSelectedAppendix.description" placeholder="Ghi chú chi tiết cho báo cáo này..." size="small" style="width: 100%; font-size: 0.8rem;" />
          </div>

          <!-- Tích chọn cột hiển thị -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">
                TÍCH CHỌN CÁC CỘT HIỂN THỊ VÀO PHỤ LỤC NÀY (Đang chọn: {{ (currentSelectedAppendix.columns || []).length }} cột):
              </span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-tree-action" @click="selectAllAppendixCols">Chọn tất cả</button>
                <button type="button" class="btn-tree-action" @click="deselectAllAppendixCols">Bỏ chọn hết</button>
              </div>
            </div>

            <!-- Grid checkboxes các cột -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; max-height: 380px; overflow-y: auto; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafafa;">
              <label
                v-for="col in appendixAvailableColumns"
                :key="col.id"
                style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: #ffffff; border: 1px solid #f1f5f9;"
              >
                <input
                  type="checkbox"
                  :value="col.id"
                  v-model="currentSelectedAppendix.columns"
                  style="cursor: pointer; accent-color: #16a34a; width: 15px; height: 15px;"
                />
                <span style="color: #334155; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="col.label">
                  {{ col.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- Nút Lưu & Mở xem báo cáo -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <Button
              label="Mở Xem Báo cáo này"
              icon="pi pi-external-link"
              severity="info"
              outlined
              size="small"
              @click="openAppendixReport(currentSelectedAppendix.id)"
              style="font-size: 0.78rem;"
            />
            <Button
              label="Lưu Toàn bộ Cấu hình Phụ lục"
              icon="pi pi-check"
              severity="success"
              size="small"
              @click="saveAppendicesConfig"
              style="font-size: 0.82rem;"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Quản lý Chuyên đề -->
    <div v-else-if="activeTab === 'dashboard'" class="app-card" style="padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-send" style="color: #1e3a8a; font-size: 1.2rem;"></i>
            <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0;">Quản lý & Cấu hình Chuyên đề (Trang Danh sách & Thống kê)</h3>
          </div>
          <p style="font-size: 0.75rem; color: #64748b; margin: 4px 0 0 0;">
            Tạo mới các trang chuyên đề (như Danh sách Chuyến đi), tùy chỉnh các khối thẻ thống kê ở trên và chọn cột hiển thị trên bảng danh sách bên dưới.
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <Button
            label="Khôi phục Mặc định"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            @click="resetDefaultDashboards"
            style="font-size: 0.78rem;"
          />
          <Button
            label="Thêm Dashboard Mới"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="addNewDashboard"
            style="font-size: 0.78rem;"
          />
        </div>
      </div>

      <!-- Split Layout: Danh sách Dashboard (Trái) & Cấu hình Chi tiết (Phải) -->
      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; align-items: start;">
        <!-- Cột Trái: Danh sách Dashboard -->
        <div style="display: flex; flex-direction: column; gap: 8px; background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #475569; padding: 4px 6px;">
            DANH SÁCH DASHBOARD ({{ customDashboards.length }}):
          </div>

          <div
            v-for="(d, dIdx) in customDashboards"
            :key="d.id || dIdx"
            @click="selectedDashboardIdx = dIdx"
            style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent;"
            :style="selectedDashboardIdx === dIdx ? 'background: #ffffff; border-color: #1e3a8a; box-shadow: 0 2px 6px rgba(0,0,0,0.06);' : 'background: #f1f5f9; color: #475569;'"
          >
            <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden; flex: 1; margin-right: 6px;">
              <strong style="font-size: 0.8rem; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ d.code ? `[${d.code}] ` : '' }}{{ d.title }}
              </strong>
              <span style="font-size: 0.7rem; color: #64748b;">
                {{ d.source === 'trips' ? '✈️ Chuyến đi' : (d.source === 'relatives' ? '👥 Thân nhân' : '👤 Cán bộ') }} • {{ (d.metricCards || []).length }} thẻ KPI • {{ (d.columns || []).length }} cột
              </span>
            </div>

            <div style="display: flex; align-items: center; gap: 2px;">
              <button
                type="button"
                :disabled="dIdx === 0"
                @click.stop="moveDashboardUp(dIdx)"
                title="Di chuyển lên"
                style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 2px 4px;"
                :style="dIdx === 0 ? 'opacity: 0.25; cursor: not-allowed;' : ''"
              >
                <i class="pi pi-arrow-up" style="font-size: 0.72rem;"></i>
              </button>
              <button
                type="button"
                :disabled="dIdx === customDashboards.length - 1"
                @click.stop="moveDashboardDown(dIdx)"
                title="Di chuyển xuống"
                style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 2px 4px;"
                :style="dIdx === customDashboards.length - 1 ? 'opacity: 0.25; cursor: not-allowed;' : ''"
              >
                <i class="pi pi-arrow-down" style="font-size: 0.72rem;"></i>
              </button>
              <button
                v-if="customDashboards.length > 1"
                type="button"
                @click.stop="removeDashboard(dIdx)"
                title="Xóa dashboard này"
                style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 2px 4px;"
              >
                <i class="pi pi-trash" style="font-size: 0.72rem;"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Cột Phải: Form Chi tiết Dashboard đang chọn -->
        <div v-if="currentSelectedDashboard" style="display: flex; flex-direction: column; gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
          <!-- 1. Thông tin cơ bản Dashboard -->
          <div style="display: grid; grid-template-columns: 90px 1fr 130px 140px 150px; gap: 10px; align-items: center;">
            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Mã Code:</label>
              <InputText v-model="currentSelectedDashboard.code" placeholder="CD-03" size="small" style="width: 100%; font-size: 0.8rem;" />
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Tiêu đề:</label>
              <InputText v-model="currentSelectedDashboard.title" placeholder="VD: Danh sách Chuyến đi" size="small" style="width: 100%; font-size: 0.8rem;" />
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Chế độ hiển thị:</label>
              <select v-model="currentSelectedDashboard.displayMode" class="custom-key-select" style="font-size: 0.75rem; padding: 4px 6px;">
                <option value="dashboard">📊 Chuyên đề</option>
                <option value="appendix">📑 Phụ lục (Clean View)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Nguồn Dữ liệu:</label>
              <select v-model="currentSelectedDashboard.source" class="custom-key-select" style="font-size: 0.75rem; padding: 4px 6px;">
                <option value="trips">✈️ Chuyến đi</option>
                <option value="personnel">👤 Cán bộ</option>
                <option value="relatives">👥 Thân nhân</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Biểu tượng Icon:</label>
              <select v-model="currentSelectedDashboard.icon" class="custom-key-select" style="font-size: 0.75rem; padding: 4px 6px;">
                <option value="pi-send">✈️ pi-send (Chuyến đi)</option>
                <option value="pi-globe">🌐 pi-globe (Quốc tế)</option>
                <option value="pi-users">👥 pi-users (Cán bộ)</option>
                <option value="pi-user">👤 pi-user (Cá nhân)</option>
                <option value="pi-heart">❤️ pi-heart (Thân nhân)</option>
                <option value="pi-id-card">🪪 pi-id-card (Định danh)</option>
                <option value="pi-shield">🛡️ pi-shield (Bảo vệ / An ninh)</option>
                <option value="pi-chart-pie">📊 pi-chart-pie (Biểu đồ tròn)</option>
                <option value="pi-chart-bar">📈 pi-chart-bar (Biểu đồ cột)</option>
                <option value="pi-table">📋 pi-table (Bảng biểu)</option>
                <option value="pi-book">📖 pi-book (Sổ theo dõi)</option>
                <option value="pi-briefcase">💼 pi-briefcase (Công tác)</option>
                <option value="pi-bookmark">🔖 pi-bookmark (Đánh dấu)</option>
                <option value="pi-folder">📁 pi-folder (Thư mục)</option>
                <option value="pi-check-square">✅ pi-check-square (Xét duyệt)</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Mô tả phụ:</label>
            <InputText v-model="currentSelectedDashboard.description" placeholder="VD: Tổng hợp các chuyến đi nước ngoài của cán bộ và thân nhân" size="small" style="width: 100%; font-size: 0.8rem;" />
          </div>

          <!-- 2. Cấu hình Khối Thống kê ở trên / Khối Điều kiện Phụ lục -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span style="font-size: 0.84rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                  <i :class="currentSelectedDashboard.displayMode === 'appendix' ? 'pi pi-filter' : 'pi pi-th-large'" style="color: #0284c7;"></i>
                  {{ currentSelectedDashboard.displayMode === 'appendix' ? '1. Khối Điều kiện Lọc của Phụ lục (Filter Conditions):' : '1. Khối Thống kê ở trên (Top Metric KPI Cards):' }}
                </span>
                <span style="font-size: 0.72rem; color: #64748b;">
                  {{ currentSelectedDashboard.displayMode === 'appendix' ? 'Cấu hình các tiêu chí lọc dữ liệu cho Phụ lục này (kết quả bảng sẽ tự động áp dụng các điều kiện này).' : 'Các thẻ số liệu nhanh ở hàng trên cùng của Dashboard để người dùng lọc nhanh.' }}
                </span>
              </div>

              <Button
                v-if="currentSelectedDashboard.displayMode !== 'appendix' || (!currentSelectedDashboard.metricCards || currentSelectedDashboard.metricCards.length === 0)"
                :label="currentSelectedDashboard.displayMode === 'appendix' ? 'Thiết lập Điều kiện Lọc' : 'Thêm Khối Thống kê'"
                icon="pi pi-plus"
                severity="primary"
                size="small"
                @click="addMetricCardToDashboard(currentSelectedDashboard)"
                style="font-size: 0.75rem;"
              />
            </div>

            <!-- List of Metric Cards -->
            <div v-if="!currentSelectedDashboard.metricCards || currentSelectedDashboard.metricCards.length === 0" style="text-align: center; padding: 1.25rem; color: #94a3b8; font-size: 0.8rem; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1;">
              Chưa có thẻ thống kê nào. Nhấp vào <b>"+ Thêm Khối Thống kê"</b> để tạo thẻ đếm!
            </div>

            <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
              <div
                v-for="(card, cIdx) in currentSelectedDashboard.metricCards"
                :key="card.id || cIdx"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fafafa; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);"
              >
                <!-- Tiêu đề thẻ & Các nút thao tác di chuyển/xóa -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                  <input
                    v-model="card.label"
                    placeholder="Tên thẻ (VD: Có vấn đề chính trị, Đi Nhật...)"
                    style="font-size: 0.82rem; font-weight: 700; color: #1e293b; border: 1px solid #cbd5e1; background: #fff; padding: 3px 6px; border-radius: 4px; flex: 1;"
                  />
                  <select v-model="card.color" class="custom-key-select" style="font-size: 0.72rem; padding: 3px 6px; width: 95px;">
                    <option value="blue">🔵 Xanh</option>
                    <option value="green">🟢 Lá</option>
                    <option value="amber">🟠 Cam</option>
                    <option value="red">🔴 Đỏ</option>
                    <option value="purple">🟣 Tím</option>
                  </select>
                  <div style="display: flex; align-items: center; gap: 2px;">
                    <button
                      type="button"
                      :disabled="cIdx === 0"
                      @click="moveMetricCard(currentSelectedDashboard, cIdx, -1)"
                      title="Di chuyển sang trái / lên trước"
                      style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 2px 4px;"
                      :style="cIdx === 0 ? 'opacity: 0.25; cursor: not-allowed;' : ''"
                    >
                      <i class="pi pi-arrow-left" style="font-size: 0.72rem;"></i>
                    </button>
                    <button
                      type="button"
                      :disabled="cIdx === currentSelectedDashboard.metricCards.length - 1"
                      @click="moveMetricCard(currentSelectedDashboard, cIdx, 1)"
                      title="Di chuyển sang phải / xuống sau"
                      style="background: transparent; border: none; color: #475569; cursor: pointer; padding: 2px 4px;"
                      :style="cIdx === currentSelectedDashboard.metricCards.length - 1 ? 'opacity: 0.25; cursor: not-allowed;' : ''"
                    >
                      <i class="pi pi-arrow-right" style="font-size: 0.72rem;"></i>
                    </button>
                    <button
                      type="button"
                      @click="removeMetricCard(currentSelectedDashboard, cIdx)"
                      style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 2px 4px;"
                      title="Xóa thẻ này"
                    >
                      <i class="pi pi-trash" style="font-size: 0.75rem;"></i>
                    </button>
                  </div>
                </div>

                <!-- Độ rộng khối (% Width) -->
                <div style="display: flex; flex-direction: column; gap: 3px;">
                  <label style="font-size: 0.7rem; font-weight: 600; color: #475569;">Độ rộng khối:</label>
                  <select v-model="card.widthPercent" class="custom-key-select" style="font-size: 0.75rem; padding: 4px 6px;">
                    <option value="">Tự động co giãn (Mặc định)</option>
                    <option :value="16.66">16.66% (1/6 hàng - 6 khối/dòng)</option>
                    <option :value="20">20% (1/5 hàng - 5 khối/dòng)</option>
                    <option :value="25">25% (1/4 hàng - 4 khối/dòng)</option>
                    <option :value="33">33% (1/3 hàng - 3 khối/dòng)</option>
                    <option :value="50">50% (1/2 hàng - 2 khối/dòng)</option>
                    <option :value="100">100% (Toàn hàng - 1 khối/dòng)</option>
                  </select>
                </div>

                <!-- Đếm giá trị duy nhất (Unique) -->
                <div style="display: flex; align-items: center; gap: 6px; padding: 2px 0;">
                  <input
                    type="checkbox"
                    v-model="card.isUnique"
                    :id="'uniq_' + (card.id || cIdx)"
                    style="margin: 0; cursor: pointer;"
                  />
                  <label
                    :for="'uniq_' + (card.id || cIdx)"
                    style="font-size: 0.72rem; font-weight: 600; color: #334155; cursor: pointer;"
                  >
                    Đếm giá trị duy nhất (Unique)
                  </label>
                </div>

                <!-- Kiểu kết hợp (Khi có từ 2 điều kiện trở lên) -->
                <div v-if="getCardConditions(card).length > 1" style="display: flex; flex-direction: column; gap: 3px; background: #eff6ff; padding: 6px 8px; border-radius: 4px; border: 1px dashed #93c5fd;">
                  <label style="font-size: 0.68rem; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; gap: 4px;">
                    <i class="pi pi-sliders-h"></i> Kiểu kết hợp điều kiện:
                  </label>
                  <select v-model="card.logicOp" class="custom-key-select" style="font-size: 0.72rem; padding: 3px 6px; font-weight: 600; color: #1e40af;">
                    <option value="AND">🔗 VÀ (AND) - Thỏa mãn TẤT CẢ điều kiện</option>
                    <option value="OR">🔀 HOẶC (OR) - Thỏa mãn MỘT TRONG CÁC điều kiện</option>
                  </select>
                </div>

                <!-- Danh sách các điều kiện lọc -->
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <div
                    v-for="(cond, condIdx) in getCardConditions(card)"
                    :key="cond.id || condIdx"
                    style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; display: flex; flex-direction: column; gap: 4px;"
                  >
                    <!-- Tiêu đề dòng điều kiện + nút xóa -->
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 0.68rem; font-weight: 700; color: #64748b;">
                        Điều kiện #{{ condIdx + 1 }}:
                      </span>
                      <button
                        v-if="getCardConditions(card).length > 1 || cond.field"
                        type="button"
                        @click="removeConditionFromCard(card, condIdx)"
                        style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0 2px; font-size: 0.75rem;"
                        title="Xóa điều kiện này"
                      >
                        <i class="pi pi-times-circle"></i>
                      </button>
                    </div>

                    <!-- Chọn Cột để đếm -->
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      <select v-model="cond.field" @change="onCardConditionFieldChange(cond)" class="custom-key-select" style="font-size: 0.72rem; padding: 3px 6px;">
                        <option value="">-- Toàn bộ danh sách (Không lọc cột) --</option>
                        <optgroup v-for="grp in categorizedDashboardCols" :key="grp.category" :label="grp.category">
                          <option v-for="col in grp.options" :key="col.id" :value="col.id">
                            {{ col.displayLabel || col.label }}
                          </option>
                        </optgroup>
                      </select>
                    </div>

                    <!-- Toán tử & Giá trị so sánh -->
                    <div v-if="cond.field" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                      <!-- Giao diện chuyên biệt khi chọn Đối tượng (Cán bộ / Thân nhân) -->
                      <template v-if="cond.field === 'isRelative' || cond.field === '_doiTuong' || cond.field === 'doi_tuong'">
                        <div>
                          <select v-model="cond.operator" class="custom-key-select" style="font-size: 0.7rem; padding: 2px 4px; font-weight: 600;">
                            <option value="equals">Là</option>
                            <option value="not_equals">Không phải là (Khác)</option>
                          </select>
                        </div>
                        <div>
                          <select
                            v-model="cond.value"
                            class="custom-key-select"
                            style="font-size: 0.72rem; padding: 2px 4px; width: 100%; font-weight: 700; color: #1e40af; background: #eff6ff; border-color: #93c5fd;"
                          >
                            <option value="Cán bộ">👤 Cán bộ</option>
                            <option value="Thân nhân">👨‍👩‍👧 Thân nhân</option>
                          </select>
                        </div>
                      </template>
                      <!-- Giao diện chuyên biệt khi chọn Trạng thái hiện diện -->
                      <template v-else-if="cond.field === 'presenceStatus' || cond.field === '_presenceStatus'">
                        <div>
                          <select v-model="cond.operator" class="custom-key-select" style="font-size: 0.7rem; padding: 2px 4px; font-weight: 600;">
                            <option value="equals">Là</option>
                            <option value="not_equals">Không phải là (Khác)</option>
                          </select>
                        </div>
                        <div>
                          <select
                            v-model="cond.value"
                            class="custom-key-select"
                            style="font-size: 0.72rem; padding: 2px 4px; width: 100%; font-weight: 700; color: #0284c7; background: #f0f9ff; border-color: #7dd3fc;"
                          >
                            <option value="Đang ở nước ngoài">🌍 Đang ở nước ngoài</option>
                            <option value="Trong nước">🇻🇳 Trong nước (Đã về nước)</option>
                            <option value="Quá hạn chưa về">⚠️ Quá hạn chưa về</option>
                          </select>
                        </div>
                      </template>
                      <!-- Giao diện chuẩn cho các cột thông thường khác -->
                      <template v-else>
                        <div>
                          <select v-model="cond.operator" class="custom-key-select" style="font-size: 0.7rem; padding: 2px 4px;">
                            <optgroup label="-- So sánh giá trị cột --">
                              <option value="has_value">Có dữ liệu (khác rỗng)</option>
                              <option value="empty">Để trống (chưa có)</option>
                              <option value="equals">Là (khớp chính xác)</option>
                              <option value="not_equals">Khác</option>
                              <option value="contains">Chứa từ khóa</option>
                              <option value="not_contains">Không chứa từ khóa</option>
                              <option value="gt">Giá trị lớn hơn (&gt;)</option>
                              <option value="gte">Giá trị lớn hơn hoặc bằng (&gt;=)</option>
                              <option value="lt">Giá trị nhỏ hơn (&lt;)</option>
                              <option value="lte">Giá trị nhỏ hơn hoặc bằng (&lt;=)</option>
                              <option value="before">Trước ngày</option>
                              <option value="after">Sau ngày</option>
                            </optgroup>
                            <optgroup label="-- Điều kiện đếm (Tần suất / Số lần) --">
                              <option value="count_gt">Điều kiện đếm: Lớn hơn (&gt;)</option>
                              <option value="count_gte">Điều kiện đếm: Lớn hơn hoặc bằng (&gt;=)</option>
                              <option value="count_lt">Điều kiện đếm: Nhỏ hơn (&lt;)</option>
                              <option value="count_lte">Điều kiện đếm: Nhỏ hơn hoặc bằng (&lt;=)</option>
                              <option value="count_eq">Điều kiện đếm: Bằng (=)</option>
                            </optgroup>
                          </select>
                        </div>
                        <div v-if="cond.operator !== 'has_value' && cond.operator !== 'empty'">
                          <input
                            v-model="cond.value"
                            placeholder="Nhập giá trị..."
                            style="font-size: 0.72rem; border: 1px solid #cbd5e1; background: #fff; padding: 2px 4px; border-radius: 4px; width: 100%;"
                          />
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Nút + Thêm điều kiện lọc -->
                  <button
                    type="button"
                    @click="addConditionToCard(card)"
                    style="display: flex; align-items: center; justify-content: center; gap: 4px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 5px 8px; color: #0284c7; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                  >
                    <i class="pi pi-plus" style="font-size: 0.65rem;"></i> Thêm điều kiện lọc (+)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Nút Lưu & Mở xem Dashboard -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <Button
                label="Mở Xem Dashboard này"
                icon="pi pi-external-link"
                severity="info"
                outlined
                size="small"
                @click="openTopicDashboard(currentSelectedDashboard.id)"
                style="font-size: 0.78rem;"
              />
              <span v-if="dashboardSaveStatus === 'saving'" style="font-size: 0.74rem; color: #d97706; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                <i class="pi pi-spin pi-spinner"></i> Đang tự động lưu...
              </span>
              <span v-else-if="dashboardSaveStatus === 'saved'" style="font-size: 0.74rem; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                <i class="pi pi-check-circle"></i> Đã tự động lưu
              </span>
              <span v-else style="font-size: 0.74rem; color: #64748b; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                <i class="pi pi-cloud"></i> Tự động đồng bộ khi sửa
              </span>
            </div>
            <Button
              label="Lưu Toàn bộ Cấu hình Dashboard"
              icon="pi pi-save"
              severity="success"
              size="small"
              @click="saveDashboardsConfig"
              style="font-size: 0.82rem;"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Cài đặt Chung & Ảnh nền Đăng nhập -->
    <div v-else-if="activeTab === 'general'" class="app-card" style="padding: 1.5rem;">
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="pi pi-image" style="color: #ea580c; font-size: 1.15rem;"></i>
          Tùy chỉnh Hình nền Trang Đăng nhập (Login Background)
        </h3>
        <p style="font-size: 0.78rem; color: #64748b; margin: 4px 0 0 0;">
          Tải lên hình ảnh tùy biến để thay đổi giao diện màn hình Đăng nhập của Hệ thống.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
        <!-- Cột 1: Preview ảnh hiện tại -->
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 8px;">
            Ảnh nền Đăng nhập đang áp dụng:
          </div>
          <div style="width: 100%; height: 230px; border-radius: 12px; overflow: hidden; border: 2px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; background: #0f172a;">
            <img
              :src="currentLoginBg || '/login-bg.jpg'"
              alt="Login Background Preview"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #ffffff; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; backdrop-filter: blur(4px);">
              {{ currentLoginBg ? 'Ảnh tùy biến người dùng' : 'Ảnh nền mặc định hệ thống' }}
            </div>
          </div>
        </div>

        <!-- Cột 2: Các nút thao tác tải lên / khôi phục -->
        <div style="display: flex; flex-direction: column; gap: 14px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              Tải lên Ảnh nền Mới:
            </div>
            <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
              Hỗ trợ định dạng: JPG, PNG, WEBP (Khuyến nghị độ phân giải 1920x1080 hoặc tỷ lệ 16:9 để hiển thị đẹp nhất).
            </div>
            <input
              type="file"
              ref="loginBgFileInputRef"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              style="display: none;"
              @change="handleUploadLoginBg"
            />
            <Button
              label="Chọn Tệp Ảnh & Lưu Ngay"
              icon="pi pi-upload"
              severity="warn"
              size="small"
              @click="triggerUploadLoginBg"
              style="font-size: 0.82rem;"
            />
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              Khôi phục Ảnh Mặc định:
            </div>
            <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 10px;">
              Trở về ảnh nền gốc của Công An TP. Hồ Chí Minh.
            </div>
            <Button
              label="Khôi phục Ảnh Mặc định"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              size="small"
              @click="resetDefaultLoginBg"
              style="font-size: 0.82rem;"
            />
          </div>
        </div>
      </div>

      <!-- Khối 2: Tùy chỉnh Hình nền Menu Bên Trái (Sidebar Background) -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem; margin-top: 1.5rem;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-palette" style="color: #16a34a; font-size: 1.15rem;"></i>
            Tùy chỉnh Hình nền Menu Bên Trái (Sidebar Background)
          </h3>
          <p style="font-size: 0.78rem; color: #64748b; margin: 4px 0 0 0;">
            Tải lên hình ảnh tùy biến phủ lên nền rêu của thanh Menu chính bên trái (Cover mặc định) và chỉnh độ trong suốt.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
          <!-- Cột 1: Preview Sidebar Background -->
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 8px;">
              Xem trước Menu với Ảnh nền & Độ trong suốt:
            </div>
            <div style="width: 275px; height: 260px; border-radius: 12px; overflow: hidden; border: 2px solid #889962; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; background: #889962;">
              <!-- Background layer -->
              <div
                v-if="currentSidebarBg"
                style="position: absolute; inset: 0; background-size: cover; background-position: center; pointer-events: none;"
                :style="{ backgroundImage: `url(${currentSidebarBg})`, opacity: Number(sidebarBgOpacity) / 100 }"
              ></div>
              <!-- Mock sidebar content -->
              <div style="position: relative; z-index: 1; padding: 12px; display: flex; flex-direction: column; gap: 8px; height: 100%;">
                <div style="text-align: center; border-bottom: 1px solid rgba(0,0,0,0.15); padding-bottom: 8px;">
                  <div style="font-size: 0.7rem; font-weight: 800; color: #000000; text-transform: uppercase;">CÔNG AN TP. HỒ CHÍ MINH</div>
                  <div style="font-size: 0.65rem; font-weight: 800; color: #fde047; text-shadow: 0 1px 2px rgba(0,0,0,0.4); margin-top: 2px;">DỮ LIỆU CÁN BỘ & THÂN NHÂN</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                  <div style="padding: 6px 10px; background: rgba(0,0,0,0.15); border-radius: 6px; font-size: 0.78rem; font-weight: bold; color: #000000; display: flex; align-items: center; gap: 6px;">
                    <i class="pi pi-chart-pie" style="font-size: 0.85rem;"></i> Thống kê
                  </div>
                  <div style="padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: bold; color: #000000; display: flex; align-items: center; gap: 6px;">
                    <i class="pi pi-users" style="font-size: 0.85rem;"></i> Hồ sơ Cán bộ
                  </div>
                </div>
                <div style="margin-top: auto; font-size: 0.68rem; color: #000000; text-align: center; background: rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 4px;">
                  {{ currentSidebarBg ? `Độ trong suốt: ${sidebarBgOpacity}%` : 'Nền xanh rêu mặc định (#889962)' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Cột 2: Upload, Slider, Reset -->
          <div style="display: flex; flex-direction: column; gap: 14px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tải lên Ảnh nền Menu Mới:
              </div>
              <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
                Tải ảnh tùy ý (tự động căn Cover). Hỗ trợ JPG, PNG, WEBP.
              </div>
              <input
                type="file"
                ref="sidebarBgFileInputRef"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style="display: none;"
                @change="handleUploadSidebarBg"
              />
              <Button
                label="Chọn Tệp Ảnh & Lưu Ngay"
                icon="pi pi-upload"
                severity="success"
                size="small"
                @click="triggerUploadSidebarBg"
                style="font-size: 0.82rem;"
              />
            </div>

            <!-- Opacity Slider -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;" v-if="currentSidebarBg">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 0.82rem; font-weight: 700; color: #1e293b;">
                  Độ trong suốt ảnh nền (Opacity):
                </label>
                <span style="font-size: 0.82rem; font-weight: 800; color: #16a34a;">{{ sidebarBgOpacity }}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                v-model="sidebarBgOpacity"
                @change="saveSidebarBgOpacity"
                style="width: 100%; accent-color: #16a34a; cursor: pointer;"
              />
              <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">
                <span>5% (Rất mờ, hiện rõ rêu)</span>
                <span>50% (Hòa trộn vừa)</span>
                <span>100% (Hiện rõ ảnh)</span>
              </div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Khôi phục Menu Mặc định:
              </div>
              <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 10px;">
                Xóa ảnh nền tùy biến và trở về màu xanh rêu nguyên bản (#889962).
              </div>
              <Button
                label="Khôi phục Menu Mặc định"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                size="small"
                @click="resetDefaultSidebarBg"
                style="font-size: 0.82rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Thêm / Sửa Nhóm Dashboard -->
    <Dialog
      v-model:visible="isDashGroupDialogOpen"
      modal
      :header="editingDashGroup ? 'Chỉnh sửa Nhóm Thống kê Dashboard' : 'Thêm Nhóm Thống kê Dashboard Mới'"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 4px 0;">
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            Tên nhóm thống kê: <span style="color: red;">*</span>
          </label>
          <InputText
            v-model="dashGroupForm.title"
            placeholder="VD: Thống kê Đi Nước Ngoài Trọng Điểm, Nhóm Theo Dõi..."
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            Mô tả phụ (tùy chọn):
          </label>
          <InputText
            v-model="dashGroupForm.description"
            placeholder="VD: Tổng hợp các chỉ số quan trọng cần lưu ý"
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            Biểu tượng đại diện:
          </label>
          <select v-model="dashGroupForm.icon" class="custom-key-select">
            <option value="pi-folder">📁 pi-folder (Thư mục)</option>
            <option value="pi-chart-pie">📊 pi-chart-pie (Biểu đồ tròn)</option>
            <option value="pi-chart-bar">📈 pi-chart-bar (Biểu đồ cột)</option>
            <option value="pi-globe">🌐 pi-globe (Quốc tế / Toàn cầu)</option>
            <option value="pi-send">✈️ pi-send (Chuyến đi)</option>
            <option value="pi-users">👥 pi-users (Cán bộ)</option>
            <option value="pi-heart">❤️ pi-heart (Thân nhân)</option>
            <option value="pi-flag">🚩 pi-flag (Cờ / Trọng tâm)</option>
            <option value="pi-shield">🛡️ pi-shield (Bảo vệ / An ninh)</option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isDashGroupDialogOpen = false" />
        <Button label="Lưu Nhóm" severity="success" size="small" @click="saveDashGroup" />
      </template>
    </Dialog>

    <!-- Dialog Thêm / Sửa Khối Thống kê (Widget) -->
    <Dialog
      v-model:visible="isDashWidgetDialogOpen"
      modal
      :header="editingDashWidget ? 'Chỉnh sửa Khối Thống kê' : 'Thêm Khối Thống kê Mới vào Nhóm'"
      :style="{ width: '560px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 4px 0;">
        <!-- 1. Nguồn dữ liệu -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            1. Nguồn dữ liệu lấy số liệu: <span style="color: red;">*</span>
          </label>
          <select
            v-model="dashWidgetForm.source"
            class="custom-key-select"
            @change="dashWidgetForm.columnId = ''; dashWidgetForm.columnLabel = ''"
          >
            <option value="personnel">👤 Hồ sơ Cán bộ (Cá nhân)</option>
            <option value="relatives">👥 Hồ sơ Thân nhân</option>
            <option value="trips">✈️ Danh sách Chuyến đi xuất nhập cảnh</option>
            <option value="combined_country">🌐 Thống kê Toàn bộ Quốc gia (Cả CB & TN)</option>
          </select>
        </div>

        <!-- 2. Chọn Cột dữ liệu -->
        <div v-if="dashWidgetForm.source !== 'combined_country'">
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            2. Cột dữ liệu cần thống kê: <span style="color: red;">*</span>
          </label>
          <select
            v-model="dashWidgetForm.columnId"
            class="custom-key-select"
            @change="onWidgetColumnChange"
          >
            <option value="" disabled>-- Chọn cột cần tính toán số liệu --</option>
            <option v-for="col in availableSourceCols" :key="col.id" :value="col.id">
              {{ col.label }} (mã: {{ col.id }})
            </option>
          </select>
        </div>

        <!-- 3. Tiêu đề hiển thị -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            3. Tiêu đề hiển thị trên thẻ / biểu đồ:
          </label>
          <InputText
            v-model="dashWidgetForm.title"
            placeholder="Tự động theo tên cột hoặc đặt tên tùy thích"
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>

        <!-- 4. Kiểu hiển thị & Độ rộng -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
              4. Dạng hiển thị:
            </label>
            <select v-model="dashWidgetForm.displayType" class="custom-key-select">
              <option value="count">🔢 Thẻ đếm số lượng (KPI Metric)</option>
              <option value="chart">📊 Biểu đồ phân bổ (Pie / Doughnut)</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
              5. Độ rộng khối trên màn hình:
            </label>
            <select v-model="dashWidgetForm.widthPercent" class="custom-key-select">
              <option :value="25">25% (1/4 hàng - Thẻ nhỏ gọn)</option>
              <option :value="33">33% (1/3 hàng - Chuẩn)</option>
              <option :value="50">50% (1/2 hàng - Rộng)</option>
              <option :value="100">100% (Toàn hàng - Rộng nhất)</option>
            </select>
          </div>
        </div>

        <!-- 5. Tông màu sắc -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            6. Tông màu chủ đạo:
          </label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="color" v-model="dashWidgetForm.color" style="width: 40px; height: 34px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer;" />
            <span style="font-size: 0.8rem; color: #64748b;">Mã màu: <b>{{ dashWidgetForm.color }}</b></span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isDashWidgetDialogOpen = false" />
        <Button label="Lưu Khối Thống kê" severity="success" size="small" @click="saveDashWidget" />
      </template>
    </Dialog>

    <!-- Excel Import Wizard (4 Steps) -->
    <ExcelImportWizard
      v-model:visible="isWizardOpen"
      :defaultTarget="wizardTarget"
      @imported="onWizardImported"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ExcelImportWizard from '@/components/common/ExcelImportWizard.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { syncCollectionFields } from '@/api/fields';
import { uploadFile, getFileUrl } from '@/api/files';
import { computeColumnIndexMap } from '@/utils/formatters';
import { createSampleDocxTemplateBlob } from '@/utils/docxExport';
import {
  exportFullPersonnelExcel,
  exportFullRelativesExcel,
  exportFullTripsExcel,
  downloadPersonnelTemplate,
  downloadRelativeTemplate,
  downloadTripsTemplate,
  downloadAllInOneTemplate,
  exportAllInOneDataExcel,
} from '@/utils/excel';
import { saveAs } from 'file-saver';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();

const activeTab = ref('personnel');
const saving = ref(false);

const isWizardOpen = ref(false);
const wizardTarget = ref('personnel');

const getTabName = (tab) => {
  if (tab === 'personnel') return 'Cán bộ';
  if (tab === 'relative') return 'Thân nhân';
  if (tab === 'trips') return 'Chuyến đi';
  return tab;
};

const openImportWizard = (tab) => {
  wizardTarget.value = tab || 'personnel';
  isWizardOpen.value = true;
};

const onWizardImported = async () => {
  await personnelStore.fetchPersonnel();
};

const handleExportAllInOneData = () => {
  const pList = personnelStore.personnelList || [];
  
  // Extract all relatives with their parent personnel info attached
  const allRelatives = [];
  pList.forEach((p) => {
    let custom = {};
    if (p.custom_data) {
      try {
        custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
      } catch (e) {}
    }
    const personCccd = String(p.cccdparent || p.cccd || p.so_cccd || custom.cccdparent || custom.cccd || custom.so_cccd || '').trim();
    const rels = p.relatives || custom.relatives || [];
    if (Array.isArray(rels)) {
      rels.forEach((r) => {
        allRelatives.push({
          ...r,
          parentName: p.name || p.fullName || '',
          parentPersonnelName: p.name || p.fullName || '',
          cccdparent: personCccd,
          parentCccd: personCccd,
          parentPersonnelCccd: personCccd,
          parentPosition: p.position || p.positionName || custom.position || '',
          parentDepartment: p.departmentName || (p.departmentId ? personnelStore.getDepartmentName(p.departmentId) : '') || '',
          rawPerson: p,
        });
      });
    }
  });

  const rList = allRelatives.length > 0 ? allRelatives : (personnelStore.relativesList || []);

  const allTrips = [];
  pList.forEach((p) => {
    (p.trips || []).forEach((t) => {
      allTrips.push({
        ...t,
        personnelName: p.name || p.fullName || '',
        departmentName: p.departmentName || '',
        departmentId: p.departmentId || '',
        position: p.position || '',
        cccd: p.cccd || '',
        rawPerson: p,
      });
    });
  });

  rList.forEach((r) => {
    (r.trips || []).forEach((t) => {
      allTrips.push({
        ...t,
        personnelName: r.name || r.relativeName || '',
        departmentName: '',
        position: '',
        cccd: r.cccd || '',
        isRelative: true,
        parentName: r.parentName || '',
        rawPerson: r,
      });
    });
  });

  exportAllInOneDataExcel(
    pList,
    rList,
    allTrips,
    personnelGroups.value,
    relativeGroups.value,
    tripsGroups.value,
    (id) => personnelStore.getDepartmentName(id)
  );
};

const openTableHelper = () => {
  const routeData = router.resolve({ name: 'TableHelper' });
  window.open(routeData.href, '_blank');
};

const handleExportAllInOneTemplate = () => {
  downloadAllInOneTemplate(personnelGroups.value, relativeGroups.value, tripsGroups.value);
};

const handleExportCurrentTabExcel = (tab) => {
  if (tab === 'personnel') {
    downloadPersonnelTemplate(personnelGroups.value);
  } else if (tab === 'relative') {
    downloadRelativeTemplate(relativeGroups.value);
  } else if (tab === 'trips') {
    downloadTripsTemplate(tripsGroups.value);
  }
};

const personnelGroups = ref([]);
const relativeGroups = ref([]);
const tripsGroups = ref([]);

const personnelKeyField = ref('cccdparent');
const personnelNameField = ref('name');
const personnelPositionField = ref('position');
const personnelDepartmentField = ref('departmentName');
const relativeParentKeyField = ref('cccdparent');
const relativeKeyField = ref('cccdthannhan');
const tripKeyField = ref('cccdchuyendi');

const tagSearch = ref('');
const selectedCategory = ref('personnel');
const copiedTag = ref('');

// =========================================================================
// QUẢN LÝ BÁO CÁO PHỤ LỤC (DYNAMIC APPENDICES)
// =========================================================================
const DEFAULT_APPENDICES_CONFIG = [
  {
    id: 'pl1',
    code: 'PL1',
    title: 'Phụ lục 1: Danh sách Cán bộ đi nước ngoài',
    description: 'Thống kê chi tiết các lượt cán bộ xuất cảnh, nhập cảnh và công tác/học tập tại nước ngoài',
    source: 'trips',
    columns: ['code', 'name', 'departmentName', 'chuc_vu', 'decisionNumber', 'countryName', 'departureDate', 'arrivalDate', 'purpose', 'fundingName'],
  },
  {
    id: 'pl2',
    code: 'PL2',
    title: 'Phụ lục 2: Cán bộ có thân nhân ở nước ngoài',
    description: 'Thống kê chi tiết danh sách thân nhân của cán bộ, đảng viên đang sinh sống, học tập, làm việc tại nước ngoài',
    source: 'relatives',
    columns: ['parentName', 'relationshipName', 'relativeName', 'birthYear', 'countryName', 'timeAbroad', 'unitAbroad', 'occupation'],
  },
  {
    id: 'pl3',
    code: 'PL3',
    title: 'Phụ lục 3: Cán bộ có vấn đề chính trị & Kỷ luật',
    description: 'Thống kê cán bộ có lưu ý chính trị, kết luận thẩm tra tiêu chuẩn chính trị hoặc xử lý kỷ luật',
    source: 'personnel',
    columns: ['code', 'name', 'departmentName', 'chuc_vu', 'decisionNumber', 'issues', 'discipline', 'politicalVerificationResult'],
  },
];

const customAppendices = ref([...DEFAULT_APPENDICES_CONFIG]);
const selectedAppendixIdx = ref(0);

const loadCustomAppendices = async () => {
  try {
    const saved = await getAppSettings('custom_appendices_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customAppendices.value = saved;
    } else {
      const local = localStorage.getItem('custom_appendices_config');
      if (local) customAppendices.value = JSON.parse(local);
    }
  } catch (e) {
    console.error('Error loading custom appendices:', e);
  }
};

const currentSelectedAppendix = computed(() => {
  return customAppendices.value[selectedAppendixIdx.value] || null;
});

const appendixAvailableColumns = computed(() => {
  if (!currentSelectedAppendix.value) return [];
  const src = currentSelectedAppendix.value.source;
  const list = [];
  if (src === 'relatives') {
    list.push(
      { id: 'parentName', label: 'Cán bộ liên quan' },
      { id: 'parentDepartment', label: 'Đơn vị Cán bộ' },
      { id: 'relationshipName', label: 'Quan hệ' },
      { id: 'relativeName', label: 'Họ và tên thân nhân' },
      { id: 'birthYear', label: 'Năm sinh' },
      { id: 'countryName', label: 'Quốc gia' },
      { id: 'timeAbroad', label: 'Thời gian ở NN' },
      { id: 'unitAbroad', label: 'Cơ quan / Trường học NN' },
      { id: 'occupation', label: 'Nghề nghiệp' }
    );
    (availableRelativeCols.value || []).forEach((c) => {
      if (!list.some((x) => x.id === c.id)) {
        list.push({ id: c.id, label: c.label.replace(/^\[Cột\s*[^\]]+\]\s*/i, '') });
      }
    });
  } else {
    // trips or personnel
    list.push(
      { id: 'code', label: 'Mã Cán bộ' },
      { id: 'name', label: 'Họ và tên' },
      { id: 'departmentName', label: 'Đơn vị / Phòng ban' },
      { id: 'chuc_vu', label: 'Chức vụ' },
      { id: 'decisionNumber', label: 'Số Quyết định' },
      { id: 'countryName', label: 'Quốc gia đến' },
      { id: 'departureDate', label: 'Ngày đi' },
      { id: 'arrivalDate', label: 'Ngày về' },
      { id: 'purpose', label: 'Mục đích' },
      { id: 'fundingName', label: 'Nguồn kinh phí' }
    );
    (availablePersonnelCols.value || []).forEach((c) => {
      if (!list.some((x) => x.id === c.id)) {
        list.push({ id: c.id, label: c.label.replace(/^\[Cột\s*[^\]]+\]\s*/i, '') });
      }
    });
  }
  return list;
});

const selectAllAppendixCols = () => {
  if (!currentSelectedAppendix.value) return;
  currentSelectedAppendix.value.columns = appendixAvailableColumns.value.map((c) => c.id);
};

const deselectAllAppendixCols = () => {
  if (!currentSelectedAppendix.value) return;
  currentSelectedAppendix.value.columns = [];
};

const addNewAppendix = () => {
  const nextNum = customAppendices.value.length + 1;
  const newPl = {
    id: `pl_${Date.now()}`,
    code: `PL${nextNum}`,
    title: `Phụ lục ${nextNum}: Báo cáo Tùy chỉnh`,
    description: 'Thống kê danh sách theo tiêu chí tùy chỉnh',
    source: 'personnel',
    columns: ['code', 'name', 'departmentName', 'chuc_vu'],
  };
  customAppendices.value.push(newPl);
  selectedAppendixIdx.value = customAppendices.value.length - 1;
};

const removeAppendix = (idx) => {
  if (confirm(`Bạn có chắc chắn muốn xóa Phụ lục "${customAppendices.value[idx]?.title}"?`)) {
    customAppendices.value.splice(idx, 1);
    if (selectedAppendixIdx.value >= customAppendices.value.length) {
      selectedAppendixIdx.value = Math.max(0, customAppendices.value.length - 1);
    }
  }
};

const resetDefaultAppendices = () => {
  if (confirm('Khôi phục danh sách Phụ lục về 3 Phụ lục chuẩn mặc định?')) {
    customAppendices.value = JSON.parse(JSON.stringify(DEFAULT_APPENDICES_CONFIG));
    selectedAppendixIdx.value = 0;
  }
};

const saveAppendicesConfig = async () => {
  try {
    localStorage.setItem('custom_appendices_config', JSON.stringify(customAppendices.value));
    await saveAppSettings('custom_appendices_config', customAppendices.value);
    alert('Đã lưu cấu hình Phụ lục thành công! Bảng Báo cáo Phụ lục và Menu Sidebar đã được cập nhật.');
  } catch (e) {
    console.error('Error saving appendices config:', e);
    alert('Đã lưu cục bộ thành công!');
  }
};

const openAppendixReport = (id) => {
  if (id === 'pl1') router.push('/pl1');
  else if (id === 'pl2') router.push('/pl2');
  else if (id === 'pl3') router.push('/pl3');
  else router.push(`/appendix/${id}`);
};

// Cài đặt Ảnh nền Đăng nhập
const loginBgFileInputRef = ref(null);
const currentLoginBg = ref('');

const loadLoginBg = async () => {
  try {
    const bgData = await getAppSettings('custom_login_bg', null);
    if (bgData) {
      currentLoginBg.value = bgData;
      localStorage.setItem('custom_login_bg', bgData);
    }
  } catch (err) {
    console.warn('Failed to load login bg:', err);
  }
};

const triggerUploadLoginBg = () => loginBgFileInputRef.value?.click();

const compressImage = (file, maxWidth = 3840, maxHeight = 2160, quality = 0.95) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        // Chỉ thu nhỏ nếu ảnh vượt quá chuẩn 4K UHD (3840x2160)
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể xử lý tệp ảnh này'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp'));
    reader.readAsDataURL(file);
  });
};

const handleUploadLoginBg = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // 1. Tải tệp lên Directus File Storage để lưu trữ ảnh gốc 4K sắc nét tuyệt đối
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const bgUrl = getFileUrl(uploaded.id);
      currentLoginBg.value = bgUrl;
      localStorage.setItem('custom_login_bg', bgUrl);
      await saveAppSettings('custom_login_bg', bgUrl);
      alert('Đã tải lên và lưu ảnh nền đăng nhập độ nét cao (4K) thành công!');
      return;
    }
    throw new Error('Không nhận được mã tệp từ máy chủ');
  } catch (err) {
    console.warn('Lỗi tải tệp Directus Files, chuyển sang chế độ nén Canvas:', err);
    try {
      // Fallback: Nếu không upload được file, nén qua Canvas 1920x1080
      const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
      currentLoginBg.value = compressedBase64;
      localStorage.setItem('custom_login_bg', compressedBase64);
      await saveAppSettings('custom_login_bg', compressedBase64);
      alert('Đã lưu ảnh nền đăng nhập thành công!');
    } catch (fallbackErr) {
      alert('Lỗi lưu ảnh nền: ' + (err.response?.data?.errors?.[0]?.message || err.message || fallbackErr.message));
    }
  } finally {
    event.target.value = '';
  }
};

const resetDefaultLoginBg = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục lại ảnh nền đăng nhập mặc định?')) return;
  currentLoginBg.value = '';
  localStorage.removeItem('custom_login_bg');
  await saveAppSettings('custom_login_bg', null);
  alert('Đã khôi phục ảnh nền đăng nhập mặc định!');
};

// Cài đặt Ảnh nền Menu Bên Trái (Sidebar)
const sidebarBgFileInputRef = ref(null);
const currentSidebarBg = ref('');
const sidebarBgOpacity = ref(40);

const loadSidebarBgSettings = async () => {
  try {
    const bgData = await getAppSettings('sidebar_custom_bg', null);
    if (bgData) currentSidebarBg.value = typeof bgData === 'string' ? bgData : (bgData.value || '');
    else currentSidebarBg.value = '';
    const op = await getAppSettings('sidebar_bg_opacity', null);
    if (op !== null && op !== undefined && op !== '') {
      sidebarBgOpacity.value = Number(op);
    } else {
      sidebarBgOpacity.value = 40;
    }
  } catch (err) {
    console.warn('Failed to load sidebar bg:', err);
  }
};

const triggerUploadSidebarBg = () => sidebarBgFileInputRef.value?.click();

const handleUploadSidebarBg = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const bgUrl = getFileUrl(uploaded.id);
      currentSidebarBg.value = bgUrl;
      await saveAppSettings('sidebar_custom_bg', bgUrl);
      window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
      alert('Đã tải lên và lưu ảnh nền Menu bên trái thành công!');
      return;
    }
    throw new Error('Không nhận được mã tệp');
  } catch (err) {
    try {
      const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
      currentSidebarBg.value = compressedBase64;
      await saveAppSettings('sidebar_custom_bg', compressedBase64);
      window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
      alert('Đã lưu ảnh nền Menu bên trái thành công!');
    } catch (fallbackErr) {
      alert('Lỗi lưu ảnh: ' + (fallbackErr.message || err.message));
    }
  } finally {
    event.target.value = '';
  }
};

const saveSidebarBgOpacity = async () => {
  try {
    await saveAppSettings('sidebar_bg_opacity', Number(sidebarBgOpacity.value));
    window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  } catch (e) {}
};

const resetDefaultSidebarBg = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục lại nền Menu mặc định (xanh rêu #889962)?')) return;
  currentSidebarBg.value = '';
  sidebarBgOpacity.value = 40;
  await saveAppSettings('sidebar_custom_bg', null);
  await saveAppSettings('sidebar_bg_opacity', 40);
  window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  alert('Đã khôi phục nền Menu mặc định!');
};

// Quản lý Danh sách Mẫu Word (.docx)
const tplFileInputRef = ref(null);
const docxTemplates = ref([]);

const hasCustomDefaultTemplate = computed(() => {
  return docxTemplates.value.some((t) => t.isDefault);
});

const loadDocxTemplates = async () => {
  try {
    const saved = await getAppSettings('system_docx_templates', []);
    if (Array.isArray(saved)) {
      docxTemplates.value = saved;
    }
  } catch (err) {
    console.error('Error loading docx templates:', err);
  }
};

const handleUploadDocxTemplate = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const base64 = e.target.result.split(',')[1];
      const newTpl = {
        id: 'tpl_' + Date.now(),
        name: file.name,
        size: file.size,
        base64: base64,
        isDefault: docxTemplates.value.length === 0,
        uploadedAt: new Date().toLocaleString('vi-VN'),
      };
      const updated = [...docxTemplates.value, newTpl];
      docxTemplates.value = updated;
      await saveAppSettings('system_docx_templates', updated);
      alert(`Đã tải lên tệp mẫu "${file.name}" thành công!`);
    } catch (err) {
      alert('Lỗi lưu mẫu: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
  event.target.value = '';
};

const setAsDefaultTemplate = async (templateId) => {
  const updated = docxTemplates.value.map((t) => ({
    ...t,
    isDefault: t.id === templateId,
  }));
  docxTemplates.value = updated;
  await saveAppSettings('system_docx_templates', updated);
};

const setSystemAsDefault = async () => {
  const updated = docxTemplates.value.map((t) => ({
    ...t,
    isDefault: false,
  }));
  docxTemplates.value = updated;
  await saveAppSettings('system_docx_templates', updated);
};

const deleteSavedTemplate = async (templateId) => {
  const tpl = docxTemplates.value.find((t) => t.id === templateId);
  const name = tpl?.name || 'mẫu này';
  if (!confirm(`Bạn có chắc chắn muốn xóa tệp mẫu "${name}" khỏi hệ thống không?`)) return;
  const updated = docxTemplates.value.filter((t) => t.id !== templateId);
  docxTemplates.value = updated;
  await saveAppSettings('system_docx_templates', updated);
  await saveAppSettings('custom_docx_template', null);
  alert(`Đã xóa tệp mẫu "${name}" thành công!`);
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

const availablePersonnelCols = computed(() => {
  const cols = [];
  let idx = 0;
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      idx++;
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id, colIndex: idx });
      }
    });
  });
  return cols;
});

const availableRelativeCols = computed(() => {
  const cols = [];
  let idx = 0;
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      idx++;
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id, colIndex: idx });
      }
    });
  });
  return cols;
});

const availableTripCols = computed(() => {
  const cols = [];
  let idx = 0;
  (tripsGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      idx++;
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id, colIndex: idx });
      }
    });
  });
  return cols;
});

const currentActiveFormulaCols = computed(() => {
  if (activeTab.value === 'personnel') return availablePersonnelCols.value;
  if (activeTab.value === 'trips') return availableTripCols.value;
  return availableRelativeCols.value;
});

const DEFAULT_RELATIVE_MAPPING = [
  {
    group: 'Thông tin Thân nhân',
    isMultiple: true,
    columns: [
      { id: 'parentName', label: 'Họ tên Cán bộ', width: '25', format: 'text' },
      { id: 'cccdparent', label: 'CCCD Cán bộ liên quan', width: '25', format: 'text' },
      { id: 'relationshipName', label: 'Mối quan hệ', width: '25', format: 'dropdown', options: 'Bố, Mẹ, Vợ, Chồng, Con đẻ, Con nuôi, Anh, Chị, Em ruột, Bố chồng/vợ, Mẹ chồng/vợ' },
      { id: 'relativeName', label: 'Họ và tên thân nhân', width: '25', format: 'text' },
      { id: 'cccdthannhan', label: 'CCCD thân nhân', width: '25', format: 'text' },
      { id: 'birthYear', label: 'Năm sinh', width: '25', format: 'number' },
      { id: 'currentAddress', label: 'Nơi ở hiện nay', width: '50', format: 'text' },
      { id: 'occupation', label: 'Nghề nghiệp / Nơi làm việc', width: '50', format: 'text' },
      { id: 'countryName', label: 'Quốc gia định cư / lưu trú', width: '33', format: 'text' },
      { id: 'passportNumber', label: 'Số Hộ chiếu thân nhân', width: '25', format: 'text' },
      { id: 'notes', label: 'Ghi chú', width: '50', format: 'text' },
    ],
  },
];

const DEFAULT_TRIPS_MAPPING = [
  {
    group: 'Thông tin chuyến đi xuất nhập cảnh',
    isMultiple: false,
    columns: [
      { id: 'cccdchuyendi', label: 'CCCD / Định danh người đi (cccdchuyendi)', width: '25', format: 'text', placeholder: 'Nhập CCCD Cán bộ hoặc Thân nhân' },
      { id: 'countryName', label: 'Quốc gia / Nơi đến', width: '33', format: 'text', placeholder: 'Nhập quốc gia' },
      { id: 'departureDate', label: 'Ngày xuất cảnh', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
      { id: 'arrivalDate', label: 'Ngày nhập cảnh', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
      { id: 'decisionNumber', label: 'Số quyết định duyệt', width: '33', format: 'text', placeholder: 'VD: 1234/QĐ-UBND' },
      { id: 'decisionDate', label: 'Ngày quyết định', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
      { id: 'fundingName', label: 'Nguồn kinh phí', width: '33', format: 'dropdown', options: 'Ngân sách nhà nước, Tài trợ, Tự túc, Khác' },
      { id: 'purpose', label: 'Mục đích chuyến đi', width: '50', format: 'text', placeholder: 'Công tác, Du lịch, Thăm thân...' },
      { id: 'passportNumber', label: 'Số Hộ chiếu', width: '25', format: 'text' },
      { id: 'approvedDepartureDate', label: 'Ngày đi duyệt', width: '25', format: 'date' },
      { id: 'approvedArrivalDate', label: 'Ngày về duyệt', width: '25', format: 'date' },
      { id: 'approvedExtensionDate', label: 'Ngày gia hạn duyệt', width: '25', format: 'date' },
    ],
  },
];

const formatOptions = [
  { label: 'Văn bản (Text)', value: 'text' },
  { label: 'Số (Number)', value: 'number' },
  { label: 'Ngày tháng (Date)', value: 'date' },
  { label: 'List Dữ liệu (Text Loop)', value: 'text_loop' },
  { label: 'Bảng lặp nhiều cột (Tùy biến tiêu đề)', value: 'table_loop' },
  { label: 'Hộp kiểm (Nhiều lựa chọn)', value: 'checkbox' },
  { label: 'Hộp kiểm + Nhập Text (Có điều kiện)', value: 'checkbox_text' },
  { label: 'Hộp kiểm + Tệp đính kèm', value: 'checkbox_file' },
  { label: 'Dropdown (Lựa chọn đơn)', value: 'dropdown' },
  { label: 'Cột Công thức (Formula / Trạng thái)', value: 'formula' },
  { label: 'Tệp đính kèm (File/Ảnh/PDF)', value: 'file' },
  { label: 'Văn bản + Tệp đính kèm (Loop)', value: 'text_file_loop' },
  { label: 'Hộp kiểm + Tệp đính kèm (Loop)', value: 'checkbox_file_loop' },
];

const widthOptions = [
  { label: 'Rộng: 25%', value: '25' },
  { label: 'Rộng: 33%', value: '33' },
  { label: 'Rộng: 50%', value: '50' },
  { label: 'Rộng: 75%', value: '75' },
  { label: 'Rộng: 100%', value: '100' },
];

const generateSlug = (str) => {
  if (!str) return 'cot_' + Date.now();
  const slug = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'cot_' + Date.now();
};

const getSubOptions = (col) => {
  if (col.format === 'checkbox_text' && col.options) {
    return String(col.options)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeGroupColumns = (groups) => {
  (groups || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (!c.width) c.width = '25';
      if (c.id && c.id.startsWith('custom_') && c.label) {
        const cleanSlug = generateSlug(c.label);
        if (cleanSlug) c.id = cleanSlug;
      }
    });
  });
  return groups;
};

// =========================================================================
// QUẢN LÝ DASHBOARD CHUYÊN ĐỀ (DYNAMIC TOPIC DASHBOARDS)
// =========================================================================
const DEFAULT_TOPIC_DASHBOARDS_CONFIG = [
  {
    id: 'trips',
    code: 'CD-03',
    title: 'Danh sách Chuyến đi',
    description: 'Tổng hợp các chuyến đi nước ngoài của cán bộ và thân nhân',
    source: 'trips',
    icon: 'pi-send',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
      { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
      { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
      { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
    ],
    columns: [], // Để trống = Mặc định hiển thị đầy đủ toàn bộ cột khả dụng của chuyên đề
  },
];

const customDashboards = ref([...DEFAULT_TOPIC_DASHBOARDS_CONFIG]);
const selectedDashboardIdx = ref(0);
const dashboardSaveStatus = ref(''); // '', 'saving', 'saved'
let isDashboardLoaded = false;
let autoSaveTimer = null;
let lastSavedDashboardsJson = '';

const currentSelectedDashboard = computed(() => {
  return customDashboards.value[selectedDashboardIdx.value] || customDashboards.value[0] || null;
});

const loadCustomDashboards = async () => {
  try {
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customDashboards.value = saved;
      localStorage.setItem('custom_dashboards_config', JSON.stringify(saved));
    } else {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local) customDashboards.value = JSON.parse(local);
    }
  } catch (e) {
    console.error('Error loading custom dashboards:', e);
  } finally {
    setTimeout(() => {
      lastSavedDashboardsJson = JSON.stringify(customDashboards.value);
      isDashboardLoaded = true;
    }, 150);
  }
};

const debouncedAutoSaveDashboards = () => {
  if (!isDashboardLoaded) return;
  const currentJson = JSON.stringify(customDashboards.value);
  if (currentJson === lastSavedDashboardsJson) return;

  dashboardSaveStatus.value = 'saving';
  try {
    localStorage.setItem('custom_dashboards_config', currentJson);
  } catch (e) {}

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    try {
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
      lastSavedDashboardsJson = JSON.stringify(customDashboards.value);
      dashboardSaveStatus.value = 'saved';
      console.log('Auto-saved custom dashboards config to DB.');
      setTimeout(() => {
        if (dashboardSaveStatus.value === 'saved') dashboardSaveStatus.value = '';
      }, 2500);
    } catch (e) {
      console.error('Error auto-saving custom dashboards:', e);
      dashboardSaveStatus.value = '';
    }
  }, 600);
};

watch(
  customDashboards,
  () => {
    debouncedAutoSaveDashboards();
  },
  { deep: true }
);

const saveDashboardsConfig = async () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  try {
    const currentJson = JSON.stringify(customDashboards.value);
    localStorage.setItem('custom_dashboards_config', currentJson);
    await saveAppSettings('custom_dashboards_config', customDashboards.value);
    lastSavedDashboardsJson = currentJson;
    dashboardSaveStatus.value = 'saved';
    alert('Đã lưu cấu hình Dashboard thành công! Thanh menu và trang Dashboard đã được cập nhật.');
  } catch (e) {
    console.error('Error saving custom dashboards:', e);
    alert('Đã lưu cục bộ thành công!');
  }
};

const resetDefaultDashboards = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục danh sách Dashboard về mặc định ban đầu không?')) return;
  customDashboards.value = JSON.parse(JSON.stringify(DEFAULT_TOPIC_DASHBOARDS_CONFIG));
  selectedDashboardIdx.value = 0;
  await saveDashboardsConfig();
};

const addNewDashboard = () => {
  const newId = 'dash_' + Date.now();
  const newDash = {
    id: newId,
    code: 'DB-' + (customDashboards.value.length + 1),
    title: 'Dashboard Mới ' + (customDashboards.value.length + 1),
    description: '',
    source: 'trips',
    icon: 'pi-chart-pie',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
    ],
    columns: [], // Để trống = Mặc định hiển thị đầy đủ toàn bộ cột khả dụng của chuyên đề
  };
  customDashboards.value.push(newDash);
  selectedDashboardIdx.value = customDashboards.value.length - 1;
};

const moveDashboardUp = async (idx) => {
  if (idx <= 0) return;
  const temp = customDashboards.value[idx];
  customDashboards.value[idx] = customDashboards.value[idx - 1];
  customDashboards.value[idx - 1] = temp;
  selectedDashboardIdx.value = idx - 1;
  debouncedAutoSaveDashboards();
};

const moveDashboardDown = async (idx) => {
  if (idx >= customDashboards.value.length - 1) return;
  const temp = customDashboards.value[idx];
  customDashboards.value[idx] = customDashboards.value[idx + 1];
  customDashboards.value[idx + 1] = temp;
  selectedDashboardIdx.value = idx + 1;
  debouncedAutoSaveDashboards();
};

const removeDashboard = async (idx) => {
  const d = customDashboards.value[idx];
  if (!confirm(`Bạn có chắc chắn muốn xóa Dashboard "${d.title}" không?`)) return;
  customDashboards.value.splice(idx, 1);
  if (selectedDashboardIdx.value >= customDashboards.value.length) {
    selectedDashboardIdx.value = Math.max(0, customDashboards.value.length - 1);
  }
  await saveDashboardsConfig();
};

const addMetricCardToDashboard = (dash) => {
  if (!dash.metricCards) dash.metricCards = [];
  dash.metricCards.push({
    id: 'card_' + Date.now(),
    label: 'Chỉ số ' + (dash.metricCards.length + 1),
    condition: 'all',
    color: 'blue',
    widthPercent: '',
    logicOp: 'AND',
    conditions: [
      { id: 'cond_' + Date.now(), field: '', operator: 'has_value', value: '' }
    ],
  });
};

const getCardConditions = (card) => {
  if (!card) return [];
  if (!card.conditions || !Array.isArray(card.conditions)) {
    if (card.field) {
      card.conditions = [
        { id: 'cond_1', field: card.field, operator: card.operator || 'has_value', value: card.value || '' }
      ];
    } else {
      card.conditions = [
        { id: 'cond_1', field: '', operator: 'has_value', value: '' }
      ];
    }
  }
  // Tự động chuẩn hoá điều kiện đối tượng (isRelative) sang operator 'equals' và value 'Cán bộ'
  card.conditions.forEach((cond) => {
    if (cond.field === 'isRelative' || cond.field === '_doiTuong' || cond.field === 'doi_tuong') {
      if (!cond.operator || cond.operator === 'has_value') {
        cond.operator = 'equals';
      }
      if (!cond.value || cond.value === '') {
        cond.value = 'Cán bộ';
      }
    }
    if (cond.field === 'presenceStatus' || cond.field === '_presenceStatus') {
      if (!cond.operator || cond.operator === 'has_value') {
        cond.operator = 'equals';
      }
      if (!cond.value || cond.value === '') {
        cond.value = 'Đang ở nước ngoài';
      }
    }
  });
  if (!card.logicOp) card.logicOp = 'AND';
  return card.conditions;
};

const onCardConditionFieldChange = (cond) => {
  if (!cond) return;
  if (cond.field === 'isRelative' || cond.field === '_doiTuong' || cond.field === 'doi_tuong') {
    cond.operator = 'equals';
    if (!cond.value || cond.value === '') {
      cond.value = 'Cán bộ';
    }
  } else if (cond.field === 'presenceStatus' || cond.field === '_presenceStatus') {
    cond.operator = 'equals';
    if (!cond.value || cond.value === '') {
      cond.value = 'Đang ở nước ngoài';
    }
  } else if (!cond.operator) {
    cond.operator = 'has_value';
  }
};

const addConditionToCard = (card) => {
  const conds = getCardConditions(card);
  conds.push({
    id: 'cond_' + Date.now(),
    field: '',
    operator: 'has_value',
    value: ''
  });
};

const removeConditionFromCard = (card, condIdx) => {
  const conds = getCardConditions(card);
  if (conds.length <= 1) {
    conds[0].field = '';
    conds[0].operator = 'has_value';
    conds[0].value = '';
    card.field = '';
  } else {
    conds.splice(condIdx, 1);
  }
};

const removeMetricCard = (dash, cIdx) => {
  dash.metricCards.splice(cIdx, 1);
  debouncedAutoSaveDashboards();
};

const moveMetricCard = (dash, cIdx, direction) => {
  const targetIdx = cIdx + direction;
  if (!dash || !dash.metricCards || targetIdx < 0 || targetIdx >= dash.metricCards.length) return;
  const temp = dash.metricCards[cIdx];
  dash.metricCards[cIdx] = dash.metricCards[targetIdx];
  dash.metricCards[targetIdx] = temp;
  debouncedAutoSaveDashboards();
};

const categorizedDashboardCols = computed(() => {
  const groups = [];

  // 0. Nhóm Thuộc tính hệ thống & Phân loại (Dùng cho Thẻ KPI & Bộ lọc cơ sở)
  groups.push({
    category: '⚡ Thuộc tính & Phân loại (Bộ lọc)',
    options: [
      { id: 'isRelative', label: 'Đối tượng: Cán bộ / Thân nhân', displayLabel: '⚡ Đối tượng (Cán bộ hay Thân nhân) - isRelative' },
      { id: 'presenceStatus', label: 'Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn)', displayLabel: '⚡ Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn) - presenceStatus' },
    ],
  });

  // 1. Nhóm Chuyến đi (Trips)
  const tripCols = (availableTripCols.value || []).map((c, idx) => ({
    ...c,
    displayLabel: `Cột ${c.colIndex || idx + 1}: ${c.label || c.id} (${c.id})`,
  }));
  if (tripCols.length > 0) {
    groups.push({ category: '✈️ Bảng Chuyến đi (Trips)', options: tripCols });
  }

  // 2. Nhóm Thân nhân (Relatives)
  const relCols = (availableRelativeCols.value || []).map((c, idx) => ({
    ...c,
    displayLabel: `Cột ${c.colIndex || idx + 1}: ${c.label || c.id} (${c.id})`,
  }));
  if (relCols.length > 0) {
    groups.push({ category: '👨‍👩‍👧 Bảng Thân nhân (Relatives)', options: relCols });
  }

  // 3. Nhóm Cán bộ (Personnel)
  const pCols = (availablePersonnelCols.value || []).map((c, idx) => ({
    ...c,
    displayLabel: `Cột ${c.colIndex || idx + 1}: ${c.label || c.id} (${c.id})`,
  }));
  if (pCols.length > 0) {
    groups.push({ category: '📌 Bảng Cán bộ (Personnel)', options: pCols });
  }

  return groups;
});

const availableDashboardCols = computed(() => {
  const all = [];
  categorizedDashboardCols.value.forEach((grp) => {
    all.push(...grp.options);
  });
  return all;
});

const openTopicDashboard = (id) => {
  if (id === 'trips') router.push('/trips');
  else router.push(`/dashboard-topic/${id}`);
};

onMounted(async () => {
  if (route.query.tab) {
    activeTab.value = route.query.tab;
  }
  await personnelStore.loadSettings();
  personnelGroups.value = normalizeGroupColumns(JSON.parse(JSON.stringify(personnelStore.importMappingPersonnel || [])));
  relativeGroups.value = normalizeGroupColumns(
    personnelStore.importMappingRelative && personnelStore.importMappingRelative.length > 0
      ? JSON.parse(JSON.stringify(personnelStore.importMappingRelative))
      : JSON.parse(JSON.stringify(DEFAULT_RELATIVE_MAPPING))
  );
  tripsGroups.value = normalizeGroupColumns(
    personnelStore.importMappingTrips && personnelStore.importMappingTrips.length > 0
      ? JSON.parse(JSON.stringify(personnelStore.importMappingTrips))
      : JSON.parse(JSON.stringify(DEFAULT_TRIPS_MAPPING))
  );
  personnelKeyField.value = personnelStore.getPersonnelKeyField();
  personnelNameField.value = personnelStore.getPersonnelNameField();
  personnelPositionField.value = personnelStore.getPersonnelPositionField();
  personnelDepartmentField.value = personnelStore.getPersonnelDepartmentField();
  relativeParentKeyField.value = personnelStore.getRelativeParentKeyField();
  relativeKeyField.value = personnelStore.getRelativeKeyField();
  tripKeyField.value = personnelStore.getTripKeyField();
  await loadDocxTemplates();
  await loadLoginBg();
  await loadSidebarBgSettings();
  await loadCustomAppendices();
  await loadCustomDashboards();
});

const currentGroups = computed(() => {
  if (activeTab.value === 'personnel') return personnelGroups.value;
  if (activeTab.value === 'relative') return relativeGroups.value;
  if (activeTab.value === 'trips') return tripsGroups.value;
  return [];
});

const isSeedingData = ref(false);
const handleSeedTrips = async () => {
  if (!confirm('Hệ thống sẽ tạo 20 bản ghi chuyến đi mẫu (10 cho Cán bộ & 10 cho Thân nhân) với đầy đủ thông tin chuẩn hóa. Tiếp tục?')) return;
  isSeedingData.value = true;
  try {
    await personnelStore.seedSampleTripsData();
    alert('Đã tạo thành công 20 dữ liệu chuyến đi mẫu cho 10 cán bộ và 10 thân nhân!');
  } catch (e) {
    alert('Lỗi tạo dữ liệu mẫu: ' + (e.message || e));
  } finally {
    isSeedingData.value = false;
  }
};

// Tra cứu thẻ Tag (Tab 3)
const personnelColMap = computed(() => {
  return computeColumnIndexMap(personnelGroups.value || []);
});

const relativeColMap = computed(() => {
  return computeColumnIndexMap(relativeGroups.value || []);
});

const tripsColMap = computed(() => {
  return computeColumnIndexMap(tripsGroups.value || []);
});

const allAvailableTags = computed(() => {
  const tags = [];
  const pMap = personnelColMap.value;
  const rMap = relativeColMap.value;

  // 1. Cán bộ
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((col) => {
      const colNum = pMap[col.id] || '';
      if (col.format === 'table_loop') {
        tags.push({
          label: `Bảng lặp: ${col.label}`,
          tag: `{#${col.id}}...{col0}, {col1}...{/${col.id}}`,
          category: 'personnel',
          colNum,
        });
      } else if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
        tags.push({
          label: `${col.label} (Toàn bộ tên + nội dung)`,
          tag: `{${col.id}}`,
          category: 'personnel',
          colNum,
        });
        tags.push({
          label: `${col.label} -> Tên mục đã tích chọn`,
          tag: `{label_${col.id}}`,
          category: 'personnel',
          colNum,
        });
        if (col.format === 'checkbox_text') {
          tags.push({
            label: `${col.label} -> Chi tiết Text đã nhập`,
            tag: `{detail_${col.id}}`,
            category: 'personnel',
            colNum,
          });
        }
        const opts = String(col.options).split(',').map((s) => s.trim()).filter(Boolean);
        opts.forEach((optName) => {
          const optSlug = generateSlug(optName);
          if (optSlug) {
            tags.push({
              label: `${col.label} -> [Tích X ${optName}]`,
              tag: `{is_${col.id}_${optSlug}}`,
              category: 'personnel',
              colNum,
            });
          }
        });
      } else {
        tags.push({
          label: col.label,
          tag: `{${col.id}}`,
          category: 'personnel',
          colNum,
        });
      }
    });
  });

  // 2. Thân nhân
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((col) => {
      const colNum = rMap[col.id] || '';
      if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
        tags.push({
          label: `[Thân nhân] ${col.label} (Đầy đủ)`,
          tag: `{${col.id}}`,
          category: 'relatives',
          colNum,
        });
        tags.push({
          label: `[Thân nhân] ${col.label} -> Tên mục đã chọn`,
          tag: `{label_${col.id}}`,
          category: 'relatives',
          colNum,
        });
        if (col.format === 'checkbox_text') {
          tags.push({
            label: `[Thân nhân] ${col.label} -> Chi tiết`,
            tag: `{detail_${col.id}}`,
            category: 'relatives',
            colNum,
          });
        }
      } else {
        tags.push({
          label: `[Thân nhân] ${col.label}`,
          tag: `{${col.id}}`,
          category: 'relatives',
          colNum,
        });
      }
    });
  });

  // 3. Khối lặp Chuyến đi & Thân nhân
  tags.push(
    { label: 'Khối lặp Chuyến đi nước ngoài (Bắt đầu)', tag: '{#xuatnhapcanh}', category: 'trips', colNum: 'Chuyến đi' },
    { label: 'Khối lặp Chuyến đi nước ngoài (Kết thúc)', tag: '{/xuatnhapcanh}', category: 'trips', colNum: 'Chuyến đi' },
    { label: '[Chuyến đi] Quốc gia đến', tag: '{countryName}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Mục đích chuyến đi', tag: '{label_purpose}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Chi tiết mục đích', tag: '{detail_purpose}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày xuất cảnh', tag: '{departureDate}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày nhập cảnh', tag: '{arrivalDate}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Nguồn kinh phí', tag: '{label_funding2}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Số quyết định', tag: '{decisionNumber}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày ký quyết định', tag: '{decisionDate}', category: 'trips', colNum: '' },
    { label: 'Khối lặp Thân nhân (Bắt đầu)', tag: '{#than_nhan}', category: 'relatives', colNum: 'Thân nhân' },
    { label: 'Khối lặp Thân nhân (Kết thúc)', tag: '{/than_nhan}', category: 'relatives', colNum: 'Thân nhân' }
  );

  // 4. Hệ thống & Ngày giờ & Khối tổng hợp Group
  tags.push(
    { label: '🌟 TỔNG HỢP TOÀN BỘ CÁC GROUP (Tự động điền toàn bộ trường cán bộ & thân nhân theo khối)', tag: '{formgroup}', category: 'system', colNum: 'Auto Group' },
    { label: 'Ngày hiện tại dạng chữ (Ví dụ: ngày 21 tháng 08 năm 2026)', tag: '{ngay_hien_tai_text}', category: 'system', colNum: 'HT' },
    { label: 'Địa điểm & Ngày tháng đầy đủ (Ví dụ: Tp. Hồ Chí Minh, ngày 22 tháng 12 năm 2026)', tag: '{dia_diem_ngay_thang}', category: 'system', colNum: 'HT' },
    { label: 'Ngày hiện tại (DD/MM/YYYY)', tag: '{ngay_hien_tai}', category: 'system', colNum: 'HT' },
    { label: 'Ngày hiện tại (DD)', tag: '{ngay}', category: 'system', colNum: 'HT' },
    { label: 'Tháng hiện tại (MM)', tag: '{thang}', category: 'system', colNum: 'HT' },
    { label: 'Năm hiện tại (YYYY)', tag: '{nam}', category: 'system', colNum: 'HT' },
    { label: 'Giờ xuất file (HH)', tag: '{gio}', category: 'system', colNum: 'HT' },
    { label: 'Phút xuất file (mm)', tag: '{phut}', category: 'system', colNum: 'HT' },
    { label: 'Thời gian xuất (HH:mm)', tag: '{thoi_gian_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Ngày giờ xuất đầy đủ (DD/MM/YYYY HH:mm)', tag: '{ngay_gio_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Họ tên Người xuất file', tag: '{ho_ten_nguoi_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Số thứ tự cán bộ', tag: '{stt}', category: 'system', colNum: 'HT' }
  );

  return tags;
});

const personnelTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'personnel').length;
});

const relativeTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'relatives').length;
});

const systemTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'system').length;
});

const filteredTags = computed(() => {
  const q = (tagSearch.value || '').toLowerCase().trim();
  const cat = selectedCategory.value;

  return allAvailableTags.value.filter((item) => {
    let matchCat = false;
    if (cat === 'all') matchCat = true;
    else matchCat = item.category === cat;

    const matchQ =
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      (item.colNum && String(item.colNum).toLowerCase().includes(q));

    return matchCat && matchQ;
  });
});

const getCategoryLabel = (cat) => {
  switch (cat) {
    case 'personnel':
      return 'Cán bộ';
    case 'relatives':
      return 'Thân nhân';
    case 'trips':
      return 'Chuyến đi';
    case 'system':
      return 'Hệ thống';
    default:
      return 'Khác';
  }
};

const copyTag = (tag) => {
  navigator.clipboard.writeText(tag);
  copiedTag.value = tag;
  setTimeout(() => {
    if (copiedTag.value === tag) copiedTag.value = '';
  }, 2000);
};

const downloadSampleTemplate = async () => {
  try {
    const blob = await createSampleDocxTemplateBlob();
    saveAs(blob, 'Mau_Word_Trich_Ngang_Chuan.docx');
  } catch (e) {
    alert('Lỗi tạo mẫu Word: ' + e.message);
  }
};

const getColLabelBadge = (groupIndex, columnIndex) => {
  const groups = currentGroups.value;
  let count = 0;
  for (let i = 0; i < groupIndex; i++) {
    (groups[i]?.columns || []).forEach((c) => {
      const sub = getSubOptions(c);
      count += sub.length > 1 ? sub.length : 1;
    });
  }
  for (let j = 0; j < columnIndex; j++) {
    const prevCol = groups[groupIndex]?.columns?.[j];
    const sub = prevCol ? getSubOptions(prevCol) : [];
    count += sub.length > 1 ? sub.length : 1;
  }

  const currentCol = groups[groupIndex]?.columns?.[columnIndex];
  const currentSub = currentCol ? getSubOptions(currentCol) : [];
  const startCol = count + 1;

  if (currentSub.length > 1) {
    const endCol = count + currentSub.length;
    return `Cột ${startCol} - ${endCol} (${currentSub.length} cột)`;
  }
  return `Cột ${startCol}`;
};

const moveColumn = (gIdx, cIdx, direction) => {
  const groups = currentGroups.value;
  const currentGroup = groups[gIdx];
  if (!currentGroup || !currentGroup.columns) return;

  const targetIdx = cIdx + direction;

  // Move within the same group
  if (targetIdx >= 0 && targetIdx < currentGroup.columns.length) {
    const temp = currentGroup.columns[cIdx];
    currentGroup.columns[cIdx] = currentGroup.columns[targetIdx];
    currentGroup.columns[targetIdx] = temp;
    return;
  }

  // Move to previous group
  if (direction === -1 && gIdx > 0) {
    const col = currentGroup.columns.splice(cIdx, 1)[0];
    const prevGroup = groups[gIdx - 1];
    prevGroup.columns.push(col);
    return;
  }

  // Move to next group
  if (direction === 1 && gIdx < groups.length - 1) {
    const col = currentGroup.columns.splice(cIdx, 1)[0];
    const nextGroup = groups[gIdx + 1];
    nextGroup.columns.unshift(col);
    return;
  }
};

const onLabelBlur = (col) => {
  if (!col.id || col.id.startsWith('cot_') || col.id.startsWith('custom_')) {
    col.id = generateSlug(col.label);
  }
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

const moveGroupUp = (gIndex) => {
  if (gIndex <= 0) return;
  const list = currentGroups.value;
  const temp = list[gIndex];
  list[gIndex] = list[gIndex - 1];
  list[gIndex - 1] = temp;
};

const moveGroupDown = (gIndex) => {
  const list = currentGroups.value;
  if (gIndex >= list.length - 1) return;
  const temp = list[gIndex];
  list[gIndex] = list[gIndex + 1];
  list[gIndex + 1] = temp;
};

const addColumn = (gIdx) => {
  const label = 'Cột mới ' + (currentGroups.value[gIdx].columns.length + 1);
  const slugId = generateSlug(label);
  currentGroups.value[gIdx].columns.push({
    id: slugId,
    label: label,
    format: 'text',
    width: '25',
    options: '',
  });
};

const removeColumn = (gIdx, cIdx) => {
  currentGroups.value[gIdx].columns.splice(cIdx, 1);
};

const validateUniqueIds = () => {
  const pSeen = new Map();
  for (const g of personnelGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (pSeen.has(c.id)) {
          return `Trong Cấu hình Cán bộ: Mã ID "${c.id}" (${c.label}) bị trùng với "${pSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        pSeen.set(c.id, c.label || c.id);
      }
    }
  }

  const rSeen = new Map();
  for (const g of relativeGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (rSeen.has(c.id)) {
          return `Trong Cấu hình Thân nhân: Mã ID "${c.id}" (${c.label}) bị trùng với "${rSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        rSeen.set(c.id, c.label || c.id);
      }
    }
  }

  const tSeen = new Map();
  for (const g of tripsGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (tSeen.has(c.id)) {
          return `Trong Cấu hình Chuyến đi: Mã ID "${c.id}" (${c.label}) bị trùng với "${tSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        tSeen.set(c.id, c.label || c.id);
      }
    }
  }

  // 3. Cảnh báo nếu trùng ID giữa Cán bộ và Thân nhân (trừ trường khóa liên kết cha mẹ)
  for (const [rId, rLabel] of rSeen.entries()) {
    if (pSeen.has(rId) && rId !== 'cccdparent' && rId !== relativeParentKeyField.value) {
      return `Mã ID "${rId}" đang tồn tại ở cả bảng Cán bộ (${pSeen.get(rId)}) và Thân nhân (${rLabel}). Vui lòng đặt mã khác nhau để xuất báo cáo không bị nhầm lẫn.`;
    }
  }

  return null;
};

const saveConfig = async () => {
  if (activeTab.value === 'dashboard') {
    await saveDashboardsConfig();
    return;
  }
  if (activeTab.value === 'appendices') {
    await saveAppendicesConfig();
    return;
  }

  const errorMsg = validateUniqueIds();
  if (errorMsg) {
    alert('⚠️ KHÔNG THỂ LƯU CẤU HÌNH:\n\n' + errorMsg);
    return;
  }

  saving.value = true;
  try {
    const keyConfig = {
      personnelKeyField: personnelKeyField.value || 'cccdparent',
      personnelNameField: personnelNameField.value || 'name',
      personnelPositionField: personnelPositionField.value || 'position',
      personnelDepartmentField: personnelDepartmentField.value || 'departmentName',
      relativeParentKeyField: relativeParentKeyField.value || 'cccdparent',
      relativeKeyField: relativeKeyField.value || 'cccdthannhan',
      tripKeyField: tripKeyField.value || 'cccdchuyendi',
    };
    await saveAppSettings('system_key_config', keyConfig);
    personnelStore.systemKeyConfig = keyConfig;

    if (activeTab.value === 'personnel') {
      const allActiveCols = (personnelGroups.value || []).flatMap((g) => g.columns || []).filter((c) => c.id && c.id !== 'stt');
      await Promise.all([
        syncCollectionFields('personnels', allActiveCols),
        saveAppSettings('mapping_config_personnel', personnelGroups.value),
        saveAppSettings('importMappingPersonnel', personnelGroups.value),
      ]);
      personnelStore.importMappingPersonnel = personnelGroups.value;
    } else if (activeTab.value === 'relative') {
      await Promise.all([
        saveAppSettings('mapping_config_relative', relativeGroups.value),
        saveAppSettings('importMappingRelative', relativeGroups.value),
      ]);
      personnelStore.importMappingRelative = relativeGroups.value;
    } else if (activeTab.value === 'trips') {
      await Promise.all([
        saveAppSettings('mapping_config_trips', tripsGroups.value),
        saveAppSettings('importMappingTrips', tripsGroups.value),
      ]);
      personnelStore.importMappingTrips = tripsGroups.value;
    }
    alert('Đã lưu cấu hình cột và đồng bộ trực tiếp vào cơ sở dữ liệu Directus thành công!');
  } catch (err) {
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.custom-key-select {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-key-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.btn-reorder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  color: #475569;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.btn-reorder:hover:not(:disabled) {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.custom-col-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
  background-color: #ffffff;
  color: #1f2937;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.custom-col-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.segmented-tab-btn {
  background: transparent;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.segmented-tab-btn:hover {
  color: #1e293b;
}

.segmented-tab-btn.tab-active {
  background: #ffffff;
  color: #16a34a !important;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
