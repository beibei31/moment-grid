import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisResult, AssetInput } from './contracts';
import { analyzeProject, createProject } from './momentGridApi';

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

const assets: AssetInput[] = [
  {
    id: 'asset-1',
    name: 'summer.jpg',
    mimeType: 'image/jpeg',
    size: 128,
    width: 1080,
    height: 1080,
    originalIndex: 0,
  },
];

const analysis: AnalysisResult = {
  engineVersion: 'metadata-mvp-v1',
  excludedCount: 0,
  plans: [],
  captions: [],
};

describe('momentGridApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a daily project through the versioned API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ projectId: 'project-1', status: 'DRAFT' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createProject()).resolves.toEqual({ projectId: 'project-1', status: 'DRAFT' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene: 'DAILY' }),
      signal: undefined,
    });
  });

  it('passes the selected scene when creating a project', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ projectId: 'project-1', status: 'DRAFT' }));
    vi.stubGlobal('fetch', fetchMock);

    await createProject('TRAVEL');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/projects', expect.objectContaining({
      body: JSON.stringify({ scene: 'TRAVEL' }),
    }));
  });

  it('posts exact photo metadata to the project analysis endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(analysis));
    vi.stubGlobal('fetch', fetchMock);

    await expect(analyzeProject('project-1', assets)).resolves.toEqual(analysis);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/projects/project-1/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets }),
      signal: undefined,
    });
  });

  it('surfaces the API error message instead of a generic fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ code: 'INVALID_ASSETS', message: '至少需要一张照片' }, 400)),
    );

    await expect(analyzeProject('project-1', [])).rejects.toThrow('至少需要一张照片');
  });

  it('turns a network failure into a recoverable localized error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(createProject()).rejects.toMatchObject({
      message: '无法连接分析服务，请确认后端已启动后重试',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });
});
