import type { MemeInfo, MemeKey } from "./types";
import {
  normalizeKeys,
  resolveImageResult,
  parseValidationErrors,
  createObjectURLFactory,
  type ImageResult,
} from "./meme-utils";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(errors.join("\n"));
    this.name = "ValidationError";
    this.errors = errors;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail))
      return parseValidationErrors(data.detail).join("; ");
    if (typeof data?.message === "string") return data.message;
  } catch {
    /* ignore */
  }
  return `请求失败 (${res.status})`;
}

export const getVersion = async (): Promise<unknown> => {
  const res = await fetch("/api/meme/version");
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return res.json().catch(() => null);
};

export const getKeys = async (): Promise<MemeKey[]> => {
  const res = await fetch("/api/memes/keys");
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const data = await res.json().catch(() => []);
  return normalizeKeys(data);
};

export const getMemeInfo = async (key: string): Promise<MemeInfo> => {
  const res = await fetch(`/api/memes/${encodeURIComponent(key)}/info`);
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  const data = await res.json().catch(() => ({}));
  return data && typeof data === "object" ? (data as MemeInfo) : {};
};

export const getMemePreview = async (
  key: string,
  createObjectURL = createObjectURLFactory()
): Promise<ImageResult> => {
  const res = await fetch(`/api/memes/${encodeURIComponent(key)}/preview`);
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return resolveImageResult(res, createObjectURL);
};

export const generateMeme = async (
  key: string,
  formData: FormData,
  createObjectURL = createObjectURLFactory()
): Promise<ImageResult> => {
  const res = await fetch(`/api/memes/${encodeURIComponent(key)}/`, {
    method: "POST",
    body: formData,
  });
  if (res.status === 422) {
    const data = await res.json().catch(() => null);
    throw new ValidationError(parseValidationErrors(data?.detail));
  }
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return resolveImageResult(res, createObjectURL);
};
