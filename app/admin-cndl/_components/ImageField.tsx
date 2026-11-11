'use client';
import { useId, useRef, useState } from 'react';
import { ImageUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '../_lib/session';
import { apiError, checkImageFile } from '../_lib/utils';
import { Button } from './ui';

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

/**
 * Image picker for CMS forms: drop a file or click to choose. Uploads to
 * /api/admin/upload (SUPERADMIN; optimised to WebP server-side) and reports
 * the stored URL. Shows a local preview while the upload runs.
 */
export function ImageField({
  label,
  value,
  onChange,
  onUploading,
  hint,
  aspect = 'aspect-[16/9]',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploading?: (busy: boolean) => void;
  hint?: string;
  aspect?: string;
}) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const upload = async (file: File) => {
    const problem = checkImageFile(file);
    if (problem) return void toast.error(problem);
    const local = URL.createObjectURL(file);
    setPreview(local);
    setBusy(true);
    onUploading?.(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) return void toast.error(apiError(body, 'Upload failed'));
      onChange(body.url);
    } catch {
      toast.error('Upload failed — check the connection and try again');
    } finally {
      URL.revokeObjectURL(local);
      setPreview(null);
      setBusy(false);
      onUploading?.(false);
    }
  };

  const shown = preview || value;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-table font-medium text-zinc-700">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) void upload(f);
        }}
        className={cx(
          'relative overflow-hidden rounded-lg border border-dashed transition-colors',
          aspect,
          over ? 'border-brand-500 bg-brand-50' : 'border-zinc-300 bg-zinc-50'
        )}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file
          <img src={shown} alt="" className={cx('h-full w-full object-cover', busy && 'opacity-60')} />
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-center text-zinc-500 hover:text-zinc-800"
          >
            <ImageUp size={20} aria-hidden="true" />
            <span className="text-table font-medium">Drop an image or click to choose</span>
            <span className="text-meta text-zinc-400">JPEG, PNG, WebP, GIF or AVIF, up to 10 MB</span>
          </button>
        )}
        {busy && (
          <span className="absolute inset-x-0 bottom-0 bg-zinc-900/70 px-3 py-1.5 text-center text-meta text-white">Uploading and optimising…</span>
        )}
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void upload(f);
        }}
      />
      {shown && !busy && (
        <div className="flex gap-2">
          <Button size="sm" icon={ImageUp} onClick={() => input.current?.click()}>
            Replace
          </Button>
          <Button size="sm" variant="ghost" icon={X} onClick={() => onChange('')}>
            Remove
          </Button>
        </div>
      )}
      {hint && <p className="text-meta text-zinc-500">{hint}</p>}
    </div>
  );
}
