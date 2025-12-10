// 根据用户提供的新排序重新分配分类ID的脚本
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 主函数
async function reorderCategories() {
  // 读取当前的分类数据
  const data = JSON.parse(await fs.readFile(join(__dirname, './navigator_output.json'), 'utf8'));

// 用户提供的新分类排序
const newCategoryStructure = [
  {
    name: '实用工具',
    children: ['常用工具', '推荐工具', '常用网址', '效率工具', '短链生成工具', '指纹检测', 'SCRM工具', '筛号工具']
  },
  {
    name: 'AI工具',
    children: ['AI常用工具', 'AI办公工具', 'AI写作工具', 'AI视频工具', 'AI设计工具', 'AI编程工具']
  },
  {
    name: '跨境资讯',
    children: ['全球新闻', '中国论坛', '全球论坛', 'Affliate联盟']
  },
  {
    name: '跨境推广',
    children: ['社交媒体', '社交营销', '网红营销', 'EDM营销']
  },
  {
    name: '社媒资源',
    children: ['账号购买', '涨粉平台']
  },
  {
    name: '全球网络',
    children: ['全球VPS', '中国VPS', '全球IP代理', '域名注册']
  },
  {
    name: '全球接码',
    children: ['2FA短信验证码发送', '短信接码', '虚拟邮箱']
  },
  {
    name: '数字货币',
    children: ['区块链媒体', '财经新闻', '市场数据', 'NFT工具', '交易所', '钱包']
  },
  {
    name: '全球支付',
    children: ['跨境支付']
  },
  {
    name: 'Facebook',
    children: ['FB常用工具', 'FB申诉链接', 'FB官方资料', 'FB广告工具']
  },
  {
    name: 'Google',
    children: ['Google常用', '谷歌插件', '关键词工具', 'SEO工具']
  },
  {
    name: '广告工具',
    children: ['广告监测', '追踪系统', 'Cloak工具', '检测优化']
  },
  {
    name: '指纹浏览器',
    children: [] // 无次级分类
  },
  {
    name: '全球APP下载',
    children: ['社交app', '电商app', '常用app']
  },
  {
    name: '内容制作',
    children: ['Lander制作', '文案工具', '素材编辑', '图库网站', 'Logo设计', '视频下载']
  },
  {
    name: '技术交流',
    children: ['软件开发', '逆向安全', '主机交流']
  },
  {
    name: '引流工具',
    children: ['脚本工具', '云手机', '模拟器', '新机工具']
  },
  {
    name: '跨境电商',
    children: ['电商平台', '独立站', '选品分析', 'Deals平台']
  },
  {
    name: '跨境服务',
    children: ['广告代理', '常用ERP', '物流货代', '货源网站']
  }
];

// 创建旧ID到新ID的映射
const idMapping = {};
let newId = 1;

// 重新分配分类ID
const newGroups = [];

newCategoryStructure.forEach((topCategory, index) => {
  // 找到当前的顶级分类
  const currentTopCategory = data.groups.find(group => 
    group.name === topCategory.name && group.parent_id === null
  );
  
  if (!currentTopCategory) {
    console.error(`未找到顶级分类: ${topCategory.name}`);
    return;
  }
  
  // 保存旧ID到新ID的映射
  idMapping[currentTopCategory.id] = newId;
  
  // 创建新的顶级分类
  const newTopCategory = {
    id: newId,
    name: topCategory.name,
    order_num: index,
    parent_id: null
  };
  
  newGroups.push(newTopCategory);
  newId++;
  
  // 处理次级分类
  topCategory.children.forEach((childName, childIndex) => {
    // 找到当前的次级分类
    const currentChildCategory = data.groups.find(group => 
      group.name === childName && group.parent_id === currentTopCategory.id
    );
    
    if (!currentChildCategory) {
      console.error(`未找到次级分类: ${childName} (父分类: ${topCategory.name})`);
      return;
    }
    
    // 保存旧ID到新ID的映射
    idMapping[currentChildCategory.id] = newId;
    
    // 创建新的次级分类
    const newChildCategory = {
      id: newId,
      name: childName,
      order_num: index * 10 + childIndex,
      parent_id: idMapping[currentTopCategory.id]
    };
    
    newGroups.push(newChildCategory);
    newId++;
  });
});

// 更新所有sites的group_id
const updatedSites = data.sites.map(site => {
  if (idMapping[site.group_id]) {
    return {
      ...site,
      group_id: idMapping[site.group_id]
    };
  }
  return site;
});

// 为每个分组添加嵌套的sites数组
const groupsWithNestedSites = newGroups.map(group => {
  // 找到属于该分组的所有网站
  const groupSites = updatedSites.filter(site => site.group_id === group.id);
  return {
    ...group,
    sites: groupSites // 添加嵌套的sites数组
  };
});

// 创建更新后的数据结构
const updatedData = {
  groups: groupsWithNestedSites,
  sites: updatedSites,
  configs: data.configs // 保留原有configs数据
};

// 保存更新后的数据
await fs.writeFile(join(__dirname, './navigator_output_reordered.json'), JSON.stringify(updatedData, null, 2), 'utf8');

console.log('分类ID重新分配完成！');
console.log(`共处理 ${newGroups.length} 个分类和 ${updatedSites.length} 个网站。`);
console.log('更新后的文件已保存为 navigator_output_reordered.json');
}

// 调用主函数
reorderCategories().catch(error => {
  console.error('执行过程中出现错误：', error);
  process.exit(1);
});
