// src/shared/auth/cross-tab.ts
export const AUTH_CHANNEL = "edumath-auth";
export const LS_KEY = "edumath:auth:event";

export type AuthSyncEvent =
  | { type: "AUTH_LOGOUT"; at: number; reason?: string; nonce?: number };

function safeParse<T>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

export function broadcastLogout(reason?: string) {
  const evt: AuthSyncEvent = {
    type: "AUTH_LOGOUT",
    at: Date.now(),
    reason,
    nonce: Math.random(), // storage event'in her seferinde tetiklenmesi için
  };

  // 1) BroadcastChannel (primary)
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.postMessage(evt);
      bc.close();
    }
  } catch {
    // ignore
  }

  // 2) localStorage storage event (fallback)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(evt));
  } catch {
    // ignore
  }
}

export function subscribeAuthSync(onLogout: (evt: AuthSyncEvent) => void) {
  let bc: BroadcastChannel | null = null;

  const handle = (evt: AuthSyncEvent | null) => {
    if (!evt) return;
    if (evt.type === "AUTH_LOGOUT") onLogout(evt);
  };

  // BroadcastChannel listener
  try {
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.onmessage = (e) => handle(e.data as AuthSyncEvent);
    }
  } catch {
    bc = null;
  }

  // localStorage listener
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LS_KEY) return;
    handle(safeParse<AuthSyncEvent>(e.newValue));
  };

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    if (bc) bc.close();
  };
}
