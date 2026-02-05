import { defineStore } from 'pinia';
import { setItem, getItem } from '@/utils/storage/localStorage';
import { TK_STORAGE_KEY } from '@/constants/index.js';

export const useTkStore = defineStore('tk', {
  state: () => ({
    tk: getItem(TK_STORAGE_KEY) || 'e1f2618711e8858b50bb0a1d4a715fa9', // 初始化时从 localStorage 读取
  }),
  actions: {
    updateTk(newValue) {
      this.tk = newValue;
      setItem(TK_STORAGE_KEY, newValue); // 同步更新 localStorage
    },
  },
});
