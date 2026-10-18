import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Film, 
  Music, 
  FileText, 
  Archive, 
  X, 
  Send, 
  Smartphone, 
  Monitor,
  FolderOpen
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface FilePickerProps {
  onStartUpload: (files: File[], senderName: string) => void;
  defaultSenderName: string;
  isUploading: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  onStartUpload,
  defaultSenderName,
  isUploading,
}) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelection = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const array = Array.from(newFiles);
    setStagedFiles((prev) => [...prev, ...array]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllStaged = () => {
    setStagedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if (stagedFiles.length === 0 || isUploading) return;
    onStartUpload(stagedFiles, senderName.trim() || defaultSenderName);
    setStagedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalStagedSize = stagedFiles.reduce((acc, f) => acc + f.size, 0);

  const getStagedIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/.test(name)) {
      return <ImageIcon className="w-4 h-4 text-pink-400" />;
    }
    if (type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/.test(name)) {
      return <Film className="w-4 h-4 text-purple-400" />;
    }
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(name)) {
      return <Music className="w-4 h-4 text-amber-400" />;
    }
    if (/\.(zip|tar|gz|7z|rar)$/.test(name)) {
      return <Archive className="w-4 h-4 text-indigo-400" />;
    }
    return <FileText className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Send Files Over Wi-Fi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select or drop any photos, 4K videos, documents, or ZIP archives
          </p>
        </div>

        {/* Sender Device Name */}
        <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-400">From:</span>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="My Device"
            className="bg-transparent text-xs text-white font-medium focus:outline-none w-32 sm:w-40"
            title="Name displayed on receiving devices"
          />
        </div>
      </div>

      {/* Hidden file input supporting multi-selection and mobile file picking */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelection(e.target.files)}
        className="hidden"
        id="localshare-file-input"
      />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.005]'
            : 'border-slate-700/80 hover:border-cyan-500/60 bg-slate-950/40 hover:bg-slate-950/70'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition transform duration-200 shadow-lg shadow-cyan-500/5">
            <FolderOpen className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Click to browse or drop files here
            </p>
            <p className="text-xs text-slate-400">
              Direct transfer via local Wi-Fi • No cloud upload • No file size limits
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Photos & Videos</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">PDFs & Docs</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">ZIP & Folders</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Music & Audio</span>
          </div>
        </div>
      </div>

      {/* Staged Files Queue */}
      {stagedFiles.length > 0 && (
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              Ready to Send ({stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''} • {formatBytes(totalStagedSize)})
            </span>
            <button
              onClick={handleClearAllStaged}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              Clear selection
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {stagedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate mr-2">
                  {getStagedIcon(file)}
                  <span className="text-slate-200 truncate font-medium">{file.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {formatBytes(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStagedFile(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                  title="Remove from queue"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSend}
              disabled={isUploading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send {stagedFiles.length} File{stagedFiles.length > 1 ? 's' : ''} to Network</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
