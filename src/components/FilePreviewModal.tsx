import React, { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { SharedFile } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';

import { buildApiUrl } from '../utils/apiConfig';

interface FilePreviewModalProps {
  file: SharedFile | null;
  onClose: () => void;
  onDownload: (file: SharedFile) => void;
  serverUrl?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  serverUrl,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!file) {
      setTextContent(null);
      return;
    }

    const isTextReadable =
      file.category === 'document' &&
      (file.mimeType.includes('text') ||
        file.originalName.endsWith('.txt') ||
        file.originalName.endsWith('.md') ||
        file.originalName.endsWith('.json') ||
        file.originalName.endsWith('.csv') ||
        file.originalName.endsWith('.log'));

    if (isTextReadable) {
      setLoadingText(true);
      fetch(buildApiUrl(`/api/files/${file.id}/preview`, serverUrl))
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text.slice(0, 50000)); // preview up to 50KB text
        })
        .catch(() => {
          setTextContent('Failed to load text preview.');
        })
        .finally(() => {
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [file, serverUrl]);

  if (!file) return null;

  const previewUrl = buildApiUrl(`/api/files/${file.id}/preview`, serverUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="min-w-0 mr-4">
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {file.originalName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatBytes(file.size)} • Sent by {file.senderName} • {formatDate(file.uploadedAt)}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Media Viewer */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[300px]">
          {file.category === 'image' ? (
            <img
              src={previewUrl}
              alt={file.originalName}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : file.category === 'video' ? (
            <video
              src={previewUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[70vh] max-w-full rounded-lg shadow-lg bg-black"
            />
          ) : file.category === 'audio' ? (
            <div className="w-full max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-white">{file.originalName}</p>
              <audio src={previewUrl} controls className="w-full" />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-full max-h-[65vh] overflow-auto bg-slate-900 p-4 rounded-xl font-mono text-xs text-slate-200 border border-slate-800 whitespace-pre-wrap">
              {loadingText ? (
                <div className="flex items-center justify-center py-10 space-x-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading preview...</span>
                </div>
              ) : (
                textContent
              )}
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-white">Direct Preview Not Supported</p>
              <p className="text-xs text-slate-400 max-w-sm">
                This file format ({file.mimeType}) cannot be rendered directly in the browser. Click below to download and open it locally.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                <span>Save to Device</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
