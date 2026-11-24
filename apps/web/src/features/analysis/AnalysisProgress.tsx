import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ImageSearchRoundedIcon from '@mui/icons-material/ImageSearchRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';

const stages = [
  {
    label: '读取照片元数据',
    detail: '读取文件名、格式、尺寸与用户选择顺序',
    icon: <ImageSearchRoundedIcon />,
    threshold: 0,
  },
  {
    label: '校验照片清单',
    detail: '校验图片 ID，避免重复输入并保留原始顺序',
    icon: <FactCheckRoundedIcon />,
    threshold: 25,
  },
  {
    label: '计算版式适配分数',
    detail: '依据尺寸比例、分辨率与文件大小进行确定性排序',
    icon: <StraightenRoundedIcon />,
    threshold: 50,
  },
  {
    label: '生成 3 套排版方案',
    detail: '故事感、氛围感与高光优先',
    icon: <GridViewRoundedIcon />,
    threshold: 75,
  },
];

export function AnalysisProgress({ progress }: { progress: number }) {
  return (
    <Stack spacing={2}>
      {stages.map((stage, index) => {
        const complete = progress >= (index + 1) * 25;
        const active = progress >= stage.threshold && !complete;
        return (
          <Paper
            key={stage.label}
            elevation={0}
            className={`analysis-stage${active ? ' is-active' : ''}${complete ? ' is-complete' : ''}`}
          >
            <Box className="analysis-stage-icon" aria-hidden="true">
              {complete ? <CheckCircleRoundedIcon /> : stage.icon}
            </Box>
            <Box flex={1} minWidth={0}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Typography fontWeight={700}>{stage.label}</Typography>
                <Typography variant="caption" color={complete ? 'primary' : 'text.secondary'}>
                  {complete ? '已完成' : active ? '分析中' : '等待中'}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.4}>
                {stage.detail}
              </Typography>
              {active && <LinearProgress className="stage-progress" />}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}
