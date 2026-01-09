<template>
  <transition name=".el-zoom-in-center">
    <div class="projection-zones-fold" v-show="fold" @click="handleFold">
      <i-ep-Fold />
    </div>
  </transition>
  <transition name=".el-zoom-in-center">
    <div class="projection-zones" v-show="!fold">
      <div class="header">
        <div class="title">行政区划</div>
        <div class="fold" @click="handleFold">
          <i-ep-Expand />
        </div>
      </div>
      <el-divider style="margin: 10px 0"></el-divider>
      <el-input
        v-model="filterText"
        style="margin: 6px 0 10px"
        placeholder="请输入关键字"
        clearable />
      <div class="tree">
        <el-tree
          ref="treeRef"
          :data
          node-key="gb"
          :props="{ children: 'children', label: 'name' }"
          :default-expanded-keys="[]"
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
          highlight-current
          empty-text="暂无数据"
          :expand-on-click-node="false">
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
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';

import {
  addBizLayer,
  createPolygonStyle,
  getAdmistrativeDivisionsData,
  readAdministrativeDivisionsData,
} from '@/utils/common.js';
import { getItem, setItem } from '@/utils/storage/sessionStorage.js';

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const fold = ref(false);

const data = ref([]);

const cgcs2000 = getItem('cgcs2000');

if (cgcs2000) {
  data.value = cgcs2000;
} else {
  getAdmistrativeDivisionsData().then((res) => {
    data.value = res[0].children;
    setItem('cgcs2000', res[0].children);
  });
}

let map = null;
let source = null;
let provinceFeatureArray = [];
let cityFeatureArray = [];
let countyFeatureArray = [];
const geojsonFormat = new GeoJSON();

const readTasks = [
  { url: './data/中国_省.geojson', type: 'province' },
  { url: './data/中国_市.geojson', type: 'city' },
  { url: './data/中国_县.geojson', type: 'county' },
];

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
  return data.name.includes(value);
};

function init() {
  source = addBizLayer(map, undefined, 'administrative-divisions', 100);

  Promise.allSettled(
    readTasks.map((task) =>
      readAdministrativeDivisionsData(task.url).then((res) => ({
        type: task.type,
        features: geojsonFormat.readFeatures(res),
      })),
    ),
  ).then((results) => {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { type, features } = result.value;
        // 根据 type 参数赋值
        if (type === 'province') provinceFeatureArray = features;
        else if (type === 'city') cityFeatureArray = features;
        else if (type === 'county') countyFeatureArray = features;
      } else {
        console.error(`[${result.reason.type}] 数据加载失败`, result.reason);
      }
    });
  });
}

async function handleNodeClick(data) {
  const { gb } = toRaw(data);
  if (String(gb).endsWith('0000')) {
    // console.log('这是一个省级编码');
    showClickDivision(provinceFeatureArray, gb);
  } else if (String(gb).endsWith('00') || String(gb).endsWith('000')) {
    // console.log('这是一个市级编码');
    showClickDivision(cityFeatureArray, gb);
  } else {
    // console.log('这是一个县级编码');
    showClickDivision(countyFeatureArray, gb);
  }
}

function showClickDivision(featureArr, gb) {
  const feature = featureArr.find((f) => f.getProperties().gb === gb);
  if (feature instanceof Feature) {
    const { name } = feature.getProperties();
    if (source.getFeatures().length > 0) {
      source.clear();
    }
    feature.setStyle(
      createPolygonStyle('rgba(0, 0, 255, 0.2)', 'rgba(0, 0, 255)', 1.25, name),
    );
    source.addFeature(feature);
    map.getView().fit(feature.getGeometry(), {
      duration: 300,
      padding: [20, 50 + 30 + 260, 20, 50 + 400],
    });
  }
}

function handleFold() {
  fold.value = !fold.value;
}
</script>

<style lang="scss" scoped>
.projection-zones-fold {
  top: 8px;
  right: 8px;
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
  border-radius: 4px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.12),
    0 0 6px rgba(0, 0, 0, 0.04);
  display: flex;
  background-color: white;
  opacity: 0.9;
}

.projection-zones {
  top: 8px;
  right: 30px;
  width: 260px;
  height: 500px;
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

/* 修改所有树节点的文字大小 */
:deep(.custom-tree-node .el-tree-node .el-tree-node .el-tree-node__label) {
  font-size: 12px !important;
}
</style>
