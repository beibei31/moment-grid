import type { LayoutCount } from '../../store/workflowStore';

export type { LayoutCount } from '../../store/workflowStore';

export function fitAssetIdsToLayout(
  currentIds: string[],
  availableIds: string[],
  requestedCount: LayoutCount,
): string[] {
  const available = new Set(availableIds);
  const unique: string[] = [];

  for (const id of currentIds) {
    if (available.has(id) && !unique.includes(id)) unique.push(id);
  }
  for (const id of availableIds) {
    if (!unique.includes(id)) unique.push(id);
  }

  return unique.slice(0, Math.min(requestedCount, availableIds.length));
}

export function replaceAssetAt(ids: string[], index: number, replacementId: string): string[] {
  if (index < 0 || index >= ids.length) return [...ids];
  const result = [...ids];
  const existingIndex = result.indexOf(replacementId);
  if (existingIndex === index) return result;

  if (existingIndex >= 0) {
    [result[index], result[existingIndex]] = [result[existingIndex], result[index]];
  } else {
    result[index] = replacementId;
  }
  return result;
}

export function moveAsset(ids: string[], activeId: string, overId: string): string[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return [...ids];

  const result = [...ids];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}
