import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type RealtimeEvent = {
  type: 'transaction' | 'balance' | 'pix_key';
  action: 'insert' | 'update' | 'delete';
  data: unknown;
  timestamp: Date;
};

interface RealtimeContextType {
  isConnected: boolean;
  events: RealtimeEvent[];
  lastEvent: RealtimeEvent | null;
  subscribeToTransactions: (callback: (payload: unknown) => void) => () => void;
  subscribeToBalances: (callback: (payload: unknown) => void) => () => void;
  subscribeToPixKeys: (callback: (payload: unknown) => void) => () => void;
  addEvent: (event: RealtimeEvent) => void;
  clearEvents: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    let channels: RealtimeChannel[] = [];

    const setupChannels = async () => {
      try {
        const transactionsChannel = supabase
          .channel('transactions_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions'
            },
            (payload: { eventType: string; new: unknown }) => {
              const newEvent: RealtimeEvent = {
                type: 'transaction',
                action: payload.eventType as 'insert' | 'update' | 'delete',
                data: payload.new,
                timestamp: new Date()
              };
              setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
              setLastEvent(newEvent);
            }
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log('Realtime: Connected to transactions channel');
            }
          });

        const balancesChannel = supabase
          .channel('balances_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'pix_keys'
            },
            (payload: { new: unknown }) => {
              const newEvent: RealtimeEvent = {
                type: 'balance',
                action: 'update',
                data: payload.new,
                timestamp: new Date()
              };
              setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
              setLastEvent(newEvent);
            }
          )
          .subscribe();

        const pixKeysChannel = supabase
          .channel('pix_keys_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pix_keys'
            },
            (payload: { eventType: string; new: unknown }) => {
              const newEvent: RealtimeEvent = {
                type: 'pix_key',
                action: payload.eventType as 'insert' | 'update' | 'delete',
                data: payload.new,
                timestamp: new Date()
              };
              setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
              setLastEvent(newEvent);
            }
          )
          .subscribe();

        channels = [transactionsChannel, balancesChannel, pixKeysChannel];
      } catch (error) {
        console.error('Realtime setup error:', error);
      }
    };

    setupChannels();

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  const subscribeToTransactions = useCallback((callback: (payload: unknown) => void) => {
    const channel = supabase
      .channel('custom_transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const subscribeToBalances = useCallback((callback: (payload: unknown) => void) => {
    const channel = supabase
      .channel('custom_balances')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pix_keys'
      }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const subscribeToPixKeys = useCallback((callback: (payload: unknown) => void) => {
    const channel = supabase
      .channel('custom_pix_keys')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pix_keys'
      }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addEvent = useCallback((event: RealtimeEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 99)]);
    setLastEvent(event);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  const value = {
    isConnected,
    events,
    lastEvent,
    subscribeToTransactions,
    subscribeToBalances,
    subscribeToPixKeys,
    addEvent,
    clearEvents,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
