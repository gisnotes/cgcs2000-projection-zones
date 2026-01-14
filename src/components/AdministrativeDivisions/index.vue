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
      <div class="tree" v-loading="loading">
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
import GeoJSON from 'ol/format/GeoJSON.js';

import {
  addBizLayer,
  createPolygonStyle,
  getAdmistrativeDivisionsData,
  readAdministrativeDivisionsData,
  clearSource,
} from '@/utils/common.js';
import { getItem, setItem } from '@/utils/storage/sessionStorage.js';
import { onUnmounted } from 'vue';

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const fold = ref(false);

const data = ref([]);

const loading = ref(false);
const cgcs2000 = getItem('cgcs2000');

let map = null;
let source = null;
const provinceMap = new Map();
const cityMap = new Map();
const countyMap = new Map();
const geojsonReader = new GeoJSON();

const readTasks = [
  { url: './data/中国_省.geojson', type: 'province' },
  { url: './data/中国_市.geojson', type: 'city' },
  { url: './data/中国_县.geojson', type: 'county' },
];

const filterText = ref('');
const treeRef = ref();

const emits = defineEmits(['popup', 'dataLoaded']);

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

  if (cgcs2000) {
    data.value = cgcs2000;
  } else {
    loading.value = true;
    getAdmistrativeDivisionsData()
      .then((res) => {
        loading.value = false;
        data.value = res[0].children;
        setItem('cgcs2000', res[0].children);
      })
      .catch((err) => {
        loading.value = false;
        console.error(err);
      });
  }

  Promise.allSettled(
    readTasks.map((task) =>
      readAdministrativeDivisionsData(task.url).then((res) => ({
        type: task.type,
        features: res,
      })),
    ),
  )
    .then((results) => {
      emits('dataLoaded');
      results.forEach((result) => {
        handleAdministritiveData(result);
      });
    })
    .catch((err) => {
      console.error(err);
      emits('dataLoaded');
    });
}

function handleAdministritiveData(result) {
  if (result.status === 'fulfilled') {
    const {
      type,
      features: { features: fs },
    } = result.value;
    fs.forEach((f) => handleData(type, f));
  } else {
    console.error(`[${result.reason.type}] 数据加载失败`, result.reason);
  }
}

function handleData(type, f) {
  const {
    properties: { gb },
  } = f;
  if (type === 'province') {
    provinceMap.set(gb, f);
  } else if (type === 'city') {
    cityMap.set(gb, f);
  } else if (type === 'county') {
    countyMap.set(gb, f);
  }
}

async function handleNodeClick(data) {
  const { gb, name } = toRaw(data);
  let feature;
  if (String(gb).endsWith('0000')) {
    // console.log('这是一个省级编码');
    feature = provinceMap.get(gb);
  } else if (String(gb).endsWith('00') || String(gb).endsWith('000')) {
    // console.log('这是一个市级编码');
    feature = cityMap.get(gb);
  } else {
    // console.log('这是一个县级编码');
    feature = countyMap.get(gb);
  }
  showClickDivision(feature, name);
}

function showClickDivision(feature, name) {
  clearSource(source);
  const division = geojsonReader.readFeature(feature);
  division.setStyle(
    createPolygonStyle('rgba(0, 0, 255, 0.2)', 'rgb(0, 0, 255)', 1.25, name),
  );
  source.addFeature(division);
  map.getView().fit(division.getGeometry(), {
    duration: 300,
    padding: [20, 50 + 30 + 260, 20, 50 + 400],
  });
}

function handleFold() {
  fold.value = !fold.value;
}

onUnmounted(() => {
  clearSource(source);
  provinceMap.clear();
  cityMap.clear();
  countyMap.clear();
});
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
