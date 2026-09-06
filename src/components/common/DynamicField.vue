<template>
  <div class="dynamic-field-wrapper">
    <!-- 1. Text -->
    <template v-if="col.format === 'text' || !col.format">
      <InputText
        v-model="model"
        :placeholder="col.placeholder || ('Nhập ' + (col.label || ''))"
        size="small"
        class="w-full"
      />
    </template>

    <!-- 2. Number -->
    <template v-else-if="col.format === 'number'">
      <InputNumber
        v-model="model"
        :placeholder="col.placeholder || 'Nhập số'"
        size="small"
        class="w-full"
      />
    </template>

    <!-- 3. Date -->
    <template v-else-if="col.format === 'date'">
      <AppDatePicker
        v-model="model"
        :placeholder="col.placeholder || 'DD/MM/YYYY'"
      />
    </template>

    <!-- 4. Text Loop (List dữ liệu lặp) -->
    <template v-else-if="col.format === 'text_loop'">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div v-for="(item, idx) in loopItems" :key="idx" style="display: flex; gap: 6px; align-items: center;">
          <InputText
            v-model="loopItems[idx]"
            size="small"
            style="flex: 1; font-size: 0.8rem;"
            :placeholder="'Dòng ' + (idx + 1)"
            @input="updateLoopModel"
          />
          <Button
            icon="pi pi-times"
            severity="danger"
            text
            size="small"
            @click="removeLoopItem(idx)"
            style="padding: 2px 6px;"
          />
        </div>
        <Button
          label="Thêm dòng"
          icon="pi pi-plus"
          size="small"
          text
          @click="addLoopItem"
          style="font-size: 0.75rem; align-self: flex-start; padding: 2px 6px;"
        />
      </div>
    </template>

    <!-- 4b. Table Loop (Bảng lặp nhiều cột tùy biến tiêu đề) -->
    <template v-else-if="col.format === 'table_2col' || col.format === 'table_loop'">
      <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; background: #fafafa; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; min-width: 320px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; font-weight: 700; text-align: left;">
              <th style="padding: 6px 8px; width: 35px; text-align: center; border-radius: 4px 0 0 4px;">STT</th>
              <th v-for="(h, hIdx) in tableHeaders" :key="hIdx" style="padding: 6px 8px;">
                {{ h }}
              </th>
              <th style="padding: 6px 8px; width: 32px; text-align: center; border-radius: 0 4px 4px 0;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIdx) in tableRows" :key="rIdx" style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px; text-align: center; color: #64748b; font-weight: 600;">{{ rIdx + 1 }}</td>
              <td v-for="(h, hIdx) in tableHeaders" :key="hIdx" style="padding: 4px;">
                <InputText
                  v-model="row['col' + hIdx]"
                  size="small"
                  :placeholder="'Nhập ' + h"
                  style="width: 100%; font-size: 0.78rem; padding: 4px 6px;"
                  @input="updateTableModel"
                />
              </td>
              <td style="padding: 4px; text-align: center;">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  @click="removeTableRow(rIdx)"
                  style="padding: 2px 4px; font-size: 0.75rem;"
                />
              </td>
            </tr>
            <tr v-if="tableRows.length === 0">
              <td :colspan="tableHeaders.length + 2" style="text-align: center; padding: 8px; color: #94a3b8; font-style: italic;">
                Chưa có dữ liệu bảng. Nhấp "+ Thêm hàng" để nhập.
              </td>
            </tr>
          </tbody>
        </table>
        <Button
          label="Thêm hàng"
          icon="pi pi-plus"
          size="small"
          text
          severity="success"
          @click="addTableRow"
          style="font-size: 0.75rem; align-self: flex-start; padding: 2px 6px; margin-top: 2px;"
        />
      </div>
    </template>

    <!-- 4c. Text + File Loop (Danh sách Văn bản + Tệp đính kèm lặp) -->
    <template v-else-if="col.format === 'text_file_loop'">
      <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <!-- Trạng thái chưa ấn (chưa có mục nào): Hiện nút bấm ban đầu -->
        <div v-if="textFileList.length === 0" style="display: flex; align-items: center;">
          <button
            type="button"
            class="btn-add-text-file-initial"
            style="background: #f0fdf4 !important; color: #166534 !important; border: 1.5px dashed #86efac !important; display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
            @click.stop="addTextFileRow"
          >
            <i class="pi pi-plus" style="font-size: 0.8rem; color: #166534 !important;"></i>
            <span style="color: #166534 !important; font-weight: 600;">Thêm mục (Văn bản + Tệp đính kèm)</span>
          </button>
        </div>
        <template v-else>
          <div
            v-for="(item, idx) in textFileList"
            :key="item.id || idx"
            style="display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;"
          >
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; width: 22px; text-align: center;">
                #{{ idx + 1 }}
              </span>
              <InputText
                v-model="item.text"
                size="small"
                style="flex: 1; font-size: 0.8rem;"
                :placeholder="'Nhập nội dung văn bản / diễn giải #' + (idx + 1)"
                @input="syncTextFileModel"
              />
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click.stop="removeTextFileRow(idx)"
                title="Xóa mục này"
                style="padding: 2px 6px;"
              />
            </div>

            <!-- File Attachment Area for this row -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-left: 30px; gap: 8px;">
              <div v-if="item.file" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; background: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid #cbd5e1; max-width: 85%; overflow: hidden;">
                <i class="pi pi-paperclip" style="color: #0284c7; font-size: 0.8rem; flex-shrink: 0;"></i>
                <span style="color: #1e293b; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                  {{ item.file.name || 'Tài liệu đính kèm' }}
                </span>
                <a v-if="item.file.url" :href="item.file.url" target="_blank" style="text-decoration: none; margin-left: 4px;">
                  <span style="color: #0284c7; font-size: 0.72rem; cursor: pointer; text-decoration: underline;">Xem</span>
                </a>
                <i
                  class="pi pi-times"
                  style="color: #ef4444; font-size: 0.7rem; cursor: pointer; margin-left: 6px;"
                  title="Xóa tệp đính kèm này"
                  @click.stop="removeRowFile(idx)"
                ></i>
              </div>
              <div v-else style="display: flex; align-items: center; gap: 6px;">
                <input
                  type="file"
                  :ref="el => setFileInputRef(el, idx)"
                  style="display: none;"
                  @change="e => handleRowFileUpload(e, idx)"
                />
                <Button
                  type="button"
                  :label="uploadingRowIdx === idx ? 'Đang tải lên...' : 'Đính kèm tệp'"
                  :icon="uploadingRowIdx === idx ? 'pi pi-spin pi-spinner' : 'pi pi-paperclip'"
                  size="small"
                  outlined
                  severity="secondary"
                  :disabled="uploadingRowIdx === idx"
                  @click.stop="triggerRowFileInput(idx)"
                  style="font-size: 0.72rem; padding: 2px 8px; height: 26px;"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn-add-text-file-more"
            style="background: #f8fafc !important; color: #166534 !important; border: 1px solid #86efac !important; display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; align-self: flex-start;"
            @click.stop="addTextFileRow"
          >
            <i class="pi pi-plus" style="font-size: 0.75rem; color: #166534 !important;"></i>
            <span style="color: #166534 !important; font-weight: 600;">Thêm mục mới (Văn bản + Tệp)</span>
          </button>
        </template>
      </div>
    </template>

    <!-- 4d. Checkbox + File Loop (Hộp kiểm + Tệp đính kèm lặp, hỗ trợ Chọn duy nhất / Chọn nhiều) -->
    <template v-else-if="col.format === 'checkbox_file_loop'">
      <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <!-- Thanh công cụ trên cùng: Nút tick "Chọn duy nhất" & Bộ đếm -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <label style="display: inline-flex; align-items: center; gap: 7px; font-size: 0.78rem; font-weight: 600; color: #1e293b; cursor: pointer; user-select: none;">
            <input
              type="checkbox"
              v-model="checkboxFileLoopIsSingle"
              @change="onToggleCheckboxFileLoopSingle"
              style="accent-color: #2563eb; width: 16px; height: 16px; cursor: pointer;"
            />
            <span style="color: #1e40af; font-weight: 700;">Chọn duy nhất (Chỉ 1 mục)</span>
            <span style="font-size: 0.72rem; color: #64748b; font-weight: normal;">(Bỏ tích = có thể chọn cả 2 hoặc nhiều mục)</span>
          </label>
          <span style="font-size: 0.74rem; color: #0369a1; font-weight: 600; background: #e0f2fe; padding: 2px 10px; border-radius: 12px; border: 1px solid #bae6fd;">
            Đã chọn: {{ selectedCheckboxFileLoopCount }} / {{ checkboxFileLoopList.length }} mục
          </span>
        </div>

        <!-- Trạng thái chưa có mục nào -->
        <div v-if="checkboxFileLoopList.length === 0" style="display: flex; align-items: center;">
          <button
            type="button"
            class="btn-add-text-file-initial"
            style="background: #f0fdf4 !important; color: #166534 !important; border: 1.5px dashed #86efac !important; display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
            @click.stop="addCheckboxFileLoopRow"
          >
            <i class="pi pi-plus" style="font-size: 0.8rem; color: #166534 !important;"></i>
            <span style="color: #166534 !important; font-weight: 600;">Thêm mục mới (Hộp kiểm + Tệp)</span>
          </button>
        </div>

        <!-- Danh sách các mục lặp -->
        <template v-else>
          <div
            v-for="(item, idx) in checkboxFileLoopList"
            :key="item.id || idx"
            :style="{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '8px 10px',
              background: item.checked ? '#f0fdf4' : '#f8fafc',
              border: item.checked ? '1px solid #86efac' : '1px solid #e2e8f0',
              borderRadius: '8px',
              transition: 'all 0.2s',
            }"
          >
            <div style="display: flex; gap: 8px; align-items: center;">
              <!-- Hộp kiểm tick chọn mục này -->
              <input
                :type="checkboxFileLoopIsSingle ? 'radio' : 'checkbox'"
                :checked="item.checked"
                :name="'cfl_grp_' + (col.id || 'field')"
                @change="onToggleCheckboxFileLoopItem(idx)"
                style="accent-color: #16a34a; width: 17px; height: 17px; cursor: pointer; flex-shrink: 0;"
                :title="checkboxFileLoopIsSingle ? 'Chọn mục này (Duy nhất)' : 'Chọn mục này'"
              />
              <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; width: 22px; text-align: center;">
                #{{ idx + 1 }}
              </span>
              <InputText
                v-model="item.text"
                size="small"
                style="flex: 1; font-size: 0.8rem;"
                :placeholder="'Nhập tên mục / nội dung #' + (idx + 1)"
                @input="syncCheckboxFileLoopModel"
              />
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click.stop="removeCheckboxFileLoopRow(idx)"
                title="Xóa mục này"
                style="padding: 2px 6px;"
              />
            </div>

            <!-- Tệp đính kèm cho mục này -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-left: 47px; gap: 8px;">
              <div v-if="item.file" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; background: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid #cbd5e1; max-width: 85%; overflow: hidden;">
                <i class="pi pi-paperclip" style="color: #0284c7; font-size: 0.8rem; flex-shrink: 0;"></i>
                <span style="color: #1e293b; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                  {{ item.file.name || 'Tài liệu đính kèm' }}
                </span>
                <a v-if="item.file.url" :href="item.file.url" target="_blank" style="text-decoration: none; margin-left: 4px;">
                  <span style="color: #0284c7; font-size: 0.72rem; cursor: pointer; text-decoration: underline;">Xem</span>
                </a>
                <i
                  class="pi pi-times"
                  style="color: #ef4444; font-size: 0.7rem; cursor: pointer; margin-left: 6px;"
                  title="Xóa tệp đính kèm này"
                  @click.stop="removeCheckboxFileLoopRowFile(idx)"
                ></i>
              </div>
              <div v-else style="display: flex; align-items: center; gap: 6px;">
                <input
                  type="file"
                  :ref="el => setCheckboxFileLoopInputRef(el, idx)"
                  style="display: none;"
                  @change="e => handleCheckboxFileLoopUpload(e, idx)"
                />
                <Button
                  type="button"
                  :label="uploadingCheckboxFileLoopIdx === idx ? 'Đang tải lên...' : 'Đính kèm tệp'"
                  :icon="uploadingCheckboxFileLoopIdx === idx ? 'pi pi-spin pi-spinner' : 'pi pi-paperclip'"
                  size="small"
                  outlined
                  severity="secondary"
                  :disabled="uploadingCheckboxFileLoopIdx === idx"
                  @click.stop="triggerCheckboxFileLoopFileInput(idx)"
                  style="font-size: 0.72rem; padding: 2px 8px; height: 26px;"
                />
              </div>
            </div>
          </div>

          <!-- Nút thêm mục mới -->
          <button
            type="button"
            class="btn-add-text-file-more"
            style="background: #f8fafc !important; color: #166534 !important; border: 1px solid #86efac !important; display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; align-self: flex-start;"
            @click.stop="addCheckboxFileLoopRow"
          >
            <i class="pi pi-plus" style="font-size: 0.75rem; color: #166534 !important;"></i>
            <span style="color: #166534 !important; font-weight: 600;">Thêm mục mới (Hộp kiểm + Tệp)</span>
          </button>
        </template>
      </div>
    </template>

    <!-- 5. Checkbox (Nhiều lựa chọn) -->
    <template v-else-if="col.format === 'checkbox'">
      <div style="display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 4px 0; align-items: center;">
        <label
          v-for="opt in parsedOptions"
          :key="opt"
          style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;"
        >
          <input
            type="checkbox"
            :value="opt"
            :checked="isCheckboxChecked(opt)"
            @change="toggleCheckbox(opt)"
            style="accent-color: #2e7d32; flex-shrink: 0;"
          />
          <span style="white-space: nowrap;">{{ opt }}</span>
        </label>
        <span v-if="parsedOptions.length === 0" style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">
          (Chưa cấu hình tùy chọn trong Cài đặt cột)
        </span>
      </div>
    </template>

    <!-- 6. Checkbox + Nhập Text (Hộp kiểm có điều kiện) -->
    <template v-else-if="col.format === 'checkbox_text'">
      <!-- Trường hợp 1: Có cấu hình danh sách options -->
      <template v-if="parsedOptions.length > 0">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Horizontal Checkbox Row -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 2px 0; align-items: center;">
            <label
              v-for="opt in parsedOptions"
              :key="opt"
              style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;"
            >
              <input
                type="checkbox"
                :checked="isConditionalOptActive(opt)"
                @change="toggleConditionalOpt(opt)"
                style="accent-color: #2e7d32; flex-shrink: 0;"
              />
              <span style="white-space: nowrap;">{{ opt }}</span>
            </label>
          </div>

          <!-- Detail input container underneath -->
          <div
            v-if="activeConditionalOptions.length > 0"
            style="display: flex; flex-direction: column; gap: 6px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;"
          >
            <div
              v-for="opt in activeConditionalOptions"
              :key="opt"
              style="display: flex; align-items: center; gap: 8px;"
            >
              <span style="font-size: 0.78rem; font-weight: 600; color: #475569; min-width: 75px; white-space: nowrap;">
                {{ opt }}:
              </span>
              <InputText
                v-model="conditionalDetails[opt]"
                :placeholder="'Nhập chi tiết cho ' + opt + '...'"
                size="small"
                style="font-size: 0.8rem; height: 30px; flex: 1;"
                @input="syncConditionalModel"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Trường hợp 2: Không có options -> Hộp kiểm đơn + ô nhập nội dung inline -->
      <template v-else>
        <div style="display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 4px 0; align-items: center;">
          <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; user-select: none;"
          >
            <input
              type="checkbox"
              v-model="singleConditionalChecked"
              @change="syncSingleConditional"
              style="accent-color: #2e7d32; flex-shrink: 0;"
            />
            <span style="white-space: nowrap;">Phát sinh nội dung / Vi phạm</span>
          </label>
          <div v-if="singleConditionalChecked" style="flex: 1; min-width: 160px;">
            <InputText
              v-model="singleConditionalText"
              placeholder="Nhập diễn giải chi tiết..."
              size="small"
              style="font-size: 0.78rem; height: 30px; width: 100%;"
              @input="syncSingleConditional"
            />
          </div>
        </div>
      </template>
    </template>

    <!-- 6b. Checkbox + Đính kèm tệp (Không cần loop) -->
    <template v-else-if="col.format === 'checkbox_file'">
      <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div style="display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center;">
          <!-- Có danh sách options -->
          <template v-if="parsedOptions.length > 0">
            <label
              v-for="opt in parsedOptions"
              :key="opt"
              style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; user-select: none;"
            >
              <input
                type="checkbox"
                :checked="isCheckboxFileOptActive(opt)"
                @change="toggleCheckboxFileOpt(opt)"
                style="accent-color: #2e7d32; width: 16px; height: 16px;"
              />
              <span style="font-weight: 500; color: #1e293b;">{{ opt }}</span>
            </label>
          </template>
          <!-- Không có options: Hộp kiểm đơn giản -->
          <template v-else>
            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; user-select: none;">
              <input
                type="checkbox"
                v-model="checkboxFileSingleChecked"
                @change="syncCheckboxFileModel"
                style="accent-color: #2e7d32; width: 16px; height: 16px;"
              />
              <span style="font-weight: 600; color: #1e293b;">{{ col.options || 'Có phát sinh / Chọn' }}</span>
            </label>
          </template>
        </div>

        <!-- File đính kèm minh chứng cho trường này -->
        <div style="display: flex; align-items: center; gap: 8px; padding-left: 2px;">
          <div v-if="checkboxFileObject.file" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; background: #ffffff; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; max-width: 90%;">
            <i class="pi pi-paperclip" style="color: #0284c7; font-size: 0.82rem; flex-shrink: 0;"></i>
            <span style="color: #1e293b; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              {{ checkboxFileObject.file.name || 'Tài liệu đính kèm' }}
            </span>
            <a v-if="checkboxFileObject.file.url" :href="checkboxFileObject.file.url" target="_blank" style="text-decoration: none; margin-left: 4px;">
              <span style="color: #0284c7; font-size: 0.72rem; cursor: pointer; text-decoration: underline;">Xem</span>
            </a>
            <i
              class="pi pi-times"
              style="color: #ef4444; font-size: 0.72rem; cursor: pointer; margin-left: 6px;"
              title="Xóa tệp đính kèm này"
              @click.stop="removeCheckboxFileAttachment"
            ></i>
          </div>
          <div v-else style="display: flex; align-items: center; gap: 6px;">
            <input
              type="file"
              ref="checkboxFileInputRef"
              style="display: none;"
              @change="handleCheckboxFileUpload"
            />
            <Button
              type="button"
              :label="isUploadingCheckboxFile ? 'Đang tải lên...' : '+ Đính kèm tệp minh chứng'"
              :icon="isUploadingCheckboxFile ? 'pi pi-spin pi-spinner' : 'pi pi-paperclip'"
              size="small"
              outlined
              severity="secondary"
              :disabled="isUploadingCheckboxFile"
              @click.stop="triggerCheckboxFileInput"
              style="font-size: 0.75rem; padding: 3px 10px; height: 28px;"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 7. Dropdown -->
    <template v-else-if="col.format === 'dropdown'">
      <select
        v-model="model"
        class="custom-col-select"
      >
        <option value="">-- Chọn --</option>
        <option v-for="opt in parsedOptions" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </template>

    <!-- 8. File Attachments -->
    <template v-else-if="col.format === 'file'">
      <PersonnelAttachments
        v-model="model"
        :label="col.label || 'Tệp đính kèm'"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import AppDatePicker from './AppDatePicker.vue';
import PersonnelAttachments from '@/components/personnel/PersonnelAttachments.vue';
import { uploadFile, getFileUrl } from '@/api/files';

const props = defineProps({
  modelValue: {
    type: [String, Number, Array, Object, Boolean],
    default: '',
  },
  col: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const parsedOptions = computed(() => {
  if (!props.col.options) return [];
  return String(props.col.options)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
});

// Text Loop
const loopItems = ref(['']);
let isInternalTextLoop = false;

watch(
  () => props.modelValue,
  (val) => {
    if (isInternalTextLoop) return;
    if (Array.isArray(val)) {
      loopItems.value = val.length > 0 ? [...val] : [''];
    } else if (typeof val === 'string' && val) {
      loopItems.value = [val];
    } else {
      loopItems.value = [''];
    }
  },
  { immediate: true }
);

const addLoopItem = () => {
  loopItems.value.push('');
  updateLoopModel();
};

const removeLoopItem = (idx) => {
  loopItems.value.splice(idx, 1);
  if (loopItems.value.length === 0) loopItems.value.push('');
  updateLoopModel();
};

const updateLoopModel = () => {
  isInternalTextLoop = true;
  emit('update:modelValue', [...loopItems.value]);
  setTimeout(() => {
    isInternalTextLoop = false;
  }, 100);
};

// Table Loop (Multi-Column Custom Headers)
const tableHeaders = computed(() => {
  if (props.col?.options) {
    const parts = String(props.col.options).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return ['Cột 1', 'Cột 2'];
});

const tableRows = ref([]);

const initTableRows = (val) => {
  const headers = tableHeaders.value;
  if (Array.isArray(val)) {
    tableRows.value = val.map((item) => {
      const row = {};
      if (typeof item === 'object' && item !== null) {
        headers.forEach((h, idx) => {
          row['col' + idx] = item['col' + idx] !== undefined ? item['col' + idx] : (item['col' + (idx + 1)] !== undefined ? item['col' + (idx + 1)] : (item[h] || ''));
        });
      } else {
        const parts = String(item).split(/[-:;,]/);
        headers.forEach((_, idx) => {
          row['col' + idx] = parts[idx]?.trim() || '';
        });
      }
      return row;
    });
  } else if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        initTableRows(parsed);
        return;
      }
    } catch (e) {}
    tableRows.value = val.split('\n').filter(Boolean).map((line) => {
      const parts = line.split(/[-:;,]/);
      const row = {};
      headers.forEach((_, idx) => {
        row['col' + idx] = parts[idx]?.trim() || '';
      });
      return row;
    });
  } else {
    tableRows.value = [];
  }
};

// Text + File Loop (Danh sách Văn bản + Tệp đính kèm)
const textFileList = ref([]);
const fileInputRefs = ref({});
const uploadingRowIdx = ref(-1);
let isInternalTextFileLoop = false;

const setFileInputRef = (el, idx) => {
  if (el) fileInputRefs.value[idx] = el;
};

const triggerRowFileInput = (idx) => {
  fileInputRefs.value[idx]?.click();
};

const initTextFileList = (val) => {
  if (props.col.format !== 'text_file_loop') return;
  if (Array.isArray(val)) {
    textFileList.value = val.map((item, i) => {
      if (typeof item === 'string') {
        return { id: 'tf_' + Date.now() + '_' + i, text: item, file: null };
      }
      return {
        id: item.id || ('tf_' + Date.now() + '_' + i),
        text: item.text || item.content || item.name || '',
        file: item.file || (item.url ? { name: item.fileName || item.name, url: item.url, id: item.fileId } : null),
      };
    });
  } else if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        initTextFileList(parsed);
        return;
      }
    } catch (e) {}
    textFileList.value = [{ id: 'tf_' + Date.now(), text: val, file: null }];
  } else {
    textFileList.value = [];
  }
};

const addTextFileRow = () => {
  textFileList.value.push({
    id: 'tf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    text: '',
    file: null,
  });
  syncTextFileModel();
};

const removeTextFileRow = (idx) => {
  textFileList.value.splice(idx, 1);
  syncTextFileModel();
};

const removeRowFile = (idx) => {
  if (textFileList.value[idx]) {
    textFileList.value[idx].file = null;
    syncTextFileModel();
  }
};

const handleRowFileUpload = async (event, idx) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 100 * 1024 * 1024) {
    alert(`Tệp "${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Giới hạn tối đa là 100MB.`);
    event.target.value = '';
    return;
  }

  uploadingRowIdx.value = idx;
  try {
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const url = getFileUrl(uploaded.id);
      if (!textFileList.value[idx]) {
        textFileList.value[idx] = { id: 'tf_' + Date.now(), text: '', file: null };
      }
      textFileList.value[idx].file = {
        id: uploaded.id,
        name: file.name,
        url: url,
        size: file.size,
        type: file.type,
      };
      if (!textFileList.value[idx].text) {
        textFileList.value[idx].text = file.name.replace(/\.[^/.]+$/, '');
      }
      syncTextFileModel();
    }
  } catch (err) {
    alert('Lỗi tải tệp: ' + (err.response?.data?.errors?.[0]?.message || err.message));
  } finally {
    uploadingRowIdx.value = -1;
    event.target.value = '';
  }
};

const syncTextFileModel = () => {
  isInternalTextFileLoop = true;
  emit('update:modelValue', [...textFileList.value]);
  setTimeout(() => {
    isInternalTextFileLoop = false;
  }, 100);
};

// Checkbox + File Loop (Hộp kiểm + Tệp lặp, có tùy chọn Duy nhất hoặc Chọn nhiều)
const checkboxFileLoopList = ref([]);
const checkboxFileLoopIsSingle = ref(false);
const checkboxFileLoopInputRefs = ref({});
const uploadingCheckboxFileLoopIdx = ref(-1);
let isInternalCheckboxFileLoop = false;

const selectedCheckboxFileLoopCount = computed(() => {
  return checkboxFileLoopList.value.filter((it) => it.checked).length;
});

const setCheckboxFileLoopInputRef = (el, idx) => {
  if (el) checkboxFileLoopInputRefs.value[idx] = el;
};

const triggerCheckboxFileLoopFileInput = (idx) => {
  checkboxFileLoopInputRefs.value[idx]?.click();
};

const initCheckboxFileLoop = (val) => {
  if (props.col.format !== 'checkbox_file_loop') return;

  let isSingle = Boolean(props.col.isSingleSelect);
  let rawList = [];

  if (val && typeof val === 'object' && !Array.isArray(val)) {
    if (val.isSingle !== undefined) isSingle = Boolean(val.isSingle);
    rawList = Array.isArray(val.items) ? val.items : [];
  } else if (Array.isArray(val)) {
    rawList = val;
  } else if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.isSingle !== undefined) isSingle = Boolean(parsed.isSingle);
        rawList = Array.isArray(parsed.items) ? parsed.items : [];
      }
    } catch (e) {
      rawList = [{ id: 'cfl_' + Date.now(), text: val, checked: true, file: null }];
    }
  }

  checkboxFileLoopIsSingle.value = isSingle;

  // Nếu rỗng và có options định sẵn trong col.options:
  if (rawList.length === 0 && props.col.options) {
    const opts = String(props.col.options).split(',').map((s) => s.trim()).filter(Boolean);
    if (opts.length > 0) {
      checkboxFileLoopList.value = opts.map((opt, i) => ({
        id: 'cfl_' + Date.now() + '_' + i,
        checked: false,
        text: opt,
        file: null,
      }));
      return;
    }
  }

  checkboxFileLoopList.value = rawList.map((item, i) => {
    if (typeof item === 'string') {
      return { id: 'cfl_' + Date.now() + '_' + i, checked: false, text: item, file: null };
    }
    return {
      id: item.id || ('cfl_' + Date.now() + '_' + i),
      checked: Boolean(item.checked),
      text: item.text || item.name || '',
      file: item.file || (item.url ? { name: item.fileName || item.name, url: item.url, id: item.fileId } : null),
    };
  });
};

const onToggleCheckboxFileLoopItem = (idx) => {
  const target = checkboxFileLoopList.value[idx];
  if (!target) return;

  if (checkboxFileLoopIsSingle.value) {
    // Duy nhất: chỉ chọn 1 mục này, bỏ chọn tất cả các mục khác
    checkboxFileLoopList.value.forEach((item, i) => {
      item.checked = (i === idx);
    });
  } else {
    // Không tích là duy nhất -> có thể chọn cả 2 hoặc nhiều mục
    target.checked = !target.checked;
  }
  syncCheckboxFileLoopModel();
};

const onToggleCheckboxFileLoopSingle = () => {
  if (checkboxFileLoopIsSingle.value) {
    // Khi bật duy nhất: nếu có nhiều hơn 1 mục đang checked, giữ lại mục đầu tiên
    let foundFirst = false;
    checkboxFileLoopList.value.forEach((item) => {
      if (item.checked) {
        if (!foundFirst) {
          foundFirst = true;
        } else {
          item.checked = false;
        }
      }
    });
  }
  syncCheckboxFileLoopModel();
};

const addCheckboxFileLoopRow = () => {
  checkboxFileLoopList.value.push({
    id: 'cfl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    checked: false,
    text: '',
    file: null,
  });
  syncCheckboxFileLoopModel();
};

const removeCheckboxFileLoopRow = (idx) => {
  checkboxFileLoopList.value.splice(idx, 1);
  syncCheckboxFileLoopModel();
};

const removeCheckboxFileLoopRowFile = (idx) => {
  if (checkboxFileLoopList.value[idx]) {
    checkboxFileLoopList.value[idx].file = null;
    syncCheckboxFileLoopModel();
  }
};

const handleCheckboxFileLoopUpload = async (event, idx) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 100 * 1024 * 1024) {
    alert(`Tệp "${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Giới hạn tối đa là 100MB.`);
    event.target.value = '';
    return;
  }

  uploadingCheckboxFileLoopIdx.value = idx;
  try {
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const url = getFileUrl(uploaded.id);
      if (!checkboxFileLoopList.value[idx]) {
        checkboxFileLoopList.value[idx] = { id: 'cfl_' + Date.now(), checked: false, text: '', file: null };
      }
      checkboxFileLoopList.value[idx].file = {
        id: uploaded.id,
        name: file.name,
        url: url,
        size: file.size,
        type: file.type,
      };
      if (!checkboxFileLoopList.value[idx].text) {
        checkboxFileLoopList.value[idx].text = file.name.replace(/\.[^/.]+$/, '');
      }
      // Tự động tick mục này nếu chưa tick
      checkboxFileLoopList.value[idx].checked = true;
      if (checkboxFileLoopIsSingle.value) {
        checkboxFileLoopList.value.forEach((item, i) => {
          if (i !== idx) item.checked = false;
        });
      }
      syncCheckboxFileLoopModel();
    }
  } catch (err) {
    alert('Lỗi tải tệp: ' + (err.response?.data?.errors?.[0]?.message || err.message));
  } finally {
    uploadingCheckboxFileLoopIdx.value = -1;
    event.target.value = '';
  }
};

const syncCheckboxFileLoopModel = () => {
  isInternalCheckboxFileLoop = true;
  const payload = {
    isSingle: checkboxFileLoopIsSingle.value,
    items: checkboxFileLoopList.value.map((it) => ({
      id: it.id,
      checked: it.checked,
      text: it.text,
      file: it.file,
    })),
  };
  emit('update:modelValue', payload);
  setTimeout(() => {
    isInternalCheckboxFileLoop = false;
  }, 100);
};

const addTableRow = () => {
  const row = {};
  tableHeaders.value.forEach((_, idx) => {
    row['col' + idx] = '';
  });
  tableRows.value.push(row);
  emit('update:modelValue', [...tableRows.value]);
};

const removeTableRow = (idx) => {
  tableRows.value.splice(idx, 1);
  emit('update:modelValue', [...tableRows.value]);
};

const updateTableModel = () => {
  emit('update:modelValue', [...tableRows.value]);
};

const normalizeArrayValue = (val) => {
  if (val === undefined || val === null || val === '') return [];
  const tokens = [];

  const addToken = (str) => {
    if (!str) return;
    const cleaned = String(str)
      .replace(/[\[\]"'\\]/g, ' ')
      .split(/[,;\n]/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s && s !== '-' && s !== 'null' && s !== 'undefined');
    tokens.push(...cleaned);
  };

  if (Array.isArray(val)) {
    val.forEach((item) => {
      if (Array.isArray(item)) {
        item.forEach(addToken);
      } else {
        addToken(item);
      }
    });
  } else if (typeof val === 'string') {
    addToken(val);
  }

  return [...new Set(tokens)];
};

// Checkbox (Multi-select)
const isCheckboxChecked = (opt) => {
  const currentList = normalizeArrayValue(props.modelValue);
  return currentList.includes(opt);
};

const toggleCheckbox = (opt) => {
  let list = normalizeArrayValue(props.modelValue);
  if (list.includes(opt)) {
    list = list.filter((x) => x !== opt);
  } else {
    list.push(opt);
  }
  emit('update:modelValue', list);
};

// Checkbox + Text (Conditional)
const conditionalActiveOpts = ref([]);
const conditionalDetails = ref({});

const isConditionalOptActive = (opt) => {
  return conditionalActiveOpts.value.includes(opt);
};

const activeConditionalOptions = computed(() => {
  return parsedOptions.value.filter((opt) => isConditionalOptActive(opt));
});

const toggleConditionalOpt = (opt) => {
  if (conditionalActiveOpts.value.includes(opt)) {
    conditionalActiveOpts.value = conditionalActiveOpts.value.filter((x) => x !== opt);
    delete conditionalDetails.value[opt];
  } else {
    conditionalActiveOpts.value.push(opt);
    if (!conditionalDetails.value[opt]) conditionalDetails.value[opt] = '';
  }
  syncConditionalModel();
};

const syncConditionalModel = () => {
  const result = [];
  conditionalActiveOpts.value.forEach((opt) => {
    const detail = conditionalDetails.value[opt];
    result.push(detail ? `${opt}: ${detail}` : opt);
  });
  emit('update:modelValue', result.join('; '));
};

// Single Conditional (no options)
const singleConditionalChecked = ref(false);
const singleConditionalText = ref('');

const syncSingleConditional = () => {
  if (!singleConditionalChecked.value) {
    emit('update:modelValue', '');
  } else {
    emit('update:modelValue', singleConditionalText.value || 'Có');
  }
};

// Checkbox + File (Không cần loop)
const checkboxFileSingleChecked = ref(false);
const checkboxFileActiveOpts = ref([]);
const checkboxFileObject = ref({ file: null });
const isUploadingCheckboxFile = ref(false);
const checkboxFileInputRef = ref(null);
let isInternalCheckboxFile = false;

const triggerCheckboxFileInput = () => {
  checkboxFileInputRef.value?.click();
};

const handleCheckboxFileUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.size > 100 * 1024 * 1024) {
    alert(`Tệp "${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Giới hạn tối đa là 100MB.`);
    event.target.value = '';
    return;
  }

  isUploadingCheckboxFile.value = true;
  try {
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const url = getFileUrl(uploaded.id);
      checkboxFileObject.value.file = {
        id: uploaded.id,
        name: file.name,
        url: url,
        size: file.size,
        type: file.type,
      };
      syncCheckboxFileModel();
    }
  } catch (err) {
    alert('Lỗi tải tệp: ' + (err.response?.data?.errors?.[0]?.message || err.message));
  } finally {
    isUploadingCheckboxFile.value = false;
    event.target.value = '';
  }
};

const removeCheckboxFileAttachment = () => {
  checkboxFileObject.value.file = null;
  syncCheckboxFileModel();
};

const isCheckboxFileOptActive = (opt) => {
  return checkboxFileActiveOpts.value.includes(opt);
};

const toggleCheckboxFileOpt = (opt) => {
  const idx = checkboxFileActiveOpts.value.indexOf(opt);
  if (idx !== -1) {
    checkboxFileActiveOpts.value.splice(idx, 1);
  } else {
    checkboxFileActiveOpts.value.push(opt);
  }
  syncCheckboxFileModel();
};

const initCheckboxFile = (val) => {
  if (props.col.format !== 'checkbox_file') return;
  if (!val) {
    checkboxFileSingleChecked.value = false;
    checkboxFileActiveOpts.value = [];
    checkboxFileObject.value = { file: null };
    return;
  }

  let obj = val;
  if (typeof val === 'string' && val.trim()) {
    try {
      obj = JSON.parse(val);
    } catch {
      if (val === 'Có' || val === 'true' || val === true) {
        checkboxFileSingleChecked.value = true;
      } else {
        checkboxFileActiveOpts.value = val.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        if (checkboxFileActiveOpts.value.length === 0) checkboxFileSingleChecked.value = true;
      }
      checkboxFileObject.value = { file: null };
      return;
    }
  }

  if (typeof obj === 'object' && obj !== null) {
    checkboxFileSingleChecked.value = Boolean(obj.checked);
    checkboxFileActiveOpts.value = Array.isArray(obj.selected) ? [...obj.selected] : [];
    checkboxFileObject.value.file = obj.file || null;
  }
};

const syncCheckboxFileModel = () => {
  isInternalCheckboxFile = true;
  const isChecked = parsedOptions.value.length > 0 ? checkboxFileActiveOpts.value.length > 0 : checkboxFileSingleChecked.value;
  const textSummary = parsedOptions.value.length > 0
    ? checkboxFileActiveOpts.value.join('; ')
    : (checkboxFileSingleChecked.value ? (props.col.options || 'Có') : '');

  const payload = {
    checked: isChecked,
    selected: [...checkboxFileActiveOpts.value],
    file: checkboxFileObject.value.file || null,
    text: textSummary,
  };
  emit('update:modelValue', payload);
  setTimeout(() => {
    isInternalCheckboxFile = false;
  }, 100);
};

// Đồng bộ khởi tạo dữ liệu cho các trường phức tạp (Table loop, Text file loop, Checkbox file)
watch(
  () => [props.modelValue, props.col.format, props.col.options],
  ([val, fmt]) => {
    if (fmt === 'table_2col' || fmt === 'table_loop') {
      const currentJson = JSON.stringify(tableRows.value);
      const incomingJson = JSON.stringify(val);
      if (currentJson !== incomingJson) {
        initTableRows(val);
      }
    } else if (fmt === 'text_file_loop') {
      if (isInternalTextFileLoop) return;
      const currentJson = JSON.stringify(textFileList.value);
      const incomingJson = JSON.stringify(val);
      if (currentJson !== incomingJson) {
        initTextFileList(val);
      }
    } else if (fmt === 'checkbox_file') {
      if (isInternalCheckboxFile) return;
      initCheckboxFile(val);
    } else if (fmt === 'checkbox_file_loop') {
      if (isInternalCheckboxFileLoop) return;
      initCheckboxFileLoop(val);
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.dynamic-field-wrapper {
  width: 100%;
}

.custom-col-select {
  width: 100% !important;
  height: 33px;
  padding: 0.25rem 0.6rem;
  font-size: 0.82rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #1e293b;
  box-sizing: border-box;
  outline: none;
  display: block;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.custom-col-select:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

.btn-add-text-file-initial {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #f0fdf4;
  color: #166534;
  border: 1.5px dashed #86efac;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-add-text-file-initial:hover {
  background: #dcfce7;
  border-color: #22c55e;
  color: #14532d;
}

.btn-add-text-file-more {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f8fafc;
  color: #166534;
  border: 1px solid #86efac;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  transition: all 0.15s ease;
}

.btn-add-text-file-more:hover {
  background: #f0fdf4;
  border-color: #22c55e;
}
</style>
