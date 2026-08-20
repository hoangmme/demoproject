<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
          Phụ lục 3: Danh sách Cán bộ có vấn đề cần lưu ý, vi phạm, kỷ luật ({{ warningRows.length }} cán bộ)
        </h3>
        <Button
          label="Xuất Phụ lục 3 (Excel)"
          icon="pi pi-file-excel"
          severity="success"
          size="small"
          @click="handleExport"
          style="font-size: 0.8rem;"
        />
      </div>

      <DataTable
        :value="warningRows"
        paginator
        :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        tableStyle="min-width: 60rem"
      >
        <Column field="stt" header="STT" headerStyle="width: 3.5rem;" />
        <Column field="personCode" header="Mã CB" sortable />
        <Column field="personName" header="Họ và tên" sortable>
          <template #body="{ data }">
            <strong>{{ data.personName }}</strong>
          </template>
        </Column>
        <Column field="departmentName" header="Phòng ban" sortable />
        <Column field="partyDiscipline" header="Kỷ luật Đảng" sortable>
          <template #body="{ data }">
            <span v-if="data.partyDiscipline !== '-'" class="badge-pill badge-red">{{ data.partyDiscipline }}</span>
            <span v-else>-</span>
          </template>
        </Column>
        <Column field="govDiscipline" header="Kỷ luật Chính quyền" sortable>
          <template #body="{ data }">
            <span v-if="data.govDiscipline !== '-'" class="badge-pill badge-red">{{ data.govDiscipline }}</span>
            <span v-else>-</span>
          </template>
        </Column>
        <Column field="politicalIssue" header="Vấn đề chính trị" sortable />
        <Column field="lawViolation" header="Vi phạm pháp luật" sortable />
        <Column field="otherIssue" header="Lưu ý khác" sortable />
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { formatPersonnelCode } from '@/utils/formatters';
import { exportToExcel } from '@/utils/excel';

const personnelStore = usePersonnelStore();

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const warningRows = computed(() => {
  const rows = [];
  let stt = 1;
  personnelStore.personnelList.forEach((p) => {
    const f = p.flags || {};
    const cd = p.custom_data || {};
    
    // Check all possible political notes, discipline, or foreign factors
    const partyDiscipline = f.partyDiscipline || cd.partyDiscipline || cd['Kỷ luật Đảng'] || cd.ky_luat_dang || '-';
    const govDiscipline = f.govDiscipline || cd.govDiscipline || cd['Kỷ luật Chính quyền'] || cd.ky_luat_chinh_quyen || '-';
    const politicalIssue = f.politicalIssue || cd.politicalIssue || cd.kqThamTra || cd.tcctResult || cd['Vấn đề chính trị'] || p.kqThamTra || p.tcctResult || '-';
    const lawViolation = f.lawViolation || cd.lawViolation || cd['Vi phạm pháp luật'] || '-';
    
    // Foreign factors
    const foreignFactors = [];
    if (f.marriedToForeigner || cd.marriedToForeigner || String(cd.ket_hon_nuoc_ngoai || '').toLowerCase().includes('có')) foreignFactors.push('Kết hôn với người NN');
    if (f.giftOver50M || cd.giftOver50M || String(cd.tang_qua_50tr || '').toLowerCase().includes('có')) foreignFactors.push('Nhận quà/tiền >50tr');
    if (f.rentHouseToForeigner || cd.rentHouseToForeigner || String(cd.thue_nha_dat || '').toLowerCase().includes('có')) foreignFactors.push('Cho người NN thuê nhà/đất');
    if (f.workInForeignCompany || cd.workInForeignCompany || String(cd.cty_von_nn || '').toLowerCase().includes('có')) foreignFactors.push('Làm việc cty vốn NN');

    const otherIssue = foreignFactors.length > 0 ? foreignFactors.join('; ') : (f.otherIssue || cd.otherIssue || cd.notes || '-');

    const hasAnyRecord = partyDiscipline !== '-' || govDiscipline !== '-' || politicalIssue !== '-' || lawViolation !== '-' || otherIssue !== '-';

    // If there's specific warning, or include personnel with foreign trips/factors
    if (hasAnyRecord || (p.trips && p.trips.length > 0)) {
      rows.push({
        stt: stt++,
        personCode: p.code || formatPersonnelCode(p.id),
        personName: p.name,
        departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '-',
        position: p.positionName || p.position || '-',
        partyDiscipline,
        govDiscipline,
        politicalIssue,
        lawViolation,
        otherIssue,
        tripCount: (p.trips || []).length,
      });
    }
  });
  return rows;
});

const handleExport = () => {
  exportToExcel(warningRows.value, 'Phu_luc_3_Lich_su_va_Luu_y', 'Phụ lục 3');
};
</script>
