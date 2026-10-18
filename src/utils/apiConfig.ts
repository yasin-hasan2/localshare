/**
 * API configuration and server URL management
 * Allows attaching an external / separate server URL to the client.
 */

export const STORAGE_KEY_SERVER_URL = 'localshare_server_url';

export function isMixedContent(targetUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol !== 'https:') return false;
  try {
    const trimmed = targetUrl.trim();
    if (!trimmed) return false;
    const full = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    const parsed = new URL(full);
    // If target is http and not localhost/127.0.0.1, it's blocked by browsers as Mixed Content
    if (parsed.protocol === 'http:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function getInitialServerUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Check if specified in URL query params: ?server=http://...
  const params = new URLSearchParams(window.location.search);
  const serverParam = params.get('server');
  if (serverParam) {
    try {
      const clean = cleanUrl(serverParam);
      if (!isMixedContent(clean)) {
        localStorage.setItem(STORAGE_KEY_SERVER_URL, clean);
        return clean;
      }
    } catch {
      // ignore invalid
    }
  }

  // 2. Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY_SERVER_URL);
  if (stored) {
    const clean = cleanUrl(stored);
    // Clean up if saved an insecure/blocked URL on an HTTPS page
    if (isMixedContent(clean)) {
      try {
        localStorage.removeItem(STORAGE_KEY_SERVER_URL);
      } catch {
        // ignore
      }
      return '';
    }
    return clean;
  }

  // 3. Default: empty string (same-origin relative paths)
  return '';
}

export function cleanUrl(url: string): string {
  let trimmed = url.trim();
  if (!trimmed) return '';
  // Remove trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');
  // If user typed '192.168.1.5:3000' without protocol, prepend http://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  return trimmed;
}

export function buildApiUrl(endpoint: string, customServerUrl?: string): string {
  const base = customServerUrl !== undefined ? customServerUrl : (typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_SERVER_URL) || '') : '');
  const cleanBase = cleanUrl(base);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!cleanBase) {
    return cleanEndpoint;
  }
  return `${cleanBase}${cleanEndpoint}`;
}

export interface ServerPingResult {
  ok: boolean;
  latencyMs?: number;
  serverInfo?: any;
  error?: string;
  isMixedContentWarning?: boolean;
}

export async function testServerConnection(url: string): Promise<ServerPingResult> {
  const target = cleanUrl(url);
  
  if (target && isMixedContent(target)) {
    return {
      ok: false,
      isMixedContentWarning: true,
      error: 'Browsers block insecure HTTP requests from HTTPS pages (Mixed Content). To connect to a local HTTP Wi-Fi IP, open this app over HTTP on your LAN or use HTTPS.',
    };
  }

  const checkUrl = target ? `${target}/api/info` : '/api/info';
  const start = performance.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(checkUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const serverInfo = await res.json();
      return { ok: true, latencyMs, serverInfo };
    }
    return {
      ok: false,
      error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Connection timed out (no response within 4 seconds)' };
    }
    return {
      ok: false,
      error: err.message || 'Cannot reach server. Check IP/URL and Wi-Fi connection.',
    };
  }
}
