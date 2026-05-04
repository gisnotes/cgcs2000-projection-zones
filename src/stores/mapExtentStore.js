import { defineStore } from 'pinia';

export const useMapExtentStore = defineStore('mapExtent', {
  state: () => ({
    extent: [],
  }),
  actions: {
    updateExtent(newValue) {
      if (newValue?.length) {
        this.extent = newValue;
      }
    },
  },
});
