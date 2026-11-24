import { useEffect, useRef, useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import TextFieldsRoundedIcon from '@mui/icons-material/TextFieldsRounded';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { MomentsPreview } from '../../shared/components/MomentsPreview';
import type { Scene } from '../../shared/api/contracts';
import { useWorkflowStore, type PhotoAsset } from '../../store/workflowStore';
import { PhotoDropzone } from './PhotoDropzone';
import { ingestPhotoFiles, type RejectionReason } from './photoIngestion';

const presets: Array<{ label: string; scene: Scene }> = [
  { label: '旅行生活', scene: 'TRAVEL' },
  { label: '探店下午茶', scene: 'FOOD' },
  { label: '胶片野餐', scene: 'DAILY' },
  { label: '城市夜行', scene: 'PARTY' },
];

const journey = [
  {
    icon: <PhotoLibraryRoundedIcon />,
    title: '批量上传照片',
    text: '读取照片尺寸、方向和选择顺序，为智能推荐做好准备。',
  },
  {
    icon: <GridViewRoundedIcon />,
    title: '排版方案智能推荐',
    text: '生成故事感、氛围感和高光优先三套可解释方案。',
  },
  {
    icon: <TextFieldsRoundedIcon />,
    title: '微调并生成文案',
    text: '自由换位，选择更自然的朋友圈短句并导出。',
  },
];

const rejectionLabels: Record<RejectionReason, string> = {
  UNSUPPORTED_TYPE: '格式不支持',
  LIMIT_EXCEEDED: '超过 50 张上限',
  DECODE_FAILED: '图片无法读取',
};

function rejectionNotice(acceptedCount: number, reasons: RejectionReason[]) {
  const counts = reasons.reduce<Partial<Record<RejectionReason, number>>>((result, reason) => {
    result[reason] = (result[reason] ?? 0) + 1;
    return result;
  }, {});
  const details = (Object.keys(rejectionLabels) as RejectionReason[])
    .filter((reason) => counts[reason])
    .map((reason) => `${rejectionLabels[reason]} ${counts[reason]} 张`)
    .join('、');
  return `已接收 ${acceptedCount} 张，跳过 ${reasons.length} 张（${details}）。请确认后继续分析。`;
}

function revokePreviews(photos: PhotoAsset[]) {
  if (typeof URL.revokeObjectURL !== 'function') return;
  photos.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
}

export function UploadPage() {
  const navigate = useNavigate();
  const setPhotos = useWorkflowStore((state) => state.setPhotos);
  const activeScene = useWorkflowStore((state) => state.scene);
  const setScene = useWorkflowStore((state) => state.setScene);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<PhotoAsset[]>([]);
  const importLockRef = useRef(false);
  const ownedPendingRef = useRef<PhotoAsset[]>([]);
  const mountedRef = useRef(true);
  const batchTokenRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      batchTokenRef.current += 1;
      revokePreviews(ownedPendingRef.current);
      ownedPendingRef.current = [];
    };
  }, []);

  const discardPending = () => {
    revokePreviews(ownedPendingRef.current);
    ownedPendingRef.current = [];
    setPendingPhotos([]);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0 || importLockRef.current) return;
    importLockRef.current = true;
    const batchToken = ++batchTokenRef.current;
    setBusy(true);
    setError(null);
    discardPending();

    try {
      const result = await ingestPhotoFiles(files);
      if (!mountedRef.current || batchToken !== batchTokenRef.current) {
        revokePreviews(result.accepted);
        return;
      }

      if (result.accepted.length === 0) {
        setError('请选择 JPG、PNG 或 WebP 图片；单次最多支持 50 张。');
        return;
      }

      if (result.rejected.length > 0) {
        ownedPendingRef.current = result.accepted;
        setPendingPhotos(result.accepted);
        setError(rejectionNotice(
          result.accepted.length,
          result.rejected.map(({ reason }) => reason),
        ));
        return;
      }

      setPhotos(result.accepted);
      navigate('/analyzing');
    } finally {
      if (batchToken === batchTokenRef.current) {
        importLockRef.current = false;
        if (mountedRef.current) setBusy(false);
      }
    }
  };

  const continueAnalysis = () => {
    if (pendingPhotos.length === 0) return;
    const accepted = pendingPhotos;
    ownedPendingRef.current = [];
    setPendingPhotos([]);
    setError(null);
    setPhotos(accepted);
    navigate('/analyzing');
  };

  return (
    <Box className="upload-page">
      <Box className="upload-hero">
        <Stack spacing={2.25} alignItems="flex-start">
          <Chip icon={<AutoAwesomeRoundedIcon />} label="AI 摄影整理助手" color="primary" />
          <Typography component="h1" variant="h1">
            把这一刻，<br />排成更好看的朋友圈
          </Typography>
          <Typography color="text.secondary" fontSize={{ xs: 15, sm: 18 }} maxWidth={560}>
            上传照片，自动帮你挑选、排序、构图并生成自然文案。推荐可解释，也随时可以自己调整。
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" aria-label="即刻预设风格">
            {presets.map((preset) => (
              <Chip
                key={preset.scene}
                label={preset.label}
                color={activeScene === preset.scene ? 'primary' : 'default'}
                icon={activeScene === preset.scene ? <CheckCircleRoundedIcon /> : undefined}
                onClick={() => setScene(preset.scene)}
              />
            ))}
          </Stack>
        </Stack>
        <PhotoDropzone onFiles={handleFiles} busy={busy} />
      </Box>

      {error && (
        <Alert
          severity="warning"
          role="alert"
          className="upload-alert"
          action={pendingPhotos.length > 0 ? (
            <Button color="inherit" size="small" onClick={continueAnalysis}>
              继续分析
            </Button>
          ) : undefined}
        >
          {error}
        </Alert>
      )}

      <Box className="upload-content-grid">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Box className="section-dot" />
            <Typography component="h2" variant="h5" fontWeight={700}>
              3 步搞定朋友圈排版
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {journey.map((step, index) => (
              <Paper key={step.title} className="journey-card" elevation={0}>
                <Box className="journey-number">{index + 1}</Box>
                <Box className="journey-icon" aria-hidden="true">{step.icon}</Box>
                <Box>
                  <Typography fontWeight={700}>{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {step.text}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography component="h2" variant="h5" fontWeight={700}>
            精选九宫格排版预览
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} mb={2}>
            光影和谐 · 节奏舒缓 · 留白自然
          </Typography>
          <MomentsPreview />
        </Box>
      </Box>

      <Stack className="privacy-note" direction="row" spacing={0.75} alignItems="center" justifyContent="center">
        <LockRoundedIcon fontSize="small" />
        <Typography variant="body2">本地优先预览；首个版本只向服务端发送图片元数据</Typography>
      </Stack>
    </Box>
  );
}
