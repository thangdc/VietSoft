export type AccountState = {
  authenticated: boolean;
  email: string;
  displayName?: string;
};

export type LicenseState = {
  active: boolean;
  key: string;
  email: string;
  expiresAt?: string;
};

export type AccountLicenseState = {
  account: AccountState;
  license: LicenseState;
  busy: boolean;
};

export type AccountLicenseActions = {
  signIn: () => void;
  signOut: () => Promise<void>;
  activateLicense: (key: string, email: string) => Promise<void>;
  clearLicense: () => Promise<void>;
};