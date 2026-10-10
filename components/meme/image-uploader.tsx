"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";

import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  images: File[];
  onChange: (next: File[]) => void;
  max?: number;
  disabled?: boolean;
}

function makeThumb(file: File): string {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }
  return "blob:thumb-fallback";
}

function revoke(url: string) {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

/**
 * Multi-file image picker with thumbnail previews and per-item removal.
 * Honors an optional `max` count limit. Object URLs are revoked on change
 * and unmount to avoid leaks.
 */
export function ImageUploader({
  images,
  onChange,
  max,
  disabled,
}: ImageUploaderProps) {
  const thumbs = useMemo(() => images.map(makeThumb), [images]);

  const tracked = useRef<string[]>([]);
  useEffect(() => {
    const prev = tracked.current;
    tracked.current = thumbs;
    return () => prev.forEach(revoke);
  }, [thumbs]);

  const atLimit = max != null && images.length >= max;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const next =
      max != null ? [...images, ...picked].slice(0, max) : [...images, ...picked];
    onChange(next);
    e.target.value = "";
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>图片{max != null ? `（最多 ${max} 张）` : ""}</Label>
      <div className="flex flex-wrap gap-3">
        {thumbs.map((src, index) => (
          <div
            key={`${images[index]?.name}-${index}`}
            className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={images[index]?.name ?? `图片 ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                aria-label={`删除图片 ${index + 1}`}
                onClick={() => removeAt(index)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        {!disabled && !atLimit && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary">
            <ImagePlus className="size-5" />
            <span className="text-xs">上传</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-label="上传图片"
              onChange={onPick}
            />
          </label>
        )}
      </div>
      {atLimit && (
        <p className="text-xs text-muted-foreground">
          已达到最大上传数量 {max} 张。
        </p>
      )}
    </div>
  );
}
