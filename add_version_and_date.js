// 添加版本信息和导出日期的脚本
import fs from 'fs/promises';

async function addVersionAndDate() {
  try {
    // 读取navigator_output.json文件
    const data = JSON.parse(await fs.readFile('./navigator_output.json', 'utf8'));
    
    // 添加version和exportDate字段
    data.version = '1.0';
    data.exportDate = new Date().toISOString();
    
    // 保存修改后的文件
    await fs.writeFile('./navigator_output.json', JSON.stringify(data, null, 2), 'utf8');
    
    console.log('已成功添加version和exportDate字段');
    console.log(`添加的版本信息: ${data.version}`);
    console.log(`添加的导出日期: ${data.exportDate}`);
  } catch (error) {
    console.error('添加字段时出现错误:', error);
    process.exit(1);
  }
}

// 运行脚本
addVersionAndDate();