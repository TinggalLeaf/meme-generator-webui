import { describe, expect, it } from "vitest";
import {
  buildFormData,
  formatJson,
  isImageContentType,
  normalizeKeys,
  parseValidationErrors,
  resolveDefaultArgs,
  resolveImageResult,
  tryParseJson,
  type ImageResult,
} from "@/lib/meme-utils";

describe("normalizeKeys", () => {
  it("handles a string[]", () => {
    expect(normalizeKeys(["a", "b"])).toEqual([
      { key: "a" },
      { key: "b" },
    ]);
  });

  it("handles an object[] with name", () => {
    expect(normalizeKeys([{ key: "a", name: "A" }, { key: "b" }])).toEqual([
      { key: "a", name: "A" },
      { key: "b" },
    ]);
  });

  it("drops invalid entries and non-arrays", () => {
    expect(normalizeKeys([null, 1, { noKey: true }, "ok"])).toEqual([
      { key: "ok" },
    ]);
    expect(normalizeKeys({ key: "x" })).toEqual([]);
  });
});

describe("isImageContentType", () => {
  it("detects image content types", () => {
    expect(isImageContentType("image/png")).toBe(true);
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("application/json")).toBe(false);
    expect(isImageContentType(null)).toBe(false);
  });
});

describe("formatJson / tryParseJson", () => {
  it("pretty-prints a JSON string", () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
  });
  it("pretty-prints an object", () => {
    expect(formatJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
  it("tryParseJson reports errors", () => {
    expect(tryParseJson("{}").ok).toBe(true);
    const bad = tryParseJson("{bad");
    expect(bad.ok).toBe(false);
    expect(bad.error).toBeTruthy();
  });
  it("treats empty string as valid (undefined)", () => {
    expect(tryParseJson("").ok).toBe(true);
    expect(tryParseJson("").value).toBeUndefined();
  });
});

describe("buildFormData", () => {
  it("appends texts, images and args", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    const fd = buildFormData({
      texts: ["t1", "t2"],
      images: [file],
      args: '{"user_infos":[]}',
    });
    expect(fd.getAll("texts")).toEqual(["t1", "t2"]);
    expect(fd.getAll("images")).toHaveLength(1);
    expect(fd.get("args")).toBe('{"user_infos":[]}');
  });
});

describe("parseValidationErrors", () => {
  it("parses FastAPI-style detail arrays", () => {
    const detail = [
      { loc: ["body", "texts", 0], msg: "field required", type: "missing" },
      { loc: ["body", "args"], msg: "invalid", type: "value_error" },
    ];
    expect(parseValidationErrors(detail)).toEqual([
      "body.texts.0: field required",
      "body.args: invalid",
    ]);
  });
  it("passes through strings", () => {
    expect(parseValidationErrors("boom")).toEqual(["boom"]);
  });
  it("returns fallback on unexpected shape", () => {
    expect(parseValidationErrors(undefined)).toEqual(["请求参数校验失败"]);
  });
});

describe("resolveDefaultArgs", () => {
  it("uses default when info missing", () => {
    expect(resolveDefaultArgs(null)).toBe('{"user_infos":[]}');
  });
  it("uses info.args when present and valid", () => {
    expect(resolveDefaultArgs({ args: { foo: 1 } })).toBe('{\n  "foo": 1\n}');
  });
  it("falls back on malformed info.args", () => {
    expect(resolveDefaultArgs({ args: "{bad" } as never)).toBe(
      '{"user_infos":[]}'
    );
  });
});

describe("resolveImageResult", () => {
  it("returns a blob url for image responses", async () => {
    const res = new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-type": "image/png" },
    });
    const createObjectURL = (b: Blob) =>
      `blob:custom-${b.size}`;
    const result: ImageResult = await resolveImageResult(res, createObjectURL);
    expect(result.type).toBe("blob");
    expect(result.url).toBe("blob:custom-3");
    expect(typeof result.revoke).toBe("function");
  });

  it("reads url from json responses", async () => {
    const res = new Response(JSON.stringify({ url: "http://x/y.png" }), {
      headers: { "content-type": "application/json" },
    });
    const result = await resolveImageResult(res);
    expect(result.type).toBe("url");
    expect(result.url).toBe("http://x/y.png");
    expect(result.revoke).toBeUndefined();
  });

  it("falls back to data field when url missing", async () => {
    const res = new Response(JSON.stringify({ data: "data:image/png;base64," }), {
      headers: { "content-type": "application/json" },
    });
    const result = await resolveImageResult(res);
    expect(result.url).toBe("data:image/png;base64,");
  });
});
