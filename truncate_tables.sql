-- 清空所有表数据的SQL脚本
-- 注意：请在确认要删除所有数据时执行此脚本
-- 执行顺序需要考虑外键约束

-- 1. 首先删除sites表数据（依赖于groups表）
DELETE FROM sites;

-- 2. 然后删除groups表数据
DELETE FROM groups;

-- 3. 最后删除configs表数据
DELETE FROM configs;

-- 重置自增主键
DELETE FROM sqlite_sequence WHERE name IN ('groups', 'sites');
