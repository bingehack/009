import fs from 'fs';

// 读取文件内容
const filePath = './navigator_output.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 获取所有分类
const groups = data.groups;

console.log('=== 修改前的分类状态 ===');

// 找出指纹浏览器分类
const fingerprintBrowser = groups.find(g => g.id === 63);

if (fingerprintBrowser) {
    console.log(`指纹浏览器 (ID: 63): parent_id = ${fingerprintBrowser.parent_id}`);
    
    // 修改：将指纹浏览器的parent_id设置为null，使其成为顶级分类
    fingerprintBrowser.parent_id = null;
    console.log(`修改后: 指纹浏览器 (ID: 63) -> parent_id = ${fingerprintBrowser.parent_id} (顶级分类)`);
}

// 保存修改后的数据
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('\n=== 修改完成 ===');
console.log('修改后的文件已保存到 navigator_output.json');

// 验证修改结果
console.log('\n=== 验证修改结果 ===');
const updatedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const updatedFingerprintBrowser = updatedData.groups.find(g => g.id === 63);

if (updatedFingerprintBrowser) {
    console.log(`指纹浏览器 (ID: 63): parent_id = ${updatedFingerprintBrowser.parent_id}`);
    
    // 检查是否有子分类
    const childCount = updatedData.groups.filter(g => g.parent_id === 63).length;
    console.log(`指纹浏览器 (ID: 63) 的子分类数量: ${childCount}`);
}
