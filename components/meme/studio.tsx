"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  type UseMutationResult,
} from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ApiError,
  ValidationError,
  generateMeme,
  getKeys,
  getMemeInfo,
  getMemePreview,
  getVersion,
} from "@/lib/api";
import {
  buildFormData,
  getMemeDisplayName,
  resolveDefaultArgs,
  tryParseJson,
  type ImageResult,
} from "@/lib/meme-utils";
import type { MemeInfo } from "@/lib/types";

import { ArgsEditor } from "./args-editor";
import { ImageUploader } from "./image-uploader";
import { PreviewPanel } from "./preview-panel";
import { TextFields } from "./text-fields";
import { TemplateList } from "./template-list";

type GenerateMutation = UseMutationResult<ImageResult, Error, FormData>;

function displayVersion(value: unknown): string {
  if (value == null) return "未知";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const v = (value as Record<string, unknown>).version;
    if (v != null) return String(v);
    return JSON.stringify(value);
  }
  return "未知";
}

export function MemeStudio() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const versionQuery = useQuery({
    queryKey: ["version"],
    queryFn: getVersion,
  });
  const keysQuery = useQuery({ queryKey: ["keys"], queryFn: getKeys });

  const handleRefresh = () => {
    versionQuery.refetch();
    keysQuery.refetch();
    toast.success("已刷新");
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-base font-semibold">表情包制作工坊</h1>
          <span className="text-xs text-muted-foreground">
            v{displayVersion(versionQuery.data)}
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw /> 刷新
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r">
          {keysQuery.error ? (
            <div className="p-4 text-sm text-destructive">
              模板列表加载失败
            </div>
          ) : (
            <TemplateList
              items={keysQuery.data ?? []}
              selected={selectedKey}
              onSelect={setSelectedKey}
              loading={keysQuery.isLoading}
            />
          )}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row">
          {!selectedKey ? (
            <Card className="flex-1">
              <CardContent className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  从左侧选择一个表情包模板开始制作。
                </p>
              </CardContent>
            </Card>
          ) : (
            // Remounting on selection change resets all form state naturally.
            <Workspace key={selectedKey} selectedKey={selectedKey} />
          )}
        </main>
      </div>
    </div>
  );
}

function Workspace({ selectedKey }: { selectedKey: string }) {
  const infoQuery = useQuery({
    queryKey: ["info", selectedKey],
    queryFn: () => getMemeInfo(selectedKey),
  });
  const previewQuery = useQuery({
    queryKey: ["preview", selectedKey],
    queryFn: () => getMemePreview(selectedKey),
  });
  const [result, setResult] = useState<ImageResult | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const generateMutation: GenerateMutation = useMutation({
    mutationFn: (fd: FormData) => generateMeme(selectedKey, fd),
    onSuccess: (res) => {
      setResult(res);
      setResultError(null);
      toast.success("生成成功");
    },
    onError: (err) => {
      if (err instanceof ValidationError) {
        setResultError(err.errors.join("；"));
        toast.error("参数校验失败");
      } else if (err instanceof ApiError) {
        setResultError(err.message);
        toast.error(err.message);
      } else {
        setResultError("生成失败，请重试");
        toast.error("生成失败，请重试");
      }
    },
  });

  if (infoQuery.isLoading) {
    return (
      <Card className="flex-1">
        <CardContent className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">加载模板信息…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <EditorPanel
      selectedKey={selectedKey}
      info={infoQuery.data ?? null}
      infoError={!!infoQuery.error}
      preview={previewQuery.data ?? null}
      result={result}
      resultError={resultError}
      generateMutation={generateMutation}
    />
  );
}

interface EditorPanelProps {
  selectedKey: string;
  info: MemeInfo | null;
  infoError: boolean;
  preview: ImageResult | null;
  result: ImageResult | null;
  resultError: string | null;
  generateMutation: GenerateMutation;
}

function EditorPanel({
  selectedKey,
  info,
  infoError,
  preview,
  result,
  resultError,
  generateMutation,
}: EditorPanelProps) {
  // Initialize form state once from the loaded info. Because this panel is
  // keyed by the selected template, changing selection remounts it with fresh
  // defaults — no reset effect required.
  const [texts, setTexts] = useState<string[]>(() =>
    info?.texts && info.texts.length ? info.texts : []
  );
  const [images, setImages] = useState<File[]>([]);
  const [args, setArgs] = useState<string>(() => resolveDefaultArgs(info));
  const [argError, setArgError] = useState<string | null>(null);

  // Track object URLs so they can be revoked when replaced/unmounted.
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls: string[] = [];
    if (result?.type === "blob" && result.url) urls.push(result.url);
    if (preview?.type === "blob" && preview.url) urls.push(preview.url);
    objectUrls.current = urls;
    return () => {
      urls.forEach((u) => {
        if (
          typeof URL !== "undefined" &&
          typeof URL.revokeObjectURL === "function"
        ) {
          URL.revokeObjectURL(u);
        }
      });
    };
  }, [result, preview]);

  const handleGenerate = () => {
    const parsed = tryParseJson(args);
    if (!parsed.ok) {
      setArgError(parsed.error ?? "JSON 格式错误");
      toast.error("args 不是合法 JSON");
      return;
    }
    setArgError(null);
    const fd = buildFormData({ images, texts, args });
    generateMutation.mutate(fd);
  };

  const handleDownload = () => {
    if (!result?.url) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${selectedKey}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{getMemeDisplayName(info, selectedKey)}</CardTitle>
          <CardDescription className="font-mono text-xs">
            {selectedKey}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {infoError && (
            <p role="alert" className="text-sm text-destructive">
              模板信息加载失败，已切换到通用模式。
            </p>
          )}
          <TextFields
            values={texts}
            onChange={setTexts}
            disabled={generateMutation.isPending}
          />
          <ImageUploader
            images={images}
            onChange={setImages}
            max={info?.images?.max}
            disabled={generateMutation.isPending}
          />
          <div className="space-y-1">
            <ArgsEditor
              value={args}
              onChange={setArgs}
              disabled={generateMutation.isPending}
            />
            {argError && (
              <p role="alert" className="text-xs text-destructive">
                {argError}
              </p>
            )}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending && <Loader2 className="animate-spin" />}
            生成表情包
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardContent className="h-full p-4">
          <PreviewPanel
            preview={preview}
            result={result}
            isGenerating={generateMutation.isPending}
            error={resultError}
            hasSelection
            onDownload={handleDownload}
            onRegenerate={handleGenerate}
          />
        </CardContent>
      </Card>
    </>
  );
}
