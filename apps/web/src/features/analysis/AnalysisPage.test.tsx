import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisResult } from '../../shared/api/contracts';
import { analyzeProject, createProject, MomentGridApiError } from '../../shared/api/momentGridApi';
import { useWorkflowStore, type PhotoAsset } from '../../store/workflowStore';
import { AnalysisPage } from './AnalysisPage';

vi.mock('../../shared/api/momentGridApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../shared/api/momentGridApi')>(),
  createProject: vi.fn(),
  analyzeProject: vi.fn(),
}));

const photo: PhotoAsset = {
  id: 'asset-1',
  file: new File(['photo'], 'summer.jpg', { type: 'image/jpeg' }),
  previewUrl: 'blob:summer',
  name: 'summer.jpg',
  mimeType: 'image/jpeg',
  size: 5,
  width: 1080,
  height: 1080,
  originalIndex: 0,
};

const analysis: AnalysisResult = {
  engineVersion: 'metadata-mvp-v1',
  excludedCount: 0,
  plans: [
    {
      id: 'story',
      kind: 'STORY',
      title: '故事感方案',
      summary: '按顺序讲故事',
      confidence: 0.98,
      assetIds: ['asset-1'],
      reasons: ['封面清晰'],
    },
  ],
  captions: [],
};

function renderAnalysisPage() {
  return render(
    <MemoryRouter initialEntries={['/analyzing']}>
      <Routes>
        <Route path="/analyzing" element={<AnalysisPage />} />
        <Route path="/recommendations" element={<h1>智能方案推荐</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AnalysisPage', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
    useWorkflowStore.getState().setPhotos([photo]);
    vi.mocked(createProject).mockReset();
    vi.mocked(analyzeProject).mockReset();
    vi.mocked(createProject).mockResolvedValue({ projectId: 'project-1', status: 'DRAFT' });
  });

  it('shows all four approved analysis stages while work is pending', async () => {
    vi.mocked(analyzeProject).mockReturnValue(new Promise(() => undefined));
    renderAnalysisPage();

    expect(await screen.findByText('读取照片元数据')).toBeInTheDocument();
    expect(screen.getByText('校验照片清单')).toBeInTheDocument();
    expect(screen.getByText('计算版式适配分数')).toBeInTheDocument();
    expect(screen.getByText('生成 3 套排版方案')).toBeInTheDocument();
  });

  it('stores analysis and navigates once the API succeeds', async () => {
    vi.mocked(analyzeProject).mockResolvedValue(analysis);
    renderAnalysisPage();

    expect(await screen.findByRole('heading', { name: '智能方案推荐' })).toBeInTheDocument();
    expect(useWorkflowStore.getState()).toMatchObject({
      projectId: 'project-1',
      analysis,
    });
  });

  it('keeps photos and retries after an API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(analyzeProject).mockRejectedValueOnce(new Error('服务暂时不可用')).mockResolvedValueOnce(analysis);
    renderAnalysisPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂时不可用');
    expect(useWorkflowStore.getState().photos).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '重新分析' }));
    expect(await screen.findByRole('heading', { name: '智能方案推荐' })).toBeInTheDocument();
    expect(analyzeProject).toHaveBeenCalledTimes(2);
  });

  it('recreates one stale in-memory project and retries analysis once', async () => {
    useWorkflowStore.getState().setProjectId('stale-project');
    vi.mocked(analyzeProject)
      .mockRejectedValueOnce(new MomentGridApiError('项目不存在', 404, 'PROJECT_NOT_FOUND'))
      .mockResolvedValueOnce(analysis);
    vi.mocked(createProject).mockResolvedValueOnce({ projectId: 'fresh-project', status: 'DRAFT' });

    renderAnalysisPage();

    expect(await screen.findByRole('heading', { name: '智能方案推荐' })).toBeInTheDocument();
    expect(createProject).toHaveBeenCalledOnce();
    expect(analyzeProject).toHaveBeenNthCalledWith(
      1,
      'stale-project',
      expect.any(Array),
      expect.any(AbortSignal),
    );
    expect(analyzeProject).toHaveBeenNthCalledWith(
      2,
      'fresh-project',
      expect.any(Array),
      expect.any(AbortSignal),
    );
    expect(useWorkflowStore.getState().projectId).toBe('fresh-project');
  });

  it('aborts pending API work when leaving the page', async () => {
    vi.mocked(createProject).mockReturnValue(new Promise(() => undefined));
    const view = renderAnalysisPage();
    await vi.waitFor(() => expect(createProject).toHaveBeenCalledOnce());
    const signal = vi.mocked(createProject).mock.calls[0][1];

    view.unmount();

    expect(signal?.aborted).toBe(true);
  });
});
