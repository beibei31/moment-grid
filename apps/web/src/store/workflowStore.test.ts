import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisResult } from '../shared/api/contracts';
import { useWorkflowStore, type PhotoAsset } from './workflowStore';

const photo = (id: string, name = 'same-name.jpg'): PhotoAsset => ({
  id,
  file: new File(['photo'], name, { type: 'image/jpeg' }),
  previewUrl: `blob:${id}`,
  name,
  mimeType: 'image/jpeg',
  size: 5,
  width: 1080,
  height: 1080,
  originalIndex: Number(id.replace(/\D/g, '')) || 0,
});

const analysis: AnalysisResult = {
  engineVersion: 'metadata-mvp-v1',
  excludedCount: 0,
  captions: [],
  plans: [
    {
      id: 'story',
      kind: 'STORY',
      title: '故事感方案',
      summary: '按顺序讲故事',
      confidence: 0.98,
      assetIds: ['photo-1', 'photo-2', 'photo-3'],
      reasons: ['顺序稳定'],
    },
  ],
};

describe('workflow store', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
  });

  it('preserves photos with duplicate filenames when their ids differ', () => {
    useWorkflowStore.getState().setPhotos([photo('photo-1'), photo('photo-2')]);

    expect(useWorkflowStore.getState().photos.map(({ id }) => id)).toEqual([
      'photo-1',
      'photo-2',
    ]);
  });

  it('keeps the requested selected-photo order stable', () => {
    useWorkflowStore.getState().setAnalysis(analysis);
    useWorkflowStore.getState().selectPlan('story');
    useWorkflowStore
      .getState()
      .reorderSelectedPhotos(['photo-3', 'photo-1', 'photo-2']);

    expect(useWorkflowStore.getState().orderedAssetIds).toEqual([
      'photo-3',
      'photo-1',
      'photo-2',
    ]);
  });

  it('reset clears project and editing state', () => {
    useWorkflowStore.getState().setScene('TRAVEL');
    useWorkflowStore.getState().setPhotos([photo('photo-1')]);
    useWorkflowStore.getState().setProjectId('project-1');
    useWorkflowStore.getState().setAnalysis(analysis);
    useWorkflowStore.getState().selectPlan('story');

    useWorkflowStore.getState().reset();

    expect(useWorkflowStore.getState()).toMatchObject({
      scene: 'DAILY',
      photos: [],
      projectId: null,
      analysis: null,
      selectedPlanId: null,
      selectedCaptionId: null,
      orderedAssetIds: [],
      layoutCount: 1,
    });
  });

  it('starts a clean project when a new photo batch replaces the previous one', () => {
    const first = photo('photo-1');
    const retainedUrl = photo('photo-2');
    retainedUrl.previewUrl = 'blob:shared';
    useWorkflowStore.getState().setScene('FOOD');
    useWorkflowStore.getState().setPhotos([first, retainedUrl]);
    useWorkflowStore.getState().setProjectId('project-1');
    useWorkflowStore.getState().setAnalysis(analysis);
    useWorkflowStore.getState().selectPlan('story');
    useWorkflowStore.getState().setLayoutCount(6);
    useWorkflowStore.getState().selectCaption('caption-1');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const next = photo('photo-3');
    next.previewUrl = 'blob:shared';
    useWorkflowStore.getState().setPhotos([next]);

    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:photo-1');
    expect(useWorkflowStore.getState()).toMatchObject({
      scene: 'FOOD',
      photos: [next],
      projectId: null,
      analysis: null,
      selectedPlanId: null,
      selectedCaptionId: null,
      orderedAssetIds: [],
      layoutCount: 1,
    });
    revoke.mockRestore();
  });

  it('releases every local preview when the workflow is reset', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    useWorkflowStore.getState().setPhotos([photo('photo-1'), photo('photo-2')]);

    useWorkflowStore.getState().reset();

    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith('blob:photo-1');
    expect(revoke).toHaveBeenCalledWith('blob:photo-2');
    revoke.mockRestore();
  });

  it('initializes and stores the selected grid layout', () => {
    useWorkflowStore.getState().setAnalysis(analysis);
    useWorkflowStore.getState().selectPlan('story');

    expect(useWorkflowStore.getState().layoutCount).toBe(4);
    useWorkflowStore.getState().setLayoutCount(6);
    expect(useWorkflowStore.getState().layoutCount).toBe(6);
  });

  it('keeps the scene selected on the upload page', () => {
    useWorkflowStore.getState().setScene('FOOD');

    expect(useWorkflowStore.getState().scene).toBe('FOOD');
  });
});
