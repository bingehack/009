// 将常用app和电商app的数据添加到navigator_output.json
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取文件的辅助函数
async function readJsonFile(filePath) {
  const absolutePath = resolve(__dirname, filePath);
  const content = await fs.readFile(absolutePath, 'utf8');
  return JSON.parse(content);
}

// 写入文件的辅助函数
async function writeJsonFile(filePath, data) {
  const absolutePath = resolve(__dirname, filePath);
  await fs.writeFile(absolutePath, JSON.stringify(data, null, 2), 'utf8');
}

// 主函数
async function addAppSites() {
  try {
    // 读取现有数据
    const navigatorData = await readJsonFile('navigator_output.json');

    // 读取新数据
    const commonApps = await readJsonFile('常用app_data.json');
    const ecommerceApps = await readJsonFile('电商app_data.json');

// 定义分类ID
const COMMON_APPS_GROUP_ID = 67;
const ECOMMERCE_APPS_GROUP_ID = 66;

// 获取当前最大ID和order_num
const currentMaxId = Math.max(...navigatorData.sites.map(site => site.id));
const currentMaxOrderNum = Math.max(...navigatorData.sites.map(site => site.order_num));

// 转换数据格式
function transformAppData(appData, groupId, startId, startOrderNum) {
  let currentId = startId;
  let currentOrderNum = startOrderNum;
  
  return appData.map(app => ({
    id: ++currentId,
    group_id: groupId,
    name: app.name,
    url: app.official_website,
    icon: `https://www.faviconextractor.com/favicon/${new URL(app.official_website).hostname}?larger=true`,
    description: app.description,
    notes: '',
    order_num: ++currentOrderNum,
    is_public: 1, // 默认公开
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }));
}

// 转换新数据
const transformedCommonApps = transformAppData(commonApps, COMMON_APPS_GROUP_ID, currentMaxId, currentMaxOrderNum);
const transformedEcommerceApps = transformAppData(ecommerceApps, ECOMMERCE_APPS_GROUP_ID, currentMaxId + transformedCommonApps.length, currentMaxOrderNum + transformedCommonApps.length);

// 添加到全局sites数组
const updatedSites = [...navigatorData.sites, ...transformedCommonApps, ...transformedEcommerceApps];

// 更新嵌套在分组中的sites数组
const updatedGroups = navigatorData.groups.map(group => {
  if (group.id === COMMON_APPS_GROUP_ID) {
    return {
      ...group,
      sites: [...group.sites, ...transformedCommonApps]
    };
  } else if (group.id === ECOMMERCE_APPS_GROUP_ID) {
    return {
      ...group,
      sites: [...group.sites, ...transformedEcommerceApps]
    };
  }
  return group;
});

// 更新数据结构
const updatedData = {
  ...navigatorData,
  groups: updatedGroups,
  sites: updatedSites
};

// 保存更新后的数据
await writeJsonFile('navigator_output.json', updatedData);

console.log('数据添加完成！');
console.log(`添加了 ${transformedCommonApps.length} 个常用app网站`);
console.log(`添加了 ${transformedEcommerceApps.length} 个电商app网站`);
console.log(`新的网站总数: ${updatedSites.length}`);
  } catch (error) {
    console.error('添加网站数据时出错:', error);
  }
}

// 调用主函数
addAppSites();
