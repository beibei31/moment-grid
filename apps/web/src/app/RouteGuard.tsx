import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { useWorkflowStore } from '../store/workflowStore';

export function RouteGuard({ children }: PropsWithChildren) {
  const hasPhotos = useWorkflowStore((state) => state.photos.length > 0);

  if (!hasPhotos) {
    return <Navigate to="/" replace />;
  }

  return children;
}
