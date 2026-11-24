export type Scene =
  | 'TRAVEL'
  | 'FOOD'
  | 'PARTY'
  | 'DAILY'
  | 'FAMILY'
  | 'PET'
  | 'CUSTOM';

export type RecommendationKind = 'STORY' | 'MOOD' | 'PEOPLE';

export type CaptionStyle =
  | 'MINIMAL'
  | 'NATURAL'
  | 'STORY'
  | 'HUMOR'
  | 'POETIC'
  | 'INFORMATIONAL';

export interface AssetInput {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  originalIndex: number;
}

export interface RecommendationPlan {
  id: string;
  kind: RecommendationKind;
  title: string;
  summary: string;
  confidence: number;
  assetIds: string[];
  reasons: string[];
}

export interface CaptionCandidate {
  id: string;
  style: CaptionStyle;
  text: string;
  reason: string;
}

export interface AnalysisResult {
  engineVersion: string;
  excludedCount: number;
  plans: RecommendationPlan[];
  captions: CaptionCandidate[];
}

export interface ProjectResponse {
  projectId: string;
  status: 'DRAFT' | 'READY';
}
