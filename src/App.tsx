/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SharedFile, 
  ServerInfo, 
  PairingStatus, 
  ActiveTransfer, 
  ConnectedDevice 
} from './types';
import { detectDevice } from './utils/device';
import { 
  getInitialServerUrl, 
  buildApiUrl, 
  STORAGE_KEY_SERVER_URL, 
  cleanUrl 
} from './utils/apiConfig';
import { Header } from './components/Header';
import { QRPanel } from './components/QRPanel';
import { FilePicker } from './components/FilePicker';
import { TransferProgress } from './components/TransferProgress';
import { ReceivedFiles } from './components/ReceivedFiles';
import { FilePreviewModal } from './components/FilePreviewModal';
import { HostApprovalBanner } from './components/HostApprovalBanner';
import { PairingModal } from './components/PairingModal';
import { WifiGuideModal } from './components/WifiGuideModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { 
  Smartphone, 
  Monitor, 
  LogOut, 
  Server, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const [deviceProfile] = useState(() => detectDevice());
  const [viewRole, setViewRole] = useState<'host' | 'client'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('pin') || params.get('role') === 'client') {
        return 'client';
      }
    }
    return 'host';
  });

  // Attached separate Server URL state
  const [serverUrl, setServerUrl] = useState<string>(() => getInitialServerUrl());
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>([]);
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>({
    pairingPin: '',
    pairingMode: 'pin',
    pending: [],
    connectedDevices: [],
  });
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Client Session State
  const [clientToken, setClientToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('localshare_token') : null;
  });
  const [clientDeviceName, setClientDeviceName] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('localshare_devicename')) || deviceProfile.name;
  });
  const [urlPin, setUrlPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('pin') || '';
    }
    return '';
  });

  // Resilient fetch helper that handles custom server failure and falls back to local origin
  const resilientFetch = useCallback(async (endpoint: string): Promise<Response | null> => {
    // 1. If custom serverUrl is set, attempt it first
    if (serverUrl) {
      try {
        const fullUrl = buildApiUrl(endpoint, serverUrl);
        const res = await fetch(fullUrl);
        if (res.ok) {
          return res;
        }
      } catch {
        // Fall back to same origin below
      }
    }
    // 2. Fetch same origin
    try {
      const fallbackRes = await fetch(endpoint);
      if (fallbackRes.ok) {
        return fallbackRes;
      }
    } catch {
      // Server is currently unreachable
    }
    return null;
  }, [serverUrl]);

  // Fetch server info
  const fetchServerInfo = useCallback(async () => {
    const res = await resilientFetch('/api/info');
    if (res) {
      try {
        const data: ServerInfo = await res.json();
        setServerInfo(data);
        setServerOnline(true);
        if (!selectedIp) {
          if (data.interfaces && data.interfaces.length > 0) {
            setSelectedIp(data.interfaces[0].ip);
          } else {
            setSelectedIp('192.168.1.15');
          }
        }
      } catch {
        setServerOnline(false);
      }
    } else {
      setServerOnline(false);
    }
  }, [resilientFetch, selectedIp]);

  // Fetch shared files
  const fetchSharedFiles = useCallback(async () => {
    const res = await resilientFetch('/api/files');
    if (res) {
      try {
        const data = await res.json();
        setSharedFiles(data.files || []);
        setServerOnline(true);
      } catch {
        // silent
      }
    }
  }, [resilientFetch]);

  // Fetch pairing status (host polls pending requests & connected peers)
  const fetchPairingStatus = useCallback(async () => {
    const res = await resilientFetch('/api/pairing/status');
    if (res) {
      try {
        const data: PairingStatus = await res.json();
        setPairingStatus(data);
        setServerOnline(true);
      } catch {
        // silent
      }
    }
  }, [resilientFetch]);

  // Initial load
  useEffect(() => {
    fetchServerInfo();
    fetchSharedFiles();
    fetchPairingStatus();
  }, [fetchServerInfo, fetchSharedFiles, fetchPairingStatus]);

  // Periodic polling for files and pairing
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSharedFiles();
      if (viewRole === 'host') {
        fetchPairingStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [viewRole, fetchSharedFiles, fetchPairingStatus]);

  // Save new server URL
  const handleSaveServerUrl = (newUrl: string) => {
    const cleaned = cleanUrl(newUrl);
    setServerUrl(cleaned);
    if (typeof window !== 'undefined') {
      if (cleaned) {
        localStorage.setItem(STORAGE_KEY_SERVER_URL, cleaned);
      } else {
        localStorage.removeItem(STORAGE_KEY_SERVER_URL);
      }
    }
    // Re-fetch with new URL
    setTimeout(() => {
      fetchServerInfo();
      fetchSharedFiles();
      fetchPairingStatus();
    }, 150);
  };

  // File Upload via Streaming XMLHttpRequest with Progress
  const handleStartUpload = (filesToUpload: File[], sender: string) => {
    for (const file of filesToUpload) {
      const transferId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const xhr = new XMLHttpRequest();
      let lastLoaded = 0;
      let lastTime = performance.now();

      const newTransfer: ActiveTransfer = {
        id: transferId,
        filename: file.name,
        totalBytes: file.size,
        loadedBytes: 0,
        progressPercent: 0,
        speedBytesPerSec: 0,
        timeRemainingSec: 0,
        status: 'uploading',
        xhr,
      };

      setActiveTransfers((prev) => [newTransfer, ...prev]);

      // Track upload progress events
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const now = performance.now();
          const elapsedSec = (now - lastTime) / 1000;
          const deltaBytes = event.loaded - lastLoaded;

          let speed = 0;
          if (elapsedSec > 0.1) {
            speed = deltaBytes / elapsedSec;
            lastTime = now;
            lastLoaded = event.loaded;
          }

          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          const remainingBytes = event.total - event.loaded;
          const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

          setActiveTransfers((prev) =>
            prev.map((t) =>
              t.id === transferId
                ? {
                    ...t,
                    loadedBytes: event.loaded,
                    progressPercent: percent,
                    speedBytesPerSec: speed || t.speedBytesPerSec,
                    timeRemainingSec: timeRemaining,
                  }
                : t
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setActiveTransfers((prev) =>
            prev.map((t) =>
              t.id === transferId
                ? {
                    ...t,
                    loadedBytes: file.size,
                    progressPercent: 100,
                    status: 'completed',
                  }
                : t
            )
          );
          fetchSharedFiles();
        } else {
          setActiveTransfers((prev) =>
            prev.map((t) =>
              t.id === transferId
                ? {
                    ...t,
                    status: 'error',
                    errorMessage: `Server error (${xhr.status})`,
                  }
                : t
            )
          );
        }
      };

      xhr.onerror = () => {
        setActiveTransfers((prev) =>
          prev.map((t) =>
            t.id === transferId
              ? {
                  ...t,
                  status: 'error',
                  errorMessage: 'Network error or unreachable server',
                }
              : t
          )
        );
      };

      xhr.onabort = () => {
        setActiveTransfers((prev) =>
          prev.map((t) =>
            t.id === transferId
              ? {
                  ...t,
                  status: 'cancelled',
                }
              : t
          )
        );
      };

      const formData = new FormData();
      formData.append('files', file);
      formData.append('senderName', sender);

      const uploadUrl = buildApiUrl('/api/upload', serverUrl);
      xhr.open('POST', uploadUrl, true);
      if (clientToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${clientToken}`);
      }
      xhr.send(formData);
    }
  };

  const handleCancelTransfer = (transferId: string) => {
    setActiveTransfers((prev) => {
      const match = prev.find((t) => t.id === transferId);
      if (match && match.xhr) {
        match.xhr.abort();
      }
      return prev.map((t) => (t.id === transferId ? { ...t, status: 'cancelled' } : t));
    });
  };

  const handleDismissTransfer = (transferId: string) => {
    setActiveTransfers((prev) => prev.filter((t) => t.id !== transferId));
  };

  // Download a shared file
  const handleDownload = (file: SharedFile) => {
    const downloadUrl = buildApiUrl(`/api/files/${file.id}/download`, serverUrl);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', file.originalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(fetchSharedFiles, 800);
  };

  // Delete a shared file
  const handleDelete = async (fileId: string) => {
    try {
      const res = await fetch(buildApiUrl(`/api/files/${fileId}`, serverUrl), { method: 'DELETE' });
      if (res.ok) {
        setSharedFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Clear all files
  const handleClearAll = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/files/clear', serverUrl), { method: 'POST' });
      if (res.ok) {
        setSharedFiles([]);
      }
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  // Host Action: Approve or Deny pending device
  const handleHostApprovalAction = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      await fetch(buildApiUrl('/api/pairing/action', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      fetchPairingStatus();
    } catch (err) {
      console.error('Approval action error:', err);
    }
  };

  // Host: Regenerate PIN
  const handleRegeneratePin = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/pairing/regenerate-pin', serverUrl), { method: 'POST' });
      const data = await res.json();
      if (data.pairingPin) {
        setPairingStatus((prev) => ({ ...prev, pairingPin: data.pairingPin }));
      }
    } catch (err) {
      console.error('Regenerate PIN error:', err);
    }
  };

  // Host: Change Pairing Mode
  const handleChangePairingMode = async (mode: 'pin' | 'approval' | 'open') => {
    try {
      const res = await fetch(buildApiUrl('/api/pairing/mode', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        setPairingStatus((prev) => ({ ...prev, pairingMode: mode }));
      }
    } catch (err) {
      console.error('Change mode error:', err);
    }
  };

  // Host: Disconnect device
  const handleDisconnectDevice = async (deviceId: string) => {
    try {
      await fetch(buildApiUrl('/api/pairing/disconnect', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      fetchPairingStatus();
    } catch (err) {
      console.error('Disconnect device error:', err);
    }
  };

  // Client: Pairing Success
  const handleClientPairSuccess = (token: string, devName: string) => {
    setClientToken(token);
    setClientDeviceName(devName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('localshare_token', token);
      localStorage.setItem('localshare_devicename', devName);
    }
  };

  // Client: Disconnect / Log out
  const handleClientLogout = () => {
    setClientToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('localshare_token');
    }
  };

  // Open mobile test in simulator or popup
  const handleOpenMobileTest = () => {
    setViewRole('client');
  };

  const totalBytes = sharedFiles.reduce((acc, f) => acc + f.size, 0);
  const activePin = pairingStatus.pairingPin || serverInfo?.pairingPin || '123456';
  const effectivePairingMode = pairingStatus.pairingMode || serverInfo?.pairingMode || 'pin';

  // Check if client is authorized
  const isClientAuthorized =
    effectivePairingMode === 'open' || Boolean(clientToken);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Host Approval Banner for incoming connection requests */}
      {viewRole === 'host' && (
        <HostApprovalBanner
          pendingRequests={pairingStatus.pending}
          onAction={handleHostApprovalAction}
        />
      )}

      {/* Main Header with Server Connection Status */}
      <Header
        currentView={viewRole}
        onViewChange={setViewRole}
        onOpenGuide={() => setShowGuide(true)}
        onOpenServerSettings={() => setShowServerSettings(true)}
        serverUrl={serverUrl}
        totalFiles={sharedFiles.length}
        totalBytes={totalBytes}
        activeDevicesCount={pairingStatus.connectedDevices.length}
        serverOnline={serverOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Attached Server Notification Banner (if custom server URL is used) */}
        {serverUrl && (
          <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>
                Connected to custom backend server: <strong className="font-mono text-white">{serverUrl}</strong>
              </span>
            </div>
            <button
              onClick={() => setShowServerSettings(true)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              Change Server
            </button>
          </div>
        )}

        {/* ================= HOST VIEW (PC) ================= */}
        {viewRole === 'host' && (
          <div className="space-y-8">
            {/* Top QR & Network Information Panel */}
            <QRPanel
              interfaces={serverInfo?.interfaces || []}
              selectedIp={selectedIp}
              onSelectIp={setSelectedIp}
              port={serverInfo?.port || 3000}
              pin={activePin}
              pairingMode={effectivePairingMode}
              onRegeneratePin={handleRegeneratePin}
              onChangeMode={handleChangePairingMode}
              connectedDevices={pairingStatus.connectedDevices}
              onDisconnectDevice={handleDisconnectDevice}
              onOpenMobileTest={handleOpenMobileTest}
              currentOrigin={serverInfo?.currentOrigin}
              serverUrl={serverUrl}
              onOpenServerSettings={() => setShowServerSettings(true)}
            />

            {/* Active Transfer Progress (if any) */}
            <TransferProgress
              transfers={activeTransfers}
              onCancelTransfer={handleCancelTransfer}
              onDismissTransfer={handleDismissTransfer}
            />

            {/* Dual Column: Send Files from Host PC & Received Files */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* File Picker / Uploader */}
              <div className="lg:col-span-5 space-y-6">
                <FilePicker
                  onStartUpload={handleStartUpload}
                  defaultSenderName={
                    serverInfo?.isWindows
                      ? 'Windows PC'
                      : serverInfo?.isMac
                      ? 'Mac'
                      : 'Host PC'
                  }
                  isUploading={activeTransfers.some((t) => t.status === 'uploading')}
                />
              </div>

              {/* Shared & Received Files */}
              <div className="lg:col-span-7 space-y-6">
                <ReceivedFiles
                  files={sharedFiles}
                  onDownload={handleDownload}
                  onPreview={(file) => setPreviewFile(file)}
                  onDelete={handleDelete}
                  onClearAll={handleClearAll}
                  role="host"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= CLIENT VIEW (PHONE / SECOND DEVICE) ================= */}
        {viewRole === 'client' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Pairing Modal if not yet authorized */}
            {!isClientAuthorized && (
              <PairingModal
                initialPin={urlPin}
                defaultDeviceName={clientDeviceName}
                onPairSuccess={handleClientPairSuccess}
                pairingMode={effectivePairingMode}
                serverUrl={serverUrl}
              />
            )}

            {/* Client Connected Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm sm:text-base">
                      {clientDeviceName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Connected to Host
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {serverUrl ? `Server: ${serverUrl}` : 'Local Wi-Fi Host • Ready to share'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowServerSettings(true)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-slate-700 transition"
                  title="Configure server URL"
                >
                  <Server className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClientLogout}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                  title="Disconnect device"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Transfer Progress for Mobile */}
            <TransferProgress
              transfers={activeTransfers}
              onCancelTransfer={handleCancelTransfer}
              onDismissTransfer={handleDismissTransfer}
            />

            {/* Upload Files from Phone to Host PC */}
            <FilePicker
              onStartUpload={handleStartUpload}
              defaultSenderName={clientDeviceName}
              isUploading={activeTransfers.some((t) => t.status === 'uploading')}
            />

            {/* Browse & Download Files Shared by PC */}
            <ReceivedFiles
              files={sharedFiles}
              onDownload={handleDownload}
              onPreview={(file) => setPreviewFile(file)}
              onDelete={handleDelete}
              onClearAll={handleClearAll}
              role="client"
            />
          </div>
        )}
      </main>

      {/* Media Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        serverUrl={serverUrl}
      />

      {/* Offline Transfer Guide Modal */}
      {showGuide && <WifiGuideModal onClose={() => setShowGuide(false)} />}

      {/* Server Connection Settings Modal */}
      {showServerSettings && (
        <ServerSettingsModal
          currentServerUrl={serverUrl}
          onSaveServerUrl={handleSaveServerUrl}
          onClose={() => setShowServerSettings(false)}
          defaultOrigin={typeof window !== 'undefined' ? window.location.origin : ''}
        />
      )}
    </div>
  );
}
