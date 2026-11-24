import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ingestPhotoFiles } from './photoIngestion';

const imageFile = (name: string, type = 'image/jpeg') =>
  new File(['image-bytes'], name, { type });

describe('ingestPhotoFiles', () => {
  beforeEach(() => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1600, height: 1200, close: vi.fn() }));
    vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('accepts JPEG PNG and WebP while rejecting unsupported files', async () => {
    const result = await ingestPhotoFiles([
      imageFile('one.jpg', 'image/jpeg'),
      imageFile('two.png', 'image/png'),
      imageFile('three.webp', 'image/webp'),
      imageFile('animation.gif', 'image/gif'),
    ]);

    expect(result.accepted.map(({ mimeType }) => mimeType)).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    expect(result.rejected).toEqual([
      expect.objectContaining({ name: 'animation.gif', reason: 'UNSUPPORTED_TYPE' }),
    ]);
  });

  it('keeps only the first 50 files and reports the rest', async () => {
    const files = Array.from({ length: 52 }, (_, index) => imageFile(`${index}.jpg`));

    const result = await ingestPhotoFiles(files);

    expect(result.accepted).toHaveLength(50);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected.every(({ reason }) => reason === 'LIMIT_EXCEEDED')).toBe(true);
  });

  it('assigns distinct stable ids to repeated filenames', async () => {
    const first = await ingestPhotoFiles([imageFile('same.jpg'), imageFile('same.jpg')]);
    const second = await ingestPhotoFiles([imageFile('same.jpg'), imageFile('same.jpg')]);

    expect(first.accepted.map(({ id }) => id)).toEqual(second.accepted.map(({ id }) => id));
    expect(new Set(first.accepted.map(({ id }) => id)).size).toBe(2);
  });

  it('creates previews and reads dimensions for accepted images', async () => {
    const result = await ingestPhotoFiles([imageFile('moment.jpg')]);

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(result.accepted[0]).toMatchObject({
      previewUrl: 'blob:moment.jpg',
      width: 1600,
      height: 1200,
    });
  });
});
