export const CHINA_2000_EXTENT = [73.62, 16.7, 134.77, 53.56];

/**
 * 提取所有 checked 为 true 的节点 ID
 * @param {Array} data 树形数据数组
 * @returns {number[]} ID 数组
 */
export function getCheckedIds(data) {
  return data.reduce((acc, node) => {
    // 如果当前节点被选中，记录 ID
    if (node.checked) {
      acc.push(node.id);
    }
    // 如果有子节点，递归处理并将结果合并
    if (node.children && node.children.length > 0) {
      acc.push(...getCheckedIds(node.children));
    }
    return acc;
  }, []);
}
