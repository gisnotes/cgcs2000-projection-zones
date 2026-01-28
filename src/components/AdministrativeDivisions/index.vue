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
      <div
        class="tree"
        v-loading.lock="loading"
        element-loading-text="数据加载中...">
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
  clearSource,
  createPolygonStyle,
  getAdmistrativeBoundsData,
  getAdmistrativeDivisionsData,
} from '@/utils/common.js';
import { onUnmounted, inject, ref, watch, toRaw } from 'vue';
import { setItem, getItem } from '@/utils/storage/localForage';

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const fold = ref(false);
const data = ref([]);
const loading = ref(false);

let map = null;
let source = null;
const geojsonReader = new GeoJSON();

const filterText = ref('');
const treeRef = ref();

// 保持 Worker 引用
let worker = null;

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

/**
 * 初始化 Worker
 */
function initWorker() {
  if (!worker) {
    worker = new Worker(new URL('./coordinate-worker.js', import.meta.url), {
      type: 'module',
    });
  }
}

/**
 * 封装 Worker 通信为 Promise
 */
function requestTransform(feature) {
  initWorker();
  return new Promise((resolve) => {
    worker.onmessage = (e) => {
      resolve(e.data.transformedFeature);
    };
    worker.postMessage({ feature });
  });
}

async function init() {
  source = addBizLayer(map, undefined, 'administrative-divisions', 100);
  const cachedTree = await getItem('cgcs2000');

  if (cachedTree) {
    data.value = cachedTree;
  } else {
    loading.value = true;
    try {
      const res = await getAdmistrativeDivisionsData();
      // 注意：这里根据你接口返回的数据结构调整 (res.children 或 res[0].children)
      const treeData = res.children || (res[0] && res[0].children);
      data.value = treeData;
      await setItem('cgcs2000', treeData);
    } catch (err) {
      console.error('初始化行政区划树失败:', err);
    } finally {
      loading.value = false;
    }
  }
}

async function handleNodeClick(nodeData) {
  const { gb, name } = toRaw(nodeData);
  const code = String(gb).slice(3);
  const storageKey = `bound_${code}`;

  let feature;

  try {
    // 1. 优先从本地数据库获取
    feature = await getItem(storageKey);

    if (!feature) {
      loading.value = true;
      // 2. 数据库没有，则请求接口
      const rawFeature = await getAdmistrativeBoundsData(code);

      // 3. 此时坐标是 GCJ02，通过 Worker 转换
      feature = await requestTransform(rawFeature);

      // 4. 将转换后的 WGS84 数据存入数据库，下次直接使用
      await setItem(storageKey, feature);
      loading.value = false;
    }

    // 5. 地图渲染
    if (feature) {
      showClickDivision(feature, name);
    }
  } catch (error) {
    console.error('处理行政区划点击失败:', error);
    loading.value = false;
  }
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
  // 组件销毁时彻底关闭线程
  if (worker) {
    worker.terminate();
    worker = null;
  }
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
