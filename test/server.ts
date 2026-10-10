import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);

/** Captured request body for the generate endpoint, for assertions. */
export const captured = {
  key: "",
  formData: null as FormData | null,
};

export const handlers = [
  http.get("/api/meme/version", () =>
    HttpResponse.json({ version: "1.2.3", name: "meme-generator" })
  ),

  http.get("/api/memes/keys", () =>
    HttpResponse.json(["5000choyen", "a_jj_play_baseball", "doge"])
  ),

  http.get("/api/memes/:key/info", ({ params }) =>
    HttpResponse.json({
      key: params.key,
      name: "演示模板",
      texts: ["上文字", "下文字"],
      args: { user_infos: [] },
      images: { max: 2, min: 0 },
    })
  ),

  http.get("/api/memes/:key/preview", () =>
    new HttpResponse(PNG_BYTES, {
      headers: { "content-type": "image/png" },
    })
  ),

  http.post("/api/memes/:key/", async ({ params, request }) => {
    captured.key = String(params.key);
    captured.formData = await request.formData();
    return new HttpResponse(PNG_BYTES, {
      headers: { "content-type": "image/png" },
    });
  }),
];

export const server = setupServer(...handlers);
