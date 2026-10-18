import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  ExternalLink, 
  Wifi, 
  Globe, 
  Settings2,
  Trash2,
  HelpCircle,
  Smartphone,
  Radio,
  Server
} from 'lucide-react';
import { NetworkInterface, ConnectedDevice } from '../types';

interface QRPanelProps {
  interfaces: NetworkInterface[];
  selectedIp: string;
  onSelectIp: (ip: string) => void;
  port: number;
  pin: string;
  pairingMode: 'pin' | 'approval' | 'open';
  onRegeneratePin: () => void;
  onChangeMode: (mode: 'pin' | 'approval' | 'open') => void;
  connectedDevices: ConnectedDevice[];
  onDisconnectDevice: (deviceId: string) => void;
  onOpenMobileTest: () => void;
  currentOrigin?: string;
  serverUrl?: string;
  onOpenServerSettings?: () => void;
}

export const QRPanel: React.FC<QRPanelProps> = ({
  interfaces,
  selectedIp,
  onSelectIp,
  port,
  pin,
  pairingMode,
  onRegeneratePin,
  onChangeMode,
  connectedDevices,
  onDisconnectDevice,
  onOpenMobileTest,
  currentOrigin,
  serverUrl,
  onOpenServerSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [customIpInput, setCustomIpInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if we are running on a cloud preview URL (like .run.app or non-localhost)
  const isHostedDomain = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  // URL Mode: 'web' for cloud / live preview, 'local' for local offline Wi-Fi
  const [urlMode, setUrlMode] = useState<'web' | 'local'>(() => {
    return isHostedDomain ? 'web' : 'local';
  });

  // Calculate the target sharing URL (including custom server URL param if attached)
  let sharingUrl = '';
  const serverQuery = serverUrl ? `&server=${encodeURIComponent(serverUrl)}` : '';
  if (urlMode === 'web') {
    const origin = currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    sharingUrl = `${origin}/?role=client&pin=${pin}${serverQuery}`;
  } else {
    const host = selectedIp || (interfaces.length > 0 ? interfaces[0].ip : '192.168.1.15');
    sharingUrl = `http://${host}:${port || 3000}/?role=client&pin=${pin}${serverQuery}`;
  }

  // Render QR Code to Canvas locally
  useEffect(() => {
    if (canvasRef.current && sharingUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        sharingUrl,
        {
          width: 210,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR Code render error:', error);
        }
      );
    }
  }, [sharingUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleApplyCustomIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIpInput.trim()) {
      onSelectIp(customIpInput.trim());
      setCustomIpInput('');
      setUrlMode('local');
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Selector Tabs: Live Web Link vs Offline Wi-Fi */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            QR Code Target Network
          </span>
          <p className="text-xs text-slate-500">
            Choose how you are running the app to ensure your phone opens the right address
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setUrlMode('web')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              urlMode === 'web'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web App URL {isHostedDomain ? '(Active)' : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setUrlMode('local')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              urlMode === 'local'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Offline Wi-Fi IP</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* QR Code Canvas */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="p-3 bg-white rounded-2xl shadow-xl ring-1 ring-slate-800/20 flex items-center justify-center">
            <canvas ref={canvasRef} className="rounded-xl block" />
          </div>

          <div className="mt-3 flex items-center space-x-2">
            <a
              href={sharingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/50 transition"
              title="Open the exact link that the QR code points to in a new tab"
            >
              <span>Test Link in Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onOpenMobileTest}
              className="text-xs text-slate-300 hover:text-white font-medium flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Switch to phone view"
            >
              <Smartphone className="w-3 h-3" />
              <span>Phone View</span>
            </button>
          </div>
        </div>

        {/* Pairing Information & Network Controls */}
        <div className="flex-1 w-full space-y-5">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                Scan with Phone Camera
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {urlMode === 'web'
                  ? 'Scan with iPhone or Android to open and pair instantly via the live web app.'
                  : 'Scan with iPhone or Android connected to the same offline Wi-Fi router or PC hotspot.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenServerSettings && (
                <button
                  type="button"
                  onClick={onOpenServerSettings}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                    serverUrl
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Attach or configure separate server URL"
                >
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Attach Server</span>
                  {serverUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                  showAdvanced
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Configure IP address or security mode"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>

          {/* Target Sharing URL Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium flex items-center gap-1.5">
                {urlMode === 'web' ? (
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                )}
                Active QR Code Address:
              </span>
              <span className="text-slate-500 text-[11px]">
                {urlMode === 'web' ? 'Live Web URL' : `Local Port ${port}`}
              </span>
            </div>

            <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-200">
              <span className="font-mono text-cyan-300 select-all truncate flex-1 text-xs sm:text-sm">
                {sharingUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="ml-2 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PIN and Security Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 6-Digit PIN */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Pairing PIN
                </span>
                <span className="text-2xl font-mono font-bold tracking-widest text-white">
                  {pin}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleCopyPin}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Copy PIN"
                >
                  {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={onRegeneratePin}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Generate new PIN"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Security Mode */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Security Mode
                </span>
                <span className="text-sm font-semibold text-slate-200 capitalize flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  {pairingMode === 'pin' && 'PIN Protected'}
                  {pairingMode === 'approval' && 'Host Approval'}
                  {pairingMode === 'open' && 'Open (Trusted LAN)'}
                </span>
              </div>

              <select
                value={pairingMode}
                onChange={(e) => onChangeMode(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="pin">PIN Required</option>
                <option value="approval">Host Prompt</option>
                <option value="open">Open Access</option>
              </select>
            </div>
          </div>

          {/* Advanced / IP Configuration Drawer */}
          {showAdvanced && (
            <div className="bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  Local Wi-Fi Network Configuration
                </span>
                <span className="text-slate-500 text-[11px]">
                  {interfaces.length} LAN interface(s)
                </span>
              </div>

              {interfaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {interfaces.map((net, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelectIp(net.ip);
                        setUrlMode('local');
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs flex flex-col justify-between transition ${
                        selectedIp === net.ip && urlMode === 'local'
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-[140px] font-medium text-slate-200">
                          {net.interfaceName}
                        </span>
                        {net.isLikelyWifi && (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Wi-Fi
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400 mt-1">{net.ip}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-medium text-slate-300">How to find your Windows PC Wi-Fi IP:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[11px]">
                    <li>Open Windows Terminal or Command Prompt (<code className="bg-slate-800 px-1 rounded text-cyan-300">cmd</code>).</li>
                    <li>Type <code className="bg-slate-800 px-1 rounded text-cyan-300">ipconfig</code> and press Enter.</li>
                    <li>Look for <strong className="text-white">IPv4 Address</strong> (e.g., <code className="text-cyan-300">192.168.1.XX</code>).</li>
                    <li>Enter that IP address below and click Set IP.</li>
                  </ol>
                </div>
              )}

              {/* Custom IP input */}
              <form onSubmit={handleApplyCustomIp} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.15"
                  value={customIpInput}
                  onChange={(e) => setCustomIpInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition"
                >
                  Set Custom IP
                </button>
              </form>
            </div>
          )}

          {/* Connected Peers List */}
          {connectedDevices.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Connected Devices ({connectedDevices.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {connectedDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-medium text-white">{dev.deviceName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">({dev.ip})</span>
                    </div>
                    <button
                      onClick={() => onDisconnectDevice(dev.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      title="Disconnect device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
