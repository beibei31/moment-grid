import { describe, expect, it } from 'vitest';

import type { AnalysisResult } from './contracts';

describe('analysis contracts', () => {
  it('represents three distinct recommendation plans', () => {
    const result: AnalysisResult = {
      engineVersion: 'metadata-mvp-v1',
      excludedCount: 2,
      plans: [
        {
          id: 'story',
          kind: 'STORY',
          title: '故事感方案',
          summary: '按上传顺序讲述一天的故事',
          confidence: 0.98,
          assetIds: ['photo-1'],
          reasons: ['首图作为故事开场'],
        },
        {
          id: 'mood',
          kind: 'MOOD',
          title: '氛围感方案',
          summary: '保持色调和节奏统一',
          confidence: 0.94,
          assetIds: ['photo-1'],
          reasons: ['优先视觉一致性'],
        },
        {
          id: 'people',
          kind: 'PEOPLE',
          title: '高光优先方案',
          summary: '保留元数据评分更高的照片',
          confidence: 0.91,
          assetIds: ['photo-1'],
          reasons: ['视觉模型接入前不声称识别人脸'],
        },
      ],
      captions: [],
    };

    expect(result.plans.map((plan) => plan.kind)).toEqual([
      'STORY',
      'MOOD',
      'PEOPLE',
    ]);
    expect(result.engineVersion).toBe('metadata-mvp-v1');
  });
});
