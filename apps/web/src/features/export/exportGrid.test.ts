import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PhotoAsset } from '../../store/workflowStore';
import { exportGrid, gridDimensions } from './exportGrid';

const photo: PhotoAsset = {
  id: 'asset-1',
  file: new File(['photo'], 'one.jpg', { type: 'image/jpeg' }),
  previewUrl: 'blob:one',
  name: 'one.jpg',
  mimeType: 'image/jpeg',
  size: 100,
  width: 800,
  height: 600,
  originalIndex: 0,
};

describe('gridDimensions', () => {
  it.each([
    [1, { width: 1080, height: 1080, columns: 1, rows: 1 }],
    [4, { width: 1080, height: 1080, columns: 2, rows: 2 }],
    [6, { width: 1080, height: 720, columns: 3, rows: 2 }],
    [9, { width: 1080, height: 1080, columns: 3, rows: 3 }],
  ] as const)('returns exact canvas dimensions for %s photos', (layout, expected) => {
    expect(gridDimensions(layout)).toEqual(expected);
  });
});

describe('exportGrid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders selected photos into a PNG blob', async () => {
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
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['png'], { type: 'image/png' }));
    });

    const result = await exportGrid([photo], 1);

    expect(result.type).toBe('image/png');
  });

  it('reports a useful error when a preview cannot be decoded', async () => {
    class BrokenImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Image', BrokenImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    await expect(exportGrid([photo], 1)).rejects.toThrow('无法读取照片 one.jpg');
  });
});
