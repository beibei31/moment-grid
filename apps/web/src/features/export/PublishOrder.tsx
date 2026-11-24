import { Box, Stack, Typography } from '@mui/material';

import type { PhotoAsset } from '../../store/workflowStore';

const positionLabels: Record<number, string[]> = {
  1: ['封面'],
  4: ['左上', '右上', '左下', '右下'],
  6: ['左上', '中上', '右上', '左下', '中下', '右下'],
  9: ['左上', '中上', '右上', '正左', '中心', '正右', '左下', '中下', '右下'],
};

export function PublishOrder({ photos }: { photos: PhotoAsset[] }) {
  const labels = positionLabels[photos.length] ?? photos.map(() => '顺序');

  return (
    <Box className="publish-order">
      <Typography component="h2" variant="h6" fontWeight={800} mb={1.5}>
        图片发布序列核对
      </Typography>
      <Box className="publish-order-grid">
        {photos.map((photo, index) => (
          <Stack key={photo.id} alignItems="center" spacing={0.75}>
            <Box className="publish-order-photo">
              <img src={photo.previewUrl} alt={photo.name} />
              <span>{index + 1}</span>
            </Box>
            <Typography variant="caption" fontWeight={700}>{index + 1} {labels[index]}</Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
