export interface SharedFile {
  id: string;
  originalName: string;
  storedFilename: string;
  size: number;
  mimeType: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  uploadedAt: string;
  senderName: string;
  senderIp: string;
  downloadCount: number;
}

export interface NetworkInterface {
  interfaceName: string;
  ip: string;
  isLikelyWifi: boolean;
}

export interface ServerInfo {
  hostname: string;
  platform: string;
  isWindows: boolean;
  isMac: boolean;
  port: number;
  clientIp: string;
  interfaces: NetworkInterface[];
  currentOrigin?: string;
  appUrl?: string;
  pairingPin: string;
  pairingMode: 'pin' | 'approval' | 'open';
  totalFiles: number;
  activeSessionsCount: number;
}

export interface PendingApproval {
  id: string;
  deviceName: string;
  ip: string;
  requestedAt: number;
}

export interface ConnectedDevice {
  id: string;
  deviceName: string;
  ip: string;
  role: string;
  approvedAt: number;
  lastSeen: number;
}

export interface PairingStatus {
  pairingPin: string;
  pairingMode: 'pin' | 'approval' | 'open';
  pending: PendingApproval[];
  connectedDevices: ConnectedDevice[];
}

export interface ActiveTransfer {
  id: string;
  filename: string;
  totalBytes: number;
  loadedBytes: number;
  progressPercent: number;
  speedBytesPerSec: number;
  timeRemainingSec: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  errorMessage?: string;
  xhr?: XMLHttpRequest;
}
