import CropRoundedIcon from '@mui/icons-material/CropRounded';
import DrawRoundedIcon from '@mui/icons-material/DrawRounded';
import FilterVintageRoundedIcon from '@mui/icons-material/FilterVintageRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import { Button, Chip, Stack, Tooltip } from '@mui/material';

import type { LayoutCount } from './gridLayout';

interface EditorToolbarProps {
  layoutCount: LayoutCount;
  onLayoutChange: (count: LayoutCount) => void;
}

const layoutOptions: LayoutCount[] = [1, 4, 6, 9];

export function EditorToolbar({ layoutCount, onLayoutChange }: EditorToolbarProps) {
  return (
    <Stack className="editor-toolbar" direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
      <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" alignItems="center">
        <Chip icon={<GridViewRoundedIcon />} label="网格布局" />
        {layoutOptions.map((count) => (
          <Button
            key={count}
            size="small"
            variant={layoutCount === count ? 'contained' : 'outlined'}
            onClick={() => onLayoutChange(count)}
          >
            {count} 格
          </Button>
        ))}
      </Stack>
      <Stack direction="row" gap={0.5} useFlexGap flexWrap="wrap">
        <Tooltip title="将在下一阶段接入非破坏裁剪">
          <span><Button disabled startIcon={<CropRoundedIcon />}>裁剪</Button></span>
        </Tooltip>
        <Tooltip title="将在下一阶段接入真实滤镜">
          <span><Button disabled startIcon={<FilterVintageRoundedIcon />}>滤镜</Button></span>
        </Tooltip>
        <Tooltip title="将在下一阶段接入涂鸦与贴纸">
          <span><Button disabled startIcon={<DrawRoundedIcon />}>贴纸文字</Button></span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
