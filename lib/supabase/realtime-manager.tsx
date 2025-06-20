"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getSupabaseSingleton } from "./singleton-client";

interface RealtimeManagerState {
  isConnected: boolean;
  connectionError: string | null;
  retryCount: number;
  lastError: Date | null;
}

interface ChannelConfig {
  channelName: string;
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  schema?: string;
  onMessage: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface RealtimeManagerContextType {
  state: RealtimeManagerState;
  subscribe: (config: ChannelConfig) => () => void;
  forceReconnect: () => void;
}

const RealtimeManagerContext = createContext<RealtimeManagerContextType | null>(
  null,
);

const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 2000; // Increased from 1000 to 2000 for Safari
const MAX_RETRY_DELAY = 60000; // Increased from 30000 to 60000

export function RealtimeManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<RealtimeManagerState>({
    isConnected: false,
    connectionError: null,
    retryCount: 0,
    lastError: null,
  });

  const channelsRef = useRef<
    Map<string, { channel: RealtimeChannel; config: ChannelConfig; refCount: number }>
  >(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRetryingRef = useRef<Set<string>>(new Set());
  const supabase = getSupabaseSingleton();

  const calculateRetryDelay = (attempt: number): number => {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      BASE_RETRY_DELAY * Math.pow(2, attempt),
      MAX_RETRY_DELAY,
    );
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return exponentialDelay + jitter;
  };

  const retryConnection = useCallback(
    (config: ChannelConfig, attempt: number = 0) => {
      // Prevent duplicate retry attempts
      if (isRetryingRef.current.has(config.channelName)) {
        // Already retrying, skipping duplicate retry
        return;
      }

      if (attempt >= MAX_RETRY_ATTEMPTS) {
        console.error(
          "[RealtimeManager] Max retry attempts reached for channel:",
          config.channelName,
        );
        setState((prev) => ({
          ...prev,
          connectionError: `Failed to connect after ${MAX_RETRY_ATTEMPTS} attempts`,
          lastError: new Date(),
        }));
        config.onError?.(new Error("Max retry attempts reached"));
        isRetryingRef.current.delete(config.channelName);
        return;
      }

      isRetryingRef.current.add(config.channelName);
      const delay = calculateRetryDelay(attempt);
      // Retrying connection with exponential backoff

      retryTimeoutRef.current = setTimeout(() => {
        isRetryingRef.current.delete(config.channelName);
        const existingEntry = channelsRef.current.get(config.channelName);
        if (existingEntry) {
          // Remove the old channel before creating a new one
          try {
            supabase.removeChannel(existingEntry.channel);
          } catch (e) {
            console.warn("[RealtimeManager] Error removing channel:", e);
          }
          channelsRef.current.delete(config.channelName);
        }

        // Add a small delay before creating new subscription to let Safari clean up
        setTimeout(() => {
          createSubscription(config, attempt + 1);
        }, 100);
      }, delay);
    },
    [],
  );

  const createSubscription = useCallback(
    (config: ChannelConfig, retryAttempt: number = 0) => {
      // Creating subscription

      try {
        const channel = supabase.channel(config.channelName).on(
          "postgres_changes" as any,
          {
            event: config.event || "UPDATE",
            schema: config.schema || "public",
            table: config.table,
            filter: config.filter,
          },
          (payload) => {
            // Message received

            // Reset retry count on successful message
            if (state.retryCount > 0) {
              setState((prev) => ({
                ...prev,
                retryCount: 0,
                connectionError: null,
              }));
            }

            config.onMessage(payload as any);
          },
        );

        // Subscribe with timeout handling
        const subscribeTimeout = setTimeout(() => {
          console.warn(
            "[RealtimeManager] Subscribe timeout for",
            config.channelName,
          );
          channel.unsubscribe();
          retryConnection(config, retryAttempt);
        }, 10000); // 10 second timeout for subscription

        channel.subscribe((status) => {
          clearTimeout(subscribeTimeout);
          // Channel status changed

          if (status === "SUBSCRIBED") {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              connectionError: null,
              retryCount: 0,
            }));
            config.onConnect?.();
            isRetryingRef.current.delete(config.channelName);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(
              "[RealtimeManager] Channel error:",
              config.channelName,
              status,
            );
            setState((prev) => ({
              ...prev,
              isConnected: false,
              connectionError: `Channel ${status}`,
              retryCount: retryAttempt,
              lastError: new Date(),
            }));
            config.onDisconnect?.();

            // Only retry if not already retrying
            if (!isRetryingRef.current.has(config.channelName)) {
              retryConnection(config, retryAttempt);
            }
          }
        });

        // Store channel reference with initial ref count
        channelsRef.current.set(config.channelName, { channel, config, refCount: 1 });

        return channel;
      } catch (error) {
        console.error("[RealtimeManager] Error creating subscription:", error);
        if (!isRetryingRef.current.has(config.channelName)) {
          retryConnection(config, retryAttempt);
        }
      }
    },
    [state.retryCount, retryConnection],
  );

  const subscribe = useCallback(
    (config: ChannelConfig) => {
      // Check if channel already exists
      const existing = channelsRef.current.get(config.channelName);
      if (existing) {
        // Increment reference count for existing channel
        existing.refCount++;
        // Return cleanup function that decrements ref count
        return () => {
          const entry = channelsRef.current.get(config.channelName);
          if (entry) {
            entry.refCount--;
            // Only remove channel when no more references
            if (entry.refCount <= 0) {
              try {
                supabase.removeChannel(entry.channel);
              } catch (e) {
                console.warn("[RealtimeManager] Error removing channel:", e);
              }
              channelsRef.current.delete(config.channelName);
              isRetryingRef.current.delete(config.channelName);
            }
          }
        };
      }

      // Create new subscription
      createSubscription(config);

      // Return cleanup function
      return () => {
        const entry = channelsRef.current.get(config.channelName);
        if (entry) {
          entry.refCount--;
          // Only remove channel when no more references
          if (entry.refCount <= 0) {
            try {
              supabase.removeChannel(entry.channel);
            } catch (e) {
              console.warn("[RealtimeManager] Error removing channel:", e);
            }
            channelsRef.current.delete(config.channelName);
            isRetryingRef.current.delete(config.channelName);
          }
        }
      };
    },
    [createSubscription],
  );

  const forceReconnect = useCallback(() => {
    // Force reconnecting all channels

    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    isRetryingRef.current.clear();

    // Reconnect all channels
    channelsRef.current.forEach(({ channel, config }) => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn(
          "[RealtimeManager] Error removing channel during reconnect:",
          e,
        );
      }
      createSubscription(config);
    });
  }, [createSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      channelsRef.current.forEach(({ channel }) => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn(
            "[RealtimeManager] Error removing channel during cleanup:",
            e,
          );
        }
      });
      channelsRef.current.clear();
      isRetryingRef.current.clear();
    };
  }, []);

  return (
    <RealtimeManagerContext.Provider
      value={{ state, subscribe, forceReconnect }}
    >
      {children}
    </RealtimeManagerContext.Provider>
  );
}

export function useRealtimeManager() {
  const context = useContext(RealtimeManagerContext);
  if (!context) {
    throw new Error(
      "useRealtimeManager must be used within RealtimeManagerProvider",
    );
  }
  return context;
}

// Custom hook for easy subscription with better error handling
export function useRealtimeSubscription(config: ChannelConfig | null) {
  const { subscribe } = useRealtimeManager();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!config) return;

    let unsubscribe: (() => void) | null = null;

    // Add a small delay to prevent Safari WebSocket issues
    const timer = setTimeout(() => {
      unsubscribe = subscribe({
        ...config,
        onConnect: () => {
          setIsSubscribed(true);
          config.onConnect?.();
        },
        onDisconnect: () => {
          setIsSubscribed(false);
          config.onDisconnect?.();
        },
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [config?.channelName]); // Only re-subscribe if channel name changes
}
