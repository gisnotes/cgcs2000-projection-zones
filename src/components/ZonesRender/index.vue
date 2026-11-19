<template>
  <div class="zones-render">
    <el-input
      v-if="allZones.length > 1"
      v-model="keyword"
      class="zone-search"
      size="small"
      placeholder="筛选 EPSG / 中央子午线 / 带号..."
      clearable>
      <template #prefix>
        <i-ep-Search />
      </template>
    </el-input>

    <div class="zone-summary">
      <span class="summary-subtitle">{{ subtitle || '投影分带' }}</span>
      <span class="summary-count">
        {{
          keyword.trim()
            ? `匹配 ${filteredZones.length} / ${allZones.length}`
            : `共 ${allZones.length} 个分带`
        }}
      </span>
    </div>

    <div class="zone-list" v-if="filteredZones.length">
      <div
        v-for="item in filteredZones"
        :key="item.code"
        class="zone-item"
        :class="{ 'is-active': selectedCode === item.code }"
        @click="handleSelectZone(item)">
        <div class="zone-item-main">
          <div class="zone-item-title">{{ getDisplayTitle(item) }}</div>
          <div class="zone-item-sub" :title="item.label">
            {{
              item.code === 4490
                ? '国家2000大地坐标系 · EPSG:4490'
                : item.label
            }}
          </div>
        </div>
        <button
          type="button"
          class="epsg-pill"
          title="点击复制 EPSG 代码"
          @click.stop="handleCopyCode(item.code)">
          EPSG:{{ item.code }}
        </button>
      </div>
    </div>

    <div class="zone-empty" v-else>未找到匹配的分带</div>
  </div>
</template>

<script setup>
import { useClipboard } from '@vueuse/core';
import Feature from 'ol/Feature.js';
import { LineString } from 'ol/geom.js';
import { fromExtent } from 'ol/geom/Polygon';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Fill, Stroke, Style, Text } from 'ol/style.js';

import { clearSource, getLayerByName } from '@/utils/common.js';
import { CHINA_2000_EXTENT } from './utils.js';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  name: {
    type: String,
    default: 'zones-render',
  },
  subtitle: {
    type: String,
    default: '',
  },
  visible: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const { copy } = useClipboard();

const keyword = ref('');
const selectedCode = ref(null);

const emits = defineEmits(['popup', 'closePopup']);

const allZones = computed(() => {
  const list = [];
  const collect = (items) => {
    items?.forEach((item) => {
      if (item?.bounds) {
        list.push(item);
      }
      if (item?.children?.length) {
        collect(item.children);
      }
    });
  };
  collect(props.data);
  return list;
});

const filteredZones = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return allZones.value;
  return allZones.value.filter((item) => {
    const title = getDisplayTitle(item).toLowerCase();
    const label = String(item.label || '').toLowerCase();
    const code = String(item.code || '').toLowerCase();
    const cm = String(item.centralMeridian || '').toLowerCase();
    return (
      title.includes(q) ||
      label.includes(q) ||
      code.includes(q) ||
      cm.includes(q)
    );
  });
});

function getDisplayTitle(item) {
  if (item.code === 4490) {
    return 'CGCS 2000 地理坐标系';
  }
  const zoneMatch = item.label?.match(/zone\s+(\d+)/i);
  if (zoneMatch) {
    return (
      `第 ${zoneMatch[1]} 带` +
      (item.centralMeridian ? ` · ${item.centralMeridian}` : '')
    );
  }
  if (item.centralMeridian) {
    return `中央子午线 ${item.centralMeridian}`;
  }
  return item.label;
}

async function handleCopyCode(code) {
  await copy(String(code));
  ElMessage.success(`已复制 EPSG:${code}`);
}

let map = null;
let highlightSource = null;
const source = new VectorSource({ wrapX: false });
const style = new Style({
  fill: new Fill({
    color: 'rgba(225, 29, 72, 0.035)',
  }),
  stroke: new Stroke({
    color: 'rgba(225, 29, 72, 0.52)',
    width: 1,
  }),
});
const layer = new VectorLayer({
  source,
  zIndex: 99,
  visible: props.visible,
  properties: {
    name: `${props.name}-zone`,
  },
});

const cmSource = new VectorSource({ wrapX: false });
const cmStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(225, 29, 72, 0.72)',
    width: 1.2,
    lineDash: [6, 5],
  }),
  text: new Text({
    placement: 'line',
    textAlign: 'center',
    textBaseline: 'middle',
    font: '600 11px "Inter", "PingFang SC", sans-serif',
    fill: new Fill({ color: '#be123c' }),
    stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.92)', width: 3.5 }),
    overflow: true,
  }),
});
const cmLayer = new VectorLayer({
  source: cmSource,
  zIndex: 99,
  visible: props.visible,
  properties: {
    name: `${props.name}-cm`,
  },
});

watch(isMapCreated, (val) => {
  if (val) {
    map = state.map;
    init();
  }
});

watch(
  () => props.visible,
  (val) => {
    layer.setVisible(val);
    cmLayer.setVisible(val);
    if (!val) {
      clearSource(highlightSource);
      emits('closePopup');
      selectedCode.value = null;
    }
  },
);

watch(
  () => props.active,
  (val) => {
    clearSource(highlightSource);
    selectedCode.value = null;
    if (val) {
      // 切换显示新标签页时，fit中国范围，并关闭弹窗
      fitChinaExtent();
      emits('closePopup');
    }
  },
);

function init() {
  highlightSource = getLayerByName(map, 'highlight').getSource();
  map.addLayer(layer);
  map.addLayer(cmLayer);

  allZones.value.forEach((item) => {
    renderBounds(item);
    renderCentralMeridianLine(item);
  });

  if (props.visible) {
    fitChinaExtent();
  }
}

function renderBounds(item) {
  const geometry = fromExtent(item.bounds);
  const feature = new Feature({ geometry });
  feature.setId(item.code);
  feature.setStyle(style.clone());
  feature.setProperties({ ...item });
  source.addFeature(feature);
}

function renderCentralMeridianLine(item) {
  if (!item.centralMeridian) return;
  const lineCoordinates = getCentralMeridianPoints(item.bounds);
  const cmFeature = new Feature({ geometry: new LineString(lineCoordinates) });
  const newCmStyle = cmStyle.clone();
  newCmStyle.getText().setText(item.centralMeridian);
  cmFeature.setStyle(newCmStyle);
  cmSource.addFeature(cmFeature);
}

function handleSelectZone(data) {
  if (!data?.bounds) {
    return;
  }
  selectedCode.value = data.code;
  const feature = source.getFeatureById(data.code);
  if (feature) {
    clearSource(highlightSource);
    const clonedFeature = feature.clone();
    clonedFeature.setStyle(undefined);
    highlightSource.addFeature(clonedFeature);

    map.getView().fit(feature.getGeometry(), {
      duration: 300,
      padding: [40, 310, 64, 400],
      callback: () => emits('popup', data),
    });
  }
}

function fitChinaExtent() {
  map.getView().fit(CHINA_2000_EXTENT, {
    duration: 300,
    padding: [40, 310, 64, 400],
  });
}

const getCentralMeridianPoints = (extent, stretchLength = 2) => {
  if (!Array.isArray(extent) || extent.length !== 4) {
    return null;
  }

  const [minX, minY, maxX, maxY] = extent;

  // 计算 X 轴中点 (Easting 中点)
  const isLastZone = minX === 132.0 || minX === 133.5;
  const centerX = isLastZone ? 135 : (minX + maxX) / 2;

  // 返回格式：[ [x, y_max], [x, y_min] ]
  return [
    [centerX, maxY + stretchLength], // 上边点 (Top Center)
    [centerX, minY - stretchLength], // 下边点 (Bottom Center)
  ];
};
</script>

<style lang="scss" scoped>
.zones-render {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.zone-search {
  flex-shrink: 0;
  margin-bottom: 8px;

  :deep(.el-input__wrapper) {
    background: var(--panel-subtle-bg);
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid rgba(15, 23, 42, 0.06);
    padding: 0 10px;
    height: 30px;
    transition: all 0.18s ease;

    &.is-focus {
      background: #ffffff;
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px var(--brand-primary-ring);
    }
  }

  :deep(.el-input__inner) {
    font-size: 12px;
    color: var(--text-primary);
  }
}

.zone-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 2px 8px;
  font-size: 11.5px;
  flex-shrink: 0;

  .summary-subtitle {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .summary-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    background: var(--panel-subtle-bg);
    padding: 2px 7px;
    border-radius: 999px;
  }
}

.zone-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-right: 3px;
}

.zone-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition: all 0.16s ease;

  &:hover {
    background: #ffffff;
    border-color: rgba(37, 99, 235, 0.22);
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
  }

  &.is-active {
    background: #eff6ff;
    border-color: rgba(37, 99, 235, 0.3);
    box-shadow: inset 3px 0 0 var(--brand-primary);

    .zone-item-title {
      color: var(--brand-primary);
    }

    .epsg-pill {
      background: var(--brand-primary);
      color: #ffffff;
      border-color: var(--brand-primary);

      &:hover {
        background: var(--brand-primary-hover);
      }
    }
  }
}

.zone-item-main {
  flex: 1;
  min-width: 0;
}

.zone-item-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zone-item-sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.epsg-pill {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.07);
  color: var(--brand-primary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(37, 99, 235, 0.14);
    border-color: rgba(37, 99, 235, 0.35);
  }
}

.zone-empty {
  padding: 28px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
