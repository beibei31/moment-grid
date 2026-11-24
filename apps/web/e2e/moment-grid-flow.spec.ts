import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function photoFixtures(page: Page, count = 9) {
  const payloads = await page.evaluate(async (photoCount) => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8000ff', '#444444'];
    return Promise.all(Array.from({ length: photoCount }, async (_, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('fixture canvas unavailable');
      context.fillStyle = colors[index % colors.length];
      context.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (value) => value ? resolve(value) : reject(new Error('fixture PNG unavailable')),
        'image/png',
      ));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }));
  }, count);

  return payloads.map((payload, index) => ({
    name: `image-${index + 1}.png`,
    mimeType: 'image/png',
    buffer: Buffer.from(payload),
  }));
}

async function uploadPhotos(page: Page, count = 9) {
  await page.goto('/');
  await page.getByLabel('选择照片').setInputFiles(await photoFixtures(page, count));
}

test('从选片到重排、文案复制和 PNG 下载完整可用', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await uploadPhotos(page);

  await expect(page.getByRole('heading', { name: '智能方案推荐' })).toBeVisible();
  await expect(page.locator('.recommendation-card')).toHaveCount(3);
  await page.getByRole('button', { name: '使用故事感方案' }).click();

  await expect(page.getByRole('heading', { name: '九宫格编辑器' })).toBeVisible();
  const grid = page.getByLabel('编辑网格');
  await expect(grid.locator('[aria-label^="选择 "]')).toHaveCount(9);
  await page.getByRole('button', { name: '6 格' }).click();
  await expect(grid.locator('[aria-label^="选择 "]')).toHaveCount(6);
  await page.getByLabel('将 image-1.png 下移').click();
  await expect(grid.locator('[aria-label^="选择 "]').first()).toHaveAttribute('aria-label', /image-2\.png/);
  await page.getByRole('button', { name: '下一步：生成朋友圈文案' }).click();

  await expect(page.getByRole('heading', { name: '文案与导出' })).toBeVisible();
  await expect(page.locator('.caption-card')).toHaveCount(6);
  const captionChoice = page.locator('button[aria-label^="选用文案："]').nth(1);
  const captionLabel = await captionChoice.getAttribute('aria-label');
  const expectedCaption = captionLabel?.replace('选用文案：', '');
  expect(expectedCaption).toBeTruthy();
  await captionChoice.click();
  await page.getByRole('button', { name: '复制当前文案' }).click();
  await expect(page.getByRole('alert')).toContainText('文案已复制到剪贴板');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCaption);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出高清图片' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^拾光排版-\d+\.png$/);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const png = await readFile(downloadPath!);
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.readUInt32BE(20)).toBe(720);
  const samples = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('download canvas unavailable');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return [
      Array.from(context.getImageData(177, 178, 1, 1).data.slice(0, 3)),
      Array.from(context.getImageData(540, 178, 1, 1).data.slice(0, 3)),
    ];
  }, png.toString('base64'));
  expect(samples).toEqual([[0, 255, 0], [255, 0, 0]]);
  await expect(page.getByRole('alert')).toContainText('PNG 已生成');
});

test('分析 API 首次离线时可恢复重试', async ({ page }) => {
  let offline = true;
  await page.route('**/api/v1/projects', async (route) => {
    if (offline) {
      await route.abort('connectionfailed');
      return;
    }
    await route.continue();
  });

  await uploadPhotos(page, 4);
  await expect(page.getByRole('alert')).toContainText('无法连接分析服务');
  offline = false;
  await page.getByRole('button', { name: '重新分析' }).click();
  await expect(page.getByRole('heading', { name: '智能方案推荐' })).toBeVisible();
});

test('没有选片时直接访问编辑器会回到上传页', async ({ page }) => {
  await page.goto('/editor');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /把这一刻/ })).toBeVisible();
});
