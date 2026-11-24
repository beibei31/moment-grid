import { Box } from '@mui/material';

import type { PhotoAsset } from '../../store/workflowStore';

interface RecommendationGridProps {
  assetIds: string[];
  photos: PhotoAsset[];
}

export function RecommendationGrid({ assetIds, photos }: RecommendationGridProps) {
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));
  const selected = assetIds.flatMap((id) => {
    const photo = photoById.get(id);
    return photo ? [photo] : [];
  });
  const columns = selected.length === 1 ? 1 : selected.length <= 4 ? 2 : 3;

  return (
    <Box
      className="recommendation-grid"
      sx={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-label={`${selected.length} 张照片预览`}
    >
      {selected.map((photo, index) => (
        <Box key={photo.id} className="recommendation-photo">
          <img src={photo.previewUrl} alt={`${photo.name}，位置 ${index + 1}`} />
          <Box className="recommendation-position">{index + 1}</Box>
        </Box>
      ))}
    </Box>
  );
}
