import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkflowStore } from '../../store/workflowStore';
import { UploadPage } from './UploadPage';

describe('UploadPage', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1080, height: 1080, close: vi.fn() }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:uploaded-photo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stores accepted photos and moves to analysis', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analyzing" element={<h1>正在整理你的照片</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.upload(
      screen.getByLabelText('选择照片'),
      new File(['photo'], 'summer.jpg', { type: 'image/jpeg' }),
    );

    expect(await screen.findByRole('heading', { name: '正在整理你的照片' })).toBeInTheDocument();
    expect(useWorkflowStore.getState().photos).toHaveLength(1);
  });

  it('stays on upload and explains when no selected file is supported', async () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('选择照片'), {
      target: {
        files: [new File(['gif'], 'animation.gif', { type: 'image/gif' })],
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('请选择 JPG、PNG 或 WebP 图片');
    expect(useWorkflowStore.getState().photos).toHaveLength(0);
  });

  it('reports partially rejected files and waits for explicit confirmation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analyzing" element={<h1>正在整理你的照片</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('选择照片'), {
      target: {
        files: [
          new File(['photo'], 'summer.jpg', { type: 'image/jpeg' }),
          new File(['gif'], 'animation.gif', { type: 'image/gif' }),
        ],
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('已接收 1 张，跳过 1 张');
    expect(screen.getByRole('alert')).toHaveTextContent('格式不支持 1 张');
    expect(screen.queryByRole('heading', { name: '正在整理你的照片' })).not.toBeInTheDocument();
    expect(useWorkflowStore.getState().photos).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '继续分析' }));

    expect(await screen.findByRole('heading', { name: '正在整理你的照片' })).toBeInTheDocument();
    expect(useWorkflowStore.getState().photos.map(({ name }) => name)).toEqual(['summer.jpg']);
  });

  it('ignores a second import while the first batch is still decoding', async () => {
    let finishDecode: ((value: { width: number; height: number; close: () => void }) => void) | undefined;
    vi.stubGlobal('createImageBitmap', vi.fn().mockImplementation(() => new Promise((resolve) => {
      finishDecode = resolve;
    })));
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/analyzing" element={<h1>正在整理你的照片</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    const input = screen.getByLabelText('选择照片');

    fireEvent.change(input, {
      target: { files: [new File(['first'], 'first.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.change(input, {
      target: { files: [new File(['second'], 'second.jpg', { type: 'image/jpeg' })] },
    });

    expect(createImageBitmap).toHaveBeenCalledTimes(1);
    finishDecode?.({ width: 1080, height: 1080, close: vi.fn() });

    expect(await screen.findByRole('heading', { name: '正在整理你的照片' })).toBeInTheDocument();
    expect(useWorkflowStore.getState().photos.map(({ name }) => name)).toEqual(['first.jpg']);
  });

  it('discards and releases a decoded batch that finishes after unmount', async () => {
    let finishDecode: ((value: { width: number; height: number; close: () => void }) => void) | undefined;
    vi.stubGlobal('createImageBitmap', vi.fn().mockImplementation(() => new Promise((resolve) => {
      finishDecode = resolve;
    })));
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const view = render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('选择照片'), {
      target: { files: [new File(['late'], 'late.jpg', { type: 'image/jpeg' })] },
    });
    view.unmount();
    await act(async () => {
      finishDecode?.({ width: 1080, height: 1080, close: vi.fn() });
      await Promise.resolve();
    });

    expect(useWorkflowStore.getState().photos).toHaveLength(0);
    expect(revoke).toHaveBeenCalledWith('blob:uploaded-photo');
  });

  it('stores a semantic scene for the selected preset', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByText('探店下午茶'));

    expect(useWorkflowStore.getState().scene).toBe('FOOD');
  });
});
