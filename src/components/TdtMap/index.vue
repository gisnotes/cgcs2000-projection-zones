<template>
  <div class="map" ref="mapDivRef">
    <div class="bottom-left-bar">
      <el-segmented
        class="map-switch"
        v-model="mapType"
        :options="typeOptions"
        @change="handleMapTypeChange" />
      <div class="graticule-switch">
        <span class="label">经纬网</span>
        <el-switch
          size="small"
          width="38px"
          v-model="graticuleSwitchVal"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleGraticuleSwitchChange" />
      </div>
      <slot name="bottom-left" />
      <div class="scale-line-wrap" ref="scaleLineRef" />
    </div>
    <div
      class="realtime-coordinates"
      ref="realtimeCoordinatesRef"
      v-show="lngLat">
      实时坐标：
    </div>
  </div>
</template>

<script setup>
import Attribution from 'ol/control/Attribution.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import MousePosition from 'ol/control/MousePosition.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import { createStringXY } from 'ol/coordinate.js';
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
const lngLat = ref(null);

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

const graticuleSwitchVal = ref(false);
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

const realtimeCoordinatesRef = ref(null);
const scaleLineRef = ref(null);

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
  }).extend([
    attribution,
    new ScaleLine({
      target: scaleLineRef.value,
    }),
    new MousePosition({
      target: realtimeCoordinatesRef.value,
      coordinateFormat: (coord) => {
        if (!lngLat.value) {
          lngLat.value = coord;
        }
        const stringifyFunc = createStringXY(6);
        return stringifyFunc(coord);
      },
    }),
  ]);

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
}

.bottom-left-bar {
  position: absolute;
  bottom: var(--edge-gap);
  left: var(--edge-gap);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-switch,
.graticule-switch,
.scale-line-wrap,
.realtime-coordinates {
  height: var(--control-height);
  box-sizing: border-box;
  background: var(--panel-bg);
  backdrop-filter: blur(8px);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);
  border-radius: var(--control-radius);
}

.map-switch {
  padding: 2px;
  --el-segmented-bg-color: transparent;
  --el-border-radius-base: 4px;

  :deep(.el-segmented__group) {
    height: 100%;
  }

  :deep(.el-segmented__item) {
    min-height: 26px;
    padding: 0 10px;
    font-size: 13px;
  }
}

.graticule-switch {
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
}

.scale-line-wrap {
  padding: 0 10px;
  display: flex;
  align-items: center;

  :deep(.ol-scale-line) {
    position: static;
    background: transparent;
    padding: 0;
    margin: 0;
  }

  :deep(.ol-scale-line-inner) {
    border: 1px solid #606266;
    border-top: none;
    color: #303133;
    font-size: 11px;
    line-height: 1.2;
    padding: 0 4px 1px;
    margin: 0;
  }
}

.realtime-coordinates {
  position: absolute;
  bottom: var(--edge-gap);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  min-width: 225px;
  padding: 0 12px;
  color: #303133;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 鼠标实时坐标组件样式自定义 */
:deep(.ol-mouse-position) {
  position: static;
  flex: 1;
}

:deep(.ol-attribution) {
  bottom: var(--edge-gap);
  right: var(--edge-gap);
  height: var(--control-height);
  max-height: var(--control-height);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--control-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(8px);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);

  ul {
    font-size: 12px;
    color: #606266;
    text-shadow: none;
    line-height: 1;
    padding: 0 4px;
  }

  button {
    width: 22px;
    height: 22px;
    color: #606266;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
