import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { MemeStudio } from "@/components/meme/studio";
import { renderWithClient } from "../utils";
import { captured, server } from "../server";

beforeEach(() => {
  captured.key = "";
  captured.formData = null;
});

describe("MemeStudio integration", () => {
  it("loads and renders the template list with the version", async () => {
    renderWithClient(<MemeStudio />);
    // keys appear
    expect(await screen.findByText("5000choyen")).toBeInTheDocument();
    expect(screen.getByText("doge")).toBeInTheDocument();
    // version from /meme/version
    expect(screen.getByText(/v1\.2\.3/)).toBeInTheDocument();
  });

  it("filters the template list by search", async () => {
    renderWithClient(<MemeStudio />);
    await screen.findByText("doge");
    fireEvent.change(screen.getByLabelText("搜索模板"), {
      target: { value: "doge" },
    });
    expect(screen.queryByText("5000choyen")).toBeNull();
    expect(screen.getByText("doge")).toBeInTheDocument();
  });

  it("loads info + preview and initialises the form on selection", async () => {
    renderWithClient(<MemeStudio />);
    fireEvent.click(await screen.findByText("doge"));
    await waitFor(() =>
      expect(screen.getByLabelText("文本 1")).toHaveValue("上文字")
    );
    expect(screen.getByLabelText("文本 2")).toHaveValue("下文字");
    // preview image rendered
    await waitFor(() =>
      expect(screen.getByAltText("表情包预览")).toBeInTheDocument()
    );
    // default args populated
    expect(screen.getByLabelText("args").textContent).toContain("user_infos");
  });

  it("generates a meme with the correct FormData", async () => {
    renderWithClient(<MemeStudio />);
    fireEvent.click(await screen.findByText("doge"));
    await waitFor(() =>
      expect(screen.getByLabelText("文本 1")).toHaveValue("上文字")
    );
    fireEvent.click(screen.getByRole("button", { name: /生成表情包/ }));

    await waitFor(() => expect(captured.key).toBe("doge"));
    const fd = captured.formData!;
    expect(fd.getAll("texts")).toEqual(["上文字", "下文字"]);
    expect((fd.get("args") as string) ?? "").toContain("user_infos");

    // result image is shown and download becomes available
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /下载/ })).toBeEnabled()
    );
  });

  it("shows a validation error on a 422 response", async () => {
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
    renderWithClient(<MemeStudio />);
    fireEvent.click(await screen.findByText("doge"));
    await waitFor(() =>
      expect(screen.getByLabelText("文本 1")).toHaveValue("上文字")
    );
    fireEvent.click(screen.getByRole("button", { name: /生成表情包/ }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
    expect(screen.getByText(/field required/)).toBeInTheDocument();
  });
});
