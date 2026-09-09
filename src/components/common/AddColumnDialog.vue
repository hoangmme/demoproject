<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'➕ Thêm Cột Dữ Liệu Mới (' + tableSourceName + ')'"
    :style="{ width: '540px' }"
    :closable="!isSaving"
  >
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 6px 0;">
      <!-- 1. Tên cột & Mã Field -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Tên hiển thị cột <span style="color: #ef4444;">*</span>
          </label>
          <input
            v-model="form.label"
            placeholder="VD: Số quyết định, Ngày cấp..."
            class="dialog-input"
            autofocus
            @input="onLabelInput"
          />
        </div>
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Mã định danh (Field ID) <span style="color: #ef4444;">*</span>
          </label>
          <input
            v-model="form.id"
            placeholder="so_quyet_dinh"
            class="dialog-input"
            style="font-family: monospace;"
            @input="isIdManuallyEdited = true"
          />
        </div>
      </div>

      <!-- 2. Kiểu dữ liệu (Format) -->
      <div>
        <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
          Kiểu dữ liệu:
        </label>
        <select v-model="form.format" class="dialog-select" @change="onFormatChange">
          <option value="text">Văn bản (Text) - Mặc định</option>
          <option value="number">Số (Number)</option>
          <option value="date">Ngày tháng (Date)</option>
          <option value="dropdown">Danh mục lựa chọn (Dropdown / Single Select)</option>
          <option value="checkbox">Hộp kiểm đơn (Checkbox)</option>
          <option value="checkbox_file_loop">Hộp kiểm kèm Tệp đính kèm</option>
          <option value="file">Tệp đính kèm (File / Ảnh / PDF)</option>
          <option value="lookup">🔗 Tham chiếu tự động (Lookup - Lấy dữ liệu từ bảng liên kết)</option>
          <option value="formula">⚡ Công thức Nâng cao (Formula - Lark Base / Teable)</option>
          <option value="rollup">📊 Tính toán tổng hợp (Rollup)</option>
        </select>
      </div>

      <!-- Tùy chọn nếu là Dropdown -->
      <div v-if="form.format === 'dropdown' || form.format === 'checkbox_file_loop'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <label style="font-size: 0.74rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
          Danh sách tùy chọn (cách nhau bởi dấu phẩy):
        </label>
        <input
          v-model="form.options"
          placeholder="VD: Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
          class="dialog-input"
        />
        <div style="font-size: 0.68rem; color: #64748b; margin-top: 4px;">
          Người dùng sẽ chọn giá trị từ danh sách này khi nhập liệu hoặc inline-edit trên bảng.
        </div>
      </div>

      <!-- CẤU HÌNH THAM CHIẾU TỰ ĐỘNG (LOOKUP ĐA BẢNG - LARK BASE STYLE) -->
      <div v-if="form.format === 'lookup'" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-link"></i>
            <span>Cấu hình Tham chiếu Tự động (Lookup)</span>
            <i
              class="pi pi-info-circle"
              style="font-size: 0.82rem; color: #2563eb; cursor: help;"
              title="Lookup giúp lấy giá trị 1 ô từ Bảng khác sang Bảng hiện tại dựa theo liên kết khóa hoặc điều kiện khớp giữa 2 bảng"
            ></i>
          </div>
          <span style="font-size: 0.65rem; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Lark Base</span>
        </div>

        <!-- Hộp giải thích cách hoạt động của Lookup với icon ! -->
        <div style="background: #ffffff; border: 1px solid #bfdbfe; border-left: 3px solid #2563eb; border-radius: 6px; padding: 6px 10px; font-size: 0.72rem; color: #1e40af; line-height: 1.45; display: flex; gap: 8px; align-items: flex-start;">
          <div style="width: 18px; height: 18px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.75rem; flex-shrink: 0; line-height: 1;">!</div>
          <div>
            <strong>Cách Lookup hoạt động:</strong> Lấy trực tiếp giá trị 1 cột từ Bảng khác sang Bảng này. <em>Ví dụ:</em> Ở bảng Chuyến đi, tự động lấy cột "Họ và tên Cán bộ" hoặc "Đơn vị" từ Bảng Cán bộ theo liên kết hồ sơ.
          </div>
        </div>

        <!-- 1. Look up data in this field: Chọn bảng đích & cột lấy dữ liệu -->
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #1e3a8a; display: block; margin-bottom: 3px;">
            1. Lấy dữ liệu từ bảng (Look up data in this field): <span style="color: #ef4444;">*</span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <select v-model="form.lookupTarget" class="dialog-select" @change="form.lookupField = ''">
              <option v-for="tbl in availableTargetTables" :key="tbl.id" :value="tbl.id">
                {{ tbl.title }}
              </option>
            </select>
            <select v-model="form.lookupField" class="dialog-select">
              <option value="">-- Chọn cột cần hiển thị --</option>
              <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                {{ c.label }} ({{ c.id }})
              </option>
            </select>
          </div>
        </div>

        <!-- 2. Reference data if: Điều kiện tham chiếu đa tầng -->
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-size: 0.72rem; font-weight: 700; color: #1e293b; margin: 0;">
              2. Tham chiếu dữ liệu khi (Reference data if):
            </label>
            <!-- Logic Operator (AND / OR) -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.68rem; color: #64748b;">Khớp:</span>
              <select
                v-model="form.lookupLogicOp"
                class="dialog-select"
                style="width: 85px; height: 26px; font-size: 0.7rem; padding: 0 6px; font-weight: 700; color: #0369a1; background: #f0f9ff;"
              >
                <option value="AND">AND (Tất cả)</option>
                <option value="OR">OR (Bất kỳ)</option>
              </select>
            </div>
          </div>

          <!-- Danh sách điều kiện -->
          <div v-if="form.lookupConditions && form.lookupConditions.length > 0" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
            <div
              v-for="(cond, cIdx) in form.lookupConditions"
              :key="cIdx"
              style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.68rem; font-weight: 700; color: #475569;">
                  Điều kiện {{ cIdx + 1 }}:
                </span>
                <button
                  type="button"
                  @click="removeLookupCondition(cIdx)"
                  style="border: none; background: transparent; color: #ef4444; cursor: pointer; font-size: 0.75rem; padding: 0 4px;"
                  title="Xóa điều kiện này"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <!-- Cột bảng đích -->
                <select v-model="cond.targetField" class="dialog-select" style="font-size: 0.74rem;">
                  <option value="">-- Chọn cột ở Bảng đích --</option>
                  <option v-for="c in targetLookupCols" :key="c.id" :value="c.id">
                    {{ c.label }} ({{ c.id }})
                  </option>
                </select>

                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 6px; align-items: center;">
                  <!-- Toán tử so sánh -->
                  <select v-model="cond.operator" class="dialog-select" style="font-size: 0.72rem;">
                    <option v-for="op in lookupOperators" :key="op.value" :value="op.value">
                      {{ op.label }}
                    </option>
                  </select>

                  <!-- Cột bảng hiện tại -->
                  <select
                    v-if="cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty'"
                    v-model="cond.sourceField"
                    class="dialog-select"
                    style="font-size: 0.74rem;"
                  >
                    <option value="">-- Chọn cột ở Bảng này --</option>
                    <option v-for="c in currentTableCols" :key="c.id" :value="c.id">
                      {{ c.label }} ({{ c.id }})
                    </option>
                  </select>
                  <span v-else style="font-size: 0.7rem; color: #94a3b8; font-style: italic; text-align: center;">
                    (Không cần cột so khớp)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else style="font-size: 0.7rem; color: #64748b; font-style: italic; margin-bottom: 8px;">
            Chưa có điều kiện nào. Dữ liệu sẽ tự động dùng Khóa liên kết mặc định của bảng.
          </div>

          <button
            type="button"
            @click="addLookupCondition"
            style="width: 100%; border: 1px dashed #3b82f6; background: #f0fdf4; color: #1d4ed8; padding: 6px 10px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600;"
          >
            <i class="pi pi-plus" style="font-size: 0.7rem;"></i>
            <span>+ Thêm điều kiện (Add Condition)</span>
          </button>
        </div>

        <!-- 3. Hiển thị dữ liệu & Định dạng -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 0.7rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 3px;">
              Hiển thị dữ liệu (Display data as):
            </label>
            <select v-model="form.lookupDisplay" class="dialog-select">
              <option value="value">Giá trị (Bản ghi đầu tiên)</option>
              <option value="join">Gộp tất cả (, )</option>
              <option value="count">Đếm số lượng</option>
              <option value="array">Nhiều dòng</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 3px;">
              Định dạng (Field format):
            </label>
            <select v-model="form.lookupFormat" class="dialog-select">
              <option value="default">Mặc định</option>
            </select>
          </div>
        </div>
      </div>

      <!-- CẤU HÌNH CÔNG THỨC (FORMULA) -->
      <div v-if="form.format === 'formula'" style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #86198f; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-bolt"></i>
            <span>⚡ Cấu hình Công thức Nâng cao (Lark Base & Teable Formula)</span>
          </div>
          <span style="font-size: 0.65rem; background: #fae8ff; color: #86198f; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Teable & Lark Engine</span>
        </div>
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #701a75; display: block; margin-bottom: 3px;">
            Loại công thức:
          </label>
          <select v-model="form.formulaType" class="dialog-select">
            <option value="custom_expression">⚡ Biểu thức Công thức Tự do Nâng cao (Lark Base / Teable)</option>
            <option value="presence_status">Trạng thái Hiện diện (Trong nước / Nước ngoài)</option>
            <option value="overdue_status">Quá hạn chưa về (So sánh Ngày về với Deadline/Hôm nay)</option>
            <option value="date_delta">So sánh 2 cột ngày (Sớm / Muộn / Đúng lịch)</option>
            <option value="conditional_check">Kiểm tra điều kiện (Cảnh báo khi thiếu dữ liệu)</option>
            <option value="depart_before_decision">Đi khi chưa có cấp thẩm quyền quyết định</option>
            <option value="trips_count_in_year">Số lần xuất cảnh trong năm</option>
          </select>
        </div>

        <!-- Trình soạn thảo Biểu thức Tự do -->
        <div v-if="form.formulaType === 'custom_expression'" style="margin-top: 4px;">
          <label style="font-size: 0.7rem; color: #701a75; font-weight: 700; display: block; margin-bottom: 3px;">
            Biểu thức tính toán (Formula Expression):
          </label>
          <textarea
            v-model="form.formulaExpression"
            class="dialog-input"
            style="width: 100%; height: 75px; font-family: monospace; font-size: 0.74rem; padding: 6px; line-height: 1.4; resize: vertical; background: #ffffff;"
            placeholder='VD: IF(DATEDIF({ngay_xuat_canh}, TODAY(), "D") > 30, "⚠️ Quá hạn", "Bình thường")'
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
          <div v-if="formulaTab === 'fields'" style="max-height: 110px; overflow-y: auto; background: #ffffff; border: 1px solid #f0abfc; border-radius: 4px; padding: 6px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
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
          <div v-if="formulaTab === 'functions'" style="max-height: 130px; overflow-y: auto; background: #ffffff; border: 1px solid #f0abfc; border-radius: 4px; padding: 6px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
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
        </div>

        <!-- 2. Trạng thái Hiện diện (presence_status) -->
        <div v-else-if="form.formulaType === 'presence_status'" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.7rem; color: #0284c7; line-height: 1.4; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 5px 8px;">
            💡 <strong>Nguyên lý:</strong> So sánh <strong>Ngày xuất cảnh</strong>, <strong>Ngày nhập cảnh</strong> và <strong>Thời gian duyệt về</strong> để xác định: <em>Trong nước</em>, <em>Đang ở nước ngoài</em>, hoặc <em>Quá hạn chưa về</em>.
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày xuất cảnh (Đi):</span>
              <select v-model="form.formulaDepCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (departureDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày nhập cảnh (Về):</span>
              <select v-model="form.formulaArrivalCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (arrivalDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
          </div>
          <div>
            <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Thời gian duyệt về (Deadline):</span>
            <select v-model="form.formulaApprovedArrivalCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
              <option value="">-- Mặc định (approvedArrivalDate) --</option>
              <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Trong nước:</span>
              <input v-model="form.formulaLabelDomestic" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Trong nước" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Nước ngoài:</span>
              <input v-model="form.formulaLabelAbroad" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Đang ở nước ngoài" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Quá hạn:</span>
              <input v-model="form.formulaLabelOverdue" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Quá hạn" />
            </div>
          </div>
        </div>

        <!-- 3. Quá hạn chưa về (overdue_status) -->
        <div v-else-if="form.formulaType === 'overdue_status'" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.7rem; color: #b91c1c; line-height: 1.4; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 5px 8px;">
            💡 <strong>Nguyên lý:</strong> So sánh <strong>Ngày nhập cảnh thực tế</strong> với <strong>Thời gian duyệt về (Deadline)</strong>. Nếu chưa về và Today vượt Deadline → <strong>Quá hạn</strong>.
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày nhập cảnh (Về):</span>
              <select v-model="form.formulaArrivalCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (arrivalDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Thời gian duyệt về:</span>
              <select v-model="form.formulaApprovedArrivalCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (approvedArrivalDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Quá hạn:</span>
              <input v-model="form.formulaLabelOverdue" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Quá hạn" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Đúng hạn:</span>
              <input v-model="form.formulaLabelOnTime" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Đúng hạn" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Chưa quá hạn:</span>
              <input v-model="form.formulaLabelNotYet" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Chưa quá hạn" />
            </div>
          </div>
        </div>

        <!-- 4. So sánh 2 cột ngày (date_delta) -->
        <div v-else-if="form.formulaType === 'date_delta'" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.7rem; color: #0369a1; line-height: 1.4; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 5px 8px;">
            💡 <strong>Nguyên lý:</strong> So sánh <strong>Cột Ngày A (thực tế)</strong> với <strong>Cột Ngày B (kế hoạch)</strong>. A &lt; B → <em>Sớm</em>, A &gt; B → <em>Muộn</em>, A = B → <em>Đúng lịch</em>.
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày A (Thực tế):</span>
              <select v-model="form.formulaColA" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Chọn cột Ngày A --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày B (Kế hoạch):</span>
              <select v-model="form.formulaColB" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Chọn cột Ngày B --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Sớm:</span>
              <input v-model="form.formulaLabelEarly" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Sớm" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Muộn:</span>
              <input v-model="form.formulaLabelLate" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Muộn" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Đúng lịch:</span>
              <input v-model="form.formulaLabelOnTime" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Đúng lịch" />
            </div>
          </div>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #475569; cursor: pointer; margin-top: 2px;">
            <input type="checkbox" v-model="form.formulaShowDays" style="accent-color: #0284c7;" />
            <span>Hiển thị kèm số ngày chênh lệch</span>
          </label>
        </div>

        <!-- 5. Kiểm tra điều kiện (conditional_check) -->
        <div v-else-if="form.formulaType === 'conditional_check'" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.7rem; color: #c2410c; line-height: 1.4; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 4px; padding: 5px 8px;">
            💡 <strong>Nguyên lý:</strong> Nếu <strong>Cột Điều kiện</strong> có dữ liệu nhưng <strong>Cột Kiểm tra</strong> rỗng → ⚠️ Cảnh báo.
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Điều kiện (Phải có):</span>
              <select v-model="form.formulaColCondition" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Chọn cột điều kiện --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Kiểm tra (Rỗng → Cảnh báo):</span>
              <select v-model="form.formulaColCheck" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Chọn cột kiểm tra --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Cảnh báo:</span>
              <input v-model="form.formulaLabelWarning" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="⚠️ Cảnh báo" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Hợp lệ (Tùy chọn):</span>
              <input v-model="form.formulaLabelOk" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Để trống nếu không cần" />
            </div>
          </div>
        </div>

        <!-- 6. Đi khi chưa có cấp thẩm quyền quyết định (depart_before_decision) -->
        <div v-else-if="form.formulaType === 'depart_before_decision'" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.7rem; color: #b91c1c; line-height: 1.4; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 5px 8px;">
            💡 <strong>Nguyên lý:</strong> So sánh <strong>Ngày xuất cảnh</strong> với <strong>Thời gian duyệt đi</strong> và kiểm tra có <strong>Số quyết định</strong> hay không.
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày xuất cảnh:</span>
              <select v-model="form.formulaDepCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (departureDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Thời gian duyệt đi:</span>
              <select v-model="form.formulaApprovedDepCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (approvedDepartureDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
          </div>
          <div>
            <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Số quyết định / Quyết định:</span>
            <select v-model="form.formulaColDecision" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
              <option value="">-- Mặc định (decisionNumber / so_quyet_dinh) --</option>
              <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn khi Vi phạm:</span>
              <input v-model="form.formulaLabelWarning" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Đi khi chưa có cấp thẩm quyền quyết định" />
            </div>
            <div>
              <span style="font-size: 0.64rem; color: #64748b;">Nhãn Đúng quyết định:</span>
              <input v-model="form.formulaLabelOnTime" class="dialog-input" style="font-size: 0.7rem; height: 26px; padding: 2px 6px;" placeholder="Đi đúng quyết định" />
            </div>
          </div>
        </div>

        <!-- 7. Số lần xuất cảnh trong năm (trips_count_in_year) -->
        <div v-else-if="form.formulaType === 'trips_count_in_year'" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 0.7rem; color: #166534; line-height: 1.4; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 5px 8px;">
            💡 <strong>Nguyên lý:</strong> Tự động tính tổng <strong>số lần xuất cảnh</strong> của cán bộ trong cùng một năm (dựa trên cột ngày xuất cảnh).
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Cột Ngày xuất cảnh để lấy năm:</span>
              <select v-model="form.formulaDepCol" class="dialog-select" style="font-size: 0.7rem; height: 28px;">
                <option value="">-- Mặc định (departureDate) --</option>
                <option v-for="c in currentTableCols" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Năm tính toán:</span>
              <input v-model="form.formulaTargetYear" class="dialog-input" style="font-size: 0.7rem; height: 28px; padding: 2px 6px;" placeholder="Để trống = Năm hiện tại" />
            </div>
          </div>
          <div>
            <span style="font-size: 0.68rem; color: #475569; font-weight: 600;">Đơn vị hiển thị:</span>
            <input v-model="form.formulaUnit" class="dialog-input" style="font-size: 0.7rem; height: 28px; padding: 2px 6px;" placeholder="Mặc định: lần" />
          </div>
        </div>

        <!-- Live Preview chung cho tất cả công thức -->
        <div style="margin-top: 8px; background: #fae8ff; border: 1px solid #f0abfc; border-radius: 4px; padding: 5px 8px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.68rem; color: #701a75; font-weight: 600;">Xem trước (Dòng 1):</span>
          <span style="font-size: 0.72rem; font-weight: 700; color: #86198f; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ formulaPreviewResult }}
          </span>
        </div>
      </div>

      <!-- CẤU HÌNH TÍNH TOÁN TỔNG HỢP (ROLLUP) -->
      <div v-if="form.format === 'rollup'" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: #15803d; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-calculator"></i>
            <span>📊 Cấu hình Tính toán Tổng hợp (Rollup)</span>
            <i
              class="pi pi-info-circle"
              style="font-size: 0.82rem; color: #16a34a; cursor: help;"
              title="Rollup gom và tính toán trên nhiều dòng từ Bảng khác liên kết với dòng hiện tại (Đếm số lượng, gom danh sách, tính tổng, lấy bản ghi mới nhất)"
            ></i>
          </div>
          <span style="font-size: 0.65rem; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Flat Engine</span>
        </div>

        <!-- Hộp giải thích cách hoạt động của Rollup với icon ! -->
        <div style="background: #ffffff; border: 1px solid #bbf7d0; border-left: 3px solid #16a34a; border-radius: 6px; padding: 6px 10px; font-size: 0.72rem; color: #166534; line-height: 1.45; display: flex; gap: 8px; align-items: flex-start;">
          <div style="width: 18px; height: 18px; border-radius: 50%; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.75rem; flex-shrink: 0; line-height: 1;">!</div>
          <div>
            <strong>Cách Rollup hoạt động:</strong> Thu thập toàn bộ các bản ghi từ Bảng khác có liên kết với dòng này và tính toán ra 1 giá trị. <em>Ví dụ:</em> Ở bảng Cán bộ, đếm số chuyến đi (<code>count</code>), gom danh sách các nước đã đi cách nhau dấu phẩy (<code>join</code>), hoặc cộng tổng kinh phí (<code>sum</code>).
          </div>
        </div>

        <!-- 1. Bảng dữ liệu liên kết nguồn -->
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #166534; display: block; margin-bottom: 3px;">
            1. Bảng dữ liệu cần tổng hợp: <span style="color: #ef4444;">*</span>
          </label>
          <select v-model="form.rollupTarget" class="dialog-select" @change="form.rollupField = ''">
            <option v-for="tbl in availableTargetTables" :key="tbl.id" :value="tbl.id">
              {{ tbl.title }}
            </option>
          </select>
        </div>

        <!-- 2. Hàm tính toán (Rollup Function) -->
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #166534; display: block; margin-bottom: 3px;">
            2. Hàm tính toán (Rollup Function): <span style="color: #ef4444;">*</span>
          </label>
          <select v-model="form.rollupFunction" class="dialog-select">
            <option value="count">count() - Đếm số lượng bản ghi (VD: Đếm số thân nhân, đếm số chuyến đi)</option>
            <option value="join">join() - Gom danh sách giá trị cách nhau dấu phẩy (VD: Danh sách các Quốc gia đã đi)</option>
            <option value="sum">sum() - Tính tổng giá trị số</option>
            <option value="latest">latest() - Lấy giá trị gần nhất / mới nhất</option>
          </select>
        </div>

        <!-- 3. Cột cần tính toán / gom nhóm -->
        <div>
          <label style="font-size: 0.72rem; font-weight: 700; color: #166534; display: block; margin-bottom: 3px;">
            3. Cột dữ liệu cần tổng hợp: <span v-if="form.rollupFunction !== 'count'" style="color: #ef4444;">*</span>
          </label>
          <select v-model="form.rollupField" class="dialog-select">
            <option value="">{{ form.rollupFunction === 'count' ? '-- Không bắt buộc khi Đếm số lượng (count) --' : '-- Chọn cột dữ liệu --' }}</option>
            <option v-for="c in targetRollupCols" :key="c.id" :value="c.id">
              {{ c.label }} ({{ c.id }})
            </option>
          </select>
        </div>

        <!-- Live Preview -->
        <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.68rem; color: #166534; font-weight: 600;">Xem trước kết quả (Dòng mẫu 1):</span>
          <span style="font-size: 0.74rem; font-weight: 700; color: #15803d; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ rollupPreviewResult }}
          </span>
        </div>
      </div>

      <!-- 3. Độ rộng trong Form Chi tiết (%) -->
      <div style="padding-top: 4px; border-top: 1px solid #f1f5f9;">
        <label style="font-size: 0.75rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
          Độ rộng trong Form Chi tiết (%):
        </label>
        <select v-model="form.width" class="dialog-select">
          <option v-for="opt in formWidthOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- 4. Tùy chọn Hiển thị & Xuất dữ liệu -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #1e293b; cursor: pointer; user-select: none; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
          <input
            type="checkbox"
            v-model="form.includeInExport"
            style="accent-color: #0284c7; width: 15px; height: 15px; cursor: pointer;"
          />
          <div>
            <div style="font-weight: 600;">Xuất bản in / Export</div>
            <div style="font-size: 0.65rem; color: #64748b;">In PDF, Xuất Excel/Word</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #1e293b; cursor: pointer; user-select: none; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
          <input
            type="checkbox"
            v-model="form.showInDetail"
            style="accent-color: #0284c7; width: 15px; height: 15px; cursor: pointer;"
          />
          <div>
            <div style="font-weight: 600;">Hiển thị ở chi tiết</div>
            <div style="font-size: 0.65rem; color: #64748b;">Xem / Sửa trong form chi tiết</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #1e293b; cursor: pointer; user-select: none; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; grid-column: span 2;">
          <input
            type="checkbox"
            v-model="form.collapseDuplicates"
            style="accent-color: #0284c7; width: 15px; height: 15px; cursor: pointer;"
          />
          <div>
            <div style="font-weight: 600;">Gộp / Ẩn giá trị lặp liên tiếp (Dấu lặp ″)</div>
            <div style="font-size: 0.65rem; color: #64748b;">Hàng sau trùng giá trị với hàng trước sẽ hiển thị dấu tương tự "″"</div>
          </div>
        </label>
      </div>

      <!-- 5. Bắt buộc nhập liệu (Required) -->
      <div style="padding-top: 4px;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Quy tắc nhập liệu khi lưu:
          </label>
          <button
            type="button"
            class="btn-required-toggle"
            :class="{ 'is-required': form.required }"
            @click="form.required = !form.required"
            title="Bắt buộc phải có dữ liệu khi lưu"
          >
            <i :class="form.required ? 'pi pi-check-square' : 'pi pi-stop'" style="font-size: 0.95rem;"></i>
            <span>★ Bắt buộc</span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 0.72rem; color: #64748b;">
          💡 Cột mới sẽ tự động hiển thị trên bảng ngay sau khi tạo.
        </span>
        <div style="display: flex; gap: 8px;">
          <Button label="Hủy" severity="secondary" text size="small" @click="dialogVisible = false" :disabled="isSaving" />
          <Button label="Tạo Cột Mới" icon="pi pi-check" severity="success" size="small" @click="handleSave" :loading="isSaving" />
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
import { getUnifiedTableDefinitions } from '@/utils/tableRegistry';

import {
  generateSlug,
  formWidthOptions,
  lookupOperators,
  evaluateCustomFormula,
  evaluateFormula,
  evaluateLookup,
  evaluateRollup,
  getRecordFieldValue,
  formulaFunctionsCatalog,
} from '@/utils/formatters';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  tableSource: {
    type: String,
    default: 'personnel', // 'personnel' | 'relatives' | 'trips'
  },
  targetIndex: {
    type: Number,
    default: -1,
  },
});

const emit = defineEmits(['update:visible', 'save']);

const personnelStore = usePersonnelStore();
const isSaving = ref(false);
const formulaTab = ref('fields');

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const tableSourceName = computed(() => {
  if (props.tableSource === 'relatives') return 'Bảng Thân nhân';
  if (props.tableSource === 'trips') return 'Bảng Chuyến đi';
  return 'Bảng Cán bộ';
});

const form = ref({
  label: '',
  id: '',
  format: 'text',
  options: '',
  width: '50',
  includeInExport: true,
  showInDetail: true,
  collapseDuplicates: false,
  required: false,
  lookupTarget: 'personnel',
  lookupLinkCol: '',
  lookupField: '',
  lookupConditions: [],
  lookupLogicOp: 'AND',
  lookupDisplay: 'value',
  lookupFormat: 'default',
  formulaType: 'custom_expression',
  formulaExpression: '',
  formulaDepCol: '',
  formulaArrivalCol: '',
  formulaApprovedArrivalCol: '',
  formulaApprovedDepCol: '',
  formulaColA: '',
  formulaColB: '',
  formulaColCondition: '',
  formulaColCheck: '',
  formulaColDecision: '',
  formulaLabelEarly: '',
  formulaLabelLate: '',
  formulaLabelOnTime: '',
  formulaLabelWarning: '',
  formulaLabelOk: '',
  formulaLabelMissing: '',
  formulaLabelDomestic: '',
  formulaLabelAbroad: '',
  formulaLabelOverdue: '',
  formulaLabelNotYet: '',
  formulaShowDays: false,
  formulaTargetYear: '',
  formulaUnit: '',
  rollupTarget: 'trips',
  rollupField: '',
  rollupFunction: 'count',
});

const isIdManuallyEdited = ref(false);

const onLabelInput = () => {
  if (!isIdManuallyEdited.value) {
    form.value.id = generateSlug(form.value.label || '');
  }
};

const onFormatChange = () => {
  if (form.value.format === 'formula' && !form.value.formulaType) {
    form.value.formulaType = 'custom_expression';
  }
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      isIdManuallyEdited.value = false;
      form.value = {
        label: '',
        id: '',
        format: 'text',
        options: '',
        width: '50',
        includeInExport: true,
        showInDetail: true,
        collapseDuplicates: false,
        required: false,
        lookupTarget: 'personnel',
        lookupLinkCol: '',
        lookupField: '',
        lookupConditions: [],
        lookupLogicOp: 'AND',
        lookupDisplay: 'value',
        lookupFormat: 'default',
        formulaType: 'custom_expression',
        formulaExpression: '',
        formulaDepCol: '',
        formulaArrivalCol: '',
        formulaApprovedArrivalCol: '',
        formulaApprovedDepCol: '',
        formulaColA: '',
        formulaColB: '',
        formulaColCondition: '',
        formulaColCheck: '',
        formulaColDecision: '',
        formulaLabelEarly: '',
        formulaLabelLate: '',
        formulaLabelOnTime: '',
        formulaLabelWarning: '',
        formulaLabelOk: '',
        formulaLabelMissing: '',
        formulaLabelDomestic: '',
        formulaLabelAbroad: '',
        formulaLabelOverdue: '',
        formulaLabelNotYet: '',
        formulaShowDays: false,
        formulaTargetYear: '',
        formulaUnit: '',
        rollupTarget: 'trips',
        rollupField: '',
        rollupFunction: 'count',
      };
    }
  }
);

const availablePersonnelCols = computed(() => {
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt' && c.id !== 'code') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const availableRelativeCols = computed(() => {
  const list = [];
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
    });
  });
  return list;
});

const availableTripCols = computed(() => {
  const list = [];
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.id !== 'stt') {
        list.push({ id: c.id, label: c.label || c.id });
      }
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
  return getColumnsForTargetTable(form.value.lookupTarget);
});

const targetRollupCols = computed(() => {
  return getColumnsForTargetTable(form.value.rollupTarget);
});

const addLookupCondition = () => {
  const defaultTarget = targetLookupCols.value?.[0]?.id || '';
  const defaultSource = currentTableCols.value?.[0]?.id || '';
  if (!Array.isArray(form.value.lookupConditions)) {
    form.value.lookupConditions = [];
  }
  form.value.lookupConditions.push({
    targetField: defaultTarget,
    operator: 'is',
    sourceField: defaultSource,
  });
};

const removeLookupCondition = (index) => {
  if (Array.isArray(form.value.lookupConditions)) {
    form.value.lookupConditions.splice(index, 1);
  }
};

const sampleRow = computed(() => {
  if (props.tableSource === 'trips') return personnelStore.tripsList?.[0] || {};
  if (props.tableSource === 'relatives') return personnelStore.relativesList?.[0] || {};
  return personnelStore.personnelList?.[0] || {};
});

const rollupPreviewResult = computed(() => {
  try {
    const res = evaluateRollup(sampleRow.value, {
      rollupTarget: form.value.rollupTarget || 'trips',
      rollupField: form.value.rollupField || '',
      rollupFunction: form.value.rollupFunction || 'count',
    }, personnelStore);
    if (res === null || res === undefined || res === '') return '(trống)';
    return String(res);
  } catch (e) {
    return 'Lỗi: ' + (e.message || e);
  }
});

const formulaPreviewResult = computed(() => {
  if (form.value.formulaType === 'custom_expression') {
    if (!form.value.formulaExpression) return '(chưa có)';
    try {
      const resolver = (targetColId) => {
        const c = (currentTableCols.value || []).find((col) => col.id === targetColId || col.label === targetColId);
        if (c && c.format === 'lookup') {
          const val = evaluateLookup(sampleRow.value, c, personnelStore);
          return val !== '-' ? val : '';
        }
        return getRecordFieldValue(sampleRow.value, targetColId);
      };
      const res = evaluateCustomFormula(sampleRow.value, form.value.formulaExpression, currentTableCols.value, resolver);
      if (!res) return '(trống)';
      const val = (res && typeof res === 'object' && 'label' in res) ? res.label : res;
      if (val === null || val === undefined || val === '') return '(trống)';
      return String(val);
    } catch (e) {
      return 'Lỗi: ' + e.message;
    }
  } else {
    try {
      const dummyCol = {
        id: form.value.id || 'preview_col',
        format: 'formula',
        formulaType: form.value.formulaType,
        formulaDepCol: form.value.formulaDepCol,
        formulaArrivalCol: form.value.formulaArrivalCol,
        formulaApprovedArrivalCol: form.value.formulaApprovedArrivalCol,
        formulaApprovedDepCol: form.value.formulaApprovedDepCol,
        formulaColA: form.value.formulaColA,
        formulaColB: form.value.formulaColB,
        formulaColCondition: form.value.formulaColCondition,
        formulaColCheck: form.value.formulaColCheck,
        formulaColDecision: form.value.formulaColDecision,
        formulaLabelEarly: form.value.formulaLabelEarly,
        formulaLabelLate: form.value.formulaLabelLate,
        formulaLabelOnTime: form.value.formulaLabelOnTime,
        formulaLabelWarning: form.value.formulaLabelWarning,
        formulaLabelOk: form.value.formulaLabelOk,
        formulaLabelMissing: form.value.formulaLabelMissing,
        formulaLabelDomestic: form.value.formulaLabelDomestic,
        formulaLabelAbroad: form.value.formulaLabelAbroad,
        formulaLabelOverdue: form.value.formulaLabelOverdue,
        formulaLabelNotYet: form.value.formulaLabelNotYet,
        formulaShowDays: form.value.formulaShowDays,
        formulaTargetYear: form.value.formulaTargetYear,
        formulaUnit: form.value.formulaUnit,
      };
      const res = evaluateFormula(sampleRow.value, dummyCol);
      const val = res?.label || res?.shortLabel || res || '(trống)';
      return String(val);
    } catch (e) {
      return 'Lỗi: ' + e.message;
    }
  }
});

const insertIntoFormula = (text) => {
  if (!form.value.formulaExpression) {
    form.value.formulaExpression = text;
  } else {
    form.value.formulaExpression += ' ' + text;
  }
};

const handleSave = async () => {
  if (!form.value.label?.trim()) {
    alert('Vui lòng nhập Tên cột!');
    return;
  }
  if (!form.value.id?.trim()) {
    alert('Vui lòng nhập Mã định danh cột (Field ID)!');
    return;
  }
  if (form.value.format === 'lookup' && !form.value.lookupField) {
    alert('Vui lòng chọn cột dữ liệu cần lấy từ bảng đích!');
    return;
  }
  if (form.value.format === 'rollup' && form.value.rollupFunction !== 'count' && !form.value.rollupField) {
    alert('Vui lòng chọn cột dữ liệu cần tổng hợp!');
    return;
  }

  isSaving.value = true;
  try {
    const colPayload = {
      id: form.value.id.trim(),
      label: form.value.label.trim(),
      format: form.value.format || 'text',
      width: String(form.value.width || '50'),
      includeInExport: form.value.includeInExport !== false,
      showInDetail: form.value.showInDetail !== false,
      collapseDuplicates: Boolean(form.value.collapseDuplicates),
      required: Boolean(form.value.required),
      options: form.value.options ? form.value.options.trim() : '',
      ...(form.value.format === 'lookup' ? {
        lookupTarget: form.value.lookupTarget || 'personnel',
        lookupLinkCol: form.value.lookupLinkCol || '',
        lookupField: form.value.lookupField,
        lookupConditions: form.value.lookupConditions || [],
        lookupLogicOp: form.value.lookupLogicOp || 'AND',
        lookupDisplay: form.value.lookupDisplay || 'value',
        lookupFormat: form.value.lookupFormat || 'default',
      } : {}),
      ...(form.value.format === 'formula' ? {
        formulaType: form.value.formulaType || 'custom_expression',
        formulaExpression: form.value.formulaExpression || '',
        formulaDepCol: form.value.formulaDepCol || '',
        formulaArrivalCol: form.value.formulaArrivalCol || '',
        formulaApprovedArrivalCol: form.value.formulaApprovedArrivalCol || '',
        formulaApprovedDepCol: form.value.formulaApprovedDepCol || '',
        formulaColA: form.value.formulaColA || '',
        formulaColB: form.value.formulaColB || '',
        formulaColCondition: form.value.formulaColCondition || '',
        formulaColCheck: form.value.formulaColCheck || '',
        formulaColDecision: form.value.formulaColDecision || '',
        formulaLabelEarly: form.value.formulaLabelEarly || '',
        formulaLabelLate: form.value.formulaLabelLate || '',
        formulaLabelOnTime: form.value.formulaLabelOnTime || '',
        formulaLabelWarning: form.value.formulaLabelWarning || '',
        formulaLabelOk: form.value.formulaLabelOk || '',
        formulaLabelMissing: form.value.formulaLabelMissing || '',
        formulaLabelDomestic: form.value.formulaLabelDomestic || '',
        formulaLabelAbroad: form.value.formulaLabelAbroad || '',
        formulaLabelOverdue: form.value.formulaLabelOverdue || '',
        formulaLabelNotYet: form.value.formulaLabelNotYet || '',
        formulaShowDays: Boolean(form.value.formulaShowDays),
        formulaTargetYear: form.value.formulaTargetYear || '',
        formulaUnit: form.value.formulaUnit || '',
      } : {}),
      ...(form.value.format === 'rollup' ? {
        rollupTarget: form.value.rollupTarget || 'trips',
        rollupField: form.value.rollupField || '',
        rollupFunction: form.value.rollupFunction || 'count',
      } : {}),
      targetIndex: props.targetIndex,
    };

    emit('save', colPayload);
    dialogVisible.value = false;
  } catch (e) {
    alert('Lỗi: ' + (e.message || e));
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.dialog-input {
  width: 100%;
  height: 32px;
  font-size: 0.8rem;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
}

.dialog-select {
  width: 100%;
  height: 32px;
  font-size: 0.8rem;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  background: #ffffff;
  box-sizing: border-box;
}

.dialog-select:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 1px #0284c7;
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
  padding: 4px 8px;
  font-size: 0.7rem;
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
  padding: 3px 8px;
  background: #fdf4ff;
  border: 1px solid #e879f9;
  border-radius: 12px;
  font-size: 0.68rem;
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
  padding: 5px 8px;
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
