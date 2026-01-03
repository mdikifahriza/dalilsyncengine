// src/hooks/useNavigate.ts
// Simple navigation hook for internal app routing

import { useCallback } from 'react';
import type { ViewType } from '@/types';

export function useNavigate() {
  const navigate = useCallback((view: ViewType) => {
    // This would trigger the parent component to change view
    // In our case, we'll pass this via props
    console.log('Navigate to:', view);
  }, []);

  return navigate;
}