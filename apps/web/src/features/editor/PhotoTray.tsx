import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

import type { PhotoAsset } from '../../store/workflowStore';

interface PhotoTrayProps {
  candidates: PhotoAsset[];
  canReplace: boolean;
  onReplace: (assetId: string) => void;
}

export function PhotoTray({ candidates, canReplace, onReplace }: PhotoTrayProps) {
  return (
    <Box className="photo-tray">
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <AddPhotoAlternateRoundedIcon color="primary" />
        <Box>
          <Typography component="h2" fontWeight={800}>候选照片</Typography>
          <Typography variant="caption" color="text.secondary">先选中网格位置，再选择替换图</Typography>
        </Box>
      </Stack>
      {candidates.length === 0 ? (
        <Typography variant="body2" color="text.secondary">当前所有照片都已在网格中。</Typography>
      ) : (
        <Stack spacing={1}>
          {candidates.map((photo) => (
            <Box className="tray-photo" key={photo.id}>
              <img src={photo.previewUrl} alt={photo.name} />
              <Button size="small" disabled={!canReplace} onClick={() => onReplace(photo.id)} aria-label={`用 ${photo.name} 替换`}>
                替换
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
