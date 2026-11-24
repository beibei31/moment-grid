import { Stack, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AnalysisPage } from '../features/analysis/AnalysisPage';
import { EditorPage } from '../features/editor/EditorPage';
import { ExportPage } from '../features/export/ExportPage';
import { RecommendationsPage } from '../features/recommendations/RecommendationsPage';
import { UploadPage } from '../features/upload/UploadPage';
import { AppShell } from './AppShell';
import { RouteGuard } from './RouteGuard';

function StepPlaceholder({ title }: { title: string }) {
  return (
    <Stack className="placeholder-page" spacing={2}>
      <Typography component="h1" variant="h2">
        {title}
      </Typography>
      <Typography color="text.secondary">页面组件将在后续任务接入真实工作流。</Typography>
    </Stack>
  );
}

const guarded = (title: string) => (
  <RouteGuard>
    <StepPlaceholder title={title} />
  </RouteGuard>
);

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/analyzing" element={<RouteGuard><AnalysisPage /></RouteGuard>} />
        <Route path="/recommendations" element={<RouteGuard><RecommendationsPage /></RouteGuard>} />
        <Route path="/editor" element={<RouteGuard><EditorPage /></RouteGuard>} />
        <Route path="/export" element={<RouteGuard><ExportPage /></RouteGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
