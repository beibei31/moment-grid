import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AnalysisResult } from '../../shared/api/contracts';
import { useWorkflowStore, type PhotoAsset } from '../../store/workflowStore';
import { EditorPage } from './EditorPage';

const photos: PhotoAsset[] = Array.from({ length: 6 }, (_, index) => ({
  id: `asset-${index + 1}`,
  file: new File(['photo'], `${index + 1}.jpg`, { type: 'image/jpeg' }),
  previewUrl: `blob:photo-${index + 1}`,
  name: `${index + 1}.jpg`,
  mimeType: 'image/jpeg',
  size: 100,
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
      summary: '稳定故事顺序',
      confidence: 0.98,
      assetIds: ['asset-1', 'asset-2', 'asset-3', 'asset-4'],
      reasons: ['顺序清晰'],
    },
  ],
};

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={['/editor']}>
      <Routes>
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/export" element={<h1>文案与导出</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EditorPage', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
    useWorkflowStore.getState().setPhotos(photos);
    useWorkflowStore.getState().setAnalysis(analysis);
    useWorkflowStore.getState().selectPlan('story');
  });

  it('switches layouts and safely uses only available photos', async () => {
    const user = userEvent.setup();
    renderEditor();
    const grid = screen.getByLabelText('编辑网格');

    expect(within(grid).getAllByRole('img')).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: '6 格' }));
    expect(within(grid).getAllByRole('img')).toHaveLength(6);
    expect(useWorkflowStore.getState().layoutCount).toBe(6);
    await user.click(screen.getByRole('button', { name: '9 格' }));
    expect(within(grid).getAllByRole('img')).toHaveLength(6);
  });

  it('selects a position and replaces it without duplicate asset ids', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: '选择 1.jpg，位置 1' }));
    expect(screen.getByRole('button', { name: '选择 1.jpg，位置 1' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '用 5.jpg 替换' }));

    expect(useWorkflowStore.getState().orderedAssetIds).toEqual([
      'asset-5',
      'asset-2',
      'asset-3',
      'asset-4',
    ]);
    expect(new Set(useWorkflowStore.getState().orderedAssetIds).size).toBe(4);
  });

  it('supports keyboard-friendly movement and opens caption export', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: '将 2.jpg 上移' }));
    expect(useWorkflowStore.getState().orderedAssetIds.slice(0, 2)).toEqual(['asset-2', 'asset-1']);

    await user.click(screen.getByRole('button', { name: '下一步：生成朋友圈文案' }));
    expect(await screen.findByRole('heading', { name: '文案与导出' })).toBeInTheDocument();
  });
});
