import axios from 'axios';
import { Vector as VectorSource } from 'ol/source.js';
import { VectorImage as VectorLayer } from 'ol/layer.js';
import { Style, Fill, Stroke, Text } from 'ol/style.js';
import TopoJSON from 'ol/format/TopoJSON';
import GeoJSON from 'ol/format/GeoJSON';

const topojsonFormat = new TopoJSON();
const geojsonFormat = new GeoJSON();

/**
 * 通过图层name属性来获得图层对象
 * 注：若map为undefined或者无法查找到图层的情况下都会返回undefined
 *
 * @param map 地图对象
 * @param name 图层名称
 * @returns 图层对象
 */
export function getLayerByName(map, name) {
  return map
    ? map
        .getLayers()
        .getArray()
        .find((lyr) => lyr.get('name') === name)
    : undefined;
}

export function clearSource(source) {
  if (source?.getFeatures()?.length > 0) {
    source.clear();
  }
}

export function getAdmistrativeDivisionsData() {
  return new Promise((resolve, reject) => {
    axios
      .get('https://cloudcenter.tianditu.gov.cn/api/portal/region/menu')
      .then((response) => {
        if (response.data.status == 200) {
          resolve(response.data.data?.length ? response.data.data[0] : []);
        } else {
          resolve([]);
        }
      })
      .catch((error) => {
        ElMessage({
          message: '请求失败：' + error.message,
          type: 'error',
        });
        reject(error);
      });
  });
}

export function readAdministrativeDivisionsData(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        ElMessage({
          message: '请求失败：' + error.message,
          type: 'error',
        });
        reject(error);
      });
  });
}

export function readAdministrativeDivisionsDataFromGb(url, gb) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        const data = response.data;
        if (!data) {
          resolve(null);
          return;
        }

        try {
          // 1. 读取完整 TopoJSON 解析为 Feature 数组
          const features = topojsonFormat.readFeatures(data);

          // 2. 查找匹配 gb 的 Feature 实例
          const targetOlFeature = features.find((f) => f.get('gb') === gb);

          if (targetOlFeature) {
            // 3. 将找到的 Feature 转换为标准 GeoJSON 纯文本对象
            // 这样既脱离了 TopoJSON 的 arcs 依赖，又完美支持存入 IndexedDB/localStorage
            const geojsonObj =
              geojsonFormat.writeFeatureObject(targetOlFeature);
            resolve(geojsonObj);
          } else {
            resolve(null);
          }
        } catch (error) {
          ElMessage({
            message: 'TopoJSON 解析失败:' + error.message,
            type: 'error',
          });
          resolve(null);
        }
      })
      .catch((error) => {
        ElMessage({
          message: '请求失败：' + error.message,
          type: 'error',
        });
        reject(error);
      });
  });
}

export function addBizLayer(map, style, lyrName, zIndex, lyrVisible = true) {
  const source = new VectorSource({ wrapX: false });
  map.addLayer(
    new VectorLayer({
      source,
      style,
      properties: {
        name: lyrName,
      },
      zIndex,
      visible: lyrVisible,
    }),
  );
  return source;
}

export function createPolygonStyle(fillColor, strokeColor, strokeWidth, text) {
  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth,
    }),
    text:
      text && text !== '境界线'
        ? new Text({
            text,
            font: '12px sans-serif',
            fill: new Fill({
              color: 'white',
            }),
            backgroundFill: new Fill({
              color: 'red',
            }),
            padding: [2, 2, 2, 2],
          })
        : undefined,
  });
}

export function getAdmistrativeBoundsData(code) {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://geo.datav.aliyun.com/areas_v3/bound/${code}.json`)
      .then((response) => {
        resolve(
          response.data.features?.length ? response.data.features[0] : [],
        );
      })
      .catch((error) => {
        ElMessage({
          message: '请求失败：' + error.message,
          type: 'error',
        });
        reject(error);
      });
  });
}
