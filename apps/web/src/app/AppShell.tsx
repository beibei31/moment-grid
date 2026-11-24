import type { PropsWithChildren } from 'react';
import AutoAwesomeMosaicRoundedIcon from '@mui/icons-material/AutoAwesomeMosaicRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { Box, IconButton, Stack, Typography } from '@mui/material';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <Box className="app-shell">
      <Box component="header" className="app-header">
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box className="brand-mark" aria-hidden="true">
            <AutoAwesomeMosaicRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography component="div" fontWeight={700} lineHeight={1.1}>
              拾光排版
            </Typography>
            <Typography component="div" variant="caption" color="text.secondary">
              Moments Studio
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <IconButton aria-label="排版灵感" size="small">
            <LightbulbRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="应用设置" size="small">
            <TuneRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Box component="main" className="app-main">
        {children}
      </Box>
      <Box component="footer" className="app-footer">
        <HistoryRoundedIcon fontSize="small" />
        <Typography variant="caption">作品会在当前浏览器会话中保留</Typography>
      </Box>
    </Box>
  );
}
