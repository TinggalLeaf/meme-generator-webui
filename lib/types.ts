// Data models for the meme generator.
// The backend OpenAPI does not define response schemas, so all parsing must be
// defensive. See lib/api.ts for the compatibility handling.

export interface MemeKey {
  key: string;
  name?: string;
}

export interface MemeImageLimit {
  max?: number;
  min?: number;
}

/**
 * Loose shape returned by GET /memes/{key}/info. Every field is optional
 * because the real backend may return any subset (or nothing useful).
 */
export interface MemeInfo {
  key?: string;
  name?: string;
  /** Default text placeholders. */
  texts?: string[];
  /** Free-form args object/string used as the default for the args editor. */
  args?: Record<string, unknown> | string;
  /** Image upload constraints. */
  images?: MemeImageLimit;
  /** Optional classification used for sidebar filtering. */
  category?: string;
  /** Chinese keywords/labels returned by the backend (used as display name). */
  keywords?: string[];
  /** Any other fields are ignored but preserved here. */
  [key: string]: unknown;
}

/** Result of GET /memes/keys normalised into MemeKey[]. */
export type MemeKeysResponse = string[] | MemeKey[] | unknown;
