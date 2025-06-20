"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ConnectionStatus {
  isConnected: boolean;
  status: string;
  lastPing: Date | null;
  error: string | null;
}

export function RealtimeConnectionMonitor() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: "Initializing",
    lastPing: null,
    error: null,
  });
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    const initializeMonitor = async () => {
      try {
        // Create a dedicated monitoring channel
        channel = supabase
          .channel("connection-monitor")
          .on("system", { event: "*" }, (payload) => {
            setConnectionStatus((prev) => ({
              ...prev,
              lastPing: new Date(),
              error: null,
            }));
          })
          .subscribe((status) => {
            setConnectionStatus((prev) => ({
              ...prev,
              isConnected: status === "SUBSCRIBED",
              status,
              error:
                status === "CHANNEL_ERROR"
                  ? "Channel error"
                  : status === "TIMED_OUT"
                    ? "Connection timeout"
                    : null,
            }));
          });

        // Set up ping interval to check connection health
        pingInterval = setInterval(() => {
          if (channel?.state === "joined") {
            // Channel is healthy
            setConnectionStatus((prev) => ({
              ...prev,
              isConnected: true,
              lastPing: new Date(),
            }));
          }
        }, 5000); // Check every 5 seconds
      } catch (error) {
        setConnectionStatus((prev) => ({
          ...prev,
          isConnected: false,
          status: "Error",
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    initializeMonitor();

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Check for debug mode in production
  const isDebugMode =
    typeof window !== "undefined" &&
    (window.location.search.includes("debug=realtime") ||
      window.location.search.includes("debug=true") ||
      sessionStorage.getItem("plico_debug_realtime") === "true");

  // Only show in development, when debug mode is enabled, or if there's an error
  if (
    process.env.NODE_ENV === "production" &&
    !isDebugMode &&
    !connectionStatus.error
  ) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg transition-all ${
        isMinimized ? "w-12 h-12" : "w-80 p-4"
      }`}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-full h-full rounded-lg flex items-center justify-center ${
            connectionStatus.isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <span className="text-white text-xl">
            {connectionStatus.isConnected ? "✓" : "✗"}
          </span>
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Realtime Connection</h3>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-medium ${
                  connectionStatus.isConnected
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {connectionStatus.status}
              </span>
            </div>

            {connectionStatus.lastPing && (
              <div className="flex justify-between">
                <span>Last Ping:</span>
                <span className="text-gray-600">
                  {connectionStatus.lastPing.toLocaleTimeString()}
                </span>
              </div>
            )}

            {connectionStatus.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                {connectionStatus.error}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
