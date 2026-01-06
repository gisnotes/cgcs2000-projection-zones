<template>
  <transition name="el-fade-in-linear">
    <div class="projection-zones-fold" v-show="fold" @click="handleFold">
      <i-ep-Expand />
    </div>
  </transition>
  <transition :name="fold ? 'el-zoom-in-bottom' : 'el-zoom-in-top'">
    <div class="projection-zones" v-show="!fold">
      <div class="header">
        <div class="title">投影分带</div>
        <div class="fold" @click="handleFold">
          <i-ep-Fold />
        </div>
      </div>
      <el-divider style="margin: 10px 0"></el-divider>
      <el-input
        size="small"
        v-model="filterText"
        style="margin: 6px 0 10px 0"
        placeholder="请输入关键字" />
      <div class="tree">
        <el-tree
          ref="treeRef"
          :data="PROJECTIONS"
          node-key="id"
          :props="DEFAULT_PROPS"
          :default-expanded-keys="[2, 3, 8]"
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
          highlight-current>
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span :title="node.label">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import Feature from 'ol/Feature.js';
import { fromExtent } from 'ol/geom/Polygon';
import { Style, Fill, Stroke } from 'ol/style.js';

import { DEFAULT_PROPS, PROJECTIONS } from './data.js';

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const fold = ref(false);

let map = null;
let feature = null;

const source = new VectorSource({ wrapX: false });
const layer = new VectorLayer({
  source,
  zIndex: 99,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.2)',
    }),
    stroke: new Stroke({
      color: '#ff0000',
      width: 2,
    }),
  }),
  properties: {
    name: 'projection-zones',
  },
});

const filterText = ref('');
const treeRef = ref();

const emits = defineEmits(['popup']);

watch(filterText, (val) => {
  treeRef.value?.filter(val);
});

watch(isMapCreated, (val) => {
  if (val) {
    map = state.map;
    init();
  }
});

const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.includes(value);
};

function init() {
  map.addLayer(layer);
}

function handleNodeClick(data) {
  const { bounds } = toRaw(data);
  if (bounds) {
    const geometry = fromExtent(bounds);
    if (source.getFeatures().length === 0) {
      feature = new Feature({ geometry });
      source.addFeature(feature);
    } else {
      feature.setGeometry(geometry);
    }
    feature.setProperties({ ...data });
    map.getView().fit(geometry, {
      duration: 300,
      padding: [100, 200, 100, 200 + 400],
      callback: () => emits('popup', data),
    });
  }
}

function handleFold() {
  fold.value = !fold.value;
}
</script>

<style lang="scss" scoped>
.projection-zones-fold {
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  &:hover {
    color: #4094ff;
  }
}

.projection-zones-fold,
.projection-zones {
  position: absolute;
  top: 8px;
  left: 8px;
  border-radius: 4px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.12),
    0 0 6px rgba(0, 0, 0, 0.04);
  display: flex;
  background-color: white;
}

.projection-zones {
  width: 400px;
  height: calc(50% - 12px);
  overflow: hidden;
  padding: 10px;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;

    .title {
      flex: 1;
    }

    .fold {
      width: 30px;
      height: 30px;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;

      &:hover {
        color: #4094ff;
      }
    }
  }

  .tree {
    flex: 1;
    min-height: 0;
    height: auto;
    overflow: hidden auto;
  }
}
</style>
