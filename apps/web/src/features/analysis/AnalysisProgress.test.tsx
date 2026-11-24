import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AnalysisProgress } from './AnalysisProgress';

describe('AnalysisProgress', () => {
  it('describes only metadata operations implemented by metadata-mvp-v1', () => {
    render(<AnalysisProgress progress={60} />);

    expect(screen.getByText('读取照片元数据')).toBeInTheDocument();
    expect(screen.getByText('校验照片清单')).toBeInTheDocument();
    expect(screen.getByText('计算版式适配分数')).toBeInTheDocument();
    expect(screen.getByText(/尺寸比例、分辨率与文件大小/)).toBeInTheDocument();
    expect(screen.queryByText('识别重复与瑕疵')).not.toBeInTheDocument();
    expect(screen.queryByText('画面美学与构图评估')).not.toBeInTheDocument();
  });
});
