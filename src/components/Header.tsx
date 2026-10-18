import React from 'react';
import { 
  Wifi, 
  Share2, 
  Smartphone, 
  Monitor, 
  HelpCircle, 
  HardDrive, 
  Server, 
  Link2 
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface HeaderProps {
  currentView: 'host' | 'client';
  onViewChange: (view: 'host' | 'client') => void;
  onOpenGuide: () => void;
  onOpenServerSettings: () => void;
  serverUrl: string;
  totalFiles: number;
  totalBytes: number;
  activeDevicesCount: number;
  serverOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenGuide,
  onOpenServerSettings,
  serverUrl,
  totalFiles,
  totalBytes,
  activeDevicesCount,
  serverOnline,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                LocalShare
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Offline LAN
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Zero Internet • Cross-Device Wi-Fi Transfer
            </p>
          </div>
        </div>

        {/* View Switcher (Host PC vs Mobile Phone) */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => onViewChange('host')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentView === 'host'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Host computer that shares network & displays QR code"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Host PC</span>
          </button>
          <button
            onClick={() => onViewChange('client')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentView === 'client'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Mobile device or connected browser view"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone Client</span>
          </button>
        </div>

        {/* Status, Attached Server & Guide */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Attached Server Button / Indicator */}
          <button
            onClick={onOpenServerSettings}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
              serverUrl
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Attach or configure custom backend server URL"
          >
            <Server className={`w-3.5 h-3.5 ${serverUrl ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline font-mono">
              {serverUrl ? serverUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'Server URL'}
            </span>
            <span className="sm:hidden font-mono text-[11px]">Server</span>
            <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-400' : 'bg-rose-400'} ml-0.5`} />
          </button>

          {/* Storage & Peers (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/40">
            <div className="flex items-center space-x-1.5" title="Storage used by shared files">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatBytes(totalBytes)} ({totalFiles})</span>
            </div>
            {activeDevicesCount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">
                  {activeDevicesCount} peer{activeDevicesCount > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 transition"
            title="How to transfer without internet"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
