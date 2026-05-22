import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadImageFile, type UploadFolder } from '../../services/uploadApi';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { Button } from './Button';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  hint?: string;
  className?: string;
}

export function ImageUpload({
  label = 'Rasm',
  value,
  onChange,
  folder = 'catalog',
  hint,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const preview = resolveMediaUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!hasDjangoJwt()) {
      setError('Avval «API ga ulanish» yoki qayta login qiling.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { url } = await uploadImageFile(file, folder);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklash amalga oshmadi');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <div
          className="relative h-24 w-24 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-8 w-8 text-slate-300" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-[140px]">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Yuklanmoqda…' : 'Rasm tanlash'}
          </Button>
          {value && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={uploading}
              onClick={() => onChange('')}
            >
              <X className="h-3 w-3 mr-1 inline" />
              O‘chirish
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP yoki GIF · maks. 5 MB</p>
    </div>
  );
}
