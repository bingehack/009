import fs from 'fs';

// 读取文件内容
const filePath = './navigator_output.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 获取所有分类
let groups = data.groups;

console.log('=== 修复前的分类状态 ===');

// 找出需要修复的分类
const socialApp = groups.find(g => g.id === 95);
const fingerprintBrowser = groups.find(g => g.id === 63);

if (socialApp) {
    console.log(`社交APP (ID: 95): parent_id = ${socialApp.parent_id}`);
    // 修复：将社交APP的parent_id设置为全球APP下载(ID:64)
    socialApp.parent_id = 64;
    console.log(`修复后: 社交APP (ID: 95) -> parent_id = ${socialApp.parent_id} (全球APP下载)`);
}

if (fingerprintBrowser) {
    console.log(`指纹浏览器 (ID: 63): parent_id = ${fingerprintBrowser.parent_id}`);
    // 修复：将指纹浏览器的parent_id设置为实用工具(ID:1)
    fingerprintBrowser.parent_id = 1;
    console.log(`修复后: 指纹浏览器 (ID: 63) -> parent_id = ${fingerprintBrowser.parent_id} (实用工具)`);
}

// 保存修复后的数据
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('\n=== 修复完成 ===');
console.log('修复后的文件已保存到 navigator_output.json');

// 验证修复结果
console.log('\n=== 验证修复结果 ===');
const updatedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const updatedSocialApp = updatedData.groups.find(g => g.id === 95);
const updatedFingerprintBrowser = updatedData.groups.find(g => g.id === 63);

if (updatedSocialApp) {
    console.log(`社交APP (ID: 95): parent_id = ${updatedSocialApp.parent_id}`);
}

if (updatedFingerprintBrowser) {
    console.log(`指纹浏览器 (ID: 63): parent_id = ${updatedFingerprintBrowser.parent_id}`);
}
