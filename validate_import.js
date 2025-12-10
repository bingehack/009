// 验证导入数据格式的脚本
import fs from 'fs/promises';

async function validateImportData() {
  try {
    // 读取navigator_output.json文件
    const data = JSON.parse(await fs.readFile('./navigator_output.json', 'utf8'));
    
    const errors = [];
    
    // 验证version
    if (!data.version || typeof data.version !== 'string') {
      errors.push('缺少或无效的版本信息');
    } else {
      console.log('✓ 版本信息验证通过:', data.version);
    }
    
    // 验证exportDate
    if (!data.exportDate || typeof data.exportDate !== 'string') {
      errors.push('缺少或无效的导出日期');
    } else {
      console.log('✓ 导出日期验证通过:', data.exportDate);
    }
    
    // 验证groups
    if (!Array.isArray(data.groups)) {
      errors.push('groups必须是数组');
    } else {
      console.log('✓ groups数组验证通过，包含', data.groups.length, '个分类');
    }
    
    // 验证sites
    if (!Array.isArray(data.sites)) {
      errors.push('sites必须是数组');
    } else {
      console.log('✓ sites数组验证通过，包含', data.sites.length, '个网站');
    }
    
    // 验证configs
    if (!data.configs || typeof data.configs !== 'object') {
      errors.push('configs必须是对象');
    } else {
      console.log('✓ configs对象验证通过，包含', Object.keys(data.configs).length, '个配置');
    }
    
    // 输出验证结果
    if (errors.length > 0) {
      console.log('\n❌ 验证失败，发现以下错误:');
      errors.forEach(error => console.log('-', error));
      process.exit(1);
    } else {
      console.log('\n✅ 所有验证都通过了！文件可以成功导入。');
    }
  } catch (error) {
    console.error('验证过程中出现错误:', error);
    process.exit(1);
  }
}

// 运行验证
validateImportData();