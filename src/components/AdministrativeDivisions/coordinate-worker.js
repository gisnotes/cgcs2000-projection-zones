import gcoord from 'gcoord';

// 监听主线程发送的消息
self.onmessage = function (event) {
  const { feature } = event.data;
  const transformedFeature = transformFeature(feature);
  // 将转换后的结果发送回主线程
  self.postMessage({ transformedFeature });
};

/**
 * 转换整个 Feature 对象的几何坐标
 * @param {Object} feature 原始 GeoJSON Feature
 * @returns {Object} 坐标转换后的新 Feature
 */
function transformFeature(feature) {
  // 深拷贝，避免直接修改原始数据（可选）
  const newFeature = fastClone(feature);

  if (newFeature.geometry && newFeature.geometry.coordinates) {
    // 递归转换所有层级的坐标
    newFeature.geometry.coordinates = transformCoordinates(
      newFeature.geometry.coordinates,
    );
  }

  return newFeature;
}

function transformCoordinates(coordinates) {
  if (typeof coordinates[0] === 'number') {
    return convertGCJ02ToWgs84(coordinates);
  }
  // 如果是嵌套数组，递归处理下一层
  return coordinates.map((coord) => transformCoordinates(coord));
}

function convertGCJ02ToWgs84(lngLat) {
  return gcoord.transform(lngLat, gcoord.GCJ02, gcoord.WGS84);
}

/**
 * 原文链接：https://mp.weixin.qq.com/s/CPuNlooT-u3MM4ZR1ecFpQ
 * zero-deps deep clone
 * @param {*} value 任意值
 * @returns {*} 深拷贝结果
 */
export function fastClone(value) {
  // 1. 检测 structuredClone 是否可用
  if (typeof structuredClone === 'function') {
    const transfers = []; // 2. 递归收集所有 ArrayBuffer（含嵌套）

    (function collectBuffer(val) {
      if (val instanceof ArrayBuffer) {
        transfers.push(val);
        return;
      }
      if (Array.isArray(val)) {
        val.forEach(collectBuffer);
        return;
      }
      if (val && typeof val === 'object') {
        if (val instanceof Map) {
          val.forEach((v) => collectBuffer(v));
        } else if (val instanceof Set) {
          val.forEach((v) => collectBuffer(v));
        } else {
          Object.values(val).forEach(collectBuffer);
        }
      }
    })(value); // 3. 执行克隆 + 转移

    return structuredClone(value, { transfer: transfers });
  }

  // 4. 降级方案（可选：引入 lodash/cloneDeep 或 JSON 粗略拷贝）
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    throw new Error(
      'fastClone: 当前环境不支持 structuredClone，且对象不可序列化',
    );
  }
}
