import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径和目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 定义要检查的JSON文件路径
const jsonFilePath = join(__dirname, 'navigator_output.json');

// 使用异步IIFE执行检查
(async () => {
    console.log('正在检查JSON文件格式...');
    console.log(`文件路径: ${jsonFilePath}`);
    
    try {
        // 检查文件是否存在
        await fs.access(jsonFilePath);
        
        // 获取文件信息
        const fileStats = await fs.stat(jsonFilePath);
        console.log(`文件大小: ${Math.round(fileStats.size / 1024)} KB`);
        console.log(`修改时间: ${fileStats.mtime}`);
        
        // 尝试读取并解析JSON文件
        const fileContent = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        console.log('✅ JSON格式有效');
        
        // 检查必要的字段
        if (jsonData.version) {
            console.log(`版本: ${jsonData.version}`);
        } else {
            console.error('❌ 缺少version字段');
        }
        
        if (jsonData.exportDate) {
            console.log(`导出日期: ${jsonData.exportDate}`);
        } else {
            console.error('❌ 缺少exportDate字段');
        }
        
        if (Array.isArray(jsonData.groups)) {
            console.log(`分类数量: ${jsonData.groups.length}`);
        } else {
            console.error('❌ groups字段不是数组');
        }
        
        if (Array.isArray(jsonData.sites)) {
            console.log(`网站数量: ${jsonData.sites.length}`);
        } else {
            console.error('❌ sites字段不是数组');
        }
        
        if (jsonData.configs) {
            console.log(`配置数量: ${Object.keys(jsonData.configs).length}`);
        } else {
            console.error('❌ 缺少configs字段');
        }
        
        console.log('\n✅ 所有检查通过，文件格式完整有效');
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ 错误: 文件不存在');
        } else if (error instanceof SyntaxError) {
            console.error('❌ JSON格式无效');
            console.error(`错误信息: ${error.message}`);
            console.log(`错误位置: 行 ${error.lineNumber}, 列 ${error.columnNumber}`);
        } else {
            console.error('❌ 检查过程中发生错误');
            console.error(`错误信息: ${error.message}`);
        }
        process.exit(1);
    }
})();