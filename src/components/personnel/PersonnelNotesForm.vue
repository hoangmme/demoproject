<template>
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <div style="font-size: 0.85rem; color: #4b5563; padding: 0.5rem 0.75rem; background: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
      Tick chọn các mục có phát sinh vấn đề và nhập nội dung chi tiết tương ứng (nếu có):
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      <!-- 1. Tiêu chuẩn chính trị -->
      <div class="note-row" :class="{ 'note-active': flags.trongYeu }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.trongYeu" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">1. Vấn đề về tiêu chuẩn chính trị ("tự diễn biến", "tự chuyển hóa"...)</span>
        </label>
        <InputText
          v-model="flags.trongYeuDetail"
          :placeholder="flags.trongYeu ? 'Nhập chi tiết vấn đề tiêu chuẩn chính trị...' : 'Không có vấn đề'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 2. Đang trong quá trình điều tra -->
      <div class="note-row" :class="{ 'note-active': flags.thamNhung }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.thamNhung" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">2. Đang trong quá trình điều tra, thanh tra hoặc liên quan vụ việc phức tạp</span>
        </label>
        <InputText
          v-model="flags.thamNhungDetail"
          :placeholder="flags.thamNhung ? 'Nhập chi tiết vụ việc, nội dung đang điều tra...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 3. Vấn đề lý lịch khác -->
      <div class="note-row" :class="{ 'note-active': flags.loiKeo }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.loiKeo" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">3. Có vấn đề khác về lý lịch (khai man, che giấu lý lịch, bằng cấp...)</span>
        </label>
        <InputText
          v-model="flags.loiKeoDetail"
          :placeholder="flags.loiKeo ? 'Nhập chi tiết vấn đề lý lịch...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 4. Kỷ luật Đảng -->
      <div class="note-row" :class="{ 'note-active': flags.klDang }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.klDang" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">4. Hình thức kỷ luật Đảng</span>
        </label>
        <InputText
          v-model="flags.klDangDetail"
          :placeholder="flags.klDang ? 'Khiển trách, Cảnh cáo, Khai trừ... (Nêu số QĐ và thời gian)' : 'Không bị kỷ luật'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 5. Kỷ luật Chính quyền -->
      <div class="note-row" :class="{ 'note-active': flags.klChinhQuyen }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.klChinhQuyen" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">5. Hình thức kỷ luật Chính quyền</span>
        </label>
        <InputText
          v-model="flags.klChinhQuyenDetail"
          :placeholder="flags.klChinhQuyen ? 'Khiển trách, Cảnh cáo, Hạ bậc lương, Cách chức... (Nêu số QĐ)' : 'Không bị kỷ luật'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 6. Đi nước ngoài không xin phép -->
      <div class="note-row" :class="{ 'note-active': flags.vpChuaPhep }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.vpChuaPhep" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">6. Đi nước ngoài khi chưa được cấp phép</span>
        </label>
        <InputText
          v-model="flags.vpChuaPhepDetail"
          :placeholder="flags.vpChuaPhep ? 'Nhập thời gian, nước đến, lý do...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 7. Vi phạm pháp luật ở nước ngoài / trong nước -->
      <div class="note-row" :class="{ 'note-active': flags.vpNuocNgoai }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.vpNuocNgoai" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">7. Vi phạm pháp luật ở nước sở tại / Việt Nam</span>
        </label>
        <InputText
          v-model="flags.vpNuocNgoaiDetail"
          :placeholder="flags.vpNuocNgoai ? 'Nhập hình thức xử lý vi phạm pháp luật...' : 'Không vi phạm'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 8. Ở lại nước ngoài quá thời hạn -->
      <div class="note-row" :class="{ 'note-active': flags.vpQuaHan }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.vpQuaHan" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">8. Ở lại nước ngoài quá thời gian quy định</span>
        </label>
        <InputText
          v-model="flags.vpQuaHanDetail"
          :placeholder="flags.vpQuaHan ? 'Nhập số ngày quá hạn, lý do...' : 'Không quá hạn'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 9. Thuộc diện quản lý đặc biệt -->
      <div class="note-row" :class="{ 'note-active': flags.dienQuanLy }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.dienQuanLy" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">9. Đối tượng thuộc diện quản lý đặc biệt</span>
        </label>
        <InputText
          v-model="flags.dienQuanLyDetail"
          :placeholder="flags.dienQuanLy ? 'Nội dung diện quản lý...' : 'Không thuộc diện'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 10. Nhận quà biếu > 50M -->
      <div class="note-row" :class="{ 'note-active': flags.receivedGiftOver50M }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.receivedGiftOver50M" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">10. Được tặng tiền, hàng, hiện vật giá trị từ 50 triệu VNĐ trở lên</span>
        </label>
        <InputText
          v-model="flags.receivedGiftOver50MDetail"
          :placeholder="flags.receivedGiftOver50M ? 'Chi tiết quà tặng, nguồn gốc...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 11. Cho người nước ngoài thuê nhà -->
      <div class="note-row" :class="{ 'note-active': flags.rentHouseToForeigner }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.rentHouseToForeigner" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">11. Cho người nước ngoài thuê nhà, đất</span>
        </label>
        <InputText
          v-model="flags.rentHouseToForeignerDetail"
          :placeholder="flags.rentHouseToForeigner ? 'Chi tiết địa chỉ, thời gian cho thuê...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 12. Làm việc tại công ty FDI -->
      <div class="note-row" :class="{ 'note-active': flags.workInForeignCompany }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.workInForeignCompany" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">12. Làm việc tại công ty có vốn đầu tư nước ngoài (FDI)</span>
        </label>
        <InputText
          v-model="flags.workInForeignCompanyDetail"
          :placeholder="flags.workInForeignCompany ? 'Tên công ty FDI, vị trí làm việc...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 13. Kết hôn người nước ngoài -->
      <div class="note-row" :class="{ 'note-active': flags.marriedToForeigner }">
        <label class="note-label">
          <input type="checkbox" v-model="flags.marriedToForeigner" class="note-checkbox" />
          <span style="font-weight: 600; color: #1f2937;">13. Kết hôn với người nước ngoài</span>
        </label>
        <InputText
          v-model="flags.marriedToForeignerDetail"
          :placeholder="flags.marriedToForeigner ? 'Quốc tịch, họ tên vợ/chồng...' : 'Không có'"
          size="small"
          style="font-size: 0.8rem; width: 100%;"
        />
      </div>

      <!-- 14. Ghi chú chung -->
      <div style="margin-top: 6px;">
        <label class="field-label" style="font-weight: 600; color: #1f2937;">14. Vấn đề khác đáng lưu ý</label>
        <Textarea v-model="flags.otherFlags" rows="2" placeholder="Ghi chú thêm các vấn đề lưu ý khác nếu có..." size="small" style="width: 100%;" />
      </div>
    </div>

    <!-- Attachments -->
    <div style="margin-top: 10px;">
      <PersonnelAttachments v-model="form.files" label="Tệp đính kèm Hồ sơ Cá nhân (Đơn giải trình, Kết luận, Báo cáo...)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import PersonnelAttachments from './PersonnelAttachments.vue';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
});

const flags = computed({
  get: () => {
    if (!props.form.flags) props.form.flags = {};
    return props.form.flags;
  },
  set: (val) => {
    props.form.flags = val;
  },
});
</script>

<style scoped>
.note-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.note-row:hover {
  border-color: #cbd5e1;
  background: #fcfdfc;
}

.note-active {
  border-color: #f59e0b !important;
  background: #fffbeb !important;
}

.note-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.83rem;
}

.note-checkbox {
  width: 17px;
  height: 17px;
  cursor: pointer;
  accent-color: #f59e0b;
}
</style>
