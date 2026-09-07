import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    globalLoading: false,
    importModalOpen: false,
    importType: 'personnel', // 'personnel' or 'relative'
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    openImportModal(type = 'personnel') {
      this.importType = type;
      this.importModalOpen = true;
    },
    closeImportModal() {
      this.importModalOpen = false;
    },
  },
});
