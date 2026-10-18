import React from 'react';
import { 
  ArrowUpRight, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Clock 
} from 'lucide-react';
import { ActiveTransfer } from '../types';
import { formatBytes, formatSpeed, formatTimeRemaining } from '../utils/formatters';

interface TransferProgressProps {
  transfers: ActiveTransfer[];
  onCancelTransfer: (transferId: string) => void;
  onDismissTransfer: (transferId: string) => void;
}

export const TransferProgress: React.FC<TransferProgressProps> = ({
  transfers,
  onCancelTransfer,
  onDismissTransfer,
}) => {
  if (transfers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Active Transfers ({transfers.length})
        </span>
      </div>

      <div className="space-y-2.5">
        {transfers.map((item) => {
          const isDone = item.status === 'completed';
          const isError = item.status === 'error';
          const isCancelled = item.status === 'cancelled';
          const isRunning = item.status === 'uploading';

          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate mr-2">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  ) : isCancelled ? (
                    <X className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-white truncate">
                    {item.filename}
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {isDone ? '100%' : isCancelled ? 'Cancelled' : isError ? 'Failed' : `${item.progressPercent}%`}
                  </span>

                  {isRunning && (
                    <button
                      onClick={() => onCancelTransfer(item.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Cancel transfer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(isDone || isError || isCancelled) && (
                    <button
                      onClick={() => onDismissTransfer(item.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${
                    isDone
                      ? 'bg-emerald-500'
                      : isError
                      ? 'bg-rose-500'
                      : isCancelled
                      ? 'bg-slate-600'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(item.progressPercent, 2)}%` }}
                />
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div>
                  <span>{formatBytes(item.loadedBytes)}</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span>{formatBytes(item.totalBytes)}</span>
                </div>

                {isRunning && (
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center text-cyan-300">
                      <Zap className="w-3 h-3 mr-0.5 text-cyan-400" />
                      {formatSpeed(item.speedBytesPerSec)}
                    </span>
                    <span className="flex items-center text-slate-400">
                      <Clock className="w-3 h-3 mr-0.5" />
                      {formatTimeRemaining(item.timeRemainingSec)}
                    </span>
                  </div>
                )}

                {isError && (
                  <span className="text-rose-400">
                    {item.errorMessage || 'Transfer failed. Check Wi-Fi.'}
                  </span>
                )}
                {isDone && (
                  <span className="text-emerald-400 font-sans font-medium">
                    Uploaded to host!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
