export type AppEventMap = {
  'qr:type-changed': { type: string };
  'qr:generated': { type: string; data: string };
  'history:changed': { reason: 'create' | 'update' | 'delete' | 'replace' };
  'auth:changed': { authenticated: boolean };
};

type Handler<T> = (payload: T) => void;

const handlers = new Map<string, Set<Handler<unknown>>>();

export function emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
  handlers.get(event)?.forEach((handler) => handler(payload));
}

export function on<K extends keyof AppEventMap>(event: K, handler: Handler<AppEventMap[K]>): () => void {
  const set = handlers.get(event) ?? new Set<Handler<unknown>>();
  set.add(handler as Handler<unknown>);
  handlers.set(event, set);
  return () => set.delete(handler as Handler<unknown>);
}
