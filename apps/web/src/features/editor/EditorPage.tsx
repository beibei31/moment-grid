import { useMemo, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { useWorkflowStore } from '../../store/workflowStore';
import { EditorToolbar } from './EditorToolbar';
import { PhotoTray } from './PhotoTray';
import { SortablePhotoGrid } from './SortablePhotoGrid';
import { fitAssetIdsToLayout, moveAsset, replaceAssetAt, type LayoutCount } from './gridLayout';

export function EditorPage() {
  const navigate = useNavigate();
  const photos = useWorkflowStore((state) => state.photos);
  const analysis = useWorkflowStore((state) => state.analysis);
  const selectedPlanId = useWorkflowStore((state) => state.selectedPlanId);
  const orderedAssetIds = useWorkflowStore((state) => state.orderedAssetIds);
  const layoutCount = useWorkflowStore((state) => state.layoutCount);
  const reorderSelectedPhotos = useWorkflowStore((state) => state.reorderSelectedPhotos);
  const setLayoutCount = useWorkflowStore((state) => state.setLayoutCount);
  const selectedPlan = analysis?.plans.find(({ id }) => id === selectedPlanId);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const photoById = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const selectedPhotos = orderedAssetIds.flatMap((id) => {
    const photo = photoById.get(id);
    return photo ? [photo] : [];
  });
  const selectedSet = new Set(orderedAssetIds);
  const candidates = photos.filter(({ id }) => !selectedSet.has(id));

  if (!analysis || !selectedPlan) {
    return <Navigate to="/recommendations" replace />;
  }

  const changeLayout = (count: LayoutCount) => {
    const next = fitAssetIdsToLayout(orderedAssetIds, photos.map(({ id }) => id), count);
    setLayoutCount(count);
    reorderSelectedPhotos(next);
    if (selectedIndex !== null && selectedIndex >= next.length) setSelectedIndex(null);
  };

  const replace = (replacementId: string) => {
    if (selectedIndex === null) return;
    reorderSelectedPhotos(replaceAssetAt(orderedAssetIds, selectedIndex, replacementId));
  };

  const move = (activeId: string, overId: string) => {
    const next = moveAsset(orderedAssetIds, activeId, overId);
    reorderSelectedPhotos(next);
    if (selectedIndex !== null) {
      const selectedId = orderedAssetIds[selectedIndex];
      setSelectedIndex(next.indexOf(selectedId));
    }
  };

  return (
    <Box className="editor-page">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="返回推荐方案" onClick={() => navigate('/recommendations')}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={800}>九宫格编辑器</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
              <CloudDoneRoundedIcon fontSize="small" />
              <Typography variant="caption">当前会话自动保存</Typography>
            </Stack>
          </Box>
        </Stack>
        <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/export')}>
          下一步：生成朋友圈文案
        </Button>
      </Stack>

      <EditorToolbar layoutCount={layoutCount} onLayoutChange={changeLayout} />

      <Box className="editor-layout">
        <PhotoTray candidates={candidates} canReplace={selectedIndex !== null} onReplace={replace} />

        <Box className="editor-canvas-panel">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box>
              <Typography fontWeight={800}>{selectedPlan.title}</Typography>
              <Typography variant="caption" color="text.secondary">长按拖动，或使用每张图下方的上下移动按钮</Typography>
            </Box>
            <Chip label={`${selectedPhotos.length} 张`} color="primary" size="small" />
          </Stack>
          <SortablePhotoGrid
            photos={selectedPhotos}
            layoutCount={layoutCount}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onMove={move}
          />
        </Box>

        <Stack className="editor-suggestions" spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoFixHighRoundedIcon color="primary" />
            <Typography component="h2" fontWeight={800}>智能网格建议</Typography>
          </Stack>
          <Paper elevation={0} className="editor-suggestion-card">
            <Typography fontWeight={700}>保持视觉锚点</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {selectedPhotos.length >= 5 ? '建议把最重要的照片放在第 5 个中心位置。' : '当前照片较少，优先保留最能概括主题的一张。'}
            </Typography>
          </Paper>
          <Paper elevation={0} className="editor-suggestion-card accepted">
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CheckCircleRoundedIcon color="primary" fontSize="small" />
              <Typography fontWeight={700}>顺序可随时调整</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              首版仅使用确定性顺序建议，不会声称已识别人脸、闭眼或色温。
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
