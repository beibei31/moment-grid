import type { PhotoAsset } from '../../store/workflowStore';

const MAX_PHOTOS = 50;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type RejectionReason = 'UNSUPPORTED_TYPE' | 'LIMIT_EXCEEDED' | 'DECODE_FAILED';

export interface RejectedFile {
  name: string;
  reason: RejectionReason;
}

export interface IngestionResult {
  accepted: PhotoAsset[];
  rejected: RejectedFile[];
}

function assetId(file: File, index: number) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-');
  return `asset-${index}-${safeName}-${file.size}`;
}

async function readDimensions(file: File) {
  if (typeof createImageBitmap !== 'function') {
    return { width: 0, height: 0 };
  }

  const bitmap = await createImageBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export async function ingestPhotoFiles(files: File[]): Promise<IngestionResult> {
  const accepted: PhotoAsset[] = [];
  const rejected: RejectedFile[] = [];

  for (const [index, file] of files.entries()) {
    if (index >= MAX_PHOTOS) {
      rejected.push({ name: file.name, reason: 'LIMIT_EXCEEDED' });
      continue;
    }

    if (!SUPPORTED_TYPES.has(file.type)) {
      rejected.push({ name: file.name, reason: 'UNSUPPORTED_TYPE' });
      continue;
    }

    try {
      const dimensions = await readDimensions(file);
      accepted.push({
        id: assetId(file, index),
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
        originalIndex: index,
      });
    } catch {
      rejected.push({ name: file.name, reason: 'DECODE_FAILED' });
    }
  }

  return { accepted, rejected };
}
