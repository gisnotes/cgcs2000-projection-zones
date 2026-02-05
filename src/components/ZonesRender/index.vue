<template>
  <div class="zones-render">
    <el-tree
      ref="treeRef"
      class="custom-tree"
      :data
      node-key="id"
      :props="treeDefaultProps"
      :default-expanded-keys="[1]"
      :default-checked-keys="defaultCheckedKeys"
      @node-click="handleNodeClick"
      highlight-current>
      <template #default="{ node, data }">
        <span :title="node.label">{{ node.label }}</span>
      </template>
    </el-tree>
  </div>
</template>

<script setup>
import Feature from 'ol/Feature.js';
import { LineString } from 'ol/geom.js';
import { fromExtent } from 'ol/geom/Polygon';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Fill, Stroke, Style, Text } from 'ol/style.js';

import { clearSource, getLayerByName } from '@/utils/common.js';
import { CHINA_2000_EXTENT, getCheckedIds } from './utils.js';

const props = defineProps({
  treeDefaultProps: {
    type: Object,
    default: () => {
      return {
        children: 'children',
        label: 'label',
      };
    },
  },
  data: {
    type: Array,
    default: () => [],
  },
  name: {
    type: String,
    default: 'zones-render',
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const treeRef = ref(null);

const emits = defineEmits(['popup', 'closePopup']);

const defaultCheckedKeys = ref(getCheckedIds(props.data));

let map = null;
let highlightSource = null;
const source = new VectorSource({ wrapX: false });
const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.05)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 0, 0)',
    width: 0.5,
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
    color: 'rgba(255, 0, 0)',
    width: 1,
    lineDash: [10, 10],
  }),
  text: new Text({
    placement: 'line',
    textAlign: 'center',
    textBaseline: 'middle',
    font: 'bold 11px sans-serif',
    fill: new Fill({ color: 'red' }),
    stroke: new Stroke({ color: 'white', width: 3 }),
    overflow: true,
  }),
});
const cmLayer = new VectorLayer({
  cmSource,
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
    // 切换到对应标签页，对应的图层才显示，若有高亮，则清除高亮
    layer.setVisible(val);
    clearSource(highlightSource);
    if (val) {
      // 切换显示新标签页时，fit中国范围，并关闭弹窗
      fitChinaExtent();
      emits('closePopup');
      // 切换标签页时，取消选中的node节点项
      if (treeRef.value.getCurrentKey()) {
        treeRef.value.setCurrentKey(null);
      }
    }
  },
);

function init() {
  highlightSource = getLayerByName(map, 'highlight').getSource();
  map.addLayer(layer);
  map.addLayer(cmLayer);

  props.data.forEach((item) => {
    if (item?.bounds) {
      renderBounds(item);
      renderCentralMeridianLine(item);
    }
    if (item?.children?.length) {
      item.children.forEach((child) => {
        if (child?.bounds) {
          renderBounds(child);
          renderCentralMeridianLine(child);
        }
      });
    }
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
  source.addFeature(cmFeature);
}

function handleNodeClick(data) {
  if (!data.bounds) {
    return;
  }
  const feature = source.getFeatureById(data.code);
  if (feature) {
    clearSource(highlightSource);
    const clonedFeature = feature.clone();
    clonedFeature.setStyle(undefined);
    highlightSource.addFeature(clonedFeature);

    map.getView().fit(feature.getGeometry(), {
      duration: 300,
      padding: [20, 50 + 30 + 260, 20, 50 + 400],
      callback: () => emits('popup', data),
    });
  }
}

function fitChinaExtent() {
  map.getView().fit(CHINA_2000_EXTENT, {
    duration: 300,
    padding: [20, 50 + 30 + 260, 20, 50 + 400],
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
