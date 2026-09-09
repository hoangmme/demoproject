<template>
  <div class="lark-base-view-tabs-container">
    <div class="lark-base-view-tabs-strip">
      <template v-for="(card, cIdx) in activeMetricCards" :key="card.id || cIdx">
        <div
          v-if="!isCardHidden(card)"
          class="lark-tab-item-wrapper"
          :class="{ 'tab-active': isCardActive(card, cIdx), 'menu-open': activeTabMenuKey === `card_${cIdx}` }"
        >
          <button
            type="button"
            class="lark-base-tab-item"
            :class="{ 'tab-active': isCardActive(card, cIdx) }"
            @click="$emit('select-card', { card, index: cIdx })"
          >
            <i class="pi pi-table" style="font-size: 0.82rem; color: #0284c7;"></i>
            <span style="font-weight: 700;">{{ getCardDisplayLabel(card) }}</span>
            <span :class="['lark-tab-count-pill', `pill-${card.color || 'blue'}`]">
              {{ getCardMetricValue(card) }}
            </span>
          </button>

          <!-- Menu nút thao tác View: Setup (Dời trái, Dời phải, Sửa, Xóa) -->
          <div v-if="isAdmin" class="lark-tab-actions">
            <button
              type="button"
              class="btn-tab-action btn-tab-setup"
              :class="{ active: activeTabMenuKey === `card_${cIdx}` }"
              @click.stop.prevent="$emit('toggle-tab-menu', { type: 'card', index: cIdx })"
              @mousedown.stop
              title="Tùy chọn Chế độ xem"
            >
              <i class="pi pi-ellipsis-v"></i>
            </button>
            <div
              v-if="activeTabMenuKey === `card_${cIdx}`"
              class="lark-tab-dropdown-menu"
              @click.stop
              @mousedown.stop
            >
              <button
                type="button"
                class="lark-tab-menu-item"
                @click.stop="$emit('open-edit-view', { card, index: cIdx }); $emit('close-tab-menu')"
              >
                <i class="pi pi-pencil"></i>
                <span>Sửa tên & Điều kiện lọc</span>
              </button>
              <button
                type="button"
                class="lark-tab-menu-item"
                @click.stop="$emit('duplicate-view', { card, index: cIdx }); $emit('close-tab-menu')"
              >
                <i class="pi pi-clone" style="color: #10b981;"></i>
                <span>Nhân bản Chế độ xem</span>
              </button>
              <button
                v-if="cIdx > 0"
                type="button"
                class="lark-tab-menu-item"
                @click.stop="$emit('move-view', { index: cIdx, direction: -1 }); $emit('close-tab-menu')"
              >
                <i class="pi pi-arrow-left"></i>
                <span>Dời sang trái</span>
              </button>
              <button
                v-if="cIdx < activeMetricCards.length - 1"
                type="button"
                class="lark-tab-menu-item"
                @click.stop="$emit('move-view', { index: cIdx, direction: 1 }); $emit('close-tab-menu')"
              >
                <i class="pi pi-arrow-right"></i>
                <span>Dời sang phải</span>
              </button>
              <div v-if="cIdx > 0" class="lark-tab-menu-divider"></div>
              <button
                v-if="cIdx > 0"
                type="button"
                class="lark-tab-menu-item item-danger"
                @click.stop="$emit('delete-view', { card, index: cIdx }); $emit('close-tab-menu')"
              >
                <i class="pi pi-trash"></i>
                <span>Xóa Chế độ xem</span>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Nút Thêm Chế độ xem / Thẻ lọc mới chuẩn Lark Base (+ Add View) -->
      <button
        v-if="isAdmin"
        type="button"
        class="lark-base-tab-add"
        @click="$emit('open-add-view')"
        title="+ Thêm Chế độ xem (View) mới cho bảng này"
      >
        <i class="pi pi-plus" style="font-size: 0.72rem;"></i>
        <span>Thêm View</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeMetricCards: {
    type: Array,
    default: () => [],
  },
  activeMetricCardIdx: {
    type: Number,
    default: -1,
  },
  activeTabMenuKey: {
    type: String,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isCardHidden: {
    type: Function,
    default: () => false,
  },
  isCardActive: {
    type: Function,
    default: () => false,
  },
  getCardDisplayLabel: {
    type: Function,
    default: (c) => c?.label || '',
  },
  getCardMetricValue: {
    type: Function,
    default: () => 0,
  },
});

defineEmits([
  'select-card',
  'toggle-tab-menu',
  'open-edit-view',
  'duplicate-view',
  'move-view',
  'delete-view',
  'close-tab-menu',
  'open-add-view',
]);
</script>
