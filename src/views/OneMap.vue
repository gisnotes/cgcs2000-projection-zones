<template>
  <div class="wrap">
    <!-- 地图 -->
    <tdt-map @mapCreated="mapCreated" @mapClick="mapClick">
      <template #bottom-left>
        <!-- 更改天地图秘钥 -->
        <div class="tk-change">
          <button
            type="button"
            class="tk-trigger"
            :class="{ active: show }"
            title="变更天地图秘钥"
            @mousedown.prevent
            @click="handleToggle">
            <el-icon><Refresh /></el-icon>
            <span>天地图秘钥</span>
          </button>
          <transition name="el-zoom-in-bottom">
            <div class="tk-popover" v-show="show">
              <el-input
                ref="inputRef"
                v-model="tk"
                size="small"
                placeholder="请输入新秘钥后按 Enter 生效"
                clearable
                @blur="handleInputBlur"
                @keyup.enter="handleSearch">
                <template #prefix>
                  <i-ep-Search />
                </template>
              </el-input>
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
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getCenter } from 'ol/extent';

import { useTkStore } from '@/stores/tkStore.js';
import { clearSource, getLayerByName } from '@/utils/common.js';

const foldProjectionZones = ref(false);

//弹窗
let title = ref('');
let position = ref([]);
let offset = ref([0, -10]);
let propeties = ref([
  { key: 'label', val: '投影名称', unit: null },
  { key: 'code', val: 'EPSG', unit: null },
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
const inputRef = ref(null);
const tk = ref('');
const tkStore = useTkStore();

provide('state', state);
provide('isMapCreated', isMapCreated);

function mapCreated(map) {
  state.map = map;
  isMapCreated.value = true;
  highlightSource = getLayerByName(map, 'highlight').getSource();
}

function mapClick(evt) {
  // console.log('点击了地图');
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

function handleInputBlur() {
  if (!tk.value) {
    show.value = false;
  }
}

function handleSearch() {
  if (!tk.value) return;
  tkStore.updateTk(tk.value);
  tk.value = '';
  ElMessage({
    message: '天地图秘钥已更换,即将刷新地图',
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
    bottom: 56px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }
}

.tk-change {
  position: relative;
  display: flex;
  align-items: center;

  .tk-trigger {
    height: var(--control-height);
    box-sizing: border-box;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-family: inherit;
    color: #303133;
    background: var(--panel-bg);
    backdrop-filter: blur(8px);
    border: var(--panel-border);
    border-radius: var(--control-radius);
    box-shadow: var(--panel-shadow);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color 0.2s,
      border-color 0.2s;

    &:hover,
    &.active {
      color: #409eff;
      border-color: rgba(64, 158, 255, 0.35);
    }
  }

  .tk-popover {
    position: absolute;
    left: 0;
    bottom: calc(100% + 8px);
    width: 300px;
    padding: 8px;
    background: var(--panel-bg);
    backdrop-filter: blur(8px);
    border: var(--panel-border);
    border-radius: var(--panel-radius);
    box-shadow: var(--panel-shadow);
    z-index: 10;
  }
}
</style>
