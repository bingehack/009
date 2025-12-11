import React, { useState, useEffect } from 'react';
import { Site, Group } from '../API/http';
import { PaletteColor } from '@mui/material/styles';

import SiteCard from './SiteCard';
import { GroupWithSites } from '../types';
import EditGroupDialog from './EditGroupDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
// 引入Material UI组件
import {
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Collapse,
  Menu,
  MenuItem,
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

// 更新组件属性接口
interface GroupCardProps {
  group: GroupWithSites;
  index?: number; // 用于Draggable的索引，仅在分组排序模式下需要
  sortMode: 'None' | 'GroupSort' | 'SiteSort';
  currentSortingGroupId: number | null;
  viewMode?: 'readonly' | 'edit'; // 访问模式
  onUpdate: (updatedSite: Site) => void;
  onDelete: (siteId: number) => void;
  onSaveSiteOrder: (groupId: number, sites: Site[]) => void;
  onStartSiteSort: (groupId: number) => void;
  onAddSite?: (groupId: number) => void; // 新增添加卡片的可选回调函数
  onUpdateGroup?: (group: Group) => void; // 更新分组的回调函数
  onDeleteGroup?: (groupId: number) => void; // 删除分组的回调函数
  configs?: Record<string, string>; // 传入配置
  mainCategories: Group[]; // 大类列表
  onSubCategoryClick?: (subCategoryId: number) => void; // 子分类点击回调
  selectedSubCategory?: { mainCategoryId: number | null; subCategoryId: number | null }; // 当前选中的子分类（包含大类ID）
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  sortMode,
  currentSortingGroupId,
  viewMode = 'edit', // 默认为编辑模式
  onUpdate,
  onDelete,
  onSaveSiteOrder,
  onStartSiteSort,
  onAddSite,
  onUpdateGroup,
  onDeleteGroup,
  configs,
  mainCategories,
  onSubCategoryClick,
  selectedSubCategory,
}) => {
  // 添加本地状态来管理站点排序
  const [sites, setSites] = useState<Site[]>(group.sites);
  // 本地状态跟踪当前大类的子分类选择状态，防止无限循环
  const [localSelectedSubCategory, setLocalSelectedSubCategory] = useState<number | null>(null);
  
  // 当选中的子分类变化时，更新sites状态数组
  useEffect(() => {
    // 检查当前大类是否有选中的子分类
    if (selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId) {
      // 找到选中的子分类
      const selectedSubgroup = group.subgroups?.find(subgroup => subgroup.id === selectedSubCategory.subCategoryId);
      if (selectedSubgroup) {
        setSites(selectedSubgroup.sites);
      }
    } else {
      // 没有选中子分类，使用当前分组的站点
      setSites(group.sites);
    }
  }, [selectedSubCategory, group.sites, group.subgroups, group.id]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 重置到第一页当站点数据变化时
  useEffect(() => {
    setCurrentPage(1);
  }, [group.sites, group.subgroups, selectedSubCategory]);

  // 当进入站点排序模式时，确保sites状态数组包含正确的站点
  useEffect(() => {
    if (sortMode === 'SiteSort') {
      // 检查当前大类是否有选中的子分类
      if (selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId) {
        // 找到选中的子分类
        const selectedSubgroup = group.subgroups?.find(subgroup => subgroup.id === selectedSubCategory.subCategoryId);
        if (selectedSubgroup) {
          setSites(selectedSubgroup.sites);
        }
      } else {
        // 没有选中子分类，使用当前分组的站点
        setSites(group.sites);
      }
    }
  }, [sortMode, selectedSubCategory, group.sites, group.subgroups, group.id]);

  // 当大类下未放置导航网站时，自动默认展示第一个子分类的内容
  useEffect(() => {
    // 检查条件：
    // 1. 当前分组没有站点
    // 2. 有子分类
    // 3. 当前大类没有选中任何子分类
    // 4. 本地状态与全局状态一致（确保只在必要时触发）
    if (
      group.sites.length === 0 && 
      group.subgroups && 
      group.subgroups.length > 0 && 
      !(selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId)
    ) {
      // 自动选择第一个子分类
      if (onSubCategoryClick && group.subgroups[0]) {
        // 只有当本地状态与即将选择的子分类不同时，才触发选择
        if (localSelectedSubCategory !== group.subgroups[0].id) {
          onSubCategoryClick(group.subgroups[0].id);
          setLocalSelectedSubCategory(group.subgroups[0].id);
        }
      }
    } else if (selectedSubCategory?.mainCategoryId === group.id) {
      // 如果已经有选中的子分类，更新本地状态以保持同步
      setLocalSelectedSubCategory(selectedSubCategory.subCategoryId || null);
    } else {
      // 如果用户切换到了其他大类，重置本地状态
      setLocalSelectedSubCategory(null);
    }
  }, [group.sites.length, group.subgroups, selectedSubCategory, onSubCategoryClick, group.id, localSelectedSubCategory]);
  // 添加编辑弹窗的状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // 添加提示消息状态
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // 添加分类选择菜单状态
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  // 当前分类的子分类列表
  const [subCategories, setSubCategories] = useState<Group[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // 添加折叠状态
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem(`group-${group.id}-collapsed`);
    // 如果有保存的状态，使用保存的状态
    if (savedState) {
      return JSON.parse(savedState);
    }
    // 没有保存的状态时，所有分类默认展开
    return false;
  });

  // 保存折叠状态到本地存储
  useEffect(() => {
    if (group.id) {
      localStorage.setItem(`group-${group.id}-collapsed`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, group.id]);

  // 获取当前分类的所有子分类
  useEffect(() => {
    // 确保group存在
    if (!group) {
      setSubCategories([]);
      return;
    }
    
    // 使用group.subgroups获取子分类
    const children = group.subgroups || [];
    console.log(`当前分类 ${group.name} (ID: ${group.id}) 的子分类:`, children);
    setSubCategories(children);
  }, [group]);

  // 处理折叠切换
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 处理添加卡片按钮点击
  const handleAddCardClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // 如果有子分类，显示分类选择菜单
    if (subCategories.length > 0) {
      setMenuAnchorEl(event.currentTarget);
      setCategoryMenuOpen(true);
    } else {
      // 没有子分类，直接调用原有的onAddSite函数
      if (onAddSite) {
        onAddSite(group.id);
      }
    }
  };

  // 处理分类选择
  const handleCategorySelect = (categoryId: number) => {
    if (onAddSite) {
      onAddSite(categoryId);
    }
    handleCloseMenu();
  };

  // 关闭分类选择菜单
  const handleCloseMenu = () => {
    setCategoryMenuOpen(false);
    setMenuAnchorEl(null);
  };

  // 配置传感器，支持鼠标、触摸和键盘操作
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 的移动才激活拖拽，防止误触
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 延迟250ms激活，防止误触
        tolerance: 5, // 容忍5px的移动
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 站点拖拽结束处理函数
  const handleSiteDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      // 查找拖拽的站点索引
      const oldIndex = sites.findIndex((site) => `site-${site.id}` === active.id);
      const newIndex = sites.findIndex((site) => `site-${site.id}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // 更新本地站点顺序
        const newSites = arrayMove(sites, oldIndex, newIndex);
        setSites(newSites);
      }
    }
  };

  // 编辑分组处理函数
  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  // 更新分组处理函数
  const handleUpdateGroup = (updatedGroup: Group) => {
    if (onUpdateGroup) {
      onUpdateGroup(updatedGroup);
      setEditDialogOpen(false);
    }
  };

  // 删除分组处理函数
  const handleDeleteGroup = (groupId: number) => {
    if (onDeleteGroup) {
      onDeleteGroup(groupId);
      setEditDialogOpen(false);
    }
  };

  // 判断是否为当前正在编辑的分组
  const isCurrentEditingGroup = sortMode === 'SiteSort' && (currentSortingGroupId === group.id || currentSortingGroupId === selectedSubCategory?.subCategoryId);

  // 渲染站点卡片区域
  const renderSites = () => {
    // 使用本地状态中的站点数据
    const baseSites = isCurrentEditingGroup ? sites : group.sites;
    
    // 根据selectedSubCategory过滤站点
    let sitesToRender = baseSites;
    if (selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId) {
      // 查找当前分组下对应的子分类
      const selectedSubgroup = group.subgroups?.find(subgroup => subgroup.id === selectedSubCategory.subCategoryId);
      if (selectedSubgroup) {
        // 如果找到了子分类，只显示该子分类的站点
        sitesToRender = selectedSubgroup.sites;
      }
    }
    
    // 计算分页数据
    const totalPages = Math.ceil(sitesToRender.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSites = sitesToRender.slice(indexOfFirstItem, indexOfLastItem);

    // 如果当前不是正在编辑的分组且处于站点排序模式，不显示站点
    if (!isCurrentEditingGroup && sortMode === 'SiteSort') {
      return null;
    }

    // 如果是编辑模式，使用DndContext包装
    if (isCurrentEditingGroup) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSiteDragEnd}
        >
          <SortableContext
            items={sitesToRender.map((site) => `site-${site.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <Box sx={{ width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  margin: -1, // 抵消内部padding，确保边缘对齐
                }}
              >
                {currentSites.map((site, idx) => (
                  <Box
                    key={site.id || idx}
                    sx={{
                      width: {
                        xs: '50%',
                        sm: '50%',
                        md: '25%',
                        lg: '25%',
                        xl: '25%',
                      },
                      padding: 1, // 内部间距，更均匀的分布
                      boxSizing: 'border-box', // 确保padding不影响宽度计算
                    }}
                  >
                    <SiteCard
                      site={site}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      isEditMode={true}
                      viewMode={viewMode}
                      index={idx}
                      iconApi={configs?.['site.iconApi']} // 传入iconApi配置
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </SortableContext>
        </DndContext>
      );
    }

    // 普通模式下的渲染
    const renderContent = () => (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          margin: -1, // 抵消内部padding，确保边缘对齐
        }}
      >
        {currentSites.map((site) => (
          <Box
            key={site.id}
            sx={{
              width: {
                xs: '100%',
                sm: '50%',
                md: '33.33%',
                lg: '25%',
                xl: '20%',
              },
              padding: 1, // 内部间距，更均匀的分布
              boxSizing: 'border-box', // 确保padding不影响宽度计算
            }}
          >
            <SiteCard
              site={site}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isEditMode={false}
              viewMode={viewMode}
              iconApi={configs?.['site.iconApi']} // 传入iconApi配置
            />
          </Box>
        ))}
      </Box>
    );

    // 渲染分页控件
    const renderPagination = () => {
      if (totalPages <= 1) return null;

      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <IconButton
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            sx={{ mr: 1 }}
          >
            <FirstPage />
          </IconButton>
          <IconButton
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            sx={{ mr: 1 }}
          >
            <ChevronLeft />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
            <Typography variant="body2">
              第 {currentPage} / {totalPages} 页
            </Typography>
          </Box>
          <IconButton
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            sx={{ ml: 1 }}
          >
            <ChevronRight />
          </IconButton>
          <IconButton
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{ ml: 1 }}
          >
            <LastPage />
          </IconButton>
        </Box>
      );
    };

    return (
      <Box>
        {renderContent()}
        {renderPagination()}
      </Box>
    );
  };

  // 保存站点排序
  const handleSaveSiteOrder = () => {
    // 确定目标分组ID（可能是子分类ID）
    const targetGroupId = selectedSubCategory?.subCategoryId || group.id;
    if (!targetGroupId) {
      console.error('分组 ID 不存在,无法保存排序');
      return;
    }
    onSaveSiteOrder(targetGroupId, sites);
  };

  // 处理排序按钮点击
  const handleSortClick = () => {
    if (!group.id) {
      console.error('分组 ID 不存在,无法开始排序');
      return;
    }
    
    // 检查站点数量，考虑是否有选中的子分类
    let sitesToCheck: any[] = [];
    let targetGroupId: number = group.id;
    
    if (selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId) {
      // 找到选中的子分类
      const selectedSubgroup = group.subgroups?.find(subgroup => subgroup.id === selectedSubCategory.subCategoryId);
      if (selectedSubgroup) {
        sitesToCheck = selectedSubgroup.sites;
        targetGroupId = selectedSubgroup.id;
      }
    } else {
      // 没有选中子分类，使用当前分组的站点
      sitesToCheck = group.sites;
    }
    
    // 检查站点数量
    if (sitesToCheck.length < 2) {
      setSnackbarMessage('至少需要2个站点才能进行排序');
      setSnackbarOpen(true);
      return;
    }
    
    // 确保分组展开
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    
    // 传递目标分组ID（可能是子分类ID）
    onStartSiteSort(targetGroupId);
  };

  // 关闭提示消息
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 修改分组标题区域的渲染
  return (
    <Paper
      elevation={sortMode === 'None' ? 2 : 3}
      sx={{
        borderRadius: 4,
        p: { xs: 2, sm: 3 },
        transition: 'all 0.3s ease-in-out',
        border: '1px solid transparent',
        '&:hover': {
          boxShadow: sortMode === 'None' ? 6 : 3,
          borderColor: 'divider',
          transform: sortMode === 'None' ? 'scale(1.01)' : 'none',
        },
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={2.5}
        gap={1}
      >
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': {
                '& .collapse-icon': {
                  color: 'primary.main',
                },
              },
            }}
            onClick={handleToggleCollapse}
          >
            <IconButton
              size='small'
              className='collapse-icon'
              sx={{
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
            <Typography
              variant='h5'
              component='h2'
              fontWeight='600'
              color='text.primary'
              sx={{ mb: { xs: 1, sm: 0 } }}
            >
              {group.name}
              {group.sites.length > 0 && (
                <Typography component='span' variant='body2' color='text.secondary' sx={{ ml: 1 }}>
                  ({group.sites.length})
                </Typography>
              )}
            </Typography>
          </Box>
          
          {/* 子分类标签区域 */}
          {group.subgroups && group.subgroups.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                mt: 1.5,
                ml: 4.5,
              }}
            >
              {/* 定义颜色数组，为不同的子分类分配不同颜色 */}
              {(() => {
                // 定义颜色数组类型，确保只包含MUI调色板支持的颜色键
                type PaletteKey = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
                
                // 定义颜色数组 - 只使用MUI默认支持的标准颜色
                const colors: PaletteKey[] = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
                
                return group.subgroups.map((subgroup, index) => {
                  // 根据索引获取颜色，循环使用
                  const colorIndex = index % colors.length;
                  const color = colors[colorIndex] ?? 'primary'; // 添加默认值确保color永远不是undefined
                  
                  return (
                    <Box
                      key={`subgroup-${subgroup.id}`}
                      component='span'
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 3,
                        backgroundColor: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id 
                          ? (theme) => (theme.palette[color] as PaletteColor).main 
                          : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                        color: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id ? 'white' : 'text.primary',
                        fontSize: '0.925rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease-in-out',
                        border: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id 
                          ? (theme) => `1px solid ${(theme.palette[color] as PaletteColor).dark}` 
                          : (theme) => `1px solid ${theme.palette.divider}`,
                        boxShadow: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id 
                          ? (theme) => `0 4px 12px ${(theme.palette[color] as PaletteColor).light}40` 
                          : (theme) => theme.palette.mode === 'dark' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          backgroundColor: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id 
                            ? (theme) => (theme.palette[color] as PaletteColor).dark 
                            : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : `rgba(${(theme.palette[color] as PaletteColor).light}40)`,
                          color: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id ? 'white' : (theme) => (theme.palette[color] as PaletteColor).main,
                          transform: 'translateY(-2px)',
                          borderColor: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id 
                            ? (theme) => (theme.palette[color] as PaletteColor).dark 
                            : (theme) => (theme.palette[color] as PaletteColor).main,
                          boxShadow: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id 
                            ? (theme) => `0 6px 16px ${(theme.palette[color] as PaletteColor).light}60` 
                            : (theme) => `0 4px 12px ${(theme.palette[color] as PaletteColor).light}20`,
                        },
                        '&:active': {
                          transform: selectedSubCategory?.mainCategoryId === group.id && selectedSubCategory.subCategoryId === subgroup.id ? 'translateY(-1px)' : 'translateY(0)',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡，避免触发折叠
                        // 调用父组件传递的子分类点击回调
                        if (onSubCategoryClick) {
                          onSubCategoryClick(subgroup.id);
                        }
                      }}
                    >
                      {subgroup.name}
                      {subgroup.sites.length > 0 && (
                        <Typography 
                          component='span' 
                          variant='caption' 
                          sx={{ 
                            ml: 0.75, 
                            color: selectedSubCategory?.subCategoryId === subgroup.id ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary',
                            fontWeight: 400,
                          }}
                        >
                          ({subgroup.sites.length})
                        </Typography>
                      )}
                    </Box>
                  );
                });
              })()}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row' },
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
          {isCurrentEditingGroup ? (
            <Button
              variant='contained'
              color='primary'
              size='small'
              startIcon={<SaveIcon />}
              onClick={handleSaveSiteOrder}
              sx={{
                minWidth: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              保存顺序
            </Button>
          ) : (
            sortMode === 'None' &&
            viewMode === 'edit' && ( // 只在编辑模式显示按钮
              <>
                {onAddSite && group.id && (
                  <Button
                    variant='contained'
                    color='primary'
                    size='small'
                    onClick={handleAddCardClick}
                    startIcon={<AddIcon />}
                    sx={{
                      minWidth: 'auto',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    添加卡片
                  </Button>
                )}
                <Button
                  variant='outlined'
                  color='primary'
                  size='small'
                  startIcon={<SortIcon />}
                  onClick={handleSortClick}
                  sx={{
                    minWidth: 'auto',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  排序
                </Button>

                {onUpdateGroup && onDeleteGroup && (
                  <Tooltip title='编辑分组'>
                    <IconButton
                      color='primary'
                      onClick={handleEditClick}
                      size='small'
                      sx={{ alignSelf: 'center' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )
          )}
        </Box>
      </Box>

      {/* 使用 Collapse 组件包装站点卡片区域 */}
      <Collapse in={!isCollapsed} timeout='auto'>
        {renderSites()}
      </Collapse>

      {/* 编辑分组弹窗 */}
      {onUpdateGroup && onDeleteGroup && (
        <EditGroupDialog
          open={editDialogOpen}
          group={group}
          mainCategories={mainCategories}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleUpdateGroup}
          onDelete={handleDeleteGroup}
        />
      )}

      {/* 提示消息 */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity='info' sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* 分类选择菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={categoryMenuOpen}
        onClose={handleCloseMenu}
        MenuListProps={{
          'aria-labelledby': 'add-card-button',
        }}
      >
        {/* 当前分类选项 */}
        <MenuItem onClick={() => handleCategorySelect(group.id)}>
          当前分类 ({group.name})
        </MenuItem>
        {/* 分割线 */}
        <MenuItem divider />
        {/* 子分类选项 */}
        {subCategories
          .filter(subCategory => subCategory.id !== undefined)
          .map((subCategory) => (
            <MenuItem key={subCategory.id} onClick={() => handleCategorySelect(subCategory.id!)}>
              {subCategory.name}
            </MenuItem>
          ))}
      </Menu>
    </Paper>
  );
};

export default GroupCard;
