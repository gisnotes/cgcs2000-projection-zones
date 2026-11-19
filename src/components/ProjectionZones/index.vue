<template>
  <div class="projection-zones-wrap">
    <transition name="chip-left">
      <button
        type="button"
        class="panel-toggle-chip"
        title="展开投影分带"
        v-show="fold"
        @click="handleFold">
        <span class="chip-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4.2" ry="9" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </span>
        <span class="chip-label">投影分带</span>
        <i-ep-ArrowRight class="chip-arrow" />
      </button>
    </transition>

    <transition name="panel-left">
      <div class="projection-zones" v-show="!fold">
        <div class="header">
          <div class="header-brand">
            <span class="brand-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="4.2" ry="9" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            </span>
            <span class="title">CGCS2000 投影分带</span>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="layer-toggle-btn"
              :class="{ active: showZones }"
              title="显示/隐藏分度带图层"
              @click="showZones = !showZones">
              <svg
                v-if="showZones"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.4 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.6 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
              <span>{{ showZones ? '图层开' : '图层关' }}</span>
            </button>
            <button
              type="button"
              class="icon-btn"
              title="收起面板"
              @click="handleFold">
              <i-ep-Fold />
            </button>
          </div>
        </div>

        <div class="zone-tabs" role="tablist" aria-label="投影分带类型">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            type="button"
            role="tab"
            :aria-selected="activeName === tab.name"
            class="zone-tab"
            :class="{ active: activeName === tab.name }"
            @click="activeName = tab.name">
            {{ tab.label }}
          </button>
        </div>

        <div class="zone-panels">
          <zones-render
            v-for="tab in tabs"
            :key="tab.name"
            v-show="activeName === tab.name"
            v-bind="$attrs"
            :data="tab.data"
            :name="tab.name"
            :subtitle="tab.subtitle"
            :active="activeName === tab.name"
            :visible="activeName === tab.name && showZones" />
        </div>
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

const tabs = [
  {
    name: 'cgcs2000',
    label: '2000地理',
    subtitle: '地理坐标系 · 经纬度',
    data: PROJECTIONS_2000,
  },
  {
    name: 'degree3WithoutZone',
    label: '3°无带号',
    subtitle: '3度分带 · 无带号',
    data: PROJECTIONS_3_DEGREE_NO_ZONE,
  },
  {
    name: 'degree3WithZone',
    label: '3°有带号',
    subtitle: '3度分带 · 有带号',
    data: PROJECTIONS_3_DEGREE,
  },
  {
    name: 'degree6WithoutZone',
    label: '6°无带号',
    subtitle: '6度分带 · 无带号',
    data: PROJECTIONS_6_DEGREE_NO_ZONE,
  },
  {
    name: 'degree6WithZone',
    label: '6°有带号',
    subtitle: '6度分带 · 有带号',
    data: PROJECTIONS_6_DEGREE,
  },
];

function handleFold() {
  fold.value = !fold.value;
}
</script>

<style lang="scss" scoped>
.projection-zones-wrap {
  position: absolute;
  top: var(--edge-gap);
  left: var(--edge-gap);
  z-index: 3;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.panel-toggle-chip {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  transform-origin: left center;
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
      transform: translateX(2px);
    }
  }
}

.projection-zones {
  width: 364px;
  max-height: min(560px, calc(100vh - 196px));
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  padding: 14px;
  overflow: hidden;
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
    margin-bottom: 12px;
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
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.28);

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
      white-space: nowrap;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .layer-toggle-btn {
    height: 28px;
    padding: 0 9px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 999px;
    background: var(--panel-subtle-bg);
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.18s ease;

    svg {
      width: 13px;
      height: 13px;
    }

    &:hover {
      background: #e2e8f0;
      color: var(--text-primary);
    }

    &.active {
      background: #eff6ff;
      color: var(--brand-primary);
      border-color: rgba(37, 99, 235, 0.25);

      &:hover {
        background: #dbeafe;
      }
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

  .zone-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 3px;
    padding: 3px;
    background: var(--panel-subtle-bg);
    border-radius: 10px;
    flex-shrink: 0;
    margin-bottom: 10px;
  }

  .zone-tab {
    height: 28px;
    padding: 0 4px;
    border: none;
    border-radius: 7px;
    background: transparent;
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover:not(.active) {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.5);
    }

    &.active {
      background: #ffffff;
      color: var(--brand-primary);
      font-weight: 600;
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.1),
        0 1px 1px rgba(15, 23, 42, 0.04);
    }
  }

  .zone-panels {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

.panel-left-enter-active {
  transition:
    opacity 0.26s cubic-bezier(0.22, 1, 0.36, 1) 0.05s,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.05s;
}

.panel-left-leave-active {
  transition:
    opacity 0.18s cubic-bezier(0.4, 0, 1, 1),
    transform 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.panel-left-enter-from,
.panel-left-leave-to {
  opacity: 0;
  transform: translate3d(-12px, -6px, 0) scale(0.92);
}

.chip-left-enter-active {
  transition:
    opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1) 0.09s,
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1) 0.09s;
}

.chip-left-leave-active {
  transition:
    opacity 0.14s ease-out,
    transform 0.14s ease-out;
}

.chip-left-enter-from {
  opacity: 0;
  transform: translate3d(-10px, 0, 0) scale(0.9);
}

.chip-left-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
