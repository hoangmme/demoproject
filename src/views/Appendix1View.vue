<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
          Phụ lục 1: Danh sách Cán bộ đi nước ngoài ({{ tripRows.length }} lượt)
        </h3>
        <Button
          label="Xuất Phụ lục 1 (Excel)"
          icon="pi pi-file-excel"
          severity="success"
          size="small"
          @click="handleExport"
          style="font-size: 0.8rem;"
        />
      </div>

      <DataTable
        :value="tripRows"
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
        <Column field="departmentName" header="Đơn vị / Phòng ban" sortable />
        <Column field="position" header="Chức vụ" sortable />
        <Column field="decisionNumber" header="Số Quyết định" sortable />
        <Column field="countryName" header="Quốc gia đến" sortable>
          <template #body="{ data }">
            <span class="badge-pill badge-blue">{{ data.countryName || '-' }}</span>
          </template>
        </Column>
        <Column field="departureDate" header="Ngày đi" sortable />
        <Column field="arrivalDate" header="Ngày về" sortable />
        <Column field="purpose" header="Mục đích" sortable />
        <Column field="fundingName" header="Nguồn kinh phí" sortable />
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
import { formatPersonnelCode, formatDate } from '@/utils/formatters';
import { exportToExcel } from '@/utils/excel';

const personnelStore = usePersonnelStore();

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const tripRows = computed(() => {
  const rows = [];
  let stt = 1;
  personnelStore.personnelList.forEach((p) => {
    if (Array.isArray(p.trips) && p.trips.length > 0) {
      p.trips.forEach((t) => {
        rows.push({
          stt: stt++,
          personCode: p.code || formatPersonnelCode(p.id),
          personName: p.name,
          departmentName: personnelStore.getDepartmentName(p.departmentId),
          position: p.position || '-',
          decisionNumber: t.decisionNumber || '-',
          countryName: t.countryName || '-',
          departureDate: formatDate(t.departureDate) || '-',
          arrivalDate: formatDate(t.arrivalDate) || '-',
          purpose: t.purpose || '-',
          fundingName: t.fundingName || '-',
        });
      });
    }
  });
  return rows;
});

const handleExport = () => {
  exportToExcel(tripRows.value, 'Phu_luc_1_Di_nuoc_ngoai', 'Phụ lục 1');
};
</script>
