<script setup>
import { CopyDocument } from '@element-plus/icons-vue';
import { useClipboard } from '@vueuse/core';
import Overlay from 'ol/Overlay';

const props = defineProps({
  title: {
    type: String,
    default: '标题',
  },
  position: {
    type: Array,
    default: () => [],
  },
  offset: {
    type: Array,
    default: () => [0, -14],
  },
  autoPan: {
    type: Boolean,
    default: true,
  },
  // 属性相关
  propeties: {
    type: Array,
    default: () => [],
  },
  popupInfo: {
    type: Object,
    default: () => ({}),
  },
});

let popOverLay = null;
const popup = ref();
const emits = defineEmits(['close']);

const state = inject('state');
const isMapCreated = inject('isMapCreated');
const { copy } = useClipboard();

const getAutoPan = computed(() => {
  return props.autoPan
    ? {
        animation: {
          duration: 250,
        },
        margin: 30,
      }
    : props.autoPan;
});

const visibleProperties = computed(() => {
  const list = Array.isArray(props.propeties) ? props.propeties : [];
  return list.filter((prop) => {
    if (prop.optional) {
      const val = props.popupInfo?.[prop.key];
      return val !== undefined && val !== null && val !== '';
    }
    return true;
  });
});

watch(
  () => props.position,
  (val) => {
    if (popOverLay) {
      if (val && val.length) {
        popOverLay.setOffset(props.offset);
        popOverLay.setPosition(val);
      } else {
        popOverLay.setPosition(undefined);
      }
    }
  },
  { deep: true },
);

watch(isMapCreated, (isMapCreatedValue) => {
  if (isMapCreatedValue) {
    state.map.addOverlay(popOverLay);
  }
});

onMounted(() => {
  popOverLay = new Overlay({
    element: popup.value,
    offset: props.offset,
    autoPan: getAutoPan.value,
    positioning: 'bottom-center',
    properties: {
      name: 'popup',
    },
  });
  popOverLay.setOffset(props.offset);
  popOverLay.setPosition(undefined);
});

function close() {
  popOverLay?.setPosition(undefined);
  emits('close');
}

async function handleCopyCode(code) {
  await copy(String(code));
  ElMessage.success(`已复制 EPSG:${code}`);
}

async function handleCopyBounds(bounds) {
  await copy(JSON.stringify(bounds));
  ElMessage.success('已复制投影范围');
}

onBeforeUnmount(() => {
  popOverLay && popOverLay.setPosition(undefined);
});

defineExpose({
  close,
});
</script>

<template>
  <div class="popup" ref="popup">
    <div class="popup-header">
      <div class="popup-title-wrap">
        <span class="popup-dot" />
        <div class="popup-title" :title="title">
          {{ title }}
        </div>
      </div>
      <button
        type="button"
        class="popup-close"
        title="关闭弹窗"
        @click="close">
        <i-ep-close />
      </button>
    </div>

    <div class="popup-content">
      <div
        v-for="prop in visibleProperties"
        :key="prop.key || prop.val"
        class="popup-row">
        <span class="row-label">{{ prop.val }}</span>
        <div class="row-value">
          <template v-if="prop.key === 'code' && popupInfo[prop.key]">
            <span class="epsg-badge">EPSG:{{ popupInfo[prop.key] }}</span>
            <button
              type="button"
              class="mini-copy-btn"
              title="复制 EPSG 代码"
              @click="handleCopyCode(popupInfo[prop.key])">
              <el-icon><CopyDocument /></el-icon>
            </button>
          </template>

          <template v-else-if="Array.isArray(popupInfo[prop.key])">
            <span class="mono-text">
              [{{ popupInfo[prop.key].join(', ') }}]
            </span>
            <button
              type="button"
              class="mini-copy-btn"
              title="复制投影范围"
              @click="handleCopyBounds(popupInfo[prop.key])">
              <el-icon><CopyDocument /></el-icon>
            </button>
          </template>

          <template
            v-else-if="prop.key === 'centralMeridian' && popupInfo[prop.key]">
            <span class="cm-badge">{{ popupInfo[prop.key] }}</span>
          </template>

          <template v-else>
            <span class="plain-text">
              {{
                popupInfo[prop.key]
                  ? popupInfo[prop.key] + (prop.unit ? ' ' + prop.unit : '')
                  : '--'
              }}
            </span>
          </template>
        </div>
      </div>
    </div>

    <div class="popup-arrow" />
  </div>
</template>

<style lang="scss" scoped>
.popup {
  position: absolute;
  width: 344px;
  background: var(--panel-bg-solid);
  backdrop-filter: blur(14px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.08),
    0 16px 36px -6px rgba(15, 23, 42, 0.2),
    0 4px 12px -2px rgba(15, 23, 42, 0.08);
  transform: translate(-50%, -100%);
  border-radius: 14px;
}

.popup-arrow {
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: var(--panel-bg-solid);
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  transform: translateX(-50%) rotate(45deg);
  pointer-events: none;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--panel-divider);
  user-select: none;
}

.popup-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.popup-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
}

.popup-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popup-close {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text-primary);
    background: rgba(15, 23, 42, 0.06);
  }
}

.popup-content {
  max-height: 280px;
  overflow-y: auto;
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
}

.popup-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;

  & + .popup-row {
    border-top: 1px solid rgba(15, 23, 42, 0.05);
  }
}

.row-label {
  width: 72px;
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 20px;
}

.row-value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary);
  line-height: 20px;
}

.plain-text {
  word-break: break-word;
  font-weight: 500;
}

.mono-text {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  word-break: break-all;
}

.epsg-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  color: var(--brand-primary);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
}

.cm-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 6px;
  background: rgba(225, 29, 72, 0.08);
  border: 1px solid rgba(225, 29, 72, 0.18);
  color: #be123c;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
}

.mini-copy-btn {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
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
</style>
