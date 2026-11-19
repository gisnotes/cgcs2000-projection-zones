<template>
  <transition name="el-fade-in-linear">
    <div
      class="division-info-card"
      v-show="extentStore.extent.length || extentStore.center.length">
      <div class="selected-division" v-if="extentStore.name">
        <div class="division-name-wrap">
          <span class="status-dot" />
          <span class="division-name" :title="extentStore.name">
            {{ extentStore.name }}
          </span>
        </div>
        <span class="division-badge">已选区划</span>
      </div>

      <div class="info-section" v-if="extentStore.extent.length">
        <div class="section-header">
          <span class="section-title">边界范围</span>
          <button
            type="button"
            class="copy-pill"
            :class="{ copied: copiedTarget === 'extent' }"
            title="复制边界范围 JSON"
            @click="handleExtentCopy">
            <el-icon v-if="copiedTarget === 'extent'"><Check /></el-icon>
            <el-icon v-else><CopyDocument /></el-icon>
            <span>{{ copiedTarget === 'extent' ? '已复制' : '复制' }}</span>
          </button>
        </div>
        <div class="coord-list">
          <div class="coord-row">
            <span class="coord-key">MIN X</span>
            <span class="coord-val">{{ extentStore.extent[0] }}</span>
          </div>
          <div class="coord-row">
            <span class="coord-key">MIN Y</span>
            <span class="coord-val">{{ extentStore.extent[1] }}</span>
          </div>
          <div class="coord-row">
            <span class="coord-key">MAX X</span>
            <span class="coord-val">{{ extentStore.extent[2] }}</span>
          </div>
          <div class="coord-row">
            <span class="coord-key">MAX Y</span>
            <span class="coord-val">{{ extentStore.extent[3] }}</span>
          </div>
        </div>
      </div>

      <div class="info-section" v-if="extentStore.center.length">
        <div class="section-header">
          <span class="section-title">中心坐标</span>
          <button
            type="button"
            class="copy-pill"
            :class="{ copied: copiedTarget === 'center' }"
            title="复制中心坐标 JSON"
            @click="handleCenterCopy">
            <el-icon v-if="copiedTarget === 'center'"><Check /></el-icon>
            <el-icon v-else><CopyDocument /></el-icon>
            <span>{{ copiedTarget === 'center' ? '已复制' : '复制' }}</span>
          </button>
        </div>
        <div class="center-value">{{ extentStore.center.join(', ') }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { Check, CopyDocument } from '@element-plus/icons-vue';
import { useClipboard } from '@vueuse/core';
import { useMapExtentStore } from '@/stores/mapExtentStore.js';

const extentStore = useMapExtentStore();
const { copy } = useClipboard();
const copiedTarget = ref('');
let copyTimer = null;

function markCopied(target) {
  copiedTarget.value = target;
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
  copyTimer = setTimeout(() => {
    copiedTarget.value = '';
  }, 1500);
}

const handleExtentCopy = async () => {
  await copy(JSON.stringify(extentStore.extent));
  markCopied('extent');
  ElMessage.success('已复制');
};

const handleCenterCopy = async () => {
  await copy(JSON.stringify(extentStore.center));
  markCopied('center');
  ElMessage.success('已复制');
};

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer);
  }
});
</script>

<style lang="scss" scoped>
.division-info-card {
  flex: 0 0 auto;
  width: 280px;
  pointer-events: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: var(--panel-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(14px) saturate(160%);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);
  color: var(--text-primary);
  font-size: 12px;
}

.selected-division {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--panel-divider);

  .division-name-wrap {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
  }

  .division-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .division-badge {
    flex-shrink: 0;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--brand-primary);
    background: rgba(37, 99, 235, 0.08);
    padding: 2px 7px;
    border-radius: 999px;
  }
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
  }
}

.copy-pill {
  height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.06);
  color: var(--brand-primary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(37, 99, 235, 0.13);
    border-color: rgba(37, 99, 235, 0.3);
  }

  &.copied {
    color: #059669;
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.25);
  }
}

.coord-list {
  border-radius: 9px;
  background: rgba(241, 245, 249, 0.72);
  border: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.coord-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 5px 10px;

  & + .coord-row {
    border-top: 1px solid rgba(15, 23, 42, 0.05);
  }

  .coord-key {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  .coord-val {
    font-family: var(--font-mono);
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: all;
  }
}

.center-value {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  background: rgba(241, 245, 249, 0.72);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 9px;
  padding: 6px 10px;
  word-break: break-all;
  user-select: all;
}
</style>
