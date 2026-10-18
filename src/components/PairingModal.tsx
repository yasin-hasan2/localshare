import React, { useState, useEffect } from 'react';
import { Lock, Smartphone, ShieldCheck, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { buildApiUrl } from '../utils/apiConfig';

interface PairingModalProps {
  initialPin?: string;
  defaultDeviceName: string;
  onPairSuccess: (token: string, deviceName: string) => void;
  pairingMode: 'pin' | 'approval' | 'open';
  serverUrl?: string;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  initialPin = '',
  defaultDeviceName,
  onPairSuccess,
  pairingMode,
  serverUrl,
}) => {
  const [pin, setPin] = useState(initialPin);
  const [deviceName, setDeviceName] = useState(defaultDeviceName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingApprovalRequestId, setWaitingApprovalRequestId] = useState<string | null>(null);

  // If initialPin passed in query params, auto-submit pairing on mount
  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      handlePair(initialPin);
    }
  }, [initialPin]);

  // Polling if waiting for host manual approval
  useEffect(() => {
    if (!waitingApprovalRequestId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/pair/check/${waitingApprovalRequestId}`, serverUrl));
        const data = await res.json();
        if (data.status === 'approved' && data.token) {
          clearInterval(interval);
          onPairSuccess(data.token, deviceName);
        } else if (data.status === 'rejected') {
          clearInterval(interval);
          setWaitingApprovalRequestId(null);
          setError('Connection request was denied by the host.');
        }
      } catch (e) {
        // network retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [waitingApprovalRequestId, deviceName, onPairSuccess, serverUrl]);

  const handlePair = async (submitPin = pin) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl('/api/pair', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: submitPin,
          deviceName: deviceName.trim() || defaultDeviceName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to pair with host.');
        setLoading(false);
        return;
      }

      if (data.status === 'approved' && data.token) {
        onPairSuccess(data.token, deviceName);
      } else if (data.status === 'pending' && data.requestId) {
        setWaitingApprovalRequestId(data.requestId);
      }
    } catch (err: any) {
      setError('Cannot connect to local host. Check if connected to same Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPin(clean);
    if (clean.length === 6) {
      handlePair(clean);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-cyan-500/20">
          <Lock className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">
            Connect to LocalShare Host
          </h2>
          <p className="text-xs text-slate-400">
            {waitingApprovalRequestId
              ? 'Request sent to host PC. Awaiting confirmation...'
              : 'Enter the 6-digit PIN displayed on the host PC screen'}
          </p>
        </div>

        {waitingApprovalRequestId ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300">
              Please click <strong className="text-emerald-400">Approve</strong> on the host computer.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePair();
            }}
            className="space-y-4 text-left"
          >
            {/* Device Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                Your Device Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. iPhone 15 Pro, Android Galaxy"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* PIN input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                6-Digit PIN
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••••"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect & Start Sharing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
