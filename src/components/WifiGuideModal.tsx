import React from 'react';
import { X, Wifi, ShieldAlert, Cpu, Smartphone, Monitor, CheckCircle, Zap } from 'lucide-react';

interface WifiGuideModalProps {
  onClose: () => void;
}

export const WifiGuideModal: React.FC<WifiGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">How Offline Transfer Works</h3>
              <p className="text-xs text-slate-400">100% Local • No Internet Connection Needed</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs sm:text-sm custom-scrollbar">
          {/* Step 1 */}
          <div className="flex items-start space-x-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white">No Internet is Required on your Wi-Fi</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                A Wi-Fi router connects your devices together locally via LAN packets. Even if the WAN/Fiber cable is disconnected and your router shows &quot;No Internet&quot;, devices can still exchange files at top Wi-Fi speeds (up to 100+ MB/s).
              </p>
            </div>
          </div>

          {/* Option B: Windows Hotspot */}
          <div className="flex items-start space-x-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white">Don&apos;t have a router? Turn on Windows Mobile Hotspot</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                In Windows Settings, turn on <strong className="text-white">Mobile Hotspot</strong>. Then connect your iPhone or Android to your PC&apos;s Wi-Fi network. No cellular data or internet plan is needed!
              </p>
            </div>
          </div>

          {/* Step 3: QR Code Pairing */}
          <div className="flex items-start space-x-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white">Scan the QR Code with iPhone / Android Camera</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Open your native Camera app or Safari/Chrome, scan the QR code displayed on your PC screen, and tap the notification link. It automatically authenticates via the embedded 6-digit session PIN.
              </p>
            </div>
          </div>

          {/* Router Warning / AP Isolation */}
          <div className="flex items-start space-x-3.5 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-xs sm:text-sm">Important: Client Isolation & Guest Networks</h4>
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Some Wi-Fi routers have a setting called <strong className="text-white">&quot;AP Isolation&quot;</strong> or <strong className="text-white">&quot;Client Isolation&quot;</strong> (often enabled on Guest Wi-Fi). This setting prevents devices from communicating with each other. If your phone cannot open the page, ensure both devices are on the primary private Wi-Fi network.
              </p>
            </div>
          </div>

          {/* Cross-Platform Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
              <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                iPhone / iPad (iOS Safari)
              </span>
              <p className="text-[11px] text-slate-400">
                Supports camera roll photos, 4K videos, voice memos, and iCloud files. Downloads save automatically into Safari Downloads and Files app.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
              <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Android (Chrome / Firefox)
              </span>
              <p className="text-[11px] text-slate-400">
                Supports photos, APKs, downloads, documents, and camera captures directly saved into the phone&apos;s Downloads folder.
              </p>
            </div>
          </div>

          {/* Deployment Card */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-2">
            <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              How to Deploy & Host
            </span>
            <div className="text-slate-300 text-xs space-y-1.5 leading-relaxed">
              <p>
                • <strong className="text-white">AI Studio Live Link:</strong> Click the <strong className="text-white">Share</strong> button in the top right of AI Studio to immediately get a public URL for your friends or family.
              </p>
              <p>
                • <strong className="text-white">Run Offline on Windows PC:</strong> Run <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">npm run build && npm start</code> on your machine. Devices connect via your local IP (<code className="text-cyan-300">http://192.168.1.XX:3000</code>).
              </p>
              <p>
                • <strong className="text-white">Cloud Hosting (Render / Railway / Docker):</strong> Deploy this repo to Render or Railway with build command <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">npm run build</code> and start command <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300">npm start</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
