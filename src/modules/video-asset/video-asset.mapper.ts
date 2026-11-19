import type { video_assets } from '@prisma/client';

export function serializeVideoAsset(asset: video_assets) {
  return {
    ...asset,
    size_bytes: asset.size_bytes ? Number(asset.size_bytes) : null,
  };
}
