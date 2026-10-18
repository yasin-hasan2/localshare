import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Wifi, 
  Globe, 
  ArrowRight,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { testServerConnection, cleanUrl, ServerPingResult } from '../utils/apiConfig';

interface ServerSettingsModalProps {
  currentServerUrl: string;
  onSaveServerUrl: (url: string) => void;
  onClose: () => void;
  defaultOrigin: string;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  currentServerUrl,
  onSaveServerUrl,
  onClose,
  defaultOrigin,
}) => {
  const [inputUrl, setInputUrl] = useState(currentServerUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ServerPingResult | null>(null);

  useEffect(() => {
    // Test current configured URL on open
    handleTest(inputUrl);
  }, []);

  const handleTest = async (urlToTest = inputUrl) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testServerConnection(urlToTest);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleaned = cleanUrl(inputUrl);
    onSaveServerUrl(cleaned);
    onClose();
  };

  const handleResetDefault = () => {
    setInputUrl('');
    handleTest('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Attach Server Side URL</h3>
              <p className="text-xs text-slate-400">Connect this client to a separate backend server</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs sm:text-sm">
          {/* Explanation Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs">
              <Laptop className="w-4 h-4" />
              <span>Separate Server & Client Architecture</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              You can run the backend server separately on your Windows PC, Mac, or VPS, and point this client to it. All file uploads, downloads, and QR pairings will route directly to your server.
            </p>
          </div>

          {/* Server URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Backend Server Base URL</span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-normal hover:underline"
              >
                Use Same Host (Default)
              </button>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={defaultOrigin || 'http://192.168.1.100:3000'}
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setTestResult(null);
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleTest(inputUrl)}
                disabled={isTesting}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5 flex-shrink-0"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputUrl('');
                  handleTest('');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs border transition ${
                  !inputUrl
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Same Host (Default)
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputUrl('http://localhost:3000');
                  handleTest('http://localhost:3000');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs border transition font-mono ${
                  inputUrl === 'http://localhost:3000'
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                http://localhost:3000
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputUrl('http://192.168.1.15:3000');
                  handleTest('http://192.168.1.15:3000');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs border transition font-mono ${
                  inputUrl.includes('192.168.')
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                LAN PC (192.168.x.x:3000)
              </button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1 animate-fadeIn ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold">
                {testResult.ok ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Server Connected Successfully!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Connection Failed</span>
                  </>
                )}
              </div>

              {testResult.ok ? (
                <div className="text-[11px] text-emerald-300/80 space-y-0.5 pt-1">
                  <p>Latency: <strong>{testResult.latencyMs}ms</strong></p>
                  {testResult.serverInfo && (
                    <p>
                      Host: <strong>{testResult.serverInfo.hostname || 'LocalShare Server'}</strong> ({testResult.serverInfo.platform || 'Node'}) • PIN: <strong>{testResult.serverInfo.pairingPin}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-rose-300/90 pt-1">
                  {testResult.error}
                </p>
              )}
            </div>
          )}

          {/* Quick Guide to Run Standalone Server */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              How to Run the Server on Your PC:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>On your Windows PC / Mac, run: <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">npm run dev</code></li>
              <li>Your server will start and listen on port <strong className="text-white">3000</strong>.</li>
              <li>Type your PC&apos;s IP address above (e.g. <code className="text-cyan-300">http://192.168.1.50:3000</code>).</li>
              <li>Click <strong className="text-white">Save & Attach</strong>. This client will transfer files directly to and from your PC!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition"
          >
            <span>Save & Attach Server</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
