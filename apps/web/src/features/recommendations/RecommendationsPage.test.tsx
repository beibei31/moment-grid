import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisResult } from '../../shared/api/contracts';
import { useWorkflowStore, type PhotoAsset } from '../../store/workflowStore';
import { RecommendationsPage } from './RecommendationsPage';

const photos: PhotoAsset[] = Array.from({ length: 5 }, (_, index) => ({
  id: `asset-${index + 1}`,
  file: new File(['photo'], `${index + 1}.jpg`, { type: 'image/jpeg' }),
  previewUrl: `blob:photo-${index + 1}`,
  name: `${index + 1}.jpg`,
  mimeType: 'image/jpeg',
  size: 100 + index,
  width: 1080,
  height: 1080,
  originalIndex: index,
}));

const analysis: AnalysisResult = {
  engineVersion: 'metadata-mvp-v1',
  excludedCount: 2,
  captions: [],
  plans: [
    {
      id: 'story',
      kind: 'STORY',
      title: '故事感方案',
      summary: '从开场到收尾，保持浏览节奏。',
      confidence: 0.98,
      assetIds: ['asset-1', 'asset-2', 'asset-3', 'asset-4', 'asset-5'],
      reasons: ['第 1 张适合作为开场', '最高分照片位于视觉中心'],
    },
    {
      id: 'mood',
      kind: 'MOOD',
      title: '氛围感方案',
      summary: '优先统一的比例和视觉密度。',
      confidence: 0.94,
      assetIds: ['asset-2', 'asset-3', 'asset-4', 'asset-5'],
      reasons: ['画面比例更接近'],
    },
    {
      id: 'people',
      kind: 'PEOPLE',
      title: '高光优先方案',
      summary: '视觉模型接入前，仅依据元数据评分。',
      confidence: 0.91,
      assetIds: ['asset-4'],
      reasons: ['分辨率和版式适配度较高'],
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/recommendations']}>
      <Routes>
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/editor" element={<h1>九宫格编辑器</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RecommendationsPage', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
    useWorkflowStore.getState().setPhotos(photos);
    useWorkflowStore.getState().setAnalysis(analysis);
  });

  it('shows three distinct plans with actual available photo counts and previews', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '故事感方案' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '氛围感方案' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '高光优先方案' })).toBeInTheDocument();
    expect(screen.getByText('精选 5 张')).toBeInTheDocument();
    expect(screen.getByText('精选 4 张')).toBeInTheDocument();
    expect(screen.getByText('精选 1 张')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(10);
    expect(screen.getAllByRole('img').every((image) => image.getAttribute('src')?.startsWith('blob:'))).toBe(true);
  });

  it('expands human-readable selection reasons', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: '为什么这样选' })[0]);

    expect(screen.getByText('第 1 张适合作为开场')).toBeInTheDocument();
    expect(screen.getByText('最高分照片位于视觉中心')).toBeInTheDocument();
  });

  it('stores the selected plan and opens the editor', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '使用故事感方案' }));

    expect(await screen.findByRole('heading', { name: '九宫格编辑器' })).toBeInTheDocument();
    expect(useWorkflowStore.getState()).toMatchObject({
      selectedPlanId: 'story',
      orderedAssetIds: analysis.plans[0].assetIds,
    });
  });
});
