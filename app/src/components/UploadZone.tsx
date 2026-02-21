import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  previewUrl: string | null;
}

export function UploadZone({ onFileSelect, selectedFile, onClear, previewUrl }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed p-12 text-center cursor-pointer block-pattern',
            'transition-all duration-300 ease-out',
            'bg-[#0d1a0a]/60',
            isDragging 
              ? 'border-[#7CBD6B] bg-[#5a8c4a]/20 scale-[1.02]' 
              : 'border-[#5a6b4a] hover:border-[#7CBD6B] hover:bg-[#1a2d12]/60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className={cn(
            'w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 border-[#5a8c4a]',
            'bg-[#5a8c4a]/30',
            'transition-transform duration-300',
            isDragging && 'scale-110'
          )}>
            <Upload className={cn(
              'w-8 h-8 transition-colors duration-300',
              isDragging ? 'text-[#7CBD6B]' : 'text-white/60'
            )} />
          </div>
          
          <p className="text-lg font-medium text-white mb-2">
            Drop your drawing here
          </p>
          <p className="text-sm text-white/50">
            or click to browse (PNG, JPG)
          </p>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
            <ImageIcon className="w-4 h-4" />
            <span>Max file size: 10MB</span>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-[#0d1a0a]/80 border-2 border-[#4a5b3a]">
          {previewUrl && (
            <div className="relative aspect-video">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain bg-black/20"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-[#5a8c4a] bg-[#5a8c4a]/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-[#7CBD6B]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-white/50">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <button
              onClick={onClear}
              className={cn(
                'w-10 h-10 flex items-center justify-center border-2 border-[#5a6b4a]',
                'bg-[#1a2d12]/80 hover:bg-[#5a6b4a]/50 hover:border-[#7CBD6B] transition-colors duration-200',
                'group'
              )}
            >
              <X className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}