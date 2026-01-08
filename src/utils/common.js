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
