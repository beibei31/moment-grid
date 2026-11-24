import { describe, expect, it } from 'vitest';

import { fitAssetIdsToLayout, moveAsset, replaceAssetAt } from './gridLayout';

const all = Array.from({ length: 9 }, (_, index) => `asset-${index + 1}`);

describe('grid layout helpers', () => {
  it('fits exact 4 6 and 9-photo layouts without changing stable order', () => {
    expect(fitAssetIdsToLayout(all, all, 4)).toEqual(all.slice(0, 4));
    expect(fitAssetIdsToLayout(all, all, 6)).toEqual(all.slice(0, 6));
    expect(fitAssetIdsToLayout(all, all, 9)).toEqual(all);
  });

  it('shrinks safely when fewer photos exist than the requested layout', () => {
    expect(fitAssetIdsToLayout(all.slice(0, 3), all.slice(0, 3), 9)).toEqual(all.slice(0, 3));
  });

  it('swaps an already-selected replacement instead of duplicating it', () => {
    expect(replaceAssetAt(all.slice(0, 4), 0, 'asset-3')).toEqual([
      'asset-3',
      'asset-2',
      'asset-1',
      'asset-4',
    ]);
  });

  it('moves one asset relative to another while preserving every id', () => {
    expect(moveAsset(all.slice(0, 4), 'asset-3', 'asset-1')).toEqual([
      'asset-3',
      'asset-1',
      'asset-2',
      'asset-4',
    ]);
  });
});
