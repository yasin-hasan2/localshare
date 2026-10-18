import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Eye, 
  File, 
  Image as ImageIcon, 
  Film, 
  Music, 
  FileText, 
  Archive, 
  Search, 
  FolderDown, 
  Smartphone, 
  Monitor, 
  HardDrive,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { SharedFile } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';

interface ReceivedFilesProps {
  files: SharedFile[];
  onDownload: (file: SharedFile) => void;
  onPreview: (file: SharedFile) => void;
  onDelete: (fileId: string) => void;
  onClearAll: () => void;
  role: 'host' | 'client';
}

type CategoryFilter = 'all' | 'image' | 'video' | 'document' | 'audio' | 'archive';

export const ReceivedFiles: React.FC<ReceivedFilesProps> = ({
  files,
  onDownload,
  onPreview,
  onDelete,
  onClearAll,
  role,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.senderName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getFileIcon = (cat: SharedFile['category']) => {
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-pink-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-indigo-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryBg = (cat: SharedFile['category']) => {
    switch (cat) {
      case 'image':
        return 'bg-pink-500/10 border-pink-500/20';
      case 'video':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'audio':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'document':
        return 'bg-cyan-500/10 border-cyan-500/20';
      case 'archive':
        return 'bg-indigo-500/10 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleDownloadClick = (file: SharedFile) => {
    setDownloadingId(file.id);
    onDownload(file);
    setTimeout(() => setDownloadingId(null), 1000);
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">
              Shared Network Files
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {files.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Files stored on local PC • Accessible by all paired devices on this Wi-Fi
          </p>
        </div>

        {/* Clear All & Storage summary */}
        {files.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden md:inline">
              Total: <strong className="text-slate-200">{formatBytes(totalBytes)}</strong>
            </span>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Storage</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal for clearing all */}
      {showClearConfirm && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-200">
              Permanently delete all {files.length} shared files from the local storage folder?
            </p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClearAll();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium transition"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by file name or sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center overflow-x-auto space-x-1 pb-1 sm:pb-0 custom-scrollbar">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'image', label: 'Photos' },
                { id: 'video', label: 'Videos' },
                { id: 'document', label: 'Docs' },
                { id: 'audio', label: 'Audio' },
                { id: 'archive', label: 'Archives' },
              ] as { id: CategoryFilter; label: string }[]
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  categoryFilter === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files List */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start space-x-3">
                {/* File Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${getCategoryBg(
                    file.category
                  )}`}
                >
                  {getFileIcon(file.category)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h4>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                    <span className="font-mono text-slate-300 font-medium">
                      {formatBytes(file.size)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400 truncate max-w-[120px]" title={file.senderName}>
                      <Smartphone className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{file.senderName}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                    <span>{formatDate(file.uploadedAt)}</span>
                    {file.downloadCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">
                          {file.downloadCount} download{file.downloadCount > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onPreview(file)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center space-x-1 text-xs"
                    title="Preview file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Preview</span>
                  </button>

                  <button
                    onClick={() => onDelete(file.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleDownloadClick(file)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : files.length > 0 ? (
        <div className="text-center py-10 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-400">No files matched your filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
            className="mt-2 text-xs text-cyan-400 hover:underline"
          >
            Reset search
          </button>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800/90 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <FolderDown className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-300">
              No files shared yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select or drop files above to share with phones on your network, or scan the QR code to send files from your phone!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
