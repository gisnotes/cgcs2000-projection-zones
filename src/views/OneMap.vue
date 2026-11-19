<template>
  <div class="wrap">
    <!-- 地图 -->
    <tdt-map @mapCreated="mapCreated" @mapClick="mapClick">
      <template #bottom-left>
        <!-- 更改天地图密钥 -->
        <div class="tk-change" ref="tkChangeRef">
          <button
            type="button"
            class="tk-trigger"
            :class="{ active: show }"
            title="天地图密钥更改"
            @click="handleToggle">
            <el-icon><Key /></el-icon>
            <span>密钥更改</span>
          </button>
          <transition name="el-zoom-in-bottom">
            <div class="tk-popover" v-show="show">
              <div class="popover-header">
                <span class="popover-title">天地图密钥更改</span>
                <button
                  type="button"
                  class="popover-close"
                  title="关闭"
                  @click="show = false">
                  <i-ep-close />
                </button>
              </div>
              <div class="popover-form">
                <el-input
                  ref="inputRef"
                  v-model="tk"
                  size="small"
                  placeholder="请输入新的天地图密钥"
                  clearable
                  @keyup.enter="handleSearch">
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!tk.trim()"
                  @click="handleSearch">
                  应用
                </el-button>
              </div>
              <div class="popover-hint">输入新密钥后将自动刷新地图瓦片</div>
            </div>
          </transition>
        </div>
      </template>
    </tdt-map>
    <!-- 分度带 -->
    <projection-zones
      v-model:fold="foldProjectionZones"
      v-bind="$attrs"
      @popup="handlePopup"
      @closePopup="handleClosePopup" />
    <!-- 右侧功能区：行政区划 + 范围/中心坐标 -->
    <div class="right-dock">
      <administrative-divisions />
      <division-extent />
    </div>
    <!-- 弹窗 -->
    <ol-popup
      ref="popup"
      :title
      :position
      :offset
      :propeties
      :popupInfo
      @close="closePopup" />
  </div>
</template>

<script setup>
import { Key } from '@element-plus/icons-vue';
import { onClickOutside } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { getCenter } from 'ol/extent';

import { useTkStore } from '@/stores/tkStore.js';
import { clearSource, getLayerByName } from '@/utils/common.js';

const foldProjectionZones = ref(false);

// 弹窗
let title = ref('');
let position = ref([]);
let offset = ref([0, -14]);
let propeties = ref([
  { key: 'label', val: '投影名称', unit: null },
  { key: 'code', val: 'EPSG', unit: null },
  { key: 'centralMeridian', val: '中央子午线', unit: null, optional: true },
  { key: 'bounds', val: '投影范围', unit: null },
]);
let popupInfo = ref({});
const popup = ref(null);

let highlightSource = null;

const isMapCreated = ref(false);
const state = shallowReactive({
  map: null,
});

// 更改天地图秘钥相关
const show = ref(false);
const tkChangeRef = ref(null);
const inputRef = ref(null);
const tk = ref('');
const tkStore = useTkStore();

onClickOutside(tkChangeRef, () => {
  show.value = false;
});

provide('state', state);
provide('isMapCreated', isMapCreated);

function mapCreated(map) {
  state.map = map;
  isMapCreated.value = true;
  highlightSource = getLayerByName(map, 'highlight').getSource();
}

function mapClick(evt) {
  const lngLat = evt.coordinate;
  const pickedFeature = state.map.forEachFeatureAtPixel(
    evt.pixel,
    (feature) => feature,
  );
  if (pickedFeature) {
    if (lngLat) {
      clearSource(highlightSource);
      const clonedFeature = pickedFeature.clone();
      clonedFeature.setStyle(undefined);
      highlightSource.addFeature(clonedFeature);
    }
    const properties = pickedFeature.getProperties();
    onPopup(properties, lngLat);
  }
}

function handlePopup(data) {
  onPopup(data);
}

function onPopup(properties, lngLat) {
  if (Object.keys(properties).includes('bounds')) {
    popupInfo.value = properties;
    title.value = properties.label;
    position.value = lngLat ? lngLat : getCenter(properties.bounds);
  }
}

function closePopup() {
  clearSource(highlightSource);
}

function handleClosePopup() {
  popup.value?.close();
}

function handleToggle() {
  show.value = !show.value;
  if (show.value) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
}

function handleSearch() {
  const trimmedTk = tk.value.trim();
  if (!trimmedTk) return;
  tkStore.updateTk(trimmedTk);
  tk.value = '';
  show.value = false;
  ElMessage({
    message: '天地图密钥已更换，即将刷新地图',
    type: 'primary',
    plain: true,
    duration: 1500,
    onClose: () => window.location.reload(),
  });
}
</script>

<style lang="scss" scoped>
.wrap {
  height: 100%;
  position: relative;

  .right-dock {
    position: absolute;
    top: var(--edge-gap);
    right: var(--edge-gap);
    bottom: 62px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: none;
  }
}

.tk-change {
  position: relative;
  display: flex;
  align-items: center;

  .tk-trigger {
    height: 28px;
    padding: 0 9px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.16s ease;

    &:hover {
      color: var(--text-primary);
      background: rgba(15, 23, 42, 0.05);
    }

    &.active {
      color: var(--brand-primary);
      background: #eff6ff;
      font-weight: 600;
    }
  }

  .tk-popover {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    width: 316px;
    padding: 12px 14px;
    background: var(--panel-bg-solid);
    backdrop-filter: blur(14px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.85);
    border-radius: 12px;
    box-shadow: var(--panel-shadow);
    z-index: 10;
  }

  .popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .popover-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .popover-close {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-muted);
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        color: var(--text-primary);
        background: rgba(15, 23, 42, 0.06);
      }
    }
  }

  .popover-form {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.el-input__wrapper) {
      border-radius: 8px;
    }

    :deep(.el-button) {
      border-radius: 8px;
      padding: 0 12px;
      height: 28px;
    }
  }

  .popover-hint {
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-muted);
  }
}
</style>
