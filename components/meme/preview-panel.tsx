"use client";

import { useState } from "react";
import { Download, Maximize2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImageResult } from "@/lib/meme-utils";

interface PreviewPanelProps {
  preview: ImageResult | null;
  result: ImageResult | null;
  isGenerating?: boolean;
  error?: string | null;
  hasSelection?: boolean;
  onDownload?: () => void;
  onRegenerate?: () => void;
}

export function PreviewPanel({
  preview,
  result,
  isGenerating,
  error,
  hasSelection,
  onDownload,
  onRegenerate,
}: PreviewPanelProps) {
  const [zoom, setZoom] = useState(false);
  const display = result ?? preview;
  const hasImage = !!display?.url;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">预览</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={!hasSelection || isGenerating}
          >
            <RefreshCw className={isGenerating ? "animate-spin" : ""} /> 重新生成
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onDownload}
            disabled={!hasImage}
          >
            <Download /> 下载
          </Button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 p-4">
        {isGenerating && !result && (
          <Skeleton className="absolute inset-0 rounded-none opacity-60" />
        )}
        {hasImage ? (
          <div className="group relative max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={display!.url}
              alt="表情包预览"
              role="img"
              className="max-h-[420px] max-w-full cursor-zoom-in rounded-md object-contain"
              onClick={() => setZoom(true)}
            />
            <button
              type="button"
              aria-label="点击放大"
              onClick={() => setZoom(true)}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {hasSelection ? "加载预览中…" : "请选择左侧模板"}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>图片预览</DialogTitle>
          </DialogHeader>
          {hasImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={display!.url}
              alt="表情包预览大图"
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
