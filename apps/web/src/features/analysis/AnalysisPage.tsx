import { useCallback, useEffect, useRef, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { Alert, Box, Button, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import type { AssetInput } from '../../shared/api/contracts';
import { analyzeProject, createProject, MomentGridApiError } from '../../shared/api/momentGridApi';
import { useWorkflowStore } from '../../store/workflowStore';
import { AnalysisProgress } from './AnalysisProgress';

export function AnalysisPage() {
  const navigate = useNavigate();
  const photos = useWorkflowStore((state) => state.photos);
  const scene = useWorkflowStore((state) => state.scene);
  const setProjectId = useWorkflowStore((state) => state.setProjectId);
  const setAnalysis = useWorkflowStore((state) => state.setAnalysis);
  const [progress, setProgress] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);
    setError(null);
    setProgress(10);

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 7, 88));
    }, 360);

    try {
      const assets: AssetInput[] = photos.map(
        ({ id, name, mimeType, size, width, height, originalIndex }) => ({
          id,
          name,
          mimeType,
          size,
          width,
          height,
          originalIndex,
        }),
      );
      let projectId = useWorkflowStore.getState().projectId;
      let result;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (!projectId) {
          const project = await createProject(scene, controller.signal);
          if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
          projectId = project.projectId;
          setProjectId(projectId);
        }

        try {
          result = await analyzeProject(projectId, assets, controller.signal);
          break;
        } catch (reason) {
          const staleProject = reason instanceof MomentGridApiError && reason.code === 'PROJECT_NOT_FOUND';
          if (!staleProject || attempt > 0) throw reason;
          projectId = null;
          setProjectId(null);
        }
      }
      if (!result) throw new Error('分析失败，请稍后重试');
      if (controller.signal.aborted) return;
      setProgress(100);
      setAnalysis(result);
      navigate('/recommendations', { replace: true });
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : '分析失败，请稍后重试');
    } finally {
      window.clearInterval(timer);
      if (!controller.signal.aborted) setRunning(false);
    }
  }, [navigate, photos, scene, setAnalysis, setProjectId]);

  useEffect(() => {
    void runAnalysis();
    return () => controllerRef.current?.abort();
  }, [runAnalysis]);

  return (
    <Box className="analysis-page">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="返回上传页" onClick={() => navigate('/')}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={700}>
              挑选最值得分享的瞬间
            </Typography>
            <Typography variant="body2" color="text.secondary">
              正在整理 {photos.length} 张照片的质量线索与排版节奏
            </Typography>
          </Box>
        </Stack>
        <Typography fontWeight={800} color="primary">
          {Math.round(progress)}%
        </Typography>
      </Stack>

      <LinearProgress variant="determinate" value={progress} className="analysis-main-progress" />

      <Box className="analysis-layout">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <AutoAwesomeRoundedIcon color="primary" />
            <Typography component="h2" variant="h6" fontWeight={700}>
              智能编排流程
            </Typography>
          </Stack>
          <AnalysisProgress progress={progress} />
          {error && (
            <Alert
              severity="error"
              role="alert"
              action={
                <Button color="inherit" size="small" startIcon={<RestartAltRoundedIcon />} onClick={runAnalysis}>
                  重新分析
                </Button>
              }
              sx={{ mt: 2 }}
            >
              {error}
            </Alert>
          )}
        </Box>

        <Box className="analysis-visual-panel">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography component="h2" variant="h6" fontWeight={700}>
                实时分析流
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {running ? '动态扫描本地预览' : error ? '等待重新尝试' : '分析完成'}
              </Typography>
            </Box>
            <Typography variant="body2" color="primary" fontWeight={700}>
              {Math.min(photos.length, Math.max(1, Math.ceil((progress / 100) * photos.length)))} / {photos.length} 张
            </Typography>
          </Stack>
          <Box className="analysis-photo-grid">
            {photos.slice(0, 12).map((photo, index) => (
              <Box key={photo.id} className="analysis-photo-tile">
                <img src={photo.previewUrl} alt={photo.name} />
                {index < Math.ceil((progress / 100) * photos.length) && (
                  <Box className="analysis-scan-badge">已读取</Box>
                )}
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={1} mt={2} color="text.secondary" alignItems="flex-start">
            <InfoOutlinedIcon fontSize="small" />
            <Typography variant="body2">
              请保持此页面打开；分析请求完成后会自动呈现排版方案。
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
