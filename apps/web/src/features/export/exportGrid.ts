import type { PhotoAsset } from '../../store/workflowStore';
import type { LayoutCount } from '../editor/gridLayout';

interface GridDimensions {
  width: number;
  height: number;
  columns: number;
  rows: number;
}

export function gridDimensions(layout: LayoutCount): GridDimensions {
  switch (layout) {
    case 1:
      return { width: 1080, height: 1080, columns: 1, rows: 1 };
    case 4:
      return { width: 1080, height: 1080, columns: 2, rows: 2 };
    case 6:
      return { width: 1080, height: 720, columns: 3, rows: 2 };
    case 9:
      return { width: 1080, height: 1080, columns: 3, rows: 3 };
  }
}

function loadImage(photo: PhotoAsset): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法读取照片 ${photo.name}`));
    image.src = photo.previewUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('浏览器无法生成 PNG，请更换浏览器后重试'));
    }, 'image/png');
  });
}

export async function exportGrid(photos: PhotoAsset[], layout: LayoutCount): Promise<Blob> {
  const dimensions = gridDimensions(layout);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持图片画布导出');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const gap = layout === 1 ? 0 : 8;
  const cellWidth = (canvas.width - gap * (dimensions.columns - 1)) / dimensions.columns;
  const cellHeight = (canvas.height - gap * (dimensions.rows - 1)) / dimensions.rows;

  for (const [index, photo] of photos.slice(0, dimensions.columns * dimensions.rows).entries()) {
    const image = await loadImage(photo);
    const scale = Math.max(cellWidth / image.naturalWidth, cellHeight / image.naturalHeight);
    const sourceWidth = cellWidth / scale;
    const sourceHeight = cellHeight / scale;
    const sourceX = Math.max(0, (image.naturalWidth - sourceWidth) / 2);
    const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) / 2);
    const column = index % dimensions.columns;
    const row = Math.floor(index / dimensions.columns);
    const targetX = column * (cellWidth + gap);
    const targetY = row * (cellHeight + gap);

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      targetX,
      targetY,
      cellWidth,
      cellHeight,
    );
  }

  return canvasToBlob(canvas);
}
