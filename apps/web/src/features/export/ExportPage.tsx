import { useMemo, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { Alert, Avatar, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { useWorkflowStore } from '../../store/workflowStore';
import { CaptionList } from './CaptionList';
import { exportGrid } from './exportGrid';
import { PublishOrder } from './PublishOrder';

export function ExportPage() {
  const navigate = useNavigate();
  const photos = useWorkflowStore((state) => state.photos);
  const analysis = useWorkflowStore((state) => state.analysis);
  const orderedAssetIds = useWorkflowStore((state) => state.orderedAssetIds);
  const layoutCount = useWorkflowStore((state) => state.layoutCount);
  const selectedCaptionId = useWorkflowStore((state) => state.selectedCaptionId);
  const selectCaption = useWorkflowStore((state) => state.selectCaption);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const photoById = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const selectedPhotos = orderedAssetIds.flatMap((id) => {
    const photo = photoById.get(id);
    return photo ? [photo] : [];
  });
  const captions = analysis?.captions ?? [];
  const selectedCaption = captions.find(({ id }) => id === selectedCaptionId) ?? captions[0];

  if (!analysis || selectedPhotos.length === 0) {
    return <Navigate to="/recommendations" replace />;
  }

  const copyCaption = async (text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setFeedback({ severity: 'success', text: '文案已复制到剪贴板' });
    } catch {
      setFeedback({ severity: 'error', text: '无法访问剪贴板，请手动选择文案复制。' });
    }
  };

  const download = async () => {
    setExporting(true);
    setFeedback(null);
    try {
      const blob = await exportGrid(selectedPhotos, layoutCount);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `拾光排版-${Date.now()}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      setFeedback({ severity: 'success', text: 'PNG 已生成；这是浏览器端预览质量导出。' });
    } catch (reason) {
      setFeedback({ severity: 'error', text: reason instanceof Error ? reason.message : '图片导出失败，请重试。' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box className="export-page">
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="返回编辑器" onClick={() => navigate('/editor')}><ArrowBackRoundedIcon /></IconButton>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={800}>文案与导出</Typography>
            <Typography variant="body2" color="text.secondary">效果拟真预览 · 准备分享</Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1} useFlexGap flexWrap="wrap">
          <Button variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={() => selectedCaption && copyCaption(selectedCaption.text)}>
            复制当前文案
          </Button>
          <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={download} disabled={exporting}>
            {exporting ? '正在生成…' : '导出高清图片'}
          </Button>
        </Stack>
      </Stack>

      {feedback && <Alert role="alert" severity={feedback.severity} sx={{ mb: 2 }}>{feedback.text}</Alert>}

      <Box className="export-layout">
        <Box className="moments-export-preview">
          <Typography variant="overline" color="text.secondary">朋友圈实景呈现</Typography>
          <Stack direction="row" spacing={1.25} alignItems="center" mt={1.5}>
            <Avatar className="sample-avatar">拾</Avatar>
            <Box>
              <Typography color="primary" fontWeight={800}>今日拾光</Typography>
              <Typography variant="caption" color="text.secondary">刚刚</Typography>
            </Box>
          </Stack>
          <Typography my={1.5} lineHeight={1.75}>{selectedCaption?.text ?? '选择一条文案，让这一组照片更完整。'}</Typography>
          <Box className={`export-photo-grid count-${layoutCount}`}>
            {selectedPhotos.map((photo) => <img key={photo.id} src={photo.previewUrl} alt={photo.name} />)}
          </Box>
          <Stack direction="row" spacing={0.5} color="text.secondary" alignItems="center" mt={1.5}>
            <PlaceRoundedIcon fontSize="small" />
            <Typography variant="caption">地点仅在用户主动填写后显示</Typography>
          </Stack>
          <PublishOrder photos={selectedPhotos} />
        </Box>

        <Box className="caption-panel">
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <AutoAwesomeRoundedIcon color="primary" />
            <Box>
              <Typography component="h2" variant="h6" fontWeight={800}>AI 精选文案候选</Typography>
              <Typography variant="caption" color="text.secondary">已生成 {captions.length} 条差异化灵感</Typography>
            </Box>
          </Stack>
          <CaptionList captions={captions} selectedId={selectedCaption?.id ?? null} onSelect={selectCaption} onCopy={copyCaption} />
        </Box>
      </Box>
    </Box>
  );
}
