<template>
  <div class="app-content">
    <!-- Stat Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="app-card" style="border-left: 4px solid #2e7d32;">
        <span style="font-size: 0.8rem; color: #6b7280; font-weight: 600;">Tổng số Cán bộ</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-top: 4px;">{{ stats.totalPersonnel }}</div>
        <span style="font-size: 0.75rem; color: #2e7d32;">Hồ sơ đã chuẩn hóa</span>
      </div>

      <div class="app-card" style="border-left: 4px solid #1976d2;">
        <span style="font-size: 0.8rem; color: #6b7280; font-weight: 600;">Tổng số Lượt đi nước ngoài</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-top: 4px;">{{ stats.totalTrips }}</div>
        <span style="font-size: 0.75rem; color: #1976d2;">Chuyến công tác & học tập</span>
      </div>

      <div class="app-card" style="border-left: 4px solid #7b1fa2;">
        <span style="font-size: 0.8rem; color: #6b7280; font-weight: 600;">Thân nhân nước ngoài</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-top: 4px;">{{ stats.totalRelatives }}</div>
        <span style="font-size: 0.75rem; color: #7b1fa2;">Định cư / Làm việc NN</span>
      </div>

      <div class="app-card" style="border-left: 4px solid #e65100;">
        <span style="font-size: 0.8rem; color: #6b7280; font-weight: 600;">Vấn đề cần lưu ý</span>
        <div style="font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-top: 4px;">{{ stats.warningCount }}</div>
        <span style="font-size: 0.75rem; color: #e65100;">Kỷ luật & Lưu ý chính trị</span>
      </div>
    </div>

    <!-- Charts & Breakdown -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
      <!-- Top Countries -->
      <div class="app-card">
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          Top Quốc gia đến nhiều nhất
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div v-for="(item, idx) in stats.countryList" :key="idx" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="font-weight: 600; color: #374151;">{{ idx + 1 }}. {{ item.name }}</span>
              <strong style="color: #2e7d32;">{{ item.count }} lượt</strong>
            </div>
            <div style="height: 6px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
              <div :style="{ width: `${(item.count / stats.maxCountry) * 100}%`, height: '100%', background: '#2e7d32', borderRadius: '4px' }"></div>
            </div>
          </div>
          <div v-if="stats.countryList.length === 0" style="text-align: center; color: #9ca3af; font-size: 0.8rem; padding: 1rem;">
            Chưa có dữ liệu quốc gia
          </div>
        </div>
      </div>

      <!-- Funding Sources -->
      <div class="app-card">
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          Nguồn kinh phí chuyến đi
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div v-for="(item, idx) in stats.fundingList" :key="idx" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span style="font-weight: 600; color: #374151;">{{ item.name }}</span>
              <strong style="color: #7b1fa2;">{{ item.count }} lượt</strong>
            </div>
            <div style="height: 6px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
              <div :style="{ width: `${(item.count / stats.maxFunding) * 100}%`, height: '100%', background: '#7b1fa2', borderRadius: '4px' }"></div>
            </div>
          </div>
          <div v-if="stats.fundingList.length === 0" style="text-align: center; color: #9ca3af; font-size: 0.8rem; padding: 1rem;">
            Chưa có dữ liệu nguồn kinh phí
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { usePersonnelStore } from '@/stores/personnel';

const personnelStore = usePersonnelStore();

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const stats = computed(() => {
  const list = personnelStore.personnelList;
  let totalTrips = 0;
  let totalRelatives = 0;
  let warningCount = 0;
  const countries = {};
  const fundings = {};

  list.forEach((p) => {
    if (Array.isArray(p.trips)) {
      totalTrips += p.trips.length;
      p.trips.forEach((t) => {
        if (t.countryName?.trim()) {
          const c = t.countryName.trim();
          countries[c] = (countries[c] || 0) + 1;
        }
        if (t.fundingName?.trim()) {
          const f = t.fundingName.trim();
          fundings[f] = (fundings[f] || 0) + 1;
        }
      });
    }
    if (Array.isArray(p.relatives)) {
      totalRelatives += p.relatives.length;
    }
    if (p.flags) {
      if (p.flags.politicalIssue || p.flags.partyDiscipline || p.flags.govDiscipline || p.flags.lawViolation) {
        warningCount++;
      }
    }
  });

  const countryList = Object.entries(countries)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const fundingList = Object.entries(fundings)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxCountry = countryList.length > 0 ? countryList[0].count : 1;
  const maxFunding = fundingList.length > 0 ? fundingList[0].count : 1;

  return {
    totalPersonnel: list.length,
    totalTrips,
    totalRelatives,
    warningCount,
    countryList,
    fundingList,
    maxCountry,
    maxFunding,
  };
});
</script>
