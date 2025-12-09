import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import { Group } from '../API/http';

interface EditGroupDialogProps {
  open: boolean;
  group: Group | null;
  mainCategories: Group[];
  onClose: () => void;
  onSave: (group: Group) => void;
  onDelete: (groupId: number) => void;
}

const EditGroupDialog: React.FC<EditGroupDialogProps> = ({
  open,
  group,
  mainCategories,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true); // 公开/私密状态
  const [parentId, setParentId] = useState<number | null>(null); // 父分类ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 当弹窗打开时，初始化名称、公开状态和父分类
  React.useEffect(() => {
    if (group) {
      setName(group.name);
      setIsPublic(group.is_public !== 0); // 0 = 私密, 1 或 undefined = 公开
      setParentId(group.parent_id ?? null);
    }
    // 关闭删除确认状态
    setShowDeleteConfirm(false);
  }, [group, open]);

  const handleSave = () => {
    if (!group || !name.trim()) return;

    onSave({
      ...group,
      name: name.trim(),
      is_public: isPublic ? 1 : 0, // 保存 is_public 字段
      parent_id: parentId, // 保存父分类ID
    });
  };

  const handleDelete = () => {
    if (!group) return;

    if (!showDeleteConfirm) {
      // 显示删除确认
      setShowDeleteConfirm(true);
    } else {
      // 确认删除
      if (!group.id) {
        console.error('分组 ID 不存在,无法删除');
        return;
      }
      onDelete(group.id);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>编辑分组</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            label='分组名称'
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant='outlined'
            autoFocus
          />
        </Box>

        {/* 父分类选择 */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label='父分类'
            fullWidth
            select
            value={parentId === null ? 'null' : parentId.toString()}
            onChange={(e) => setParentId(e.target.value === 'null' ? null : parseInt(e.target.value, 10))}
            variant='outlined'
          >
            <MenuItem value='null'>/</MenuItem>
            {mainCategories.map((category) => (
              <MenuItem key={`parent-${category.id}`} value={category.id.toString()}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* 公开/私密开关 */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                color='primary'
              />
            }
            label={
              <Box>
                <Typography variant='body1'>{isPublic ? '公开分组' : '私密分组'}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {isPublic ? '所有访客都可以看到此分组' : '只有管理员登录后才能看到此分组'}
                </Typography>
              </Box>
            }
          />
        </Box>

        {showDeleteConfirm && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            <Typography variant='body2'>
              确定要删除分组 "{group.name}" 吗？
              <strong>删除此分组将同时删除该分组下的所有网站。</strong>
              此操作无法撤销。
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {!showDeleteConfirm ? (
          <>
            <Button onClick={onClose} color='inherit'>
              取消
            </Button>
            <Button onClick={handleDelete} color='error' variant='outlined'>
              删除
            </Button>
            <Button
              onClick={handleSave}
              color='primary'
              variant='contained'
              disabled={!name.trim()}
            >
              保存
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setShowDeleteConfirm(false)} color='inherit'>
              取消
            </Button>
            <Button onClick={handleDelete} color='error' variant='contained'>
              确认删除
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupDialog;
