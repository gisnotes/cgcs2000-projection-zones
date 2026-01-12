<template>
  <div
    class="map"
    ref="mapDivRef">
    <el-segmented
      class="map-switch"
      v-model="mapType"
      :options="typeOptions"
      @change="handleMapTypeChange" />
    <div class="graticule-switch">
      <div>经纬网：</div>
      <el-switch
        size="small"
        width="40px"
        v-model="graticuleSwitchVal"
        inline-prompt
        active-text="开"
        inactive-text="关"
        @change="handleGraticuleSwitchChange" />
    </div>
  </div>
</template>

<script setup>
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import { defaults as defaultInteractions } from 'ol/interaction.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import Graticule from 'ol/layer/Graticule.js';
import Map from 'ol/Map.js';
import { unByKey } from 'ol/Observable.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Fill, Stroke, Style } from 'ol/style.js';
import View from 'ol/View.js';

import 'ol/ol.css';

import Tianditu from './tianditu.js';

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

const graticuleSwitchVal = ref(true);
const graticuleLayer = new Graticule({
  strokeStyle: new Stroke({
    color: 'rgba(255,120,0,0.9)',
    width: 2,
    lineDash: [0.5, 4],
  }),
  showLabels: true,
  visible: graticuleSwitchVal.value,
  lonLabelPosition: 0.05,
});

//#region-------生命周期-------
onMounted(async () => {
  tdtInstance = new Tianditu();
  createMap();
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
    // collapsible: false,
    attributions: `<span>自然资源部 & NavInfo审图号：GS（2025）1508号</span>`,
  });

  const controls = defaultControls({
    attribution: false,
    rotate: false,
    zoom: false,
  }).extend([attribution, new ScaleLine()]);

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
    layers: [vecLyrGrp, imgLyrGrp, highlightLayer, graticuleLayer],
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
  // if (!small) return;
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

function handleGraticuleSwitchChange(checked) {
  if (checked) {
    graticuleLayer.setVisible(true);
  } else {
    graticuleLayer.setVisible(false);
  }
}
</script>

<style lang="scss" scoped>
.map {
  height: 100%;
  position: relative;

  &-switch {
    position: absolute;
    bottom: 8px;
    left: 8px;
    z-index: 2;
  }
}

.graticule-switch {
  position: absolute;
  left: 140px;
  bottom: 8px;
  padding: 4px 6px;
  border-radius: 4px;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  font-size: 14px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.12),
    0 0 6px rgba(0, 0, 0, 0.04);
}

:deep(.ol-scale-line) {
  left: 50%;
  transform: translateX(-50%);
}
</style>
