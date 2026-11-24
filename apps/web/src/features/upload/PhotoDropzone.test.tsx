import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PhotoDropzone } from './PhotoDropzone';

describe('PhotoDropzone', () => {
  it('blocks file input, batch import, and drop while decoding another batch', () => {
    const onFiles = vi.fn();
    render(<PhotoDropzone busy onFiles={onFiles} />);
    const file = new File(['photo'], 'later.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('选择照片'), { target: { files: [file] } });
    fireEvent.drop(screen.getByRole('region', { name: '照片上传区' }), {
      dataTransfer: { files: [file] },
    });

    expect(screen.getByRole('button', { name: '批量导入' })).toBeDisabled();
    expect(onFiles).not.toHaveBeenCalled();
  });
});
