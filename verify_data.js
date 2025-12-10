// 验证数据结构的测试脚本
import fs from 'fs/promises';

async function verifyData() {
  // 读取文件
  const data = JSON.parse(await fs.readFile('./navigator_output.json', 'utf8'));

  // 创建验证报告
  let report = '=== 数据结构验证报告 ===\n\n';

  // 基本数据结构验证
  report += '1. 基本数据结构验证\n';
  report += `- 包含groups字段: ${!!data.groups}\n`;
  report += `- 包含sites字段: ${!!data.sites}\n`;
  report += `- 包含configs字段: ${!!data.configs}\n`;
  report += `- groups数量: ${data.groups ? data.groups.length : 0}\n`;
  report += `- sites数量: ${data.sites ? data.sites.length : 0}\n`;
  report += `- 配置数量: ${data.configs ? Object.keys(data.configs).length : 0}\n\n`;

  // 分类验证
  report += '2. 分类验证\n';
  
  // 找出所有顶级分类（parent_id为null的分类）
  const topCategories = data.groups.filter(g => g.parent_id === null);
  
  topCategories.forEach(category => {
    const siteCount = data.sites.filter(s => s.group_id === category.id).length;
    report += `- ${category.name} (id: ${category.id}) 有 ${siteCount} 个网站\n`;
    
    // 查看该分类下的子分类
    const children = data.groups.filter(g => g.parent_id === category.id);
    if (children.length > 0) {
      report += `  - 子分类: ${children.map(c => c.name).join(', ')}\n`;
      children.forEach(child => {
        const childSiteCount = data.sites.filter(s => s.group_id === child.id).length;
        report += `    * ${child.name} 有 ${childSiteCount} 个网站\n`;
      });
    }
  });

  // 网站数据示例
  report += '\n3. 网站数据示例\n';
  const sampleSites = data.sites.slice(0, 5);
  sampleSites.forEach(site => {
    const group = data.groups.find(g => g.id === site.group_id);
    report += `- ${site.name} (${site.url}) - 分类: ${group ? group.name : '未知'}\n`;
  });

  // 保存报告到文件
  await fs.writeFile('./data_verification_report.txt', report, 'utf8');

  console.log('验证报告已生成，请查看 data_verification_report.txt 文件');
}

// 运行验证
verifyData().catch(error => {
  console.error('验证过程中出现错误:', error);
  process.exit(1);
});
