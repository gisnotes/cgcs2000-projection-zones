<template>
  <div class="wrap">
    <tdt-map @mapCreated="mapCreated" @mapClick="mapClick" />
    <projection-zones
      v-bind="$attrs"
      @popup="handlePopup"
      @closePopup="handleClosePopup" />
    <administrative-divisions />
    <ol-popup ref="popup" :title :position :offset :propeties :popupInfo />
  </div>
</template>

<script setup>
import { getCenter } from 'ol/extent';

import { getLayerByName, clearSource } from '@/utils/common.js';

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

function handleClosePopup() {
  popup.value?.close();
}
</script>

<style lang="scss" scoped>
.wrap {
  height: 100%;
}
</style>
