import { Group, Site } from './API/http';

// 确保GroupWithSites的id字段必定存在
export interface GroupWithSites extends Omit<Group, 'id'> {
  id: number; // 确保id始终存在
  parent_id?: number | null; // 添加父分类ID，支持层级结构
  sites: Site[];
  subgroups?: GroupWithSites[]; // 添加子分类数组
}
