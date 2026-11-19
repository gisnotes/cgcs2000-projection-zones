<template>
  <div
    class="division-info-card"
    v-show="extentStore.extent.length || extentStore.center.length">
    <div class="info-section" v-if="extentStore.extent.length">
      <div class="section-header">
        <span class="section-title">行政区划范围</span>
        <el-button
          type="primary"
          link
          size="small"
          title="复制范围"
          @click="handleExtentCopy">
          <el-icon><CopyDocument /></el-icon>
          <span>复制</span>
        </el-button>
      </div>
      <el-descriptions :column="1" size="small" border class="extent-table">
        <el-descriptions-item label-width="44px" label="minx">
          {{ extentStore.extent[0] }}
        </el-descriptions-item>
        <el-descriptions-item label-width="44px" label="miny">
          {{ extentStore.extent[1] }}
        </el-descriptions-item>
        <el-descriptions-item label-width="44px" label="maxx">
          {{ extentStore.extent[2] }}
        </el-descriptions-item>
        <el-descriptions-item label-width="44px" label="maxy">
          {{ extentStore.extent[3] }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-divider
      v-if="extentStore.extent.length && extentStore.center.length"
      class="section-divider" />

    <div class="info-section" v-if="extentStore.center.length">
      <div class="section-header">
        <span class="section-title">中心坐标</span>
        <el-button
          type="primary"
          link
          size="small"
          title="复制中心坐标"
          @click="handleCenterCopy">
          <el-icon><CopyDocument /></el-icon>
          <span>复制</span>
        </el-button>
      </div>
      <div class="center-value">{{ extentStore.center.join(', ') }}</div>
    </div>
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
.division-info-card {
  flex: 0 0 auto;
  width: 268px;
  padding: 10px 12px;
  border-radius: var(--panel-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(8px);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);
  color: #303133;
  font-size: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
  }

  .el-button {
    padding: 0 4px;
    height: auto;
    font-size: 12px;

    span {
      margin-left: 3px;
    }
  }
}

.extent-table {
  font-variant-numeric: tabular-nums;

  :deep(.el-descriptions__body) {
    background: transparent;
  }

  :deep(.el-descriptions__label),
  :deep(.el-descriptions__content) {
    font-size: 12px;
    padding: 3px 8px;
  }
}

.section-divider {
  margin: 8px 0;
}

.center-value {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #303133;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 4px;
  padding: 5px 8px;
  word-break: break-all;
}
</style>
