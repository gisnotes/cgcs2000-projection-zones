import { defineStore } from 'pinia';

export const useMapExtentStore = defineStore('mapExtent', {
  state: () => ({
    extent: [],
    center: [],
  }),
  actions: {
    updateExtent(newValue) {
      if (newValue?.length) {
        this.extent = newValue;
      }
    },
    updateCenter(newValue) {
      if (newValue?.length) {
        this.center = newValue;
      }
    },
  },
});
