import { useState } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';

import type { CaptionCandidate, CaptionStyle } from '../../shared/api/contracts';

const styles: Array<{ value: CaptionStyle; label: string }> = [
  { value: 'MINIMAL', label: '极简' },
  { value: 'NATURAL', label: '自然' },
  { value: 'STORY', label: '叙事' },
  { value: 'HUMOR', label: '幽默' },
  { value: 'POETIC', label: '诗意' },
  { value: 'INFORMATIONAL', label: '信息' },
];

const labelByStyle = Object.fromEntries(styles.map(({ value, label }) => [value, label])) as Record<CaptionStyle, string>;

interface CaptionListProps {
  captions: CaptionCandidate[];
  selectedId: string | null;
  onSelect: (captionId: string) => void;
  onCopy: (text: string) => void;
}

export function CaptionList({ captions, selectedId, onSelect, onCopy }: CaptionListProps) {
  const [filter, setFilter] = useState<CaptionStyle | null>(null);
  const visible = filter ? captions.filter(({ style }) => style === filter) : captions;

  return (
    <Box>
      <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" mb={2}>
        {styles.map(({ value, label }) => (
          <Chip
            key={value}
            label={label}
            color={filter === value ? 'primary' : 'default'}
            onClick={() => setFilter((current) => current === value ? null : value)}
          />
        ))}
      </Stack>
      <Stack spacing={1.5}>
        {visible.map((caption) => {
          const selected = caption.id === selectedId;
          return (
            <Card key={caption.id} className={`caption-card${selected ? ' is-selected' : ''}`}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={labelByStyle[caption.style]} size="small" color={selected ? 'primary' : 'default'} />
                {selected && <CheckCircleRoundedIcon color="primary" fontSize="small" />}
              </Stack>
              <Typography my={1.5} lineHeight={1.75}>“{caption.text}”</Typography>
              <Typography variant="caption" color="text.secondary">{caption.reason}</Typography>
              <Stack direction="row" gap={1} mt={1.5}>
                <Button size="small" variant={selected ? 'contained' : 'outlined'} onClick={() => onSelect(caption.id)} aria-label={`选用文案：${caption.text}`}>
                  {selected ? '当前采用' : '选用'}
                </Button>
                <Button size="small" color="inherit" startIcon={<ContentCopyRoundedIcon />} onClick={() => onCopy(caption.text)}>
                  复制
                </Button>
                <Button size="small" color="inherit" startIcon={<FavoriteBorderRoundedIcon />} disabled>
                  收藏
                </Button>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
