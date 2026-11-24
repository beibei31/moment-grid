import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { Avatar, Box, Stack, Typography } from '@mui/material';

const tileClasses = [
  'forest',
  'coffee',
  'portrait',
  'window',
  'notebook',
  'shadow',
  'dessert',
  'sunset',
  'walk',
];

export function MomentsPreview() {
  return (
    <Box className="moments-card">
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar className="sample-avatar">拾</Avatar>
        <Box>
          <Typography color="primary" fontWeight={700}>
            林间漫步者
          </Typography>
          <Typography variant="caption" color="text.secondary">
            28 分钟前 · 杭州
          </Typography>
        </Box>
      </Stack>
      <Typography my={1.5} lineHeight={1.7}>
        把夏天收集进取景框里。风穿过树林，咖啡馆的冰块融得刚刚好。🌿
      </Typography>
      <Box className="sample-grid" aria-label="九宫格排版示例">
        {tileClasses.map((className, index) => (
          <Box key={className} className={`sample-tile ${className}`} aria-label={`示例照片 ${index + 1}`} />
        ))}
      </Box>
      <Stack direction="row" justifyContent="space-between" mt={1.5} color="text.secondary">
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LocationOnRoundedIcon fontSize="small" />
          <Typography variant="caption">良渚文化艺术村</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <FavoriteBorderRoundedIcon fontSize="small" />
          <Typography variant="caption">42</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
