import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisResult, CaptionCandidate } from '../../shared/api/contracts';
import { useWorkflowStore, type PhotoAsset } from '../../store/workflowStore';
import { ExportPage } from './ExportPage';

const photos: PhotoAsset[] = Array.from({ length: 9 }, (_, index) => ({
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

const captions: CaptionCandidate[] = [
  { id: 'minimal', style: 'MINIMAL', text: '今日份晴天与咖啡。', reason: '高级留白' },
  { id: 'natural', style: 'NATURAL', text: '把光线最好的下午，分成了九个小格子。', reason: '自然口语' },
  { id: 'story', style: 'STORY', text: '没有计划的周末，因为这些照片被好好记住。', reason: '真实叙事' },
  { id: 'humor', style: 'HUMOR', text: '九张图，没有一张是凑数的。', reason: '轻松幽默' },
  { id: 'poetic', style: 'POETIC', text: '日光在墙上写诗，快门是我的注脚。', reason: '克制诗意' },
  { id: 'info', style: 'INFORMATIONAL', text: '今日记录：散步、咖啡和一场日落。', reason: '信息清楚' },
];

const analysis: AnalysisResult = {
  engineVersion: 'metadata-mvp-v1',
  excludedCount: 0,
  captions,
  plans: [
    {
      id: 'story-plan',
      kind: 'STORY',
      title: '故事感方案',
      summary: '九图叙事',
      confidence: 0.98,
      assetIds: photos.map(({ id }) => id),
      reasons: ['顺序清楚'],
    },
  ],
};

describe('ExportPage', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
    useWorkflowStore.getState().setPhotos(photos);
    useWorkflowStore.getState().setAnalysis(analysis);
    useWorkflowStore.getState().selectPlan('story-plan');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows all six caption styles and stores a selected caption', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ExportPage /></MemoryRouter>);

    for (const label of ['极简', '自然', '叙事', '幽默', '诗意', '信息']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: `选用文案：${captions[4].text}` }));
    expect(useWorkflowStore.getState().selectedCaptionId).toBe('poetic');
  });

  it('shows the exact nine-photo publish order', () => {
    render(<MemoryRouter><ExportPage /></MemoryRouter>);

    expect(screen.getByText('1 左上')).toBeInTheDocument();
    expect(screen.getByText('5 中心')).toBeInTheDocument();
    expect(screen.getByText('9 右下')).toBeInTheDocument();
  });

  it('shows recoverable feedback when clipboard access fails', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<MemoryRouter><ExportPage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: '复制当前文案' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('无法访问剪贴板');
  });

  it('exports a three-photo selection with the six-grid layout chosen in the editor', async () => {
    const user = userEvent.setup();
    const threePhotos = photos.slice(0, 3);
    useWorkflowStore.getState().setPhotos(threePhotos);
    useWorkflowStore.getState().setAnalysis({
      ...analysis,
      plans: [{ ...analysis.plans[0], assetIds: threePhotos.map(({ id }) => id) }],
    });
    useWorkflowStore.getState().selectPlan('story-plan');
    useWorkflowStore.getState().setLayoutCount(6);

    class LoadedImage {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', LoadedImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    let exportedSize: [number, number] | null = null;
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback) {
      exportedSize = [this.width, this.height];
      callback(new Blob(['png'], { type: 'image/png' }));
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const { container } = render(<MemoryRouter><ExportPage /></MemoryRouter>);
    expect(container.querySelector('.export-photo-grid')).toHaveClass('count-6');
    await user.click(screen.getByRole('button', { name: '导出高清图片' }));

    expect(exportedSize).toEqual([1080, 720]);
    expect(await screen.findByRole('alert')).toHaveTextContent('PNG 已生成');
  });
});
