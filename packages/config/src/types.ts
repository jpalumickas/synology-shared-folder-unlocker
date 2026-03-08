export interface NasDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  shares: EncryptedShare[];
}

export interface EncryptedShare {
  id: string;
  name: string;
  password: string;
}

export interface AppConfig {
  pollingInterval: number;
  nasList: NasDevice[];
}

export interface ShareStatus {
  nasId: string;
  shareId: string;
  shareName: string;
  status: 'unknown' | 'locked' | 'unlocked' | 'error';
  lastChecked: string | null;
  error?: string;
}

export interface AppStatus {
  initialized: boolean;
  unlocked: boolean;
  sessionValid: boolean;
}
