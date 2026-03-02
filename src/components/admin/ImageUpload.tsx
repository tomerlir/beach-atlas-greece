import React, { useCallback, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { authSupabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  /** Current image URL (from DB or upload) */
  value: string;
  /** Called when the URL changes (upload complete, manual entry, or cleared) */
  onChange: (url: string) => void;
  /** Supabase Storage bucket name */
  bucket: string;
  /** Storage path prefix, e.g. "beaches/abc-123" */
  storagePath: string;
  /** Label shown above the field */
  label?: string;
  /** Validation error message */
  error?: string;
  /** HTML name attribute for the hidden input (for form validation) */
  name?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ImageUpload({
  value,
  onChange,
  bucket,
  storagePath,
  label = "Photo",
  error,
  name,
}: ImageUploadProps) {
  const [useUrl, setUseUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Cache-busted URL used only for the in-admin preview so the browser
  // shows the newly uploaded image instead of a stale cached version.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError("Unsupported file type. Use JPEG, PNG, WebP, or AVIF.");
        return;
      }
      // Validate size
      if (file.size > MAX_SIZE_BYTES) {
        setUploadError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
        return;
      }

      setUploadError(null);
      setUploading(true);
      setProgress(0);

      // Build the storage file path: storagePath/filename
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${storagePath}/photo.${ext}`;

      try {
        // Simulate progress since Supabase JS client doesn't expose upload progress via XHR.
        // We use a timer that advances from 0 → 90% during the upload, then jump to 100% on success.
        const progressTimer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) return 90;
            return prev + 10;
          });
        }, 200);

        // Try to remove existing file first, then insert fresh.
        // This avoids upsert issues where Supabase's internal UPDATE check
        // can fail on RLS even though the INSERT would succeed.
        await authSupabase.storage.from(bucket).remove([filePath]);

        const { error: uploadErr } = await authSupabase.storage
          .from(bucket)
          .upload(filePath, file, { contentType: file.type });

        clearInterval(progressTimer);

        if (uploadErr) {
          throw uploadErr;
        }

        // Get the public URL (clean, no query params — saved to DB as-is)
        const {
          data: { publicUrl },
        } = authSupabase.storage.from(bucket).getPublicUrl(filePath);

        setProgress(100);
        // Save clean URL to the database; use cache-bust only for the local preview
        onChange(publicUrl);
        setPreviewUrl(`${publicUrl}?t=${Date.now()}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);
        setProgress(0);
      } finally {
        setUploading(false);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [bucket, storagePath, onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemove = useCallback(() => {
    onChange("");
    setPreviewUrl(null);
    setUploadError(null);
    setProgress(0);
  }, [onChange]);

  // Manual URL mode
  if (useUrl) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">{label}</label>
        <Input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          aria-invalid={!!error}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => setUseUrl(false)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Upload className="h-3 w-3" />
          Switch to file upload
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>

      {/* Current image preview */}
      {value && !uploading && (
        <div className="relative inline-block">
          <img
            src={previewUrl || value}
            alt="Current photo"
            className="h-40 w-auto rounded-lg border object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-pulse" />
            Uploading...
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
      )}

      {/* Drop zone (hidden during upload) */}
      {!uploading && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {value ? "Drop a new image to replace" : "Drop an image here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP, AVIF — max {MAX_SIZE_MB} MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            aria-label={`Upload ${label.toLowerCase()}`}
          />
        </div>
      )}

      {/* Error */}
      {(uploadError || error) && <p className="text-sm text-destructive">{uploadError || error}</p>}

      {/* Toggle to manual URL */}
      <button
        type="button"
        onClick={() => setUseUrl(true)}
        className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
      >
        <LinkIcon className="h-3 w-3" />
        Enter URL instead
      </button>
    </div>
  );
}
