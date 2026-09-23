export type AppState = {
  activeQrType: string;
  busy: boolean;
};

let state: AppState = {
  activeQrType: 'url',
  busy: false,
};

export function getState(): AppState {
  return { ...state };
}

export function setState(patch: Partial<AppState>): AppState {
  state = { ...state, ...patch };
  return getState();
}
