import type { AnalysisResult, AssetInput, ProjectResponse, Scene } from './contracts';

interface ApiErrorBody {
  code?: string;
  message?: string;
}

export class MomentGridApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'MomentGridApiError';
  }
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (reason) {
    if (init.signal?.aborted) throw reason;
    throw new MomentGridApiError(
      '无法连接分析服务，请确认后端已启动后重试',
      0,
      'NETWORK_ERROR',
    );
  }

  const body = await response.json().catch(() => ({})) as T | ApiErrorBody;

  if (!response.ok) {
    const error = body as ApiErrorBody;
    throw new MomentGridApiError(error.message ?? '请求失败，请稍后重试', response.status, error.code);
  }

  return body as T;
}

export function createProject(scene: Scene = 'DAILY', signal?: AbortSignal): Promise<ProjectResponse> {
  return requestJson('/api/v1/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene }),
    signal,
  });
}

export function analyzeProject(
  projectId: string,
  assets: AssetInput[],
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  return requestJson(`/api/v1/projects/${projectId}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assets }),
    signal,
  });
}
