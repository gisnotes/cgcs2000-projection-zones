<template>
  <div class="division-extent" v-show="extentStore.extent.length">
    <el-descriptions :column="1" :size="'small'" border>
      <el-descriptions-item label-width="40px" label="minx">
        {{ extentStore.extent[0] }}
      </el-descriptions-item>
      <el-descriptions-item label-width="40px" label="miny">
        {{ extentStore.extent[1] }}
      </el-descriptions-item>
      <el-descriptions-item label-width="40px" label="maxx">
        {{ extentStore.extent[2] }}
      </el-descriptions-item>
      <el-descriptions-item label-width="40px" label="maxy">
        {{ extentStore.extent[3] }}
      </el-descriptions-item>
    </el-descriptions>
    <el-button type="primary" circle size="small" @click="handleExtentCopy">
      <el-icon><CopyDocument /></el-icon>
    </el-button>
  </div>

  <div class="extent-center" v-show="extentStore.center.length">
    <div class="center">{{ extentStore.center.join(', ') }}</div>
    <el-button type="primary" circle size="small" @click="handleCenterCopy">
      <el-icon><CopyDocument /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { CopyDocument } from '@element-plus/icons-vue';
import { useClipboard } from '@vueuse/core';
import { useMapExtentStore } from '@/stores/mapExtentStore.js';

const extentStore = useMapExtentStore();
const { copy } = useClipboard();

const handleExtentCopy = async () => {
  // const text = extentStore.extent.join(', ');
  await copy(JSON.stringify(extentStore.extent));
  ElMessage.success('已复制');
};

const handleCenterCopy = async () => {
  // const text = extentStore.center.join(', ');
  await copy(JSON.stringify(extentStore.center));
  ElMessage.success('已复制');
};
</script>

<style lang="scss" scoped>
.division-extent {
  position: absolute;
  bottom: 84px;
  right: 8px;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.9);
  color: #303133;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;

  .el-button {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.extent-center {
  position: absolute;
  bottom: 40px;
  right: 8px;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.9);
  color: #303133;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;

  .center {
    font-size: 12px;
  }

  .el-button {
    flex-shrink: 0;
    margin-top: 2px;
  }
}
</style>
