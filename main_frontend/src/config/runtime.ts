export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function toWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
}

export const WS_BASE_URL = (import.meta.env.VITE_WS_URL || (API_BASE_URL ? toWsUrl(API_BASE_URL) : '')).replace(/\/$/, '');
