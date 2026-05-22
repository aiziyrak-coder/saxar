import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, X } from 'lucide-react';
import { uploadImageFile, type UploadFolder } from '../../services/uploadApi';
import { normalizeMediaPath, resolveMediaUrl } from '../../utils/mediaUrl';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { Button } from './Button';
import { Input } from './Input';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  hint?: string;
  className?: string;
  /** Tashqi URL qo‘lda kiritish (https://... yoki /media/...) */
  allowUrl?: boolean;
}

export function ImageUpload({
  label = 'Rasm',
  value,
  onChange,
  folder = 'catalog',
  hint,
  className = '',
  allowUrl = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const externalUrl = /^https?:\/\//i.test(value.trim());
  const urlInputValue = urlDraft || (externalUrl ? value : '');

  const preview = resolveMediaUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!hasDjangoJwt()) {
      setError('Avval tizimga kiring (JWT kerak).');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { url } = await uploadImageFile(file, folder);
      onChange(url);
      setUrlDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklash amalga oshmadi');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const applyUrl = () => {
    const raw = urlDraft.trim() || value.trim();
    if (!raw) {
      onChange('');
      return;
    }
    if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/') && !raw.startsWith('media/') && !raw.startsWith('uploads/')) {
      setError('URL https:// bilan boshlansin yoki /media/... yo‘lini kiriting.');
      return;
    }
    onChange(normalizeMediaPath(raw));
    setUrlDraft('');
    setError('');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-24 w-24 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
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
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Yuklanmoqda…' : 'Fayl yuklash'}
            </Button>
            {value && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={uploading}
                onClick={() => {
                  onChange('');
                  setUrlDraft('');
                }}
              >
                <X className="h-3 w-3 mr-1 inline" />
                O‘chirish
              </Button>
            )}
          </div>
          {allowUrl && (
            <div className="space-y-1">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="yoki rasm URL"
                    placeholder="https://... yoki /media/uploads/..."
                    value={urlInputValue}
                    onChange={(e) => {
                      setUrlDraft(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyUrl();
                      }
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="shrink-0 mb-0.5"
                  title="URL ni qo‘llash"
                  onClick={applyUrl}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-1">
        Fayl yuklash (JPEG, PNG, WebP, GIF · maks. 5 MB) yoki tayyor URL kiriting
      </p>
    </div>
  );
}
