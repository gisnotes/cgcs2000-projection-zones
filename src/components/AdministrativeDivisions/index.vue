<template>
  <div class="admin-divisions" :class="{ 'is-folded': isCollapsedLayout }">
    <transition name="chip-right">
      <button
        type="button"
        class="panel-toggle-chip"
        title="展开行政区划"
        v-show="fold"
        @click="handleFold">
        <span class="chip-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span class="chip-label">行政区划</span>
        <i-ep-ArrowLeft class="chip-arrow" />
      </button>
    </transition>

    <transition
      name="panel-right"
      @before-enter="isCollapsedLayout = false"
      @after-leave="isCollapsedLayout = true">
      <div class="division-panel" v-show="!fold">
        <div class="header">
          <div class="header-brand">
            <span class="brand-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span class="title">行政区划</span>
          </div>
          <div class="header-actions">
            <button
              v-if="mapExtentStore.extent.length"
              type="button"
              class="clear-btn"
              title="清除已选区划"
              @click="handleClearDivision">
              清除
            </button>
            <button
              type="button"
              class="icon-btn"
              title="收起面板"
              @click="handleFold">
              <i-ep-Expand />
            </button>
          </div>
        </div>

        <el-input
          v-model="filterText"
          class="filter-input"
          size="small"
          placeholder="搜索省 / 市 / 县区..."
          clearable>
          <template #prefix>
            <i-ep-Search />
          </template>
        </el-input>

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
                <span class="node-label" :title="node.label">{{
                  node.label
                }}</span>
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
const isCollapsedLayout = ref(false);
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

  try {
    // 优先从本地数据库获取 (此时拿到的是标准的 GeoJSON 对象)
    featureGeoJSON = await getItem(storageKey);

    // 若数据库没有，则请求接口
    let type = '';
    if (!featureGeoJSON) {
      loading.value = true;
      if (String(gb).endsWith('0000')) {
        type = '省';
      } else if (String(gb).endsWith('00') || String(gb).endsWith('000')) {
        type = '市';
      } else {
        type = '县';
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
    createPolygonStyle('rgba(37, 99, 235, 0.14)', '#2563eb', 2, name),
  );
  source.addFeature(division);

  const extent = division?.getGeometry()?.getExtent();
  if (extent?.length === 4) {
    mapExtentStore.updateName(name);
    mapExtentStore.updateExtent(extent);
    mapExtentStore.updateCenter(getCenter(extent));
    map.getView().fit(extent, {
      duration: 300,
      padding: [40, 310, 64, 400],
    });
  }
}

function handleClearDivision() {
  clearSource(source);
  treeRef.value?.setCurrentKey(null);
  mapExtentStore.clear();
}

function handleFold() {
  fold.value = !fold.value;
}

onUnmounted(() => {
  clearSource(source);
  mapExtentStore.clear();
  // 组件销毁时彻底关闭线程
  if (worker) {
    worker.terminate();
    worker = null;
  }
});
</script>

<style lang="scss" scoped>
.admin-divisions {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 0 1 480px;
  min-height: 0;
  max-height: 100%;
  pointer-events: none;
  transition: flex-basis 0.24s cubic-bezier(0.22, 1, 0.36, 1);

  &.is-folded {
    flex: 0 0 36px;
    min-height: var(--control-height);
  }
}

.panel-toggle-chip {
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
  transform-origin: right center;
  pointer-events: auto;
  height: var(--control-height);
  padding: 0 12px 0 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--panel-bg);
  backdrop-filter: blur(14px) saturate(160%);
  border: var(--panel-border);
  border-radius: 999px;
  box-shadow: var(--panel-shadow-sm);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;

  .chip-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .chip-arrow {
    font-size: 12px;
    color: var(--text-muted);
    transition: transform 0.18s ease;
  }

  &:hover {
    color: var(--brand-primary);
    transform: translateY(-1px);
    box-shadow: var(--panel-shadow);

    .chip-arrow {
      color: var(--brand-primary);
      transform: translateX(-2px);
    }
  }
}

.division-panel {
  width: 280px;
  height: 100%;
  min-height: 0;
  transform-origin: top right;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 14px;
  border-radius: var(--panel-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(14px) saturate(160%);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    margin-bottom: 10px;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;

    .brand-badge {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border-radius: 8px;
      background: rgba(37, 99, 235, 0.1);
      color: var(--brand-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .clear-btn {
    height: 24px;
    padding: 0 8px;
    border: none;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(239, 68, 68, 0.15);
    }
  }

  .icon-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--brand-primary);
      background: var(--brand-primary-soft);
    }
  }

  .filter-input {
    margin-bottom: 8px;
    flex-shrink: 0;

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

  .tree {
    flex: 1;
    min-height: 0;
    height: auto;
    overflow: hidden auto;
    padding-right: 2px;

    :deep(.el-tree) {
      background: transparent;
      font-size: 12.5px;
      color: var(--text-primary);
      --el-tree-node-content-height: 30px;
      --el-tree-node-hover-bg-color: rgba(15, 23, 42, 0.045);
    }

    :deep(.el-tree-node__content) {
      border-radius: 7px;
      padding-right: 8px;
      transition:
        background-color 0.14s ease,
        color 0.14s ease;
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: #eff6ff;
      color: var(--brand-primary);
      font-weight: 600;
    }

    :deep(.el-tree-node__expand-icon) {
      color: var(--text-muted);
      font-size: 12px;
    }
  }

  .custom-tree-node {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;

    .node-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.panel-right-enter-active {
  transition:
    opacity 0.26s cubic-bezier(0.22, 1, 0.36, 1) 0.05s,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.05s;
}

.panel-right-leave-active {
  transition:
    opacity 0.18s cubic-bezier(0.4, 0, 1, 1),
    transform 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.panel-right-enter-from,
.panel-right-leave-to {
  opacity: 0;
  transform: translate3d(12px, -6px, 0) scale(0.92);
}

.chip-right-enter-active {
  transition:
    opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1) 0.09s,
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1) 0.09s;
}

.chip-right-leave-active {
  transition:
    opacity 0.14s ease-out,
    transform 0.14s ease-out;
}

.chip-right-enter-from {
  opacity: 0;
  transform: translate3d(10px, 0, 0) scale(0.9);
}

.chip-right-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
