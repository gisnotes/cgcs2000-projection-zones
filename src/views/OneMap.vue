<template>
  <div class="wrap">
    <tdt-map @mapCreated="mapCreated" @mapClick="mapClick" />
    <projection-zones @popup="handlePopup" />
    <ol-popup :title :position :offset :propeties :popupInfo />
  </div>
</template>

<script setup>
import { getCenter } from 'ol/extent';

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

const isMapCreated = ref(false);
const state = shallowReactive({
  map: null,
});

provide('state', state);
provide('isMapCreated', isMapCreated);

function mapCreated(map) {
  state.map = map;
  isMapCreated.value = true;
}

function mapClick(evt) {
  // console.log('点击了地图');
  // const [lng, lat] = evt.coordinate;
  const pickedFeature = state.map.forEachFeatureAtPixel(
    evt.pixel,
    (feature) => feature,
  );
  if (pickedFeature) {
    const properties = pickedFeature.getProperties();
    popup(properties);
  }
}

function handlePopup(data) {
  popup(data);
}

function popup(properties) {
  if (Object.keys(properties).includes('bounds')) {
    popupInfo.value = properties;
    title.value = properties.label;
    position.value = getCenter(properties.bounds);
  }
}
</script>

<style lang="scss" scoped>
.wrap {
  height: 100%;
}
</style>
