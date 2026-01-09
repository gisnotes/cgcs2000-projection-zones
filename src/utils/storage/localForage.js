import localforage from 'localforage'

/**
 * 存储数据
 * @param {String} key 键名
 * @param {Any} value 值（支持对象、数组、Blob等，无需手动序列化）
 */
export function setItem(key, value) {
  return new Promise(function (resolve, reject) {
    localforage.setItem(key, value)
      .then(function (res) {
        resolve(res);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

/**
 * 获取数据
 * @param {String} key 键名
 */
export function getItem(key) {
  return new Promise(function (resolve, reject) {
    localforage.getItem(key)
      .then(function (res) {
        resolve(res);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

/**
 * 删除单个数据
 * @param {String} key 键名
 */
export function removeItem(key) {
  return new Promise(function (resolve, reject) {
    localforage.removeItem(key)
      .then(function () {
        resolve(true);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

/**
 * 清空所有数据
 */
export function removeAllItem() {
  return new Promise(function (resolve, reject) {
    localforage.clear()
      .then(function () {
        resolve(true);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}
