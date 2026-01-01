import { useContext } from 'react';
import type { RealtimeContextType } from './RealtimeContext';
import { RealtimeContext } from './RealtimeContext';

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
