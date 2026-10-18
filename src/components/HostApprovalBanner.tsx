import React from 'react';
import { Smartphone, Check, X, ShieldAlert } from 'lucide-react';
import { PendingApproval } from '../types';

interface HostApprovalBannerProps {
  pendingRequests: PendingApproval[];
  onAction: (requestId: string, action: 'approve' | 'deny') => void;
}

export const HostApprovalBanner: React.FC<HostApprovalBannerProps> = ({
  pendingRequests,
  onAction,
}) => {
  if (pendingRequests.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs sm:text-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 animate-bounce">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Connection Request Pending</span>
            <p className="text-xs text-amber-300/80">
              {pendingRequests[0].deviceName} ({pendingRequests[0].ip}) wants to pair and share files.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAction(pendingRequests[0].id, 'deny')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Deny</span>
          </button>
          <button
            onClick={() => onAction(pendingRequests[0].id, 'approve')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve Device</span>
          </button>
        </div>
      </div>
    </div>
  );
};
