<template>
  <div class="click-popover">
    <!-- 图层列表 -->
    <transition name="el-fade-in">
      <div class="content" v-show="show">
        <slot name="content"></slot>
      </div>
    </transition>
    <!-- 图标按钮 -->
    <div class="icon" @click="handleClose">
      <slot name="icon"></slot>
    </div>
  </div>
</template>

<script setup>
const show = ref(false);

const emits = defineEmits(['close']);
function handleClose() {
  show.value = !show.value;
  if (!show.value) {
    emits('close');
  }
}
</script>

<style lang="scss" scoped>
.click-popover {
  position: relative;
  display: flex;
  align-items: flex-end;
  z-index: 2;

  .icon {
    width: 30px;
    height: 30px;
    border: 1px solid white;
    border-radius: 4px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .content {
    margin-right: 10px;
    border-radius: 4px;
    position: absolute;
    right: 32px;
    bottom: 0;
  }
}
</style>
