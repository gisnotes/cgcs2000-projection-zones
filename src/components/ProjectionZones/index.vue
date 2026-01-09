<template>
  <div>
    <transition name=".el-zoom-in-center">
      <div class="projection-zones-fold" v-show="fold" @click="handleFold">
        <i-ep-Expand />
      </div>
    </transition>
    <transition name=".el-zoom-in-center">
      <div class="projection-zones" v-show="!fold">
        <div class="header">
          <div class="title">投影分带</div>
          <div class="fold" @click="handleFold">
            <i-ep-Fold />
          </div>
        </div>
        <el-divider style="margin: 10px 0"></el-divider>
        <el-tabs v-model="activeName" type="card">
          <el-tab-pane label="CGCS 2000" name="cgcs2000">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_2000"
              :visible="activeName === 'cgcs2000'" />
          </el-tab-pane>
          <el-tab-pane label="3度分带-无带号" name="degree3WithoutZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_3_DEGREE_NO_ZONE"
              :visible="activeName === 'degree3WithoutZone'" />
          </el-tab-pane>
          <el-tab-pane label="3度分带-有带号" name="degree3WithZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_3_DEGREE"
              :visible="activeName === 'degree3WithZone'" />
          </el-tab-pane>
          <el-tab-pane label="6度分带-无带号" name="degree6WithoutZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_6_DEGREE_NO_ZONE"
              :visible="activeName === 'degree6WithoutZone'" />
          </el-tab-pane>
          <el-tab-pane label="6度分带-有带号" name="degree6WithZone">
            <zones-render
              v-bind="$attrs"
              :data="PROJECTIONS_6_DEGREE"
              :visible="activeName === 'degree6WithZone'" />
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

const fold = ref(false);
const activeName = ref('degree3WithoutZone');

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
  opacity: 0.9;
}

.projection-zones {
  width: 390px;
  overflow: hidden;
  flex-direction: column;
  padding-bottom: 10px;
  padding: 10px;

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
