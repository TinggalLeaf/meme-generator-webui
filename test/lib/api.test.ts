import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import {
  ApiError,
  ValidationError,
  generateMeme,
  getKeys,
  getMemeInfo,
  getMemePreview,
  getVersion,
} from "@/lib/api";
import { captured, server } from "../server";

afterEach(() => {
  captured.key = "";
  captured.formData = null;
});

describe("api: getVersion", () => {
  it("returns the parsed version payload", async () => {
    const version = await getVersion();
    expect(version).toEqual({ version: "1.2.3", name: "meme-generator" });
  });
});

describe("api: getKeys", () => {
  it("normalises a string[] response", async () => {
    const keys = await getKeys();
    expect(keys).toEqual([
      { key: "5000choyen" },
      { key: "a_jj_play_baseball" },
      { key: "doge" },
    ]);
  });

  it("normalises an object[] response with names", async () => {
    server.use(
      http.get("/api/memes/keys", () =>
        HttpResponse.json([
          { key: "5000choyen", name: "5000兆円" },
          { key: "doge" },
        ])
      )
    );
    const keys = await getKeys();
    expect(keys).toEqual([
      { key: "5000choyen", name: "5000兆円" },
      { key: "doge" },
    ]);
  });
});

describe("api: getMemeInfo", () => {
  it("returns the info object", async () => {
    const info = await getMemeInfo("doge");
    expect(info.key).toBe("doge");
    expect(info.texts).toEqual(["上文字", "下文字"]);
    expect(info.images).toEqual({ max: 2, min: 0 });
  });
});

describe("api: getMemePreview", () => {
  it("resolves a blob url for image responses", async () => {
    const result = await getMemePreview("doge");
    expect(result.type).toBe("blob");
    expect(result.url.startsWith("blob:")).toBe(true);
  });

  it("resolves a url for json responses", async () => {
    server.use(
      http.get("/api/memes/:key/preview", () =>
        HttpResponse.json({ url: "http://cdn/x.png" })
      )
    );
    const result = await getMemePreview("doge");
    expect(result.type).toBe("url");
    expect(result.url).toBe("http://cdn/x.png");
  });
});

describe("api: generateMeme", () => {
  it("POSTs multipart and returns the generated image", async () => {
    const fd = new FormData();
    fd.append("texts", "hello");
    fd.append("args", '{"user_infos":[]}');
    const result = await generateMeme("doge", fd);
    expect(result.type).toBe("blob");
    expect(captured.key).toBe("doge");
    expect(captured.formData?.get("texts")).toBe("hello");
    expect(captured.formData?.get("args")).toBe('{"user_infos":[]}');
  });

  it("throws ValidationError on 422", async () => {
    server.use(
      http.post("/api/memes/:key/", () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ["body", "texts", 0],
                msg: "field required",
                type: "missing",
              },
            ],
          },
          { status: 422 }
        )
      )
    );
    const fd = new FormData();
    await expect(generateMeme("doge", fd)).rejects.toBeInstanceOf(
      ValidationError
    );
    try {
      await generateMeme("doge", fd);
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).errors[0]).toContain("field required");
    }
  });

  it("throws ApiError on other failures", async () => {
    server.use(
      http.post("/api/memes/:key/", () =>
        HttpResponse.json({ detail: "nope" }, { status: 500 })
      )
    );
    const fd = new FormData();
    await expect(generateMeme("doge", fd)).rejects.toBeInstanceOf(ApiError);
  });
});
