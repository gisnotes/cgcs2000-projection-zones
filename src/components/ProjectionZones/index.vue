<template>
  <div>
    <transition name="el-zoom-in-center">
      <div
        class="projection-zones-fold"
        title="展开投影分带"
        v-show="fold"
        @click="handleFold">
        <i-ep-Expand />
      </div>
    </transition>
    <transition name="el-zoom-in-center">
      <div class="projection-zones" v-show="!fold">
        <div class="header">
          <div class="title">投影分带</div>
          <el-switch
            v-model="showZones"
            size="small"
            inline-prompt
            active-text="显示"
            inactive-text="隐藏"
            title="显示/隐藏分度带"
            style="margin-right: 8px" />
          <div class="fold" title="收起" @click="handleFold">
            <i-ep-Fold />
          </div>
        </div>
        <el-divider class="panel-divider" />
        <el-tabs v-model="activeName" type="card">
          <el-tab-pane label="CGCS2000" name="cgcs2000">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_2000"
              :name="'cgcs2000'"
              :active="activeName === 'cgcs2000'"
              :visible="activeName === 'cgcs2000' && showZones" />
          </el-tab-pane>
          <el-tab-pane label="3°无带号" name="degree3WithoutZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_3_DEGREE_NO_ZONE"
              :name="'degree3WithoutZone'"
              :active="activeName === 'degree3WithoutZone'"
              :visible="activeName === 'degree3WithoutZone' && showZones" />
          </el-tab-pane>
          <el-tab-pane label="3°有带号" name="degree3WithZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_3_DEGREE"
              :name="'degree3WithZone'"
              :active="activeName === 'degree3WithZone'"
              :visible="activeName === 'degree3WithZone' && showZones" />
          </el-tab-pane>
          <el-tab-pane label="6°无带号" name="degree6WithoutZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_6_DEGREE_NO_ZONE"
              :name="'degree6WithoutZone'"
              :active="activeName === 'degree6WithoutZone'"
              :visible="activeName === 'degree6WithoutZone' && showZones" />
          </el-tab-pane>
          <el-tab-pane label="6°有带号" name="degree6WithZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_6_DEGREE"
              :name="'degree6WithZone'"
              :active="activeName === 'degree6WithZone'"
              :visible="activeName === 'degree6WithZone' && showZones" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </transition>
  </div>
</template>

<script setup>
import {
  PROJECTIONS_2000,
  PROJECTIONS_6_DEGREE_NO_ZONE,
  PROJECTIONS_6_DEGREE,
  PROJECTIONS_3_DEGREE_NO_ZONE,
  PROJECTIONS_3_DEGREE,
} from './data.js';

const fold = defineModel('fold');

const activeName = ref('degree3WithoutZone');
const showZones = ref(true);

function handleFold() {
  fold.value = !fold.value;
}
</script>

<style lang="scss" scoped>
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
  position: absolute;
  top: var(--edge-gap);
  left: var(--edge-gap);
  z-index: 2;
  border-radius: var(--panel-radius);
  background: var(--panel-bg);
  backdrop-filter: blur(8px);
  border: var(--panel-border);
  box-shadow: var(--panel-shadow);
  display: flex;
}

.projection-zones {
  width: 356px;
  max-height: calc(100vh - 68px);
  overflow: hidden;
  flex-direction: column;
  padding: 12px;

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

  :deep(.el-tabs) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  :deep(.el-tabs__item) {
    padding: 0 10px;
    height: 30px;
    line-height: 30px;
    font-size: 12px;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
