<template>
  <div
    class="map"
    ref="mapDivRef"
    v-loading.lock="loading"
    element-loading-text="地图加载中..."
    element-loading-background="rgba(122, 122, 122, 0.8)">
    <el-segmented
      class="map-switch"
      v-model="mapType"
      :options="typeOptions"
      @change="handleMapTypeChange" />
  </div>
</template>

<script setup>
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Style, Fill, Stroke } from 'ol/style.js';
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { defaults as defaultInteractions } from 'ol/interaction.js';
import Map from 'ol/Map.js';
import { unByKey } from 'ol/Observable.js';
import View from 'ol/View.js';

import 'ol/ol.css';

import Tianditu from './tianditu.js';

const loading = ref(true);
let map, attribution, tdtInstance, vecLyrGrp, imgLyrGrp;
let mapDivRef = ref();
let mapClickEvtKey = null;
let mapCheckSizeEvtKey = null;

const CHINA_BBOX = [73.62, 16.7, 134.77, 53.56];

const emits = defineEmits(['mapCreated', 'mapClick']);

const props = defineProps({
  defaultTdtLyrType: {
    type: String,
    default: 'vec',
  },
});

const mapType = ref(props.defaultTdtLyrType);
const typeOptions = [
  {
    label: '电子',
    value: 'vec',
  },
  {
    label: '影像',
    value: 'img',
  },
];

//#region-------生命周期-------
onMounted(async () => {
  tdtInstance = new Tianditu();
  createMap();
  loading.value = false;
  initMapEvt();
});

onBeforeUnmount(() => {
  unByKey(mapClickEvtKey);
  unByKey(mapCheckSizeEvtKey);
  mapClickEvtKey = null;
  mapCheckSizeEvtKey = null;
  map = null;
});
//#endregion

function createMap() {
  vecLyrGrp = tdtInstance.createTileLayerGroup(
    'vec',
    'vec' === props.defaultTdtLyrType,
  );

  imgLyrGrp = tdtInstance.createTileLayerGroup(
    'img',
    'img' === props.defaultTdtLyrType,
  );
  attribution = new Attribution({
    collapsible: false,
    attributions: `<span>自然资源部 & NavInfo审图号：GS（2025）1508号</span>`,
  });

  const controls = defaultControls({
    attribution: false,
    rotate: false,
    zoom: false,
  }).extend([attribution]);

  const view = new View({
    center: [
      (CHINA_BBOX[0] + CHINA_BBOX[2]) / 2,
      (CHINA_BBOX[1] + CHINA_BBOX[3]) / 2,
    ],
    zoom: 3,
    maxZoom: 28,
    projection: 'EPSG:4326',
    // extent: [...CHINA_BBOX],
  });

  const highlightLayer = new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: new Style({
      fill: new Fill({
        color: 'rgba(0, 255, 255, 0.1)',
      }),
      stroke: new Stroke({
        color: 'rgb(0, 255, 255)',
        width: 2,
      }),
    }),
    properties: {
      name: 'highlight',
    },
    zIndex: 100,
  });

  map = new Map({
    target: mapDivRef.value,
    layers: [vecLyrGrp, imgLyrGrp, highlightLayer],
    view,
    controls,
    interactions: defaultInteractions({ doubleClickZoom: false }), //关闭双击交互
  });
  emits('mapCreated', map);
}

function initMapEvt() {
  checkSize();
  mapCheckSizeEvtKey = map.on('change:size', checkSize);
  mapClickEvtKey = map.on('singleclick', mapClick);
}

function checkSize() {
  const small = map.getSize()[0] < 600;
  attribution.setCollapsible(small);
  attribution.setCollapsed(small);
}

function mapClick(e) {
  // ElMessage.primary({ message: e.coordinate.toString(), offset: 100 });
  emits('mapClick', e);
}

function handleMapTypeChange(value) {
  if (value === 'vec') {
    vecLyrGrp.setVisible(true);
    imgLyrGrp.setVisible(false);
  } else {
    vecLyrGrp.setVisible(false);
    imgLyrGrp.setVisible(true);
  }
}
</script>

<style lang="scss" scoped>
.map {
  height: 100%;
  position: relative;

  &-switch {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
  }
}

.el-loading-mask {
  z-index: 9999;
}
</style>
