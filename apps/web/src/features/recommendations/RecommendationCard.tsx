import { useState } from 'react';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FaceRoundedIcon from '@mui/icons-material/FaceRounded';
import FilterDramaRoundedIcon from '@mui/icons-material/FilterDramaRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import { Box, Button, Card, Chip, Collapse, Divider, Stack, Typography } from '@mui/material';

import type { RecommendationPlan } from '../../shared/api/contracts';
import type { PhotoAsset } from '../../store/workflowStore';
import { RecommendationGrid } from './RecommendationGrid';

const meta = {
  STORY: { eyebrow: '官方推荐', icon: <AutoStoriesRoundedIcon />, accent: 'primary' as const },
  MOOD: { eyebrow: '杂志感版式', icon: <FilterDramaRoundedIcon />, accent: 'secondary' as const },
  PEOPLE: { eyebrow: '高光画面', icon: <FaceRoundedIcon />, accent: 'default' as const },
};

interface RecommendationCardProps {
  plan: RecommendationPlan;
  photos: PhotoAsset[];
  onSelect: () => void;
}

export function RecommendationCard({ plan, photos, onSelect }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cardMeta = meta[plan.kind];

  return (
    <Card className={`recommendation-card kind-${plan.kind.toLowerCase()}`}>
      <Box className="recommendation-card-head">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box className="plan-icon" aria-hidden="true">{cardMeta.icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {cardMeta.eyebrow}
            </Typography>
            <Typography component="h2" variant="h5" fontWeight={800}>
              {plan.title}
            </Typography>
          </Box>
        </Stack>
        <Chip color={cardMeta.accent} label={`契合度 ${Math.round(plan.confidence * 100)}%`} size="small" />
      </Box>

      <Typography color="text.secondary" mt={1} mb={2}>
        精选 {plan.assetIds.length} 张
      </Typography>
      <RecommendationGrid assetIds={plan.assetIds} photos={photos} />
      <Typography mt={2} lineHeight={1.75}>
        {plan.summary}
      </Typography>

      <Button
        color="inherit"
        size="small"
        startIcon={<PsychologyRoundedIcon />}
        endIcon={<ExpandMoreRoundedIcon className={expanded ? 'rotate-180' : ''} />}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        sx={{ mt: 1, px: 0 }}
      >
        为什么这样选
      </Button>
      <Collapse in={expanded}>
        <Stack component="ul" spacing={0.75} className="reason-list">
          {plan.reasons.map((reason) => (
            <Typography component="li" variant="body2" color="text.secondary" key={reason}>
              {reason}
            </Typography>
          ))}
        </Stack>
      </Collapse>

      <Divider sx={{ my: 2 }} />
      <Button fullWidth variant={plan.kind === 'STORY' ? 'contained' : 'outlined'} endIcon={<ArrowForwardRoundedIcon />} onClick={onSelect}>
        使用{plan.title}
      </Button>
    </Card>
  );
}
