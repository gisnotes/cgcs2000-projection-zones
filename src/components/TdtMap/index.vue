<template>
  <div class="map" ref="mapDivRef">
    <div class="bottom-left-bar">
      <div class="map-toolbar">
        <div class="basemap-switch" role="group" aria-label="底图切换">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            type="button"
            class="basemap-option"
            :class="{ active: mapType === opt.value }"
            @click="selectMapType(opt.value)">
            <svg
              v-if="opt.value === 'vec'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>{{ opt.label }}</span>
          </button>
        </div>

        <span class="toolbar-divider" />

        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: graticuleSwitchVal }"
          title="显示/隐藏经纬网"
          @click="toggleGraticule">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span>经纬网</span>
          <span class="status-indicator" />
        </button>

        <span class="toolbar-divider" />

        <slot name="bottom-left" />
      </div>

      <div class="zoom-controls" role="group" aria-label="缩放与重置控制">
        <button
          type="button"
          class="zoom-btn"
          title="缩小"
          @click="handleZoom(-1)">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span class="zoom-divider" />
        <button
          type="button"
          class="zoom-btn"
          title="重置全国视角"
          @click="handleResetView">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>
        <span class="zoom-divider" />
        <button
          type="button"
          class="zoom-btn"
          title="放大"
          @click="handleZoom(1)">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div class="scale-line-wrap" ref="scaleLineRef" />
    </div>

    <div class="realtime-coordinates" v-show="lngLat">
      <svg
        class="coord-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
      <span class="coord-prefix">坐标</span>
      <div class="coord-target" ref="realtimeCoordinatesRef" />
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
import { Fill, Stroke, Style, Text } from 'ol/style.js';
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
    color: 'rgba(217, 119, 6, 0.55)',
    width: 1.2,
    lineDash: [3, 4],
  }),
  showLabels: true,
  visible: graticuleSwitchVal.value,
  lonLabelPosition: 0.05,
  lonLabelStyle: new Text({
    font: '600 11px "Inter", "PingFang SC", sans-serif',
    textBaseline: 'bottom',
    fill: new Fill({ color: '#334155' }),
    stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.92)', width: 3 }),
  }),
  latLabelStyle: new Text({
    font: '600 11px "Inter", "PingFang SC", sans-serif',
    textAlign: 'end',
    fill: new Fill({ color: '#334155' }),
    stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.92)', width: 3 }),
  }),
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
  });

  const highlightLayer = new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: new Style({
      fill: new Fill({
        color: 'rgba(245, 158, 11, 0.16)',
      }),
      stroke: new Stroke({
        color: '#f59e0b',
        width: 2.5,
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
    interactions: defaultInteractions({ doubleClickZoom: false }),
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
  emits('mapClick', e);
}

function selectMapType(value) {
  if (mapType.value === value) return;
  mapType.value = value;
  handleMapTypeChange(value);
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

function toggleGraticule() {
  graticuleSwitchVal.value = !graticuleSwitchVal.value;
  handleGraticuleSwitchChange(graticuleSwitchVal.value);
}

function handleGraticuleSwitchChange(checked) {
  graticuleLayer.setVisible(Boolean(checked));
}

function handleZoom(delta) {
  if (!map) return;
  const view = map.getView();
  const currentZoom = view.getZoom();
  if (currentZoom === undefined) return;
  view.animate({
    zoom: currentZoom + delta,
    duration: 200,
  });
}

function handleResetView() {
  if (!map) return;
  map.getView().fit(CHINA_BBOX, {
    duration: 350,
    padding: [40, 310, 64, 400],
  });
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
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-toolbar,
.zoom-controls,
.scale-line-wrap,
.realtime-coordinates {
  height: var(--control-height);
  box-sizing: border-box;
  background: var(--panel-bg);
  backdrop-filter: blur(14px) saturate(160%);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow-sm);
  border-radius: var(--control-radius);
}

.map-toolbar {
  padding: 3px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.basemap-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 28px;
  padding: 2px;
  border-radius: 7px;
  background: rgba(241, 245, 249, 0.9);
}

.basemap-option {
  height: 24px;
  padding: 0 9px;
  border: none;
  border-radius: 5px;
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

  svg {
    width: 13px;
    height: 13px;
  }

  &:hover:not(.active) {
    color: var(--text-primary);
  }

  &.active {
    background: var(--brand-primary);
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
  }
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: rgba(15, 23, 42, 0.1);
  margin: 0 2px;
  flex-shrink: 0;
}

.toolbar-btn {
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
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.16s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  .status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    opacity: 0.45;
    transition: all 0.16s ease;
  }

  &:hover {
    color: var(--text-primary);
    background: rgba(15, 23, 42, 0.05);
  }

  &.active {
    background: #eff6ff;
    color: var(--brand-primary);
    font-weight: 600;

    .status-indicator {
      background: var(--brand-primary);
      opacity: 1;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.18);
    }
  }
}

.zoom-controls {
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 2px;
}

.zoom-btn {
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: var(--brand-primary);
    background: var(--brand-primary-soft);
  }

  &:active {
    transform: scale(0.94);
  }
}

.zoom-divider {
  width: 1px;
  height: 16px;
  background: rgba(15, 23, 42, 0.08);
}

.scale-line-wrap {
  padding: 0 11px;
  display: flex;
  align-items: center;

  :deep(.ol-scale-line) {
    position: static;
    background: transparent;
    padding: 0;
    margin: 0;
  }

  :deep(.ol-scale-line-inner) {
    border: 1.5px solid #475569;
    border-top: none;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.25;
    padding: 0 5px 1px;
    margin: 0;
  }
}

.realtime-coordinates {
  position: absolute;
  bottom: var(--edge-gap);
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  min-width: 224px;
  padding: 0 12px;
  color: var(--text-primary);
  font-size: 12px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  .coord-icon {
    width: 13px;
    height: 13px;
    color: var(--brand-primary);
    flex-shrink: 0;
  }

  .coord-prefix {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .coord-target {
    display: flex;
    align-items: center;
  }

  :deep(.ol-mouse-position) {
    position: static;
    font-family: var(--font-mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
}

:deep(.ol-attribution) {
  bottom: var(--edge-gap);
  right: var(--edge-gap);
  z-index: 4;
  height: var(--control-height);
  max-height: var(--control-height);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 9px;
  border-radius: var(--control-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(14px) saturate(160%);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow-sm);

  ul {
    font-size: 11px;
    color: var(--text-secondary);
    text-shadow: none;
    line-height: 1;
    padding: 0 4px;
  }

  button {
    width: 22px;
    height: 22px;
    color: var(--text-secondary);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 1240px) {
  .bottom-left-bar {
    gap: 6px;
  }

  .basemap-option {
    padding: 0 7px;
  }

  .toolbar-btn {
    padding: 0 7px;
  }

  .zoom-btn {
    width: 27px;
  }

  .realtime-coordinates {
    min-width: 0;
    padding: 0 10px;

    .coord-prefix {
      display: none;
    }
  }
}
</style>
