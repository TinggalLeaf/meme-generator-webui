import type { MemeKey, MemeInfo } from "./types";

/**
 * Resolve a human-readable (Chinese) display name for a meme template from the
 * backend info. The API returns a Chinese `keywords` array (e.g. ["真寻挨骂"]);
 * we use the first entry. Falls back to the raw key when unavailable.
 */
export function getMemeDisplayName(
  info: MemeInfo | null | undefined,
  key: string
): string {
  const keywords = info?.keywords;
  if (
    Array.isArray(keywords) &&
    keywords.length > 0 &&
    typeof keywords[0] === "string" &&
    keywords[0].trim()
  ) {
    return keywords[0].trim();
  }
  return key;
}

/**
 * Normalise the GET /memes/keys response into MemeKey[].
 * Supports both string[] and object[] ({ key, name }).
 */
export function normalizeKeys(raw: unknown): MemeKey[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item): MemeKey | null => {
        if (typeof item === "string") return { key: item };
        if (item && typeof item === "object" && "key" in item) {
          const obj = item as Record<string, unknown>;
          return {
            key: String(obj.key),
            name: obj.name != null ? String(obj.name) : undefined,
          };
        }
        return null;
      })
      .filter((x): x is MemeKey => x !== null);
  }
  return [];
}

/** True when the response content type represents a binary image. */
export function isImageContentType(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().startsWith("image/");
}

/**
 * Resolve a preview/generate response into a renderable URL.
 * - image/* -> object URL created from the blob (caller must revoke it).
 * - application/json -> reads `url` or `data` field (may be a data URI or URL).
 */
export interface ImageResult {
  type: "blob" | "url";
  url: string;
  revoke?: () => void;
}

export function createObjectURLFactory(): (
  blob: Blob
) => string {
  if (
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function"
  ) {
    return (blob: Blob) => URL.createObjectURL(blob);
  }
  // jsdom / non-browser fallback: return an empty data URL so rendering
  // does not crash. Tests polyfill URL.createObjectURL explicitly.
  return () => "blob:fallback";
}

export async function resolveImageResult(
  response: Response,
  createObjectURL: (blob: Blob) => string = createObjectURLFactory()
): Promise<ImageResult> {
  const contentType = response.headers.get("content-type");
  if (isImageContentType(contentType)) {
    const blob = await response.blob();
    const url = createObjectURL(blob);
    return {
      type: "blob",
      url,
      revoke: () => {
        if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
          URL.revokeObjectURL(url);
        }
      },
    };
  }
  const json = (await response.json().catch(() => ({}))) as {
    url?: string;
    data?: string;
  };
  const url = json.url ?? json.data ?? "";
  return { type: "url", url };
}

/** Parse + pretty-print a JSON value/string. Throws on invalid JSON. */
export function formatJson(value: unknown): string {
  const data =
    typeof value === "string" ? JSON.parse(value) : value;
  return JSON.stringify(data, null, 2);
}

export interface JsonParseResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

/** Safely parse a JSON string, returning a structured result. */
export function tryParseJson(input: string): JsonParseResult {
  if (input.trim() === "") return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Build a multipart FormData for POST /memes/{key}/. */
export function buildFormData(params: {
  images?: File[];
  texts?: string[];
  args?: string;
}): FormData {
  const formData = new FormData();
  for (const text of params.texts ?? []) {
    formData.append("texts", text);
  }
  for (const image of params.images ?? []) {
    formData.append("images", image);
  }
  if (params.args !== undefined) {
    formData.append("args", params.args);
  }
  return formData;
}

/** Shape of a FastAPI-style 422 validation error detail entry. */
interface ValidationErrorEntry {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

/** Extract human-readable messages from a 422 validation error body. */
export function parseValidationErrors(detail: unknown): string[] {
  if (typeof detail === "string") return [detail];
  if (Array.isArray(detail)) {
    return detail
      .map((entry: unknown): string | null => {
        if (typeof entry === "string") return entry;
        const e = entry as ValidationErrorEntry;
        if (e && typeof e === "object") {
          const loc = (e.loc ?? []).map(String).join(".");
          const msg = e.msg ?? e.type ?? "校验失败";
          return loc ? `${loc}: ${msg}` : msg;
        }
        return null;
      })
      .filter((x): x is string => x !== null);
  }
  return ["请求参数校验失败"];
}

/** Default args string used when the backend provides none. */
export const DEFAULT_ARGS = JSON.stringify({ user_infos: [] });

/**
 * Build the initial args string for a meme given its info payload.
 * Falls back to the default args object when missing or malformed.
 */
export function resolveDefaultArgs(info: MemeInfo | null): string {
  if (info?.args === undefined || info.args === null) {
    return DEFAULT_ARGS;
  }
  try {
    return typeof info.args === "string"
      ? formatJson(info.args)
      : JSON.stringify(info.args, null, 2);
  } catch {
    return DEFAULT_ARGS;
  }
}
