<template>
  <div class="admin-divisions" :class="{ 'is-folded': fold }">
    <transition name="el-zoom-in-center">
      <div
        class="projection-zones-fold"
        title="展开行政区划"
        v-show="fold"
        @click="handleFold">
        <i-ep-Fold />
      </div>
    </transition>
    <transition name="el-zoom-in-center">
      <div class="projection-zones" v-show="!fold">
        <div class="header">
          <div class="title">行政区划</div>
          <div class="fold" title="收起" @click="handleFold">
            <i-ep-Expand />
          </div>
        </div>
        <el-divider class="panel-divider" />
        <el-input
          v-model="filterText"
          class="filter-input"
          size="small"
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
            <template #default="{ node }">
              <span class="custom-tree-node">
                <span :title="node.label">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import GeoJSON from 'ol/format/GeoJSON';
import {
  addBizLayer,
  clearSource,
  createPolygonStyle,
  readAdministrativeDivisionsDataFromGb,
  getAdmistrativeDivisionsData,
} from '@/utils/common.js';
import { onUnmounted, inject, ref, watch, toRaw } from 'vue';
import { setItem, getItem } from '@/utils/storage/localForage';
import { useMapExtentStore } from '@/stores/mapExtentStore.js';
import { getCenter } from 'ol/extent';

const mapExtentStore = useMapExtentStore();

const state = inject('state');
const isMapCreated = inject('isMapCreated');

const fold = ref(false);
const data = ref([]);
const loading = ref(false);

let map = null;
let source = null;
const geojsonReader = new GeoJSON();

const isDev = import.meta.env.DEV;

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

  let featureGeoJSON;
  let url = '';

  try {
    // 优先从本地数据库获取 (此时拿到的是标准的 GeoJSON 对象)
    featureGeoJSON = await getItem(storageKey);

    // 若数据库没有，则请求接口
    let type = '';
    if (!featureGeoJSON) {
      loading.value = true;
      if (String(gb).endsWith('0000')) {
        type = '省';
        // url = './data/中国_省.topojson';
      } else if (String(gb).endsWith('00') || String(gb).endsWith('000')) {
        type = '市';
        // url = './data/中国_市.topojson';
      } else {
        type = '县';
        // url = './data/中国_县.topojson';
      }
      const url = isDev
        ? `./data/中国_${type}.topojson`
        : `https://cdn.jsdelivr.net/gh/gisnotes/cgcs2000-projection-zones@main/public/data/中国_${type}.topojson`;
      featureGeoJSON = await readAdministrativeDivisionsDataFromGb(url, gb);
    }

    if (featureGeoJSON) {
      // 将标准的 GeoJSON 数据存入数据库
      await setItem(storageKey, featureGeoJSON);
      // 地图渲染
      showClickDivision(featureGeoJSON, name);
    } else {
      ElMessage({
        message: '未找到该行政区划数据',
        type: 'error',
      });
    }
  } catch (error) {
    console.error('处理行政区划点击失败:', error);
  } finally {
    loading.value = false;
  }
}

function showClickDivision(featureGeoJSON, name) {
  clearSource(source);

  // 使用 geojsonReader 读取要素
  const division = geojsonReader.readFeature(featureGeoJSON);

  division.setStyle(
    createPolygonStyle('rgba(0, 0, 255, 0.2)', 'rgb(0, 0, 255)', 1.25, name),
  );
  source.addFeature(division);

  const extent = division?.getGeometry()?.getExtent();
  if (extent?.length === 4) {
    mapExtentStore.updateExtent(extent);
    mapExtentStore.updateCenter(getCenter(extent));
    map.getView().fit(extent, {
      duration: 300,
      padding: [36, 300, 56, 390],
    });
  }
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
.admin-divisions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 0 1 480px;
  min-height: 0;
  max-height: 100%;

  &.is-folded {
    flex: 0 0 auto;
  }
}

.projection-zones-fold {
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;

  &:hover {
    color: #409eff;
  }
}

.projection-zones-fold,
.projection-zones {
  border-radius: var(--panel-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(8px);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);
  display: flex;
}

.projection-zones {
  width: 268px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    .title {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .fold {
      width: 28px;
      height: 28px;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;

      &:hover {
        color: #409eff;
        background: rgba(64, 158, 255, 0.08);
      }
    }
  }

  .panel-divider {
    margin: 8px 0;
    flex-shrink: 0;
  }

  .filter-input {
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  .tree {
    flex: 1;
    min-height: 0;
    height: auto;
    overflow: hidden auto;

    :deep(.el-tree) {
      background: transparent;
      font-size: 12px;
      --el-tree-node-content-height: 28px;
    }

    :deep(.el-tree-node__content) {
      border-radius: 4px;
    }
  }
}

/* 修改所有树节点的文字大小 */
:deep(.custom-tree-node .el-tree-node .el-tree-node .el-tree-node__label) {
  font-size: 12px !important;
}
</style>
