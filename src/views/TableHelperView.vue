<template>
  <div class="table-helper-page">
    <!-- Header Banner -->
    <header class="helper-header">
      <div class="header-container">
        <div class="header-branding">
          <div class="header-icon">
            <i class="pi pi-table"></i>
          </div>
          <div>
            <h1 class="header-title">Công cụ Soạn thảo Bảng & List Dữ liệu Tùy chỉnh</h1>
            <p class="header-subtitle">
              Hỗ trợ cán bộ & đơn vị soạn thảo các trường <strong>Bảng lặp nhiều cột</strong> và <strong>List dữ liệu</strong> để dán nhanh vào 1 ô file Excel nhập liệu.
            </p>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/login" class="back-link">
            <i class="pi pi-sign-in"></i>
            <span>Đăng nhập Hệ thống</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="helper-main">
      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'table_loop' }"
          @click="activeTab = 'table_loop'"
        >
          <i class="pi pi-list-check"></i>
          <span>1. Bảng lặp nhiều cột (Quá trình công tác, Khen thưởng...)</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'text_loop' }"
          @click="activeTab = 'text_loop'"
        >
          <i class="pi pi-align-left"></i>
          <span>2. List Dữ liệu (Mỗi dòng 1 mục: Hộ chiếu, Bằng cấp...)</span>
        </button>
      </div>

      <!-- TAB 1: BẢNG LẶP NHIỀU CỘT -->
      <div v-if="activeTab === 'table_loop'" class="tab-content">
        <!-- Preset Templates Selector -->
        <div class="card-box">
          <div class="box-title">
            <i class="pi pi-th-large text-primary"></i>
            <span>Chọn mẫu bảng nhanh hoặc tự cấu hình số cột:</span>
          </div>
          <div class="preset-buttons">
            <button
              v-for="(p, pIdx) in tablePresets"
              :key="pIdx"
              type="button"
              class="preset-chip"
              :class="{ selected: selectedPresetId === p.id }"
              @click="applyPreset(p)"
            >
              {{ p.name }}
            </button>
          </div>

          <!-- Column Headers Configuration -->
          <div class="col-config-section">
            <div class="col-config-header">
              <span class="sub-label">Tiêu đề các cột ({{ tableColumns.length }} cột):</span>
              <button type="button" class="btn-text-sm" @click="addColumn">
                <i class="pi pi-plus"></i> Thêm cột
              </button>
            </div>
            <div class="col-inputs-grid">
              <div v-for="(col, cIdx) in tableColumns" :key="cIdx" class="col-input-pill">
                <span class="col-num">Cột {{ cIdx + 1 }}:</span>
                <input
                  v-model="tableColumns[cIdx]"
                  type="text"
                  class="input-clean"
                  :placeholder="`Tiêu đề cột ${cIdx + 1}`"
                />
                <button
                  v-if="tableColumns.length > 1"
                  type="button"
                  class="btn-icon-del"
                  title="Xóa cột này"
                  @click="removeColumn(cIdx)"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Data Editor -->
        <div class="card-box">
          <div class="box-title-between">
            <div class="box-title">
              <i class="pi pi-pencil text-primary"></i>
              <span>Nhập liệu các dòng dữ liệu ({{ tableRows.length }} dòng):</span>
            </div>
            <div class="row-actions">
              <button type="button" class="btn-primary-sm" @click="addRow">
                <i class="pi pi-plus"></i> Thêm dòng mới
              </button>
              <button type="button" class="btn-secondary-sm" @click="clearTableRows">
                <i class="pi pi-trash"></i> Xóa hết
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="editor-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">STT</th>
                  <th v-for="(col, cIdx) in tableColumns" :key="cIdx">
                    {{ col || `Cột ${cIdx + 1}` }}
                  </th>
                  <th style="width: 60px; text-align: center;">Xóa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rIdx) in tableRows" :key="rIdx">
                  <td style="text-align: center; font-weight: 600; color: #64748b;">
                    {{ rIdx + 1 }}
                  </td>
                  <td v-for="(col, cIdx) in tableColumns" :key="cIdx">
                    <input
                      v-model="row[cIdx]"
                      type="text"
                      class="table-cell-input"
                      :placeholder="`Nhập ${col || `cột ${cIdx + 1}`}...`"
                    />
                  </td>
                  <td style="text-align: center;">
                    <button
                      type="button"
                      class="btn-row-del"
                      title="Xóa dòng này"
                      @click="removeRow(rIdx)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="tableRows.length === 0">
                  <td :colspan="tableColumns.length + 2" class="empty-state">
                    Chưa có dòng nào. Bấm nút <strong>"+ Thêm dòng mới"</strong> ở trên để bắt đầu nhập.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Output Result & Copy to Excel Box -->
        <div class="card-box highlight-box">
          <div class="box-title-between">
            <div class="box-title">
              <i class="pi pi-copy text-success"></i>
              <span style="color: #166534; font-weight: 700;">Kết quả định dạng chuẩn (Dán vào 1 ô Excel):</span>
            </div>
            <button
              type="button"
              class="btn-copy-lg"
              @click="copyToClipboard(formattedTableOutput, 'Đã sao chép chuỗi Bảng lặp vào bộ nhớ tạm!')"
            >
              <i class="pi pi-copy"></i>
              <span>Sao chép để Dán vào Excel</span>
            </button>
          </div>

          <textarea
            :value="formattedTableOutput"
            readonly
            rows="4"
            class="output-textarea"
            placeholder="Kết quả sẽ tự động hiển thị ở đây..."
          ></textarea>
          <div class="hint-text">
            💡 <strong>Cách dùng:</strong> Bấm nút <strong>"Sao chép để Dán vào Excel"</strong> &rarr; Mở file Excel &rarr; Chọn đúng 1 ô cần nhập &rarr; Nhấn <strong>Ctrl + V (hoặc Cmd + V)</strong>.
          </div>
        </div>

        <!-- Reverse Decode: Paste from Excel to Table -->
        <div class="card-box">
          <div class="box-title-between">
            <div class="box-title">
              <i class="pi pi-sync text-info"></i>
              <span>Giải mã ngược: Dán ô Excel vào đây để xem & sửa:</span>
            </div>
            <button type="button" class="btn-info-sm" @click="decodeFromExcelTable">
              <i class="pi pi-arrow-up-right"></i>
              <span>Giải mã thành Bảng</span>
            </button>
          </div>
          <textarea
            v-model="rawPasteInputTable"
            rows="3"
            class="input-textarea"
            placeholder="Dán nội dung từ 1 ô trong file Excel vào đây rồi bấm 'Giải mã thành Bảng'..."
          ></textarea>
        </div>
      </div>

      <!-- TAB 2: LIST DỮ LIỆU (TEXT LOOP) -->
      <div v-if="activeTab === 'text_loop'" class="tab-content">
        <div class="card-box">
          <div class="box-title-between">
            <div class="box-title">
              <i class="pi pi-list text-primary"></i>
              <span>Nhập các mục danh sách (Mỗi dòng là 1 mục):</span>
            </div>
            <button
              type="button"
              class="btn-copy-lg"
              @click="copyToClipboard(textLoopInput, 'Đã sao chép List Dữ liệu vào bộ nhớ tạm!')"
            >
              <i class="pi pi-copy"></i>
              <span>Sao chép để Dán vào Excel</span>
            </button>
          </div>

          <textarea
            v-model="textLoopInput"
            rows="8"
            class="input-textarea"
            placeholder="Nhập danh sách dữ liệu, mỗi dòng 1 mục. Ví dụ:
Hộ chiếu số C1234567 (Cấp ngày 10/01/2023)
Hộ chiếu số C9876543 (Cấp ngày 15/05/2025)
Bằng Thạc sĩ Quản lý công..."
          ></textarea>
          <div class="hint-text">
            💡 <strong>Quy tắc:</strong> Mỗi dòng xuống hàng ứng với 1 mục riêng biệt. Khi nhập vào hệ thống, các dòng sẽ được tự động tách thành danh sách độc lập.
          </div>
        </div>
      </div>
    </main>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-popup">
      <i class="pi pi-check-circle"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const activeTab = ref('table_loop');
const toastMessage = ref('');

const showToast = (msg) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
};

const copyToClipboard = async (text, successMsg) => {
  if (!text || String(text).trim() === '') {
    showToast('Chưa có nội dung để sao chép!');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg || 'Đã sao chép vào bộ nhớ tạm!');
  } catch (e) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(successMsg || 'Đã sao chép vào bộ nhớ tạm!');
  }
};

// ==========================================
// TAB 1: BẢNG LẶP NHIỀU CỘT
// ==========================================
const tablePresets = [
  {
    id: 'career',
    name: '💼 Quá trình công tác',
    columns: ['Từ tháng/năm', 'Đến tháng/năm', 'Chức danh / Chức vụ', 'Đơn vị công tác'],
    initialRows: [
      ['01/2015', '12/2019', 'Chuyên viên', 'Phòng Tham mưu'],
      ['01/2020', 'Nay', 'Phó Trưởng phòng', 'Phòng Tổ chức cán bộ'],
    ],
  },
  {
    id: 'reward',
    name: '🏆 Khen thưởng',
    columns: ['Năm', 'Hình thức khen thưởng', 'Số quyết định', 'Cơ quan ban hành'],
    initialRows: [
      ['2022', 'Chiến sĩ thi đua cơ sở', 'QĐ số 123/QĐ-CATP', 'Công an Thành phố'],
    ],
  },
  {
    id: 'discipline',
    name: '⚠️ Xử lý kỷ luật',
    columns: ['Năm', 'Hình thức kỷ luật', 'Số quyết định', 'Lý do'],
    initialRows: [],
  },
  {
    id: 'family',
    name: '👨‍👩‍👧 Quan hệ gia đình',
    columns: ['Họ và tên', 'Quan hệ', 'Năm sinh', 'Nghề nghiệp / Nơi cư trú'],
    initialRows: [
      ['Nguyễn Văn A', 'Cha đẻ', '1955', 'Hưu trí, TP.HCM'],
    ],
  },
  {
    id: 'custom',
    name: '✨ Tùy chỉnh tự do',
    columns: ['Cột 1', 'Cột 2', 'Cột 3'],
    initialRows: [['', '', '']],
  },
];

const selectedPresetId = ref('career');
const tableColumns = ref([...tablePresets[0].columns]);
const tableRows = ref(tablePresets[0].initialRows.map((r) => [...r]));

const applyPreset = (p) => {
  selectedPresetId.value = p.id;
  tableColumns.value = [...p.columns];
  tableRows.value = p.initialRows && p.initialRows.length > 0
    ? p.initialRows.map((r) => [...r])
    : [['', '', '']];
};

const addColumn = () => {
  const newNum = tableColumns.value.length + 1;
  tableColumns.value.push(`Cột ${newNum}`);
  tableRows.value.forEach((r) => r.push(''));
};

const removeColumn = (cIdx) => {
  if (tableColumns.value.length <= 1) return;
  tableColumns.value.splice(cIdx, 1);
  tableRows.value.forEach((r) => r.splice(cIdx, 1));
};

const addRow = () => {
  tableRows.value.push(new Array(tableColumns.value.length).fill(''));
};

const removeRow = (rIdx) => {
  tableRows.value.splice(rIdx, 1);
};

const clearTableRows = () => {
  tableRows.value = [];
};

const formattedTableOutput = computed(() => {
  if (!tableRows.value || tableRows.value.length === 0) return '';
  return tableRows.value
    .filter((row) => row && row.some((cell) => cell && String(cell).trim() !== ''))
    .map((row) => {
      return tableColumns.value
        .map((_, cIdx) => (row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]).trim() : ''))
        .join(' | ');
    })
    .join('\n');
});

// Reverse Decode
const rawPasteInputTable = ref('');

const decodeFromExcelTable = () => {
  const raw = String(rawPasteInputTable.value || '').trim();
  if (!raw) {
    showToast('Vui lòng dán nội dung từ ô Excel vào ô nhập trước!');
    return;
  }

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    showToast('Không tìm thấy dòng dữ liệu nào!');
    return;
  }

  const parsedRows = [];
  let maxCols = tableColumns.value.length;

  lines.forEach((line) => {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length > maxCols) {
      maxCols = parts.length;
    }
    parsedRows.push(parts);
  });

  while (tableColumns.value.length < maxCols) {
    tableColumns.value.push(`Cột ${tableColumns.value.length + 1}`);
  }

  tableRows.value = parsedRows.map((r) => {
    while (r.length < tableColumns.value.length) {
      r.push('');
    }
    return r;
  });

  showToast(`Đã giải mã thành công ${parsedRows.length} dòng dữ liệu!`);
};

// ==========================================
// TAB 2: LIST DỮ LIỆU (TEXT LOOP)
// ==========================================
const textLoopInput = ref(
  'Hộ chiếu số C1234567 (Cấp ngày 10/01/2023)\nHộ chiếu số C9876543 (Cấp ngày 15/05/2025)'
);
</script>

<style scoped>
.table-helper-page {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
}

.helper-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.25rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-branding {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 46px;
  height: 46px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d4ed8;
  font-size: 1.35rem;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.header-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin: 4px 0 0 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e3a8a;
  text-decoration: none;
  background: #eff6ff;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  transition: all 0.15s;
}

.back-link:hover {
  background: #dbeafe;
}

.helper-main {
  max-width: 1200px;
  margin: 1.5rem auto 3rem auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tabs-container {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 2px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1e3a8a;
  background: #f1f5f9;
}

.tab-btn.active {
  color: #1e3a8a;
  border-bottom-color: #1e3a8a;
  background: #ffffff;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.highlight-box {
  background: #f0fdf4;
  border-color: #86efac;
}

.box-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #1e293b;
}

.box-title-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.preset-chip {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-chip:hover {
  background: #e2e8f0;
}

.preset-chip.selected {
  background: #1e3a8a;
  color: #ffffff;
  border-color: #1e3a8a;
}

.col-config-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e2e8f0;
}

.col-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sub-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
}

.col-inputs-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.col-input-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
}

.col-num {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
}

.input-clean {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  width: 120px;
}

.btn-icon-del {
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  padding: 2px;
  font-size: 0.7rem;
}

.btn-primary-sm {
  background: #1e3a8a;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-secondary-sm {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-info-sm {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-text-sm {
  background: transparent;
  border: none;
  color: #1e3a8a;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-copy-lg {
  background: #16a34a;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.25);
  transition: all 0.15s;
}

.btn-copy-lg:hover {
  background: #15803d;
}

.table-responsive {
  overflow-x: auto;
}

.editor-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
}

.editor-table th {
  background: #f1f5f9;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  text-align: left;
}

.editor-table td {
  padding: 4px 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.table-cell-input {
  width: 100%;
  border: 1px solid transparent;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.82rem;
  outline: none;
  box-sizing: border-box;
}

.table-cell-input:focus {
  border-color: #3b82f6;
  background: #eff6ff;
}

.btn-row-del {
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-row-del:hover {
  background: #fee2e2;
}

.empty-state {
  text-align: center;
  padding: 1.5rem !important;
  color: #64748b;
  font-size: 0.85rem;
  background: #f8fafc !important;
}

.output-textarea {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #86efac;
  font-family: monospace;
  font-size: 0.85rem;
  background: #ffffff;
  color: #15803d;
  font-weight: 600;
  box-sizing: border-box;
  margin-top: 6px;
}

.input-textarea {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
  box-sizing: border-box;
  margin-top: 6px;
  line-height: 1.5;
}

.hint-text {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 6px;
  line-height: 1.4;
}

.toast-popup {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0f172a;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
