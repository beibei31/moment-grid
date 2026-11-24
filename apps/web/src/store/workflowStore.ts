import { create } from 'zustand';

import type { AnalysisResult, Scene } from '../shared/api/contracts';

export interface PhotoAsset {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  originalIndex: number;
}

export type LayoutCount = 1 | 4 | 6 | 9;

interface WorkflowState {
  scene: Scene;
  photos: PhotoAsset[];
  projectId: string | null;
  analysis: AnalysisResult | null;
  selectedPlanId: string | null;
  selectedCaptionId: string | null;
  orderedAssetIds: string[];
  layoutCount: LayoutCount;
  setScene: (scene: Scene) => void;
  setPhotos: (photos: PhotoAsset[]) => void;
  setProjectId: (projectId: string | null) => void;
  setAnalysis: (analysis: AnalysisResult) => void;
  selectPlan: (planId: string) => void;
  selectCaption: (captionId: string) => void;
  reorderSelectedPhotos: (assetIds: string[]) => void;
  setLayoutCount: (layoutCount: LayoutCount) => void;
  reset: () => void;
}

function layoutForPhotoCount(count: number): LayoutCount {
  if (count <= 1) return 1;
  if (count <= 4) return 4;
  if (count <= 6) return 6;
  return 9;
}

function releaseRemovedPreviews(previous: PhotoAsset[], next: PhotoAsset[] = []) {
  if (typeof URL.revokeObjectURL !== 'function') return;
  const retained = new Set(next.map(({ previewUrl }) => previewUrl));
  const released = new Set<string>();
  previous.forEach(({ previewUrl }) => {
    if (previewUrl.startsWith('blob:') && !retained.has(previewUrl) && !released.has(previewUrl)) {
      URL.revokeObjectURL(previewUrl);
      released.add(previewUrl);
    }
  });
}

const initialState = {
  scene: 'DAILY' as Scene,
  photos: [] as PhotoAsset[],
  projectId: null,
  analysis: null,
  selectedPlanId: null,
  selectedCaptionId: null,
  orderedAssetIds: [] as string[],
  layoutCount: 1 as LayoutCount,
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,
  setScene: (scene) => set({ scene }),
  setPhotos: (photos) => set((state) => {
    releaseRemovedPreviews(state.photos, photos);
    return {
      photos,
      projectId: null,
      analysis: null,
      selectedPlanId: null,
      selectedCaptionId: null,
      orderedAssetIds: [],
      layoutCount: 1,
    };
  }),
  setProjectId: (projectId) => set({ projectId }),
  setAnalysis: (analysis) =>
    set({
      analysis,
      selectedPlanId: null,
      selectedCaptionId: null,
      orderedAssetIds: [],
      layoutCount: 1,
    }),
  selectPlan: (planId) => {
    const plan = get().analysis?.plans.find((candidate) => candidate.id === planId);
    if (!plan) return;
    set({
      selectedPlanId: planId,
      orderedAssetIds: [...plan.assetIds],
      layoutCount: layoutForPhotoCount(plan.assetIds.length),
    });
  },
  selectCaption: (selectedCaptionId) => set({ selectedCaptionId }),
  reorderSelectedPhotos: (orderedAssetIds) => set({ orderedAssetIds: [...orderedAssetIds] }),
  setLayoutCount: (layoutCount) => set({ layoutCount }),
  reset: () => set((state) => {
    releaseRemovedPreviews(state.photos);
    return { ...initialState };
  }),
}));
