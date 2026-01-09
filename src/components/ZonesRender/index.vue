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
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import Feature from 'ol/Feature.js';
import { fromExtent } from 'ol/geom/Polygon';
import { Style, Fill, Stroke } from 'ol/style.js';

import { CHINA_2000_EXTENT, getCheckedIds } from './utils.js';
import { getLayerByName, clearSource } from '@/utils/common.js';

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
    color: 'rgba(255, 0, 0, 0.1)',
  }),
  stroke: new Stroke({
    color: '#ff0000',
    width: 1,
  }),
});
const layer = new VectorLayer({
  source,
  zIndex: 99,
  visible: props.visible,
  properties: {
    name: props.name,
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

  props.data.forEach((item) => {
    if (item?.bounds) {
      renderBounds(item);
    }
    if (item?.children?.length) {
      item.children.forEach((child) => {
        if (child?.bounds) {
          renderBounds(child);
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
      padding: [100, 200 + 240, 100, 200 + 350],
      callback: () => emits('popup', data),
    });
  }
}

function fitChinaExtent() {
  map.getView().fit(CHINA_2000_EXTENT, {
    duration: 300,
    padding: [100, 200 + 240, 100, 200 + 350],
  });
}
</script>
