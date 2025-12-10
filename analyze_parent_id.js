import fs from 'fs';

// 读取文件内容
const filePath = './navigator_output.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 获取所有分类
const groups = data.groups;

// 找出所有parent_id为null的分类
const topLevelGroups = groups.filter(group => group.parent_id === null);

console.log('=== 顶级分类列表（共' + topLevelGroups.length + '个） ===');
console.log('格式：ID, 名称, 子分类数量');
console.log('----------------------------------------');

topLevelGroups.forEach(group => {
    // 找出该分类的子分类数量
    const childCount = groups.filter(g => g.parent_id === group.id).length;
    console.log(`${group.id}, ${group.name}, ${childCount}`);
});

console.log('----------------------------------------');

// 分析每个顶级分类的结构
console.log('\n--- 每个顶级分类的结构 ---');
topLevelGroups.forEach(group => {
    const children = groups.filter(g => g.parent_id === group.id);
    if (children.length > 0) {
        console.log(`\n${group.name} (ID: ${group.id}) 包含子分类:`);
        children.forEach(child => {
            console.log(`  - ${child.name} (ID: ${child.id})`);
        });
    } else {
        console.log(`\n${group.name} (ID: ${group.id}) 没有子分类`);
    }
});

// 找出可能应该是子分类的顶级分类
console.log('\n--- 可能需要修复的分类（名称分析） ---');
topLevelGroups.forEach(group => {
    // 检查其他顶级分类的名称是否包含当前分类名称
    const potentialParent = topLevelGroups.find(parent => 
        parent.id !== group.id && 
        group.name.includes(parent.name) &&
        group.name !== parent.name
    );
    
    if (potentialParent) {
        console.log(`分类 "${group.name}" (ID: ${group.id}) 可能应该是 "${potentialParent.name}" (ID: ${potentialParent.id}) 的子分类`);
    }
    
    // 检查当前分类名称是否被其他顶级分类包含
    const potentialChildren = topLevelGroups.filter(child => 
        child.id !== group.id && 
        child.name.includes(group.name) &&
        child.name !== group.name
    );
    
    if (potentialChildren.length > 0) {
        console.log(`分类 "${group.name}" (ID: ${group.id}) 可能是以下分类的父分类:`);
        potentialChildren.forEach(child => {
            console.log(`  - ${child.name} (ID: ${child.id})`);
        });
    }
});
