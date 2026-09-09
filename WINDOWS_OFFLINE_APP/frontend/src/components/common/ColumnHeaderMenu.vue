<template>
  <div v-if="visible" class="column-header-menu-backdrop" @click="closeMenu">
    <div
      class="column-header-menu-popover"
      :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      @click.stop
    >
      <!-- Header Menu -->
      <div class="menu-header">
        <div class="menu-header-title">
          <i class="pi pi-cog" style="color: #0284c7; font-size: 0.85rem;"></i>
          <span>Tùy chỉnh Cột: <strong>{{ column?.label || column?.id }}</strong></span>
        </div>
        <button type="button" class="btn-close" @click="closeMenu">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Content / Form Quick Edit -->
      <div class="menu-body">
        <!-- 1. Đổi tên cột -->
        <div class="menu-field">
          <label>Tên hiển thị cột:</label>
          <div style="display: flex; gap: 4px;">
            <input
              v-model="editLabel"
              class="menu-input"
              placeholder="Nhập tên cột..."
              @keyup.enter="handleSaveRename"
            />
            <button
              type="button"
              class="btn-save-mini"
              :disabled="!editLabel.trim() || editLabel === column?.label"
              @click="handleSaveRename"
              title="Lưu đổi tên"
            >
              <i class="pi pi-check"></i>
            </button>
          </div>
        </div>

        <!-- 2. Đổi kiểu dữ liệu (Format) -->
        <div class="menu-field">
          <label>Kiểu dữ liệu:</label>
          <div v-if="column?.id === '_primaryKey'" style="font-size: 0.73rem; color: #64748b; padding: 6px 8px; background: #f1f5f9; border-radius: 6px; font-weight: 600;">
            Mã định danh (ID Hệ thống)
          </div>
          <select v-else v-model="editFormat" class="menu-select" @change="handleFormatChange">
            <option value="text">Văn bản (Text) - Mặc định</option>
            <option value="number">Số (Number)</option>
            <option value="date">Ngày tháng (Date)</option>
            <option value="dropdown">Danh mục lựa chọn (Dropdown / Single Select)</option>
            <option value="checkbox">Hộp kiểm đơn (Checkbox)</option>
            <option value="checkbox_file_loop">Hộp kiểm kèm Tệp (Checkbox + File)</option>
            <option value="file">Tệp đính kèm (Attachment / File / Ảnh / PDF)</option>
            <option value="lookup">🔗 Tham chiếu tự động (Lookup - Lấy dữ liệu từ bảng liên kết)</option>
            <option value="formula">⚡ Công thức Nâng cao (Formula - Lark Base / Teable)</option>
            <option value="rollup">📊 Tính toán tổng hợp (Rollup)</option>
          </select>
        </div>

        <!-- Cấu hình Tham chiếu Lookup nếu là lookup (Lark Base Style) -->
        <div v-if="editFormat === 'lookup'" class="menu-field" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px; margin-top: 6px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <i class="pi pi-link"></i>
              <span>Cấu hình Tham chiếu (Lookup)</span>
              <i
                class="pi pi-info-circle"
                style="font-size: 0.8rem; color: #2563eb; cursor: help;"
                title="Lookup lấy giá trị 1 ô từ Bảng khác sang Bảng hiện tại theo liên kết hồ sơ"
              ></i>
            </div>
            <span style="font-size: 0.65rem; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Lark Base</span>
          </div>

          <!-- Hộp giải thích cách hoạt động của Lookup với icon ! -->
          <div style="background: #ffffff; border: 1px solid #bfdbfe; border-left: 3px solid #2563eb; border-radius: 6px; padding: 5px 8px; font-size: 0.7rem; color: #1e40af; line-height: 1.4; display: flex; gap: 6px; align-items: flex-start; margin-bottom: 8px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; flex-shrink: 0; line-height: 1;">!</div>
            <div>
              <strong>Cách Lookup hoạt động:</strong> Lấy 1 cột từ Bảng khác sang Bảng này. <em>VD:</em> Bảng Chuyến đi lấy Tên Cán bộ / Đơn vị từ Bảng Cán bộ.
            </div>
          </div>

          <!-- 1. Look up data in this field: Chọn bảng đích & cột lấy dữ liệu -->
          <div style="margin-bottom: 8px;">
            <label style="font-size: 0.7rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 3px;">
              Lấy dữ liệu từ bảng (Look up data in this field):
            </label>
            <div style="margin-bottom: 6px;">
              <select v-model="editLookupTarget" class="menu-select" @change="editLookupField = ''; editLookupFields = []; handleSaveLookup()">
                <option v-for="tbl in availableTargetTables" :key="tbl.id" :value="tbl.id">
                  {{ tbl.title }}
                </option>
              </select>
            </div>

            <!-- Bộ chọn nhiều cột dữ liệu cùng lúc (Multi-select) -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <span style="font-size: 0.68rem; color: #1e3a8a; font-weight: 700;">
                  Chọn các cột cần lấy (mỗi dữ liệu 1 hàng):
                </span>
                <div style="display: flex; gap: 4px; font-size: 0.64rem;">
                  <button type="button" @click="selectAllLookupFields" style="background: none; border: none; color: #0284c7; cursor: pointer; padding: 0;">Tất cả</button>
                  <span style="color: #cbd5e1;">|</span>
                  <button type="button" @click="deselectAllLookupFields" style="background: none; border: none; color: #64748b; cursor: pointer; padding: 0;">Bỏ chọn</button>
                </div>
              </div>

              <!-- Danh sách checkbox các cột -->
              <div style="max-height: 125px; overflow-y: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; display: flex; flex-direction: column; gap: 2px;">
                <label
                  v-for="c in targetLookupCols"
                  :key="c.id"
                  style="display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.72rem; transition: background 0.15s ease;"
                  :style="{ background: editLookupFields.includes(c.id) ? '#eff6ff' : 'transparent' }"
                >
                  <input
                    type="checkbox"
                    :checked="editLookupFields.includes(c.id)"
                    @change="toggleLookupField(c.id)"
                    style="accent-color: #0284c7; width: 14px; height: 14px; cursor: pointer;"
                  />
                  <span style="font-weight: 500; color: #1e293b;">{{ c.label }}</span>
                  <span style="font-size: 0.64rem; color: #94a3b8;">({{ c.id }})</span>
                </label>
                <div v-if="!targetLookupCols || targetLookupCols.length === 0" style="font-size: 0.68rem; color: #94a3b8; padding: 6px; text-align: center;">
                  (Không có cột nào)
                </div>
              </div>
              <div v-if="editLookupFields.length > 0" style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 3px;">
                <span
                  v-for="fId in editLookupFields"
                  :key="fId"
                  style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.65rem; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-weight: 600;"
                >
                  {{ getLookupColLabel(fId) }}
                  <i class="pi pi-times" style="font-size: 0.55rem; cursor: pointer;" @click="toggleLookupField(fId)"></i>
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Reference data if: Điều kiện tham chiếu đa tầng -->
          <div style="margin-bottom: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.7rem; color: #1e293b; font-weight: 700;">
                Tham chiếu khi (Reference data if):
              </span>
              <!-- Logic Operator (AND / OR) -->
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 0.66rem; color: #64748b;">Khớp:</span>
                <select
                  v-model="editLookupLogicOp"
                  class="menu-select"
                  style="width: 76px; height: 22px; font-size: 0.68rem; padding: 0 4px; font-weight: 700; color: #0369a1; background: #f0f9ff;"
                  @change="handleSaveLookup"
                >
                  <option value="AND">AND (Tất cả)</option>
                  <option value="OR">OR (Bất kỳ)</option>
                </select>
              </div>
            </div>

            <!-- Danh sách từng điều kiện -->
            <div v-if="editLookupConditions && editLookupConditions.length > 0" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px;">
              <div
                v-for="(cond, cIdx) in editLookupConditions"
                :key="cIdx"
                style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 0.66rem; font-weight: 700; color: #475569;">
                    ĐK {{ cIdx + 1 }}:
                  </span>
                  <button
                    type="button"
                    @click="removeLookupCondition(cIdx)"
                    style="border: none; background: transparent; color: #ef4444; cursor: pointer; font-size: 0.72rem; padding: 0 4px;"
                    title="Xóa điều kiện này"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <!-- Bảng đích Field -->
                  <select v-model="cond.targetField" class="menu-select" style="font-size: 0.7rem; height: 26px; padding: 0 4px;" @change="handleSaveLookup">
                    <option value="">-- Cột bảng đích --</option>
                    <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                      {{ c.label }} ({{ c.id }})
                    </option>
                  </select>

                  <div style="display: grid; grid-template-columns: 110px 1fr; gap: 4px; align-items: center;">
                    <!-- Toán tử (Operator) -->
                    <select v-model="cond.operator" class="menu-select" style="font-size: 0.68rem; height: 26px; padding: 0 2px;" @change="handleSaveLookup">
                      <option v-for="op in lookupOperators" :key="op.value" :value="op.value">
                        {{ op.label }}
                      </option>
                    </select>

                    <!-- Cột bảng hiện tại (Field in current table) -->
                    <select
                      v-if="cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty'"
                      v-model="cond.sourceField"
                      class="menu-select"
                      style="font-size: 0.7rem; height: 26px; padding: 0 4px;"
                      @change="handleSaveLookup"
                    >
                      <option value="">-- Cột bảng này --</option>
                      <option v-for="c in currentTableCols" :key="c.id" :value="c.id">
                        {{ c.label }} ({{ c.id }})
                      </option>
                    </select>
                    <span v-else style="font-size: 0.65rem; color: #94a3b8; font-style: italic; text-align: center;">
                      (Không cần cột so sánh)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Khi chưa có điều kiện nào: Nút thêm -->
            <div v-else style="font-size: 0.68rem; color: #64748b; font-style: italic; margin-bottom: 6px;">
              Chưa có điều kiện nào. Dữ liệu sẽ dùng Khóa liên kết mặc định của bảng.
            </div>

            <button
              type="button"
              @click="addLookupCondition"
              style="width: 100%; border: 1px dashed #3b82f6; background: #f0fdf4; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-weight: 600;"
            >
              <i class="pi pi-plus" style="font-size: 0.68rem;"></i>
              <span>+ Thêm điều kiện (Add Condition)</span>
            </button>
          </div>

          <!-- 3. Display data as & Field format -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <label style="font-size: 0.68rem; color: #1e3a8a; font-weight: 600; display: block; margin-bottom: 2px;">
                Hiển thị dữ liệu (Display as):
              </label>
              <select v-model="editLookupDisplay" class="menu-select" style="font-size: 0.7rem;" @change="handleSaveLookup">
                <option value="value">Giá trị (Khớp đầu tiên)</option>
                <option value="join">Gộp tất cả (, )</option>
                <option value="count">Đếm số lượng</option>
                <option value="array">Nhiều dòng</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.68rem; color: #1e3a8a; font-weight: 600; display: block; margin-bottom: 2px;">
                Định dạng (Field format):
              </label>
              <select v-model="editLookupFormat" class="menu-select" style="font-size: 0.7rem;" @change="handleSaveLookup">
                <option value="default">Mặc định</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Cấu hình Công thức nếu là formula (Teable & Lark Base Style) -->
        <div v-if="editFormat === 'formula'" class="menu-field" style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 10px; margin-top: 6px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #86198f; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <i class="pi pi-bolt"></i>
              <span>⚡ Cấu hình Công thức Nâng cao (Lark Base & Teable Formula)</span>
            </div>
            <span style="font-size: 0.65rem; background: #fae8ff; color: #86198f; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Teable & Lark Engine</span>
          </div>

          <div>
            <label style="font-size: 0.7rem; color: #701a75; font-weight: 600; margin-bottom: 2px;">Loại công thức:</label>
            <select v-model="editFormulaType" class="menu-select" @change="handleSaveFormulaType">
              <option value="custom_expression">⚡ Biểu thức Công thức Tự do Nâng cao (Lark Base / Teable)</option>
              <option value="presence_status">Trạng thái Hiện diện (Trong nước / Nước ngoài)</option>
              <option value="overdue_status">Quá hạn chưa về (So sánh Ngày về với Deadline/Hôm nay)</option>
              <option value="date_delta">So sánh 2 cột ngày (Sớm / Muộn / Đúng lịch)</option>
              <option value="conditional_check">Kiểm tra điều kiện (Cảnh báo khi thiếu dữ liệu)</option>
              <option value="depart_before_decision">Đi khi chưa có cấp thẩm quyền quyết định</option>
              <option value="trips_count_in_year">Số lần xuất cảnh trong năm</option>
            </select>
          </div>

          <!-- Trình soạn thảo Biểu thức Tự do (Custom Expression Editor) -->
          <div v-if="editFormulaType === 'custom_expression'" style="margin-top: 8px;">
            <label style="font-size: 0.68rem; color: #701a75; font-weight: 700; display: block; margin-bottom: 3px;">
              Biểu thức tính toán (Formula Expression):
            </label>
            <textarea
              v-model="editFormulaExpression"
              class="menu-input"
              style="width: 100%; height: 72px; font-family: monospace; font-size: 0.72rem; padding: 6px; line-height: 1.4; resize: vertical; background: #ffffff;"
              placeholder='VD: IF(DATEDIF({ngay_xuat_canh}, TODAY(), "D") > 30, "⚠️ Quá hạn", "Bình thường")'
              @blur="handleSaveFormulaType"
            ></textarea>

            <!-- Tab chọn Chèn Cột hoặc Chèn Hàm -->
            <div style="display: flex; gap: 4px; margin-top: 6px;">
              <button
                type="button"
                :class="['btn-formula-tab', formulaTab === 'fields' ? 'active' : '']"
                @click="formulaTab = 'fields'"
              >
                <i class="pi pi-list" style="font-size: 0.65rem;"></i> Chèn Cột ({...})
              </button>
              <button
                type="button"
                :class="['btn-formula-tab', formulaTab === 'functions' ? 'active' : '']"
                @click="formulaTab = 'functions'"
              >
                <i class="pi pi-code" style="font-size: 0.65rem;"></i> Chèn Hàm (fn)
              </button>
            </div>

            <!-- Panel Danh sách Cột -->
            <div v-if="formulaTab === 'fields'" style="max-height: 110px; overflow-y: auto; background: #ffffff; border: 1px solid #f0abfc; border-radius: 4px; padding: 4px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
              <span
                v-for="c in currentTableCols"
                :key="c.id"
                class="formula-pill-field"
                @click="insertIntoFormula('{' + c.id + '}')"
                :title="'Mã cột: ' + c.id + '\nBấm để chèn vào công thức'"
              >
                + {{ c.label || c.id }}
              </span>
            </div>

            <!-- Panel Danh sách Hàm -->
            <div v-if="formulaTab === 'functions'" style="max-height: 125px; overflow-y: auto; background: #ffffff; border: 1px solid #f0abfc; border-radius: 4px; padding: 4px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
              <div
                v-for="fn in formulaFunctionsCatalog"
                :key="fn.name"
                class="formula-fn-item"
                @click="insertIntoFormula(fn.name + '()')"
                :title="fn.desc + '\nVí dụ: ' + fn.example"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: #701a75; font-size: 0.72rem;">{{ fn.name }}</strong>
                  <span style="font-size: 0.62rem; color: #94a3b8;">{{ fn.category }}</span>
                </div>
                <div style="font-size: 0.64rem; color: #64748b; font-family: monospace;">{{ fn.syntax }}</div>
              </div>
            </div>

            <!-- Live Preview -->
            <div style="margin-top: 6px; background: #fae8ff; border: 1px solid #f0abfc; border-radius: 4px; padding: 5px 8px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.68rem; color: #701a75; font-weight: 600;">Xem trước (Dòng 1):</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: #86198f; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ formulaPreviewResult }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cấu hình Tính toán Tổng hợp nếu là rollup (Flat Rollup Engine) -->
        <div v-if="editFormat === 'rollup'" class="menu-field" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; margin-top: 6px;">
          <div style="font-size: 0.76rem; font-weight: 700; color: #15803d; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <i class="pi pi-calculator"></i>
              <span>📊 Cấu hình Tính toán Tổng hợp (Rollup)</span>
              <i
                class="pi pi-info-circle"
                style="font-size: 0.8rem; color: #16a34a; cursor: help;"
                title="Rollup gom và tính toán trên nhiều dòng từ Bảng khác liên kết với dòng này"
              ></i>
            </div>
            <span style="font-size: 0.65rem; background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Flat Engine</span>
          </div>

          <!-- Hộp giải thích cách hoạt động của Rollup với icon ! -->
          <div style="background: #ffffff; border: 1px solid #bbf7d0; border-left: 3px solid #16a34a; border-radius: 6px; padding: 5px 8px; font-size: 0.7rem; color: #166534; line-height: 1.4; display: flex; gap: 6px; align-items: flex-start; margin-bottom: 8px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.7rem; flex-shrink: 0; line-height: 1;">!</div>
            <div>
              <strong>Cách Rollup hoạt động:</strong> Thu thập nhiều dòng liên kết từ Bảng khác và tính toán ra 1 ô. <em>VD:</em> Đếm số chuyến đi (<code>count</code>), gom danh sách nước đi (<code>join</code>), tính tổng kinh phí (<code>sum</code>).
            </div>
          </div>

          <!-- 1. Bảng dữ liệu nguồn -->
          <div style="margin-bottom: 6px;">
            <label style="font-size: 0.68rem; color: #166534; font-weight: 700; display: block; margin-bottom: 2px;">
              1. Bảng dữ liệu nguồn:
            </label>
            <select v-model="editRollupTarget" class="menu-select" @change="editRollupField = ''; handleSaveRollup()">
              <option v-for="tbl in availableTargetTables" :key="tbl.id" :value="tbl.id">
                {{ tbl.title }}
              </option>
            </select>
          </div>

          <!-- 2. Hàm tính toán -->
          <div style="margin-bottom: 6px;">
            <label style="font-size: 0.68rem; color: #166534; font-weight: 700; display: block; margin-bottom: 2px;">
              2. Hàm tính toán (Function):
            </label>
            <select v-model="editRollupFunction" class="menu-select" @change="handleSaveRollup">
              <option value="count">count() - Đếm số lượng</option>
              <option value="join">join() - Gom danh sách (phân tách dấu phẩy)</option>
              <option value="sum">sum() - Tính tổng giá trị số</option>
              <option value="latest">latest() - Lấy giá trị gần nhất</option>
            </select>
          </div>

          <!-- 3. Cột cần tính toán -->
          <div style="margin-bottom: 6px;">
            <label style="font-size: 0.68rem; color: #166534; font-weight: 700; display: block; margin-bottom: 2px;">
              3. Cột dữ liệu cần tổng hợp:
            </label>
            <select v-model="editRollupField" class="menu-select" @change="handleSaveRollup">
              <option value="">{{ editRollupFunction === 'count' ? '-- Không bắt buộc khi Đếm (count) --' : '-- Chọn cột dữ liệu --' }}</option>
              <option v-for="c in targetRollupCols" :key="c.id" :value="c.id">
                {{ c.label }} ({{ c.id }})
              </option>
            </select>
          </div>

          <!-- 4. Cặp cột khóa liên kết giữa 2 bảng -->
          <div style="margin-bottom: 6px; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 8px;">
            <label style="font-size: 0.68rem; color: #166534; font-weight: 700; display: block; margin-bottom: 4px;">
              4. Cặp cột liên kết (Khóa nối giữa 2 bảng):
            </label>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 4px; align-items: center;">
              <div>
                <span style="font-size: 0.64rem; color: #64748b; display: block; margin-bottom: 2px;">Cột bảng nguồn:</span>
                <select v-model="editRollupTargetCol" class="menu-select" style="font-size: 0.7rem; height: 26px; padding: 0 4px;" @change="handleSaveRollup">
                  <option value="">-- Cột bảng nguồn --</option>
                  <option v-for="c in targetRollupCols" :key="c.id" :value="c.id">
                    {{ c.label }} ({{ c.id }})
                  </option>
                </select>
              </div>
              <span style="font-weight: 700; color: #16a34a; font-size: 0.75rem; padding-top: 14px;">=</span>
              <div>
                <span style="font-size: 0.64rem; color: #64748b; display: block; margin-bottom: 2px;">Cột bảng này:</span>
                <select v-model="editRollupSourceCol" class="menu-select" style="font-size: 0.7rem; height: 26px; padding: 0 4px;" @change="handleSaveRollup">
                  <option value="">-- Cột bảng này --</option>
                  <option v-for="c in currentTableCols" :key="c.id" :value="c.id">
                    {{ c.label }} ({{ c.id }})
                  </option>
                </select>
              </div>
            </div>
            <div style="font-size: 0.62rem; color: #64748b; margin-top: 4px; font-style: italic;">
              💡 <em>VD:</em> Cột [cccdchuyendi] của Chuyến đi = Cột [cccd] của Cán bộ
            </div>
          </div>

          <!-- Live Preview -->
          <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.65rem; color: #166534; font-weight: 600;">Xem trước:</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: #15803d; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ rollupPreviewResult }}
            </span>
          </div>
        </div>

        <!-- Tùy chọn Options nếu là dropdown -->
        <div v-if="editFormat === 'dropdown' || editFormat === 'checkbox' || editFormat === 'checkbox_file_loop'" class="menu-field">
          <label>Danh sách tùy chọn (cách nhau bởi dấu phẩy):</label>
          <input
            v-model="editOptions"
            class="menu-input"
            placeholder="VD: Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
            @blur="handleSaveOptions"
          />
        </div>

        <!-- 4. Độ rộng trong Form Chi tiết (%) -->
        <div class="menu-field">
          <label>Độ rộng trong Form Chi tiết (%):</label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <select v-model="editFormWidth" class="menu-select" @change="handleSaveFormWidth">
              <option v-for="opt in formWidthOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 5. Bắt buộc nhập dữ liệu (Required) -->
        <div class="menu-field" style="margin-top: 6px;">
          <label style="margin-bottom: 5px;">Quy tắc nhập liệu khi lưu:</label>
          <button
            type="button"
            class="btn-required-toggle"
            :class="{ 'is-required': editRequired }"
            @click="handleToggleRequired"
            title="Bắt buộc phải có dữ liệu trường này khi lưu"
          >
            <i :class="editRequired ? 'pi pi-check-square' : 'pi pi-stop'" style="font-size: 0.95rem;"></i>
            <span>★ Bắt buộc</span>
          </button>
        </div>

        <!-- 5a. Tùy chọn Hiển thị & Xuất dữ liệu -->
        <div class="menu-field" style="margin-top: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 8px;">
          <label style="margin-bottom: 2px; font-weight: 700; color: #1e293b; font-size: 0.76rem;">Hiển thị & Xuất dữ liệu:</label>
          
          <label style="display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: #334155; cursor: pointer; user-select: none;">
            <input
              type="checkbox"
              v-model="editIncludeInExport"
              @change="handleToggleIncludeExport"
              style="accent-color: #0284c7; cursor: pointer;"
            />
            <span>Xuất hiện khi in PDF / Xuất & Nhập dữ liệu</span>
          </label>
          
          <label style="display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: #334155; cursor: pointer; user-select: none;">
            <input
              type="checkbox"
              v-model="editShowInDetail"
              @change="handleToggleShowInDetail"
              style="accent-color: #0284c7; cursor: pointer;"
            />
            <span>Hiển thị trong Form / Popup Chi tiết</span>
          </label>

          <label style="display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: #334155; cursor: pointer; user-select: none; background: #f0f9ff; border: 1px solid #bae6fd; padding: 4px 6px; border-radius: 4px;">
            <input
              type="checkbox"
              v-model="editCollapseDuplicates"
              @change="handleToggleCollapseDuplicates"
              style="accent-color: #0284c7; cursor: pointer;"
            />
            <span style="font-weight: 600; color: #0369a1;">Gộp / Ẩn giá trị lặp liên tiếp (Dấu lặp ″)</span>
          </label>
        </div>

        <!-- 5b. Gợi ý tự điền từ bảng khác (Autocomplete / Suggest Lookup) -->
        <div
          v-if="editFormat === 'text' || editFormat === 'id' || !editFormat"
          class="menu-field"
          style="margin-top: 6px; background: #fdf4ff; border: 1.5px solid #f0abfc; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 8px;"
        >
          <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; font-weight: 700; color: #86198f; font-size: 0.76rem; cursor: pointer;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-sparkles" style="color: #c026d3;"></i>
              Gợi ý tìm kiếm & Tự điền từ bảng khác:
            </span>
            <input
              type="checkbox"
              v-model="editSuggestEnabled"
              @change="handleSaveSuggest"
              style="accent-color: #c026d3; cursor: pointer; width: 16px; height: 16px;"
            />
          </label>

          <template v-if="editSuggestEnabled">
            <div style="font-size: 0.7rem; color: #701a75; line-height: 1.35;">
              Khi nhập liệu ở ô này, bạn gõ tìm kiếm theo tên hoặc mã từ bảng khác, hệ thống sẽ gợi ý và tự động điền giá trị tương ứng vào ô (dạng Flat độc lập).
            </div>

            <!-- Chọn Bảng nguồn gợi ý -->
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">1. Bảng nguồn dữ liệu gợi ý:</span>
              <select v-model="editSuggestTarget" class="menu-select" @change="handleSuggestTargetChange">
                <option v-for="t in availableTargetTables" :key="t.id" :value="t.id">
                  {{ t.title }} ({{ t.id }})
                </option>
              </select>
            </div>

            <!-- Chọn Cột để gõ tìm kiếm -->
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">2. Cột dùng để gõ tìm kiếm (VD: Họ và tên):</span>
              <select v-model="editSuggestSearchCol" class="menu-select" @change="handleSaveSuggest">
                <option value="">-- Chọn cột tìm kiếm --</option>
                <option v-for="c in suggestTargetCols" :key="c.id" :value="c.id">
                  {{ c.label }} ({{ c.id }})
                </option>
              </select>
            </div>

            <!-- Chọn Cột lấy giá trị điền vào ô -->
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.7rem; color: #475569; font-weight: 600;">3. Cột lấy giá trị điền vào ô (VD: CCCD, Mã):</span>
              <select v-model="editSuggestFillCol" class="menu-select" @change="handleSaveSuggest">
                <option value="">-- Chọn cột lấy giá trị điền --</option>
                <option v-for="c in suggestTargetCols" :key="c.id" :value="c.id">
                  {{ c.label }} ({{ c.id }})
                </option>
              </select>
            </div>
          </template>
        </div>

        <div class="menu-divider"></div>

        <!-- Chèn cột & Nhân bản (Lark Base style) -->
        <div class="menu-actions" style="margin-bottom: 6px;">
          <button
            v-if="column?.id !== '_primaryKey'"
            type="button"
            class="menu-action-btn"
            @click="handleInsertLeft"
          >
            <i class="pi pi-arrow-left" style="color: #0284c7;"></i>
            <span>← Chèn cột bên trái (Insert Left)</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleInsertRight">
            <i class="pi pi-arrow-right" style="color: #0284c7;"></i>
            <span>→ Chèn cột bên phải (Insert Right)</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleDuplicate">
            <i class="pi pi-clone" style="color: #10b981;"></i>
            <span>⧉ Nhân bản cột (Duplicate Column)</span>
          </button>
        </div>

        <div class="menu-divider"></div>

        <!-- Actions -->
        <div class="menu-actions">
          <button type="button" class="menu-action-btn" @click="handleCopyColumnTag">
            <i :class="copiedTag ? 'pi pi-check' : 'pi pi-copy'" :style="{ color: copiedTag ? '#16a34a' : '#0284c7' }"></i>
            <span>{{ copiedTag ? '✓ Đã sao chép mã {' + column?.id + '}' : 'Sao chép mã thẻ Word: {' + column?.id + '}' }}</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleFilterByCol">
            <i class="pi pi-filter" style="color: #0284c7;"></i>
            <span>Lọc theo cột này</span>
          </button>

          <button type="button" class="menu-action-btn" @click="handleHideColumn">
            <i class="pi pi-eye-slash" style="color: #f59e0b;"></i>
            <span>Ẩn cột này</span>
          </button>

          <button
            v-if="!column?.isVirtual && column?.id !== '_primaryKey' && column?.id !== 'code' && column?.id !== 'stt'"
            type="button"
            class="menu-action-btn action-danger"
            @click="handleDeleteColumn"
            style="color: #ef4444;"
          >
            <i class="pi pi-trash" style="color: #ef4444;"></i>
            <span style="color: #ef4444; font-weight: 600;">Xóa cột này khỏi bảng</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { usePersonnelStore } from "@/stores/personnel";
import { saveAppSettings } from "@/api/settings";
import {
  formWidthOptions,
  lookupOperators,
  evaluateCustomFormula,
  evaluateLookup,
  evaluateRollup,
  getRecordFieldValue,
  formulaFunctionsCatalog,
} from "@/utils/formatters";
import { getUnifiedTableDefinitions } from "@/utils/tableRegistry";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  column: {
    type: Object,
    default: null,
  },
  tableSource: {
    type: String,
    default: "personnel", // 'personnel' | 'relatives' | 'trips'
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  nameColFields: {
    type: Object,
    default: () => ({ name: true, cccdCB: true, position: true, department: true }),
  },
  availableParentFields: {
    type: Array,
    default: () => [],
  },
  isFirstColumn: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:visible",
  "rename-column",
  "change-format",
  "change-formula-type",
  "change-options",
  "change-form-width",
  "change-required",
  "change-include-export",
  "change-show-in-detail",
  "change-lookup",
  "change-rollup",
  "change-collapse-duplicates",
  "change-name-col-field",
  "change-suggest",
  "delete-column",
  "hide-column",
  "filter-column",
  "insert-left",
  "insert-right",
  "duplicate-column",
  "open-key-config",
]);

const personnelStore = usePersonnelStore();

const editLabel = ref("");
const editFormat = ref("text");
const editFormulaType = ref("presence_status");
const editFormulaExpression = ref("");
const formulaTab = ref("fields");
const editOptions = ref("");
const editFormWidth = ref("50");
const editRequired = ref(false);
const editIncludeInExport = ref(true);
const editShowInDetail = ref(true);
const editCollapseDuplicates = ref(false);

const editSuggestEnabled = ref(false);
const editSuggestTarget = ref("personnel");
const editSuggestSearchCol = ref("");
const editSuggestFillCol = ref("");

const editLookupTarget = ref("personnel");
const editLookupLinkCol = ref("");
const editLookupField = ref("");
const editLookupFields = ref([]);
const editLookupConditions = ref([]);
const editLookupLogicOp = ref("AND");
const editLookupDisplay = ref("value");
const editLookupFormat = ref("default");

const editRollupTarget = ref("trips");
const editRollupField = ref("");
const editRollupFunction = ref("count");
const editRollupTargetCol = ref("");
const editRollupSourceCol = ref("");

const availablePersonnelCols = computed(() => {
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && c.id !== 'code') list.push({ id: c.id, label: c.label || c.id });
    });
  });
  return list;
});

const availableRelativeCols = computed(() => {
  const list = [];
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') list.push({ id: c.id, label: c.label || c.id });
    });
  });
  return list;
});

const availableTripCols = computed(() => {
  const list = [];
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') list.push({ id: c.id, label: c.label || c.id });
    });
  });
  return list;
});

const customDashboards = ref([]);
const loadDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) customDashboards.value = parsed;
    }
  } catch (e) {}
};
loadDashboards();

const availableTargetTables = computed(() => {
  const list = getUnifiedTableDefinitions({
    personnelStore,
    customDashboards: customDashboards.value,
  });
  return list.map((t) => ({
    id: t.source || t.id,
    tableId: t.id,
    title: t.title || t.id,
    source: t.source,
  }));
});

const currentTableCols = computed(() => {
  if (props.tableSource === 'relatives') return availableRelativeCols.value;
  if (props.tableSource === 'trips') return availableTripCols.value;
  return availablePersonnelCols.value;
});

const getColumnsForTargetTable = (targetId) => {
  if (targetId === 'relatives') return availableRelativeCols.value;
  if (targetId === 'trips' || targetId === 'relative_trips') return availableTripCols.value;
  if (targetId === 'personnel') return availablePersonnelCols.value;
  const cust = (customDashboards.value || []).find((d) => d.id === targetId || d.source === targetId);
  if (cust && Array.isArray(cust.customColumns)) {
    return cust.customColumns.map((c) => ({ id: c.id, label: c.label || c.id }));
  }
  return availableTripCols.value;
};

const targetLookupCols = computed(() => {
  return getColumnsForTargetTable(editLookupTarget.value);
});

const targetRollupCols = computed(() => {
  return getColumnsForTargetTable(editRollupTarget.value);
});

const suggestTargetCols = computed(() => {
  return getColumnsForTargetTable(editSuggestTarget.value);
});

const handleSuggestTargetChange = () => {
  const cols = suggestTargetCols.value || [];
  const foundName = cols.find((c) => c.id === 'name' || c.id === 'relativeName' || c.id === 'fullName' || c.id === 'title' || (c.label && c.label.toLowerCase().includes('tên')));
  editSuggestSearchCol.value = foundName?.id || (cols[0]?.id || '');
  const foundCccd = cols.find((c) => c.id === 'cccd' || c.id === 'cccdthannhan' || c.id === 'code' || (c.label && c.label.toLowerCase().includes('cccd')));
  editSuggestFillCol.value = foundCccd?.id || (cols[1]?.id || cols[0]?.id || '');
  handleSaveSuggest();
};

const handleSaveSuggest = () => {
  emit("change-suggest", {
    colId: props.column.id,
    suggestEnabled: editSuggestEnabled.value,
    suggestTarget: editSuggestTarget.value,
    suggestSearchCol: editSuggestSearchCol.value,
    suggestFillCol: editSuggestFillCol.value,
  });
};

const defaultFallbackParentFields = [
  { key: 'name', label: 'Họ và tên' },
  { key: 'cccdCB', label: 'Số CCCD / Mã định danh' },
  { key: 'position', label: 'Chức vụ / Vị trí' },
  { key: 'department', label: 'Đơn vị / Phòng ban' },
];

const effectiveParentFieldOptions = computed(() => {
  if (Array.isArray(props.availableParentFields) && props.availableParentFields.length > 0) {
    return props.availableParentFields;
  }
  return defaultFallbackParentFields;
});

const selectedFieldCount = computed(() => {
  return effectiveParentFieldOptions.value.filter(opt => Boolean(props.nameColFields?.[opt.key])).length;
});

watch(
  () => props.column,
  (col) => {
    if (col) {
      editLabel.value = col.label || "";
      editFormat.value = col.format || "text";
      editOptions.value = col.options || "";
      editFormWidth.value = String(col.formWidth || col.width || "50").replace("%", "");
      editRequired.value = Boolean(col.required);
      editSuggestEnabled.value = Boolean(col.suggestEnabled);
      editSuggestTarget.value = col.suggestTarget || "personnel";
      editSuggestSearchCol.value = col.suggestSearchCol || "";
      editSuggestFillCol.value = col.suggestFillCol || "";
      editLookupTarget.value = col.lookupTarget || "personnel";
      editLookupLinkCol.value = col.lookupLinkCol || "";
      editLookupFields.value = Array.isArray(col.lookupFields) && col.lookupFields.length > 0
        ? [...col.lookupFields]
        : (col.lookupField ? [col.lookupField] : []);
      editLookupField.value = col.lookupField || (editLookupFields.value[0] || "");
      editLookupConditions.value = Array.isArray(col.lookupConditions)
        ? JSON.parse(JSON.stringify(col.lookupConditions))
        : (col.lookupLinkCol ? [{ targetField: col.lookupLinkCol, operator: 'is', sourceField: col.lookupLinkCol }] : []);
      editLookupLogicOp.value = col.lookupLogicOp || "AND";
      editLookupDisplay.value = col.lookupDisplay || "value";
      editLookupFormat.value = col.lookupFormat || "default";
      editFormulaType.value = col.formulaType || "presence_status";
      editFormulaExpression.value = col.formulaExpression || "";
      editRollupTarget.value = col.rollupTarget || "trips";
      editRollupField.value = col.rollupField || "";
      editRollupFunction.value = col.rollupFunction || "count";
      editRollupTargetCol.value = col.rollupTargetCol || "";
      editRollupSourceCol.value = col.rollupSourceCol || col.rollupLinkCol || "";
      editIncludeInExport.value = col.includeInExport !== false && col.includeInExport !== 'false';
      editShowInDetail.value = col.showInDetail !== false && col.showInDetail !== 'false';
      editCollapseDuplicates.value = Boolean(col.collapseDuplicates);
    }
  },
  { immediate: true }
);

const sampleRow = computed(() => {
  if (props.tableSource === 'trips') return personnelStore.tripsList?.[0] || {};
  if (props.tableSource === 'relatives') return personnelStore.relativesList?.[0] || {};
  return personnelStore.personnelList?.[0] || {};
});

const rollupPreviewResult = computed(() => {
  try {
    const res = evaluateRollup(sampleRow.value, {
      rollupTarget: editRollupTarget.value || 'trips',
      rollupField: editRollupField.value || '',
      rollupFunction: editRollupFunction.value || 'count',
      rollupTargetCol: editRollupTargetCol.value || '',
      rollupSourceCol: editRollupSourceCol.value || '',
    }, personnelStore);
    if (res === null || res === undefined || res === '') return '(trống)';
    return String(res);
  } catch (e) {
    return 'Lỗi: ' + (e.message || e);
  }
});

const formulaPreviewResult = computed(() => {
  if (!editFormulaExpression.value) return '(chưa có)';
  try {
    const resolver = (targetColId) => {
      const c = (currentTableCols.value || []).find((col) => col.id === targetColId || col.label === targetColId);
      if (c && c.format === 'lookup') {
        const val = evaluateLookup(sampleRow.value, c, personnelStore);
        return val !== '-' ? val : '';
      }
      return getRecordFieldValue(sampleRow.value, targetColId);
    };
    const res = evaluateCustomFormula(sampleRow.value, editFormulaExpression.value, currentTableCols.value, resolver);
    if (!res) return '(trống)';
    const val = (res && typeof res === 'object' && 'label' in res) ? res.label : res;
    if (val === null || val === undefined || val === '') return '(trống)';
    return String(val);
  } catch (e) {
    return 'Lỗi: ' + e.message;
  }
});

const insertIntoFormula = (text) => {
  if (!editFormulaExpression.value) {
    editFormulaExpression.value = text;
  } else {
    editFormulaExpression.value += ' ' + text;
  }
  handleSaveFormulaType();
};

const addLookupCondition = () => {
  const defaultTarget = targetLookupCols.value?.[0]?.id || '';
  const defaultSource = currentTableCols.value?.[0]?.id || '';
  editLookupConditions.value.push({
    targetField: defaultTarget,
    operator: 'is',
    sourceField: defaultSource,
  });
  handleSaveLookup();
};

const removeLookupCondition = (index) => {
  editLookupConditions.value.splice(index, 1);
  handleSaveLookup();
};

const closeMenu = () => {
  emit("update:visible", false);
};

const handleSaveRename = () => {
  if (!editLabel.value.trim()) return;
  emit("rename-column", { colId: props.column.id, newLabel: editLabel.value.trim() });
  closeMenu();
};

const getLookupColLabel = (colId) => {
  const found = (targetLookupCols.value || []).find((c) => c.id === colId);
  return found?.label || colId;
};

const toggleLookupField = (fieldId) => {
  const set = new Set(editLookupFields.value);
  if (set.has(fieldId)) {
    set.delete(fieldId);
  } else {
    set.add(fieldId);
  }
  editLookupFields.value = Array.from(set);
  editLookupField.value = editLookupFields.value[0] || '';
  handleSaveLookup();
};

const selectAllLookupFields = () => {
  editLookupFields.value = (targetLookupCols.value || []).map((c) => c.id);
  editLookupField.value = editLookupFields.value[0] || '';
  handleSaveLookup();
};

const deselectAllLookupFields = () => {
  editLookupFields.value = [];
  editLookupField.value = '';
  handleSaveLookup();
};

const handleSaveLookup = () => {
  emit("change-lookup", {
    colId: props.column.id,
    lookupTarget: editLookupTarget.value,
    lookupLinkCol: editLookupLinkCol.value.trim(),
    lookupField: editLookupFields.value[0] || editLookupField.value || '',
    lookupFields: editLookupFields.value,
    lookupConditions: editLookupConditions.value,
    lookupLogicOp: editLookupLogicOp.value,
    lookupDisplay: editLookupDisplay.value,
    lookupFormat: editLookupFormat.value,
  });
};

const handleSaveFormulaType = () => {
  emit("change-formula-type", {
    colId: props.column.id,
    formulaType: editFormulaType.value,
    formulaExpression: editFormulaExpression.value,
  });
};

const handleSaveRollup = () => {
  emit("change-rollup", {
    colId: props.column.id,
    rollupTarget: editRollupTarget.value,
    rollupField: editRollupField.value,
    rollupFunction: editRollupFunction.value,
    rollupTargetCol: editRollupTargetCol.value,
    rollupSourceCol: editRollupSourceCol.value,
    rollupLinkCol: editRollupSourceCol.value,
  });
};

const handleFormatChange = () => {
  if (editFormat.value === 'formula' && !editFormulaType.value) {
    editFormulaType.value = 'custom_expression';
  }
  emit("change-format", { colId: props.column.id, newFormat: editFormat.value });
  if (editFormat.value === 'lookup') {
    handleSaveLookup();
  } else if (editFormat.value === 'formula') {
    handleSaveFormulaType();
  } else if (editFormat.value === 'rollup') {
    handleSaveRollup();
  }
};

const handleSaveOptions = () => {
  emit("change-options", { colId: props.column.id, options: editOptions.value.trim() });
};

const handleSaveFormWidth = () => {
  emit("change-form-width", { colId: props.column.id, formWidth: editFormWidth.value });
};

const handleToggleRequired = () => {
  editRequired.value = !editRequired.value;
  emit("change-required", { colId: props.column.id, required: editRequired.value });
};

const handleToggleIncludeExport = () => {
  if (props.column) {
    props.column.includeInExport = editIncludeInExport.value;
  }
  emit("change-include-export", { colId: props.column.id, includeInExport: editIncludeInExport.value });
};

const handleToggleShowInDetail = () => {
  if (props.column) {
    props.column.showInDetail = editShowInDetail.value;
  }
  emit("change-show-in-detail", { colId: props.column.id, showInDetail: editShowInDetail.value });
};

const handleToggleCollapseDuplicates = () => {
  emit("change-collapse-duplicates", { colId: props.column.id, collapseDuplicates: editCollapseDuplicates.value });
};

const handleInsertLeft = () => {
  emit("insert-left", props.column);
  closeMenu();
};

const handleInsertRight = () => {
  emit("insert-right", props.column);
  closeMenu();
};

const handleDuplicate = () => {
  emit("duplicate-column", props.column);
  closeMenu();
};

const handleDeleteColumn = () => {
  if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn cột "${props.column?.label || props.column?.id}" khỏi bảng này không?`)) return;
  emit("delete-column", props.column.id);
  closeMenu();
};

const copiedTag = ref(false);
const handleCopyColumnTag = () => {
  if (!props.column || !props.column.id) return;
  const tag = `{${props.column.id}}`;
  try {
    navigator.clipboard.writeText(tag);
    copiedTag.value = true;
    setTimeout(() => {
      copiedTag.value = false;
      closeMenu();
    }, 1200);
  } catch (e) {
    console.error('Failed to copy column tag:', e);
  }
};

const handleHideColumn = () => {
  emit("hide-column", props.column.id);
  closeMenu();
};

const handleFilterByCol = () => {
  emit("filter-column", props.column);
  closeMenu();
};
</script>

<style scoped>
.btn-primary-key-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  justify-content: center;
}

.btn-primary-key-toggle:hover {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #b45309;
}

.btn-primary-key-toggle.is-primary-key {
  border-color: #f59e0b;
  background: #fef3c7;
  color: #b45309;
}
.column-header-menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.column-header-menu-popover {
  position: absolute;
  width: 360px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  animation: fadeIn 0.12s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.menu-header-title {
  font-size: 0.78rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.btn-close:hover {
  color: #ef4444;
}

.menu-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.menu-field label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
}

.menu-input {
  width: 100%;
  height: 28px;
  font-size: 0.75rem;
  padding: 2px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
}
.menu-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
}

.menu-select {
  width: 100%;
  height: 28px;
  font-size: 0.75rem;
  padding: 2px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  outline: none;
}

.btn-save-mini {
  background: #0284c7;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 8px;
  height: 28px;
  cursor: pointer;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-save-mini:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #334155;
  text-align: left;
  transition: background 0.15s ease;
}
.menu-action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-required-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-required-toggle:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-required-toggle.is-required {
  border-color: #dc2626;
  background: #fef2f2;
  color: #dc2626;
}

.btn-formula-tab {
  flex: 1;
  padding: 3px 6px;
  font-size: 0.68rem;
  border: 1px solid #e9d5ff;
  background: #ffffff;
  color: #7e22ce;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s ease;
}
.btn-formula-tab:hover {
  background: #fdf4ff;
  border-color: #c084fc;
}
.btn-formula-tab.active {
  background: #86198f;
  border-color: #86198f;
  color: #ffffff;
  font-weight: 600;
}

.formula-pill-field {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: #fdf4ff;
  border: 1px solid #e879f9;
  border-radius: 12px;
  font-size: 0.65rem;
  color: #86198f;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.formula-pill-field:hover {
  background: #f0abfc;
  color: #701a75;
}

.formula-fn-item {
  padding: 4px 6px;
  border: 1px solid #f5d0fe;
  background: #fdf4ff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.formula-fn-item:hover {
  background: #fae8ff;
  border-color: #d946ef;
}
</style>
