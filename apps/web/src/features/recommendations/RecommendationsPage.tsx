import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import { useWorkflowStore } from '../../store/workflowStore';
import { RecommendationCard } from './RecommendationCard';

export function RecommendationsPage() {
  const navigate = useNavigate();
  const photos = useWorkflowStore((state) => state.photos);
  const analysis = useWorkflowStore((state) => state.analysis);
  const selectPlan = useWorkflowStore((state) => state.selectPlan);

  if (!analysis) {
    return <Navigate to="/analyzing" replace />;
  }

  const select = (planId: string) => {
    selectPlan(planId);
    navigate('/editor');
  };

  return (
    <Box className="recommendations-page">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <IconButton aria-label="返回分析页" onClick={() => navigate('/analyzing')}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeRoundedIcon color="primary" />
              <Typography component="h1" variant="h4" fontWeight={800}>
                智能方案推荐
              </Typography>
            </Stack>
            <Typography color="text.secondary" mt={0.5}>
              已从 {photos.length} 张照片中整理出 {analysis.plans.length} 套方案
            </Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<TuneRoundedIcon />} onClick={() => navigate('/')}>
          重新选片
        </Button>
      </Stack>

      <Alert severity="info" icon={<CleaningServicesRoundedIcon />} className="recommendation-summary">
        三套方案均未选用 {analysis.excludedCount} 张照片。当前使用 {analysis.engineVersion}，不会声称识别尚未接入的人脸或美学特征。
      </Alert>

      <Box className="recommendation-cards">
        {analysis.plans.map((plan) => (
          <RecommendationCard key={plan.id} plan={plan} photos={photos} onSelect={() => select(plan.id)} />
        ))}
      </Box>
    </Box>
  );
}
