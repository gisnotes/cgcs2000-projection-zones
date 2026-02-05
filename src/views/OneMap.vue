<template>
  <div class="wrap">
    <!-- 地图 -->
    <tdt-map @mapCreated="mapCreated" @mapClick="mapClick" />
    <!-- 分度带 -->
    <projection-zones
      v-bind="$attrs"
      @popup="handlePopup"
      @closePopup="handleClosePopup" />
    <!-- 行政区划 -->
    <administrative-divisions />
    <!-- 弹窗 -->
    <ol-popup
      ref="popup"
      :title
      :position
      :offset
      :propeties
      :popupInfo
      @close="closePopup" />
    <!-- 更改天地图秘钥 -->
    <div class="tk-change">
      <transition name="el-fade-in">
        <el-button plain type="primary" v-if="!show" @click="handleShow">
          变更天地图秘钥
          <el-icon class="el-icon--right">
            <Refresh />
          </el-icon>
        </el-button>
      </transition>
      <transition name="el-fade-in">
        <div class="input" v-if="show">
          <el-input
            ref="inputRef"
            v-model="tk"
            placeholder="请输入要更改的秘钥后按 Enter 即可"
            clearable
            @blur="handleInputBlur"
            @keyup.enter.native="handleSearch">
            <template #prefix>
              <i-ep-Search />
            </template>
          </el-input>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getCenter } from 'ol/extent';
import { unByKey } from 'ol/Observable';

import { useTkStore } from '@/stores/tkStore.js';
import { clearSource, getLayerByName } from '@/utils/common.js';

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

function handleShow() {
  if (!show.value) {
    show.value = true;
    nextTick(() => {
      inputRef.value.focus();
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

  .tk-change {
    position: absolute;
    left: 450px;
    top: 10px;
    z-index: 2;
    transition: all 0.3s ease-in-out;
    display: flex;
    .input {
      width: 310px;
      position: absolute;
      top: 0;
      left: 0;
    }
  }
}
</style>
