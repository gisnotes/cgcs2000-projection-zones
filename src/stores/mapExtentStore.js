import { defineStore } from 'pinia';

export const useMapExtentStore = defineStore('mapExtent', {
  state: () => ({
    name: '',
    extent: [],
    center: [],
  }),
  actions: {
    updateName(newName) {
      this.name = newName || '';
    },
    updateExtent(newValue) {
      if (newValue?.length) {
        this.extent = newValue;
      }
    },
    updateCenter(newValue) {
      if (newValue?.length) {
        this.center = newValue.map((val) => Number(Number(val).toFixed(8)));
      }
    },
    clear() {
      this.name = '';
      this.extent = [];
      this.center = [];
    },
  },
});
