import React, { useState, useRef } from 'react';
import { Upload, X, Camera, FileText, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export interface FileUploadZoneProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  allowPdf?: boolean;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/avif',
  maxSizeMB = 5,
  label = 'Product Image',
  allowPdf = false,
  className
}) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || '');

  const effectiveAccept = allowPdf ? `${accept},application/pdf` : accept;

  const handleUploadFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Validate File Size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: ${maxSizeMB}MB.`);
      return;
    }

    // 2. Validate MIME Type
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isImage && (!allowPdf || !isPdf)) {
      setErrorMessage(`Invalid file format: ${file.type || 'unknown'}. Please upload an image${allowPdf ? ' or PDF' : ''}.`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', file);

      // Upload via backend API
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.file) {
            setUploadProgress(100);
            const resolvedUrl = res.file.url.startsWith('http')
              ? res.file.url
              : `http://localhost:5000${res.file.url}`;
            onChange(resolvedUrl);
            setManualUrl(resolvedUrl);
            setTimeout(() => setUploading(false), 300);
          } else {
            setErrorMessage(res.message || 'Upload failed.');
            setUploading(false);
          }
        } else {
          setErrorMessage(`Upload error HTTP ${xhr.status}`);
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setErrorMessage('Network error while uploading file.');
        setUploading(false);
      };

      xhr.open('POST', `${API_BASE}/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload');
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const isPdfFile = value && (value.endsWith('.pdf') || value.includes('application/pdf'));

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700 tracking-tight">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Use File Upload' : 'Paste Image URL'}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <Input
            value={manualUrl}
            onChange={(e) => {
              setManualUrl(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="https://images.unsplash.com/photo-..."
          />
        </div>
      ) : value ? (
        <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 p-2 flex items-center gap-3">
          {isPdfFile ? (
            <div className="w-16 h-16 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-rose-600 shrink-0">
              <FileText className="w-6 h-6" />
              <span className="text-[9px] font-bold mt-0.5">PDF</span>
            </div>
          ) : (
            <img
              src={value}
              alt="Uploaded preview"
              className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
            />
          )}

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">File ready</span>
            </div>
            <p className="text-[11px] text-stone-500 truncate mt-0.5">{value}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              onChange('');
              setManualUrl('');
            }}
            className="absolute top-2 right-2 p-1 rounded-full text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-2xl p-5 text-center transition-all bg-stone-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer',
            dragActive
              ? 'border-emerald-500 bg-emerald-50/30'
              : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={effectiveAccept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadFile(e.target.files[0]);
              }
            }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadFile(e.target.files[0]);
              }
            }}
          />

          {uploading ? (
            <div className="w-full flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium text-stone-600">
                Uploading... {uploadProgress}%
              </span>
              <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-sm">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  Click to upload or drag & drop
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Supports JPEG, PNG, WebP{allowPdf ? ', PDF' : ''} (up to {maxSizeMB}MB)
                </p>
              </div>

              {/* Mobile camera button */}
              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-[11px]"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" />
                  Capture Photo
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
