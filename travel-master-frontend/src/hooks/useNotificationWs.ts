import { useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket hook for real-time notification subscription.
 * Uses native WebSocket with SockJS-style endpoint.
 * Auto-reconnects on disconnect.
 */
export function useNotificationWs(
  userId: string | undefined,
  onNotification: (data: unknown) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const clearReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!userId || !mountedRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        // Subscribe to user-specific notification topic via STOMP-like frame
        const subscribeFrame = `SUBSCRIBE\nid:sub-notifications\ndestination:/topic/users/${userId}/notifications\n\n\0`;
        ws.send(`CONNECT\naccept-version:1.2\n\n\0`);
        // Send subscription after a short delay for STOMP handshake
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(subscribeFrame);
          }
        }, 200);
      };

      ws.onmessage = (event) => {
        try {
          // Try parsing STOMP MESSAGE frame
          const data = event.data as string;
          if (data.startsWith('MESSAGE')) {
            const bodyStart = data.indexOf('\n\n');
            if (bodyStart !== -1) {
              const body = data.substring(bodyStart + 2).replace(/\0$/, '');
              const parsed = JSON.parse(body);
              onNotification(parsed);
            }
          } else if (data.startsWith('{')) {
            // Direct JSON message (non-STOMP fallback)
            onNotification(JSON.parse(data));
          }
        } catch {
          // Ignore non-JSON messages (CONNECTED, RECEIPT, etc.)
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        if (mountedRef.current) {
          reconnectTimer.current = window.setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Error', err);
        ws.close();
      };
    } catch (err) {
      console.warn('[WS] Connection failed', err);
      if (mountedRef.current) {
        reconnectTimer.current = window.setTimeout(connect, 5000);
      }
    }
  }, [userId, onNotification, clearReconnect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearReconnect();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnect]);

  return wsRef;
}
