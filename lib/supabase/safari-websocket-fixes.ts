// Safari-specific WebSocket fixes and utilities

/**
 * Detects if the browser is Safari (including iOS Safari)
 */
export function isSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android")
  );
}

/**
 * Detects if the browser is iOS Safari
 */
export function isIOSSafari(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  );
}

/**
 * Page visibility API wrapper for Safari-specific handling
 */
export class VisibilityManager {
  private listeners: Set<(isVisible: boolean) => void> = new Set();
  private isVisible: boolean = true;
  private boundHandleVisibilityChange: () => void;
  private boundHandlePageHide: () => void;
  private boundHandlePageShow: () => void;
  private boundHandleBlur: () => void;
  private boundHandleFocus: () => void;

  constructor() {
    // Bind methods to preserve context
    this.boundHandleVisibilityChange = () => this.handleVisibilityChange();
    this.boundHandlePageHide = () => this.handleVisibilityChange(false);
    this.boundHandlePageShow = () => this.handleVisibilityChange(true);
    this.boundHandleBlur = () => this.handleVisibilityChange(false);
    this.boundHandleFocus = () => this.handleVisibilityChange(true);

    // Safari uses different visibility API events
    document.addEventListener("visibilitychange", this.boundHandleVisibilityChange);

    // iOS Safari specific events
    if (isIOSSafari()) {
      // Page hide/show events are more reliable on iOS
      window.addEventListener("pagehide", this.boundHandlePageHide);
      window.addEventListener("pageshow", this.boundHandlePageShow);

      // Handle app switching
      window.addEventListener("blur", this.boundHandleBlur);
      window.addEventListener("focus", this.boundHandleFocus);
    }
  }

  private handleVisibilityChange = (forcedState?: boolean) => {
    const isVisible =
      forcedState !== undefined ? forcedState : !document.hidden;

    if (this.isVisible !== isVisible) {
      this.isVisible = isVisible;
      this.listeners.forEach((listener) => listener(isVisible));
    }
  };

  onVisibilityChange(callback: (isVisible: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Clean up all event listeners to prevent memory leaks
   */
  destroy() {
    // Remove all event listeners
    document.removeEventListener("visibilitychange", this.boundHandleVisibilityChange);
    
    if (isIOSSafari()) {
      window.removeEventListener("pagehide", this.boundHandlePageHide);
      window.removeEventListener("pageshow", this.boundHandlePageShow);
      window.removeEventListener("blur", this.boundHandleBlur);
      window.removeEventListener("focus", this.boundHandleFocus);
    }
    
    // Clear all callbacks
    this.listeners.clear();
  }
}

/**
 * WebSocket keep-alive manager for Safari
 * Sends periodic pings to prevent connection drops
 */
export class WebSocketKeepAlive {
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly SAFARI_PING_INTERVAL = 20000; // 20 seconds for Safari

  start(sendPing: () => void) {
    this.stop();

    const interval = isSafari()
      ? this.SAFARI_PING_INTERVAL
      : this.PING_INTERVAL;

    this.pingInterval = setInterval(() => {
      sendPing();
    }, interval);
  }

  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

/**
 * Safari-optimized connection parameters
 */
export function getSafariOptimizedConfig() {
  if (!isSafari()) {
    return {};
  }

  return {
    // Shorter timeouts for Safari to fail fast and retry
    connectTimeout: 5000, // 5 seconds instead of default 10

    // More aggressive reconnection for Safari
    reconnectAfterMs: (tries: number) => {
      // Safari gets shorter delays: [1s, 2s, 4s, 8s, 10s, 10s...]
      return Math.min(1000 * Math.pow(2, tries - 1), 10000);
    },

    // Safari-specific headers if needed
    params: {
      vsn: "1.0.0",
      // Add any Safari-specific params here
    },
  };
}

/**
 * Prevents Safari from closing WebSocket during React Strict Mode
 */
export function createSafariSafeWebSocket(
  url: string,
  protocols?: string | string[],
): WebSocket | null {
  // In development with React Strict Mode, prevent double connections
  if (process.env.NODE_ENV === "development" && isSafari()) {
    // Use a global to track if we already have a connection attempt
    const globalKey = `__safari_ws_${url}`;

    if ((window as any)[globalKey]) {
      console.warn(
        "[Safari] Preventing duplicate WebSocket connection in React Strict Mode",
      );
      return null;
    }

    (window as any)[globalKey] = true;

    // Clean up after a delay
    setTimeout(() => {
      delete (window as any)[globalKey];
    }, 1000);
  }

  return new WebSocket(url, protocols);
}
